import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usar anon key para operações públicas (RLS deve permitir)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - Finalizar partida manualmente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const body = await request.json();
  const { team1_score, team2_score } = body;

  // Validar scores
  if (team1_score === undefined || team2_score === undefined) {
    return NextResponse.json({ error: "Scores are required" }, { status: 400 });
  }

  if (team1_score === team2_score) {
    return NextResponse.json({ error: "Match cannot end in a tie" }, { status: 400 });
  }

  // Buscar partida atual
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.status === "finished") {
    return NextResponse.json({ error: "Match is already finished" }, { status: 400 });
  }

  // Determinar vencedor
  const winnerId = team1_score > team2_score ? match.team1_id : match.team2_id;
  const loserId = team1_score > team2_score ? match.team2_id : match.team1_id;

  // Atualizar partida
  const { data: updatedMatch, error: updateError } = await supabase
    .from("matches")
    .update({
      team1_score,
      team2_score,
      status: "finished",
      match_phase: "finished",
      is_live: false,
      finished_at: new Date().toISOString(),
      winner_id: winnerId,
    })
    .eq("id", matchId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Avançar times no bracket
  await advanceTeamsInBracket(match.tournament_id, match.round, winnerId, loserId);

  return NextResponse.json({
    success: true,
    match: updatedMatch,
    winner_id: winnerId,
    message: "Match finished successfully",
  });
}

async function advanceTeamsInBracket(
  tournamentId: string,
  currentRound: string,
  winnerId: string,
  loserId: string
) {
  const bracketAdvancement: Record<string, { winnerGoesTo: string; loserGoesTo?: string; winnerPosition: "team1" | "team2"; loserPosition?: "team1" | "team2" }> = {
    // Winner Bracket Quartas
    winner_quarter_1: { winnerGoesTo: "winner_semi_1", loserGoesTo: "loser_round1_1", winnerPosition: "team1", loserPosition: "team1" },
    winner_quarter_2: { winnerGoesTo: "winner_semi_1", loserGoesTo: "loser_round1_1", winnerPosition: "team2", loserPosition: "team2" },
    winner_quarter_3: { winnerGoesTo: "winner_semi_2", loserGoesTo: "loser_round1_2", winnerPosition: "team1", loserPosition: "team1" },
    winner_quarter_4: { winnerGoesTo: "winner_semi_2", loserGoesTo: "loser_round1_2", winnerPosition: "team2", loserPosition: "team2" },

    // Winner Bracket Semis
    winner_semi_1: { winnerGoesTo: "winner_final", loserGoesTo: "loser_round2_1", winnerPosition: "team1", loserPosition: "team1" },
    winner_semi_2: { winnerGoesTo: "winner_final", loserGoesTo: "loser_round2_2", winnerPosition: "team2", loserPosition: "team1" },

    // Winner Final
    winner_final: { winnerGoesTo: "grand_final", loserGoesTo: "loser_final", winnerPosition: "team1", loserPosition: "team1" },

    // Loser Bracket Round 1
    loser_round1_1: { winnerGoesTo: "loser_round2_1", winnerPosition: "team2" },
    loser_round1_2: { winnerGoesTo: "loser_round2_2", winnerPosition: "team2" },

    // Loser Bracket Round 2
    loser_round2_1: { winnerGoesTo: "loser_semi", winnerPosition: "team1" },
    loser_round2_2: { winnerGoesTo: "loser_semi", winnerPosition: "team2" },

    // Loser Semi
    loser_semi: { winnerGoesTo: "loser_final", winnerPosition: "team2" },

    // Loser Final
    loser_final: { winnerGoesTo: "grand_final", winnerPosition: "team2" },
  };

  const advancement = bracketAdvancement[currentRound];
  if (!advancement) {
    console.log("[Bracket] No advancement mapping for round:", currentRound);
    return;
  }

  // Avançar vencedor
  if (advancement.winnerGoesTo) {
    const winnerField = advancement.winnerPosition === "team1" ? "team1_id" : "team2_id";

    await supabase
      .from("matches")
      .update({ [winnerField]: winnerId })
      .eq("tournament_id", tournamentId)
      .eq("round", advancement.winnerGoesTo);

    console.log(`[Bracket] Advanced winner ${winnerId} to ${advancement.winnerGoesTo} as ${advancement.winnerPosition}`);

    // Verificar se partida de destino pode ser ativada
    await checkAndActivateMatch(tournamentId, advancement.winnerGoesTo);
  }

  // Enviar perdedor para loser bracket
  if (advancement.loserGoesTo && advancement.loserPosition) {
    const loserField = advancement.loserPosition === "team1" ? "team1_id" : "team2_id";

    await supabase
      .from("matches")
      .update({ [loserField]: loserId })
      .eq("tournament_id", tournamentId)
      .eq("round", advancement.loserGoesTo);

    console.log(`[Bracket] Sent loser ${loserId} to ${advancement.loserGoesTo} as ${advancement.loserPosition}`);

    // Verificar se partida de destino pode ser ativada
    await checkAndActivateMatch(tournamentId, advancement.loserGoesTo);
  }
}

