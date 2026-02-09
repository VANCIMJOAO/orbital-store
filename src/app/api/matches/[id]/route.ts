import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

// Criar cliente Supabase com service role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar detalhes de uma partida
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;

  const { data: match, error } = await supabase
    .from("matches")
    .select(`
      *,
      team1:teams!matches_team1_id_fkey(id, name, tag, logo_url),
      team2:teams!matches_team2_id_fkey(id, name, tag, logo_url),
      tournament:tournaments(id, name, slug)
    `)
    .eq("id", matchId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(match);
}

// PATCH - Atualizar partida (placar, status, etc) — admin only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: matchId } = await params;
  const body = await request.json();

  // Campos permitidos para atualização
  const allowedFields = [
    "team1_score",
    "team2_score",
    "status",
    "match_phase",
    "winner_id",
    "scheduled_at",
    "started_at",
    "finished_at",
    "is_live",
    "map_name",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  // Validações
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: match, error } = await supabase
    .from("matches")
    .update(updateData)
    .eq("id", matchId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(match);
}
