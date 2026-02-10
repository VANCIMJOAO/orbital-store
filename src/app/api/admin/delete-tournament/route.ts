import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/admin/delete-tournament
// Exclui um campeonato e todos os dados associados (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { tournamentId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: "tournamentId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se torneio existe
    const { data: tournament, error: fetchError } = await supabase
      .from("tournaments")
      .select("id, name")
      .eq("id", tournamentId)
      .single();

    if (fetchError || !tournament) {
      return NextResponse.json(
        { error: "Campeonato não encontrado" },
        { status: 404 }
      );
    }

    // Deletar na ordem correta de dependência (filhos primeiro)
    // 1. match_player_stats (depende de matches)
    const { data: matchIds } = await supabase
      .from("matches")
      .select("id")
      .eq("tournament_id", tournamentId);

    if (matchIds && matchIds.length > 0) {
      const ids = matchIds.map((m) => m.id);
      await supabase.from("match_player_stats").delete().in("match_id", ids);
      await supabase.from("match_rounds").delete().in("match_id", ids);
      await supabase.from("match_events").delete().in("match_id", ids);
    }

    // 2. matches
    await supabase.from("matches").delete().eq("tournament_id", tournamentId);

    // 3. tournament_teams
    await supabase.from("tournament_teams").delete().eq("tournament_id", tournamentId);

    // 4. tournament
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournamentId);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao excluir campeonato: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
