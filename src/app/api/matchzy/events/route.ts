import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Criar cliente Supabase com service role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Token de autenticação para webhooks
const WEBHOOK_SECRET = process.env.MATCHZY_WEBHOOK_SECRET || "orbital_secret_token";

// Tipos de eventos do MatchZy
type MatchZyEvent = {
  event: string;
  matchid?: string;
  team1?: { name: string; score: number };
  team2?: { name: string; score: number };
  winner?: string;
  map_number?: number;
  round_number?: number;
  reason?: string;
  player?: { steamid: string; name: string };
  // Outros campos específicos de cada evento
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.log("[MatchZy Webhook] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event: MatchZyEvent = await request.json();
    console.log("[MatchZy Webhook] Received event:", event.event, event);

    // Processar evento baseado no tipo
    switch (event.event) {
      case "going_live":
        await handleGoingLive(event);
        break;

      case "round_end":
        await handleRoundEnd(event);
        break;

      case "map_result":
        await handleMapResult(event);
        break;

      case "series_end":
        await handleSeriesEnd(event);
        break;

      case "side_picked":
        await handleSidePicked(event);
        break;

      default:
        console.log("[MatchZy Webhook] Unknown event type:", event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MatchZy Webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Partida começou (saiu do warmup)
async function handleGoingLive(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  const now = new Date();

  // Atualizar status da partida para live
  const { data: match, error } = await supabase
    .from("matches")
    .update({
      status: "live",
      match_phase: "live",
      started_at: now.toISOString(),
      is_live: true,
    })
    .eq("id", matchId)
    .select()
    .single();

  if (error) {
    console.error("[MatchZy] Error updating match to live:", error);
    return;
  }

  console.log("[MatchZy] Match going live:", matchId);

  // Verificar se houve atraso e propagar para partidas seguintes
  if (match?.scheduled_at) {
    const scheduledTime = new Date(match.scheduled_at);
    const delayMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);

    if (delayMinutes > 5) {
      // Mais de 5 minutos de atraso
      console.log(`[MatchZy] Match ${matchId} started ${delayMinutes} minutes late, propagating delay`);
      await propagateDelay(match.tournament_id, matchId, delayMinutes);
    }
  }
}

// Round terminou
async function handleRoundEnd(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  // Atualizar placar da partida
  const { error } = await supabase
    .from("matches")
    .update({
      team1_score: event.team1?.score || 0,
      team2_score: event.team2?.score || 0,
    })
    .eq("id", matchId);

  if (error) {
    console.error("[MatchZy] Error updating scores:", error);
  }

  // TODO: Salvar dados do round na tabela match_rounds
}

// Mapa terminou
async function handleMapResult(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  // Atualizar placar final do mapa
  const { error } = await supabase
    .from("matches")
    .update({
      team1_score: event.team1?.score || 0,
      team2_score: event.team2?.score || 0,
    })
    .eq("id", matchId);

  if (error) {
    console.error("[MatchZy] Error updating map result:", error);
  }

  console.log("[MatchZy] Map result for match:", matchId, event.team1?.score, "-", event.team2?.score);
}

// Série terminou (BO3, BO5, etc)
async function handleSeriesEnd(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  // Buscar partida para determinar vencedor
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) {
    console.error("[MatchZy] Error fetching match:", fetchError);
    return;
  }

  // Determinar vencedor pelo placar
  const winnerId = match.team1_score > match.team2_score ? match.team1_id : match.team2_id;
  const loserId = match.team1_score > match.team2_score ? match.team2_id : match.team1_id;

  // Atualizar partida como finalizada
  const { error: updateError } = await supabase
    .from("matches")
    .update({
      status: "finished",
      match_phase: "finished",
      is_live: false,
      finished_at: new Date().toISOString(),
      winner_id: winnerId,
    })
    .eq("id", matchId);

  if (updateError) {
    console.error("[MatchZy] Error finishing match:", updateError);
    return;
  }

  console.log("[MatchZy] Match finished:", matchId, "Winner:", winnerId);

  // Avançar times no bracket
  await advanceTeamsInBracket(match.tournament_id, match.round, winnerId, loserId);
}

// Time escolheu lado
async function handleSidePicked(event: MatchZyEvent) {
  // Log para debug, pode ser usado para UI em tempo real
  console.log("[MatchZy] Side picked:", event);
}

// Propagar atraso para partidas seguintes
async function propagateDelay(tournamentId: string, currentMatchId: string, delayMinutes: number) {
  // Buscar partidas futuras do torneio (não finalizadas)
  const { data: futureMatches, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .neq("id", currentMatchId)
    .in("status", ["scheduled", "pending"])
    .order("scheduled_at", { ascending: true });

  if (error || !futureMatches) {
    console.error("[MatchZy] Error fetching future matches:", error);
    return;
  }

  // Adicionar delay mínimo de 10 minutos para cada partida futura
  const adjustedDelay = Math.max(delayMinutes, 10);

  for (const match of futureMatches) {
    if (match.scheduled_at) {
      const currentTime = new Date(match.scheduled_at);
      const newTime = new Date(currentTime.getTime() + adjustedDelay * 60000);

      await supabase
        .from("matches")
        .update({ scheduled_at: newTime.toISOString() })
        .eq("id", match.id);

      console.log(`[MatchZy] Adjusted match ${match.id} time by ${adjustedDelay} minutes`);
    }
  }
}

// Avançar times no bracket após uma partida terminar
async function advanceTeamsInBracket(
  tournamentId: string,
  currentRound: string,
  winnerId: string,
  loserId: string
) {
  // Mapa de avanço do bracket double elimination (8 times)
  const bracketAdvancement: Record<string, { winnerGoesTo: string; loserGoesTo?: string; position: "team1" | "team2" }> = {
    // Winner Bracket Quartas -> Semis
    winner_quarter_1: { winnerGoesTo: "winner_semi_1", loserGoesTo: "loser_round1_1", position: "team1" },
    winner_quarter_2: { winnerGoesTo: "winner_semi_1", loserGoesTo: "loser_round1_1", position: "team2" },
    winner_quarter_3: { winnerGoesTo: "winner_semi_2", loserGoesTo: "loser_round1_2", position: "team1" },
    winner_quarter_4: { winnerGoesTo: "winner_semi_2", loserGoesTo: "loser_round1_2", position: "team2" },

    // Winner Bracket Semis -> Final
    winner_semi_1: { winnerGoesTo: "winner_final", loserGoesTo: "loser_round2_1", position: "team1" },
    winner_semi_2: { winnerGoesTo: "winner_final", loserGoesTo: "loser_round2_2", position: "team1" },

    // Winner Final -> Grand Final
    winner_final: { winnerGoesTo: "grand_final", loserGoesTo: "loser_final", position: "team1" },

    // Loser Bracket Round 1 -> Round 2
    loser_round1_1: { winnerGoesTo: "loser_round2_1", position: "team2" },
    loser_round1_2: { winnerGoesTo: "loser_round2_2", position: "team2" },

    // Loser Bracket Round 2 -> Semi
    loser_round2_1: { winnerGoesTo: "loser_semi", position: "team1" },
    loser_round2_2: { winnerGoesTo: "loser_semi", position: "team2" },

    // Loser Semi -> Loser Final
    loser_semi: { winnerGoesTo: "loser_final", position: "team2" },

    // Loser Final -> Grand Final
    loser_final: { winnerGoesTo: "grand_final", position: "team2" },
  };

  const advancement = bracketAdvancement[currentRound];
  if (!advancement) {
    console.log("[MatchZy] No advancement mapping for round:", currentRound);
    return;
  }

  // Avançar vencedor
  if (advancement.winnerGoesTo) {
    const updateField = advancement.position === "team1" ? "team1_id" : "team2_id";

    const { error: winnerError } = await supabase
      .from("matches")
      .update({ [updateField]: winnerId })
      .eq("tournament_id", tournamentId)
      .eq("round", advancement.winnerGoesTo);

    if (winnerError) {
      console.error("[MatchZy] Error advancing winner:", winnerError);
    } else {
      console.log(`[MatchZy] Advanced winner ${winnerId} to ${advancement.winnerGoesTo}`);
    }

    // Verificar se a partida de destino agora tem ambos os times
    await checkAndActivateMatch(tournamentId, advancement.winnerGoesTo);
  }

  // Enviar perdedor para o loser bracket (se aplicável)
  if (advancement.loserGoesTo) {
    // Determinar posição do perdedor no loser bracket
    let loserPosition: "team1" | "team2" = "team1";

    // Regras específicas para onde o perdedor vai
    if (currentRound.startsWith("winner_quarter")) {
      // Perdedores das quartas vão para loser R1
      loserPosition = currentRound.includes("1") || currentRound.includes("2") ? "team1" : "team2";
      if (currentRound === "winner_quarter_2" || currentRound === "winner_quarter_4") {
        loserPosition = "team2";
      }
    } else if (currentRound.startsWith("winner_semi")) {
      // Perdedores das semis vão para loser R2
      loserPosition = "team1";
    } else if (currentRound === "winner_final") {
      // Perdedor da winner final vai para loser final
      loserPosition = "team1";
    }

    const loserUpdateField = loserPosition === "team1" ? "team1_id" : "team2_id";

    const { error: loserError } = await supabase
      .from("matches")
      .update({ [loserUpdateField]: loserId })
      .eq("tournament_id", tournamentId)
      .eq("round", advancement.loserGoesTo);

    if (loserError) {
      console.error("[MatchZy] Error sending loser to bracket:", loserError);
    } else {
      console.log(`[MatchZy] Sent loser ${loserId} to ${advancement.loserGoesTo}`);
    }

    // Verificar se a partida de destino agora tem ambos os times
    await checkAndActivateMatch(tournamentId, advancement.loserGoesTo);
  }
}

// Verificar se uma partida tem ambos os times e ativá-la
async function checkAndActivateMatch(tournamentId: string, round: string) {
  const { data: match, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("round", round)
    .single();

  if (error || !match) return;

  // Buscar IDs dos times placeholder (primeiro e segundo time do torneio)
  const { data: tournamentTeams } = await supabase
    .from("tournament_teams")
    .select("team_id")
    .eq("tournament_id", tournamentId)
    .order("seed", { ascending: true })
    .limit(2);

  if (!tournamentTeams || tournamentTeams.length < 2) return;

  const placeholderIds = tournamentTeams.map((t) => t.team_id);

  // Verificar se ambos os times são reais (não placeholders)
  const team1IsReal = match.team1_id && !placeholderIds.includes(match.team1_id);
  const team2IsReal = match.team2_id && !placeholderIds.includes(match.team2_id);

  // Se a partida ainda usa placeholders, verificar se já tem times reais
  // (isso acontece quando os times são atualizados pelo avanço do bracket)
  if (match.status === "pending") {
    // Buscar novamente para pegar valores atualizados
    const { data: updatedMatch } = await supabase
      .from("matches")
      .select("team1_id, team2_id")
      .eq("id", match.id)
      .single();

    if (updatedMatch) {
      // Verificar se ambos os times são diferentes dos placeholders originais
      // e se são diferentes entre si
      const hasRealTeams =
        updatedMatch.team1_id !== updatedMatch.team2_id &&
        updatedMatch.team1_id &&
        updatedMatch.team2_id;

      if (hasRealTeams) {
        // Ativar partida
        await supabase
          .from("matches")
          .update({ status: "scheduled" })
          .eq("id", match.id);

        console.log(`[MatchZy] Activated match ${match.id} (${round}) with both teams ready`);
      }
    }
  }
}

// GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "MatchZy webhook endpoint is running",
    timestamp: new Date().toISOString(),
  });
}
