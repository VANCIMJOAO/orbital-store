import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/logger";

const log = createLogger("bracket");

// Mapa de avanço do bracket double elimination (8 times)
const bracketAdvancement: Record<
  string,
  {
    winnerGoesTo: string;
    loserGoesTo?: string;
    winnerPosition: "team1" | "team2";
    loserPosition?: "team1" | "team2";
  }
> = {
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

/**
 * Avança times no bracket double elimination.
 * Pode receber um SupabaseClient existente (server ou browser).
 */
export async function advanceTeamsInBracket(
  supabase: SupabaseClient,
  tournamentId: string,
  currentRound: string,
  winnerId: string,
  loserId: string
) {
  const advancement = bracketAdvancement[currentRound];
  if (!advancement) {
    log.info("No advancement mapping for round: " + currentRound);
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
      log.error("Error advancing winner:", winnerError);
    } else {
      log.info(`Advanced winner ${winnerId} to ${advancement.winnerGoesTo} as ${advancement.winnerPosition}`);
    }

    await checkAndActivateMatch(supabase, tournamentId, advancement.winnerGoesTo);
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
      log.error("Error sending loser to bracket:", loserError);
    } else {
      log.info(`Sent loser ${loserId} to ${advancement.loserGoesTo} as ${advancement.loserPosition}`);
    }

    await checkAndActivateMatch(supabase, tournamentId, advancement.loserGoesTo);
  }
}

/**
 * Verifica se uma partida tem ambos os times definidos e ativa (pending → scheduled).
 */
async function checkAndActivateMatch(
  supabase: SupabaseClient,
  tournamentId: string,
  round: string
) {
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

    log.info(`Activated match ${match.id} (${round}) - both teams ready`);
  }
}
