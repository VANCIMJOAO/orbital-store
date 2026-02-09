import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "./database.types";

/**
 * Verifica se a request é de um admin autenticado.
 * Retorna { user, profile } se ok, ou um NextResponse de erro.
 */
export async function requireAdmin(): Promise<
  | { user: { id: string }; profile: Database["public"]["Tables"]["profiles"]["Row"] }
  | NextResponse
> {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorado em route handlers read-only
          }
        },
      },
    }
  );

  // Verificar autenticação via JWT (getUser valida o token no server)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    );
  }

  // Verificar se é admin no profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    return NextResponse.json(
      { error: "Acesso negado — permissão de admin necessária" },
      { status: 403 }
    );
  }

  return { user, profile };
}

/**
 * Helper para usar no início de route handlers admin.
 * Uso:
 *   const auth = await requireAdmin();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.user e auth.profile estão disponíveis
 */
