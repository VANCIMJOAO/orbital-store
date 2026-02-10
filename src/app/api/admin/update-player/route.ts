import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/admin/update-player
// Atualiza dados de um jogador (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { playerId, username, steam_id } = await request.json();

    if (!playerId || !username) {
      return NextResponse.json(
        { error: "playerId e username são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar Steam ID se fornecido
    if (steam_id && !/^7656119\d{10}$/.test(steam_id)) {
      return NextResponse.json(
        { error: "Steam ID inválido. Formato esperado: 7656119XXXXXXXXXX (17 dígitos)" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        steam_id: steam_id || null,
      })
      .eq("id", playerId);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Este nome de usuário já está em uso" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao atualizar jogador: " + error.message },
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
