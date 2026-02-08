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

// Cache de resolução de matchId numérico → UUID
const matchIdCache = new Map<string, string>();

// Resolver matchId numérico para UUID do Supabase
async function resolveMatchId(rawMatchId: string): Promise<string | null> {
  // Se já é UUID (contém "-"), retornar direto
  if (rawMatchId.includes("-")) return rawMatchId;

  // Verificar cache
  const cached = matchIdCache.get(rawMatchId);
  if (cached) return cached;

  // É numérico - buscar no banco pelo matchzy_config->matchid
  const { data } = await supabase
    .from("matches")
    .select("id")
    .filter("matchzy_config->>matchid", "eq", rawMatchId)
    .single();

  if (data?.id) {
    matchIdCache.set(rawMatchId, data.id);
    console.log(`[MatchZy Webhook] Resolved matchId ${rawMatchId} → ${data.id}`);
    return data.id;
  }

  console.error(`[MatchZy Webhook] Failed to resolve matchId: ${rawMatchId}`);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.log("[MatchZy Webhook] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event: MatchZyEvent = await request.json();
    console.log("[MatchZy Webhook] Received event:", event.event, "matchid:", event.matchid);

    // Resolver matchId numérico para UUID antes de processar
    if (event.matchid) {
      const resolvedId = await resolveMatchId(String(event.matchid));
      if (!resolvedId) {
        console.error("[MatchZy Webhook] Could not resolve matchId:", event.matchid);
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      event.matchid = resolvedId;
    }

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
    console.error("[MatchZy Webhook] Error updating match to live:", error);
    return;
  }

  console.log("[MatchZy Webhook] Match going live:", matchId);

  // Verificar se houve atraso e propagar para partidas seguintes
  if (match?.scheduled_at) {
    const scheduledTime = new Date(match.scheduled_at);
    const delayMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);

    if (delayMinutes > 5) {
      console.log(`[MatchZy Webhook] Match ${matchId} started ${delayMinutes} minutes late, propagating delay`);
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
    console.error("[MatchZy Webhook] Error updating scores:", error);
  }
}

// Mapa terminou
async function handleMapResult(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  const team1Score = event.team1?.score || 0;
  const team2Score = event.team2?.score || 0;

  // Buscar partida atual para saber best_of e maps_won
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("best_of, maps_won_team1, maps_won_team2, current_map_index")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) {
    console.error("[MatchZy Webhook] Error fetching match for map_result:", fetchError);
    // Fallback: apenas atualizar scores
    await supabase
      .from("matches")
      .update({ team1_score: team1Score, team2_score: team2Score })
      .eq("id", matchId);
    return;
  }

  const mapWinner = team1Score > team2Score ? "team1" : "team2";
  const newMapsWonTeam1 = (match.maps_won_team1 || 0) + (mapWinner === "team1" ? 1 : 0);
  const newMapsWonTeam2 = (match.maps_won_team2 || 0) + (mapWinner === "team2" ? 1 : 0);
  const newMapIndex = (match.current_map_index || 0) + 1;

  // Atualizar scores e maps_won
  const { error: updateError } = await supabase
    .from("matches")
    .update({
      team1_score: team1Score,
      team2_score: team2Score,
      maps_won_team1: newMapsWonTeam1,
      maps_won_team2: newMapsWonTeam2,
      current_map_index: newMapIndex,
    })
    .eq("id", matchId);

  if (updateError) {
    console.error("[MatchZy Webhook] Error updating map result:", updateError);
  }

  console.log(
    `[MatchZy Webhook] Map ${newMapIndex} result: ${team1Score}-${team2Score} (winner: ${mapWinner}). ` +
    `Series: ${newMapsWonTeam1}-${newMapsWonTeam2} (Bo${match.best_of || 1})`
  );

  // Se Bo1, a partida terminou com este mapa
  if ((match.best_of || 1) <= 1) {
    console.log("[MatchZy Webhook] Bo1 map finished, triggering series end");
    await handleSeriesEnd(event);
    return;
  }

  // Se Bo3/Bo5, verificar se alguém já ganhou a maioria dos mapas
  const mapsNeeded = Math.ceil((match.best_of || 1) / 2);
  if (newMapsWonTeam1 >= mapsNeeded || newMapsWonTeam2 >= mapsNeeded) {
    console.log(`[MatchZy Webhook] Series decided: ${newMapsWonTeam1}-${newMapsWonTeam2}, triggering series end`);
    await handleSeriesEnd(event);
    return;
  }

  // Série continua - MatchZy carrega o próximo mapa automaticamente da maplist
  console.log(`[MatchZy Webhook] Series continues, next map ${newMapIndex + 1} of Bo${match.best_of}`);
}

