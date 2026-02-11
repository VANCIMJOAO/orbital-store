"use client";

import { createContext, useContext, useEffect, useState, useRef, useMemo, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

import type { Database } from "@/lib/database.types";

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

// Dados opcionais para signup - pode vir da loja ou dos campeonatos
interface SignUpData {
  username: string;
  steamId?: string;
  name?: string;
  isTournamentPlayer?: boolean;
  isStoreCustomer?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  // Helpers para verificar se perfil está completo para cada área
  hasTournamentProfile: boolean;
  hasStoreProfile: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signUp: (email: string, password: string, data: SignUpData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const hasProfileRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    let currentUserId: string | null = null;
    let isInitialized = false;
    let isFetchingProfile = false;

    // Buscar sessão inicial
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (isInitialized) {
        return;
      }
      isInitialized = true;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        currentUserId = session.user.id;
        isFetchingProfile = true;
        await fetchProfile(session.user.id);
        isFetchingProfile = false;
      }

      setLoading(false);
    };

    getInitialSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignorar INITIAL_SESSION se já inicializamos
        if (event === "INITIAL_SESSION" && isInitialized) {
          return;
        }

        // Logout
        if (event === "SIGNED_OUT" || !session?.user) {
          currentUserId = null;
          setProfile(null);
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        // Se é o mesmo usuário e já estamos buscando/temos perfil, não precisa recarregar
        if (session.user.id === currentUserId && isFetchingProfile) {
          return;
        }

        isInitialized = true;
        currentUserId = session.user.id;

        setSession(session);
        setUser(session.user);

        isFetchingProfile = true;
        await fetchProfile(session.user.id);
        isFetchingProfile = false;
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchProfile = async (userId: string) => {
    // Só mostrar loading se ainda não temos um profile (evitar flicker no header)
    if (!hasProfileRef.current) setProfileLoading(true);
    try {
      // Usar fetch direto para evitar qualquer cache do cliente Supabase
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data || data.length === 0) {
        setProfile(null);
        hasProfileRef.current = false;
        return;
      }

      const profileData = data[0] as UserProfile;
      setProfile(profileData);
      hasProfileRef.current = true;
    } catch {
      setProfile(null);
      hasProfileRef.current = false;
    } finally {
      setProfileLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null, user: data?.user ?? null };
  };

  const signUp = async (email: string, password: string, data: SignUpData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: data.username,
          steam_id: data.steamId,
          is_tournament_player: data.isTournamentPlayer || false,
          is_store_customer: data.isStoreCustomer || false,
        },
      },
    });

    if (error) {
      return { error: error as Error };
    }

    // O trigger handle_new_user cria o profile automaticamente com os dados do
    // raw_user_meta_data (incluindo steam_id se o trigger atualizado estiver ativo).
    // Tentamos fazer upsert via service role API para garantir que steam_id e campos
    // extras sejam salvos, mesmo que a RLS bloqueie o upsert do client anon.
    if (authData.user) {
      try {
        const res = await fetch("/api/auth/complete-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authData.user.id,
            username: data.username,
            steamId: data.steamId || null,
            name: data.name || null,
            isTournamentPlayer: data.isTournamentPlayer || false,
            isStoreCustomer: data.isStoreCustomer || false,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          // Username duplicado
          if (res.status === 409) {
            return { error: new Error("Este nome de usuário já está em uso") };
          }
          // Outros erros não-críticos: o trigger já criou o profile base
          console.warn("Profile upsert warning:", body);
        }
      } catch (e) {
        // Fallback: se a API route falhar, tentar upsert direto (pode falhar por RLS)
        console.warn("Profile API fallback:", e);
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: authData.user.id,
              username: data.username,
              steam_id: data.steamId || null,
              name: data.name || null,
              is_tournament_player: data.isTournamentPlayer || false,
              is_store_customer: data.isStoreCustomer || false,
              level: 1,
              xp: 0,
            },
            { onConflict: "id" }
          );
        if (profileError && (profileError as any).code !== "23505") {
          console.warn("Profile upsert fallback error:", profileError);
        }
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      setSession(null);
      hasProfileRef.current = false;
      // Força refresh da página para limpar todo o estado
      window.location.href = "/campeonatos";
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { error: new Error("Não autenticado") };

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    }

    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/campeonatos/nova-senha`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Verificar se perfil está completo para campeonatos (precisa de username e steam_id)
  const hasTournamentProfile = !!(profile?.username && profile?.steam_id);

  // Verificar se perfil está completo para loja (precisa de username)
  const hasStoreProfile = !!profile?.username;

  // Loading é true enquanto auth ou profile estão carregando
  const isLoading = loading || profileLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading: isLoading,
        hasTournamentProfile,
        hasStoreProfile,
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
