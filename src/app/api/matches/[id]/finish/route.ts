import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { advanceTeamsInBracket } from "@/lib/bracket";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WEBHOOK_SECRET = process.env.MATCHZY_WEBHOOK_SECRET;

// POST - Finalizar partida (admin auth OU Bearer token do Go server)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Aceitar admin auth OU Bearer token (safety net do Go server)
  const authHeader = request.headers.get("Authorization");
  const isBearerAuth = WEBHOOK_SECRET && authHeader === `Bearer ${WEBHOOK_SECRET}`;

  if (!isBearerAuth) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
  }

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
  await advanceTeamsInBracket(supabase, match.tournament_id, match.round, winnerId, loserId);

  return NextResponse.json({
    success: true,
    match: updatedMatch,
    winner_id: winnerId,
    message: "Match finished successfully",
  });
}
