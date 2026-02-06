import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usar anon key para operações públicas (RLS deve permitir)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - Iniciar partida manualmente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const now = new Date();

  // Buscar partida atual
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("*, tournament_id, scheduled_at")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) {
    console.error("[API] Error fetching match:", fetchError);
    return NextResponse.json({ error: "Match not found", details: fetchError?.message }, { status: 404 });
  }

  if (match.status === "live") {
    return NextResponse.json({ error: "Match is already live" }, { status: 400 });
  }

  if (match.status === "finished") {
    return NextResponse.json({ error: "Match is already finished" }, { status: 400 });
  }

  // Atualizar partida para live
  const { data: updatedMatch, error: updateError } = await supabase
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

  if (updateError) {
    console.error("[API] Error updating match:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Verificar se houve atraso e propagar
  if (match.scheduled_at) {
    const scheduledTime = new Date(match.scheduled_at);
    const delayMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);

    if (delayMinutes > 5) {
      // Propagar atraso para partidas futuras
      await propagateDelay(match.tournament_id, matchId, Math.max(delayMinutes, 10));
    }
  }

  return NextResponse.json({
    success: true,
    match: updatedMatch,
    message: "Match started successfully",
  });
}

async function propagateDelay(tournamentId: string, currentMatchId: string, delayMinutes: number) {
  const { data: futureMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .neq("id", currentMatchId)
    .in("status", ["scheduled", "pending"])
    .order("scheduled_at", { ascending: true });

  if (!futureMatches) return;

  for (const match of futureMatches) {
    if (match.scheduled_at) {
      const currentTime = new Date(match.scheduled_at);
      const newTime = new Date(currentTime.getTime() + delayMinutes * 60000);

      await supabase
        .from("matches")
        .update({ scheduled_at: newTime.toISOString() })
        .eq("id", match.id);
    }
  }
}
