import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/admin/toggle-admin
// Alterna o status de admin de um jogador (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { playerId, currentStatus } = await request.json();

    if (!playerId || typeof currentStatus !== "boolean") {
      return NextResponse.json(
        { error: "playerId e currentStatus são obrigatórios" },
        { status: 400 }
      );
    }

    // Admin não pode remover próprio admin
    if (playerId === auth.user.id && currentStatus === true) {
      return NextResponse.json(
        { error: "Você não pode remover seu próprio acesso admin" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !currentStatus })
      .eq("id", playerId);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar admin: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, is_admin: !currentStatus });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
