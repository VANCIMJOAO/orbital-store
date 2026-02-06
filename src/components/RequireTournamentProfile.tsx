"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface RequireTournamentProfileProps {
  children: React.ReactNode;
}

/**
 * Wrapper que verifica se o usuário tem perfil completo para campeonatos.
 * Se não estiver logado -> redireciona para login
 * Se não tiver Steam ID -> redireciona para completar perfil
 */
export function RequireTournamentProfile({ children }: RequireTournamentProfileProps) {
  const { user, profile, loading, hasTournamentProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Não está logado -> login
    if (!user) {
      router.push("/campeonatos/login");
      return;
    }

    // Está logado mas não tem perfil completo -> completar perfil
    if (user && !hasTournamentProfile) {
      router.push("/campeonatos/completar-perfil");
      return;
    }
  }, [user, profile, loading, hasTournamentProfile, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
          </div>
          <p className="text-[#A1A1AA] text-sm font-mono">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não está logado ou não tem perfil completo
  if (!user || !hasTournamentProfile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
          </div>
          <p className="text-[#A1A1AA] text-sm font-mono">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
