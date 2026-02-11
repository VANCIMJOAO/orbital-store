import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/auth/complete-profile
// Completa o profile do usuário após signup usando service role
// (evita problemas de RLS quando o trigger handle_new_user não inclui steam_id)
export async function POST(request: NextRequest) {
  try {
    const { userId, username, steamId, name, isTournamentPlayer, isStoreCustomer } =
      await request.json();

    if (!userId || !username) {
      return NextResponse.json(
        { error: "userId e username são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar que o userId é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: "userId inválido" },
        { status: 400 }
      );
    }

    // Verificar que o user existe no auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Upsert profile com service role (bypassa RLS)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          username,
          steam_id: steamId || null,
          name: name || null,
          is_tournament_player: isTournamentPlayer || false,
          is_store_customer: isStoreCustomer || false,
          level: 1,
          xp: 0,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      if (profileError.code === "23505" && profileError.message?.includes("username")) {
        return NextResponse.json(
          { error: "Este nome de usuário já está em uso" },
          { status: 409 }
        );
      }
      // Erro de conflito genérico (trigger já criou) — não é problema
      if (profileError.code === "23505") {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: "Erro ao salvar profile: " + profileError.message },
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