async function checkAndActivateMatch(tournamentId: string, round: string) {
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("round", round)
    .single();

  if (!match) return;

  // Se a partida está pendente, verificar se ambos os times estão definidos e são diferentes
  if (match.status === "pending" && match.team1_id && match.team2_id && match.team1_id !== match.team2_id) {
    await supabase
      .from("matches")
      .update({ status: "scheduled" })
      .eq("id", match.id);

    console.log(`[Bracket] Activated match ${match.id} (${round})`);

    // Auto-carregar partida no servidor CS2 via Pterodactyl
    await autoLoadMatchOnServer(match.id);
  }
}

// Helper para enviar comando via Pterodactyl API
async function sendPterodactylCommand(cmd: string) {
  const pterodactylUrl = process.env.PTERODACTYL_API_URL;
  const pterodactylKey = process.env.PTERODACTYL_API_KEY;
  const serverId = process.env.PTERODACTYL_SERVER_ID;

  const resp = await fetch(
    `${pterodactylUrl}/api/client/servers/${serverId}/command`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${pterodactylKey}`,
        "Content-Type": "application/json",
        "Accept": "application/vnd.pterodactyl.v1+json",
      },
      body: JSON.stringify({ command: cmd }),
    }
  );

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error(`[AutoLoad] Pterodactyl error for "${cmd}":`, resp.status, errorText);
    throw new Error(`Erro ao enviar comando: ${resp.status}`);
  }

  return resp;
}

// Envia automaticamente o comando matchzy_loadmatch_url para o servidor CS2
async function autoLoadMatchOnServer(matchId: string) {
  const pterodactylUrl = process.env.PTERODACTYL_API_URL;
  const pterodactylKey = process.env.PTERODACTYL_API_KEY;
  const serverId = process.env.PTERODACTYL_SERVER_ID;

  if (!pterodactylUrl || !pterodactylKey || !serverId) {
    console.log("[AutoLoad] Pterodactyl não configurado, pulando auto-load");
    return;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://orbital-store.vercel.app").trim();
  const configUrl = `${siteUrl}/api/matches/${matchId}/config`;

  try {
    // 1. Encerrar partida anterior (MatchZy rejeita loadmatch se já tem partida ativa)
    await sendPterodactylCommand("css_endmatch");
    console.log("[AutoLoad] css_endmatch enviado");

    // 2. Aguardar MatchZy processar o endmatch
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Carregar nova partida via URL
    const loadCommand = `matchzy_loadmatch_url "${configUrl}"`;
    await sendPterodactylCommand(loadCommand);

    console.log(`[AutoLoad] Partida ${matchId} carregada automaticamente no servidor: ${loadCommand}`);
  } catch (error) {
    console.error("[AutoLoad] Falha ao carregar partida:", error);
  }
}