// Série terminou (BO1 via map_result, ou BO3/BO5 via series_end)
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
    console.error("[MatchZy Webhook] Error fetching match for series_end:", fetchError);
    return;
  }

  // Evitar finalizar duas vezes (GOTV server também chama /finish)
  if (match.status === "finished") {
    console.log("[MatchZy Webhook] Match already finished, skipping:", matchId);
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
    console.error("[MatchZy Webhook] Error finishing match:", updateError);
    return;
  }

  console.log(
    `[MatchZy Webhook] Match FINISHED: ${matchId} | ` +
    `Score: ${match.team1_score}-${match.team2_score} | ` +
    `Winner: ${winnerId}`
  );

  // Avançar times no bracket
  if (match.tournament_id && match.round) {
    await advanceTeamsInBracket(match.tournament_id, match.round, winnerId!, loserId!);
  }
}

// Time escolheu lado
async function handleSidePicked(event: MatchZyEvent) {
  console.log("[MatchZy Webhook] Side picked:", event);
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
    console.error("[MatchZy Webhook] Error fetching future matches:", error);
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

      console.log(`[MatchZy Webhook] Adjusted match ${match.id} time by ${adjustedDelay} minutes`);
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
  // Usar a mesma tabela de avanço do finish endpoint para consistência
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
    console.log("[MatchZy Webhook] No advancement mapping for round:", currentRound);
    return;
  }

  // Avançar vencedor
  if (advancement.winnerGoesTo) {
    const winnerField = advancement.winnerPosition === "team1" ? "team1_id" : "team2_id";

    const { error: winnerError } = await supabase
      .from("matches")
      .update({ [winnerField]: winnerId })
      .eq("tournament_id", tournamentId)
      .eq("round", advancement.winnerGoesTo);

    if (winnerError) {
      console.error("[MatchZy Webhook] Error advancing winner:", winnerError);
    } else {
      console.log(`[MatchZy Webhook] Advanced winner ${winnerId} to ${advancement.winnerGoesTo} as ${advancement.winnerPosition}`);
    }

    await checkAndActivateMatch(tournamentId, advancement.winnerGoesTo);
  }

  // Enviar perdedor para loser bracket
  if (advancement.loserGoesTo && advancement.loserPosition) {
    const loserField = advancement.loserPosition === "team1" ? "team1_id" : "team2_id";

    const { error: loserError } = await supabase
      .from("matches")
      .update({ [loserField]: loserId })
      .eq("tournament_id", tournamentId)
      .eq("round", advancement.loserGoesTo);

    if (loserError) {
      console.error("[MatchZy Webhook] Error sending loser to bracket:", loserError);
    } else {
      console.log(`[MatchZy Webhook] Sent loser ${loserId} to ${advancement.loserGoesTo} as ${advancement.loserPosition}`);
    }

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

  if (match.status === "pending" && match.team1_id && match.team2_id && match.team1_id !== match.team2_id) {
    await supabase
      .from("matches")
      .update({ status: "scheduled" })
      .eq("id", match.id);

    console.log(`[MatchZy Webhook] Activated match ${match.id} (${round}) - both teams ready`);
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
