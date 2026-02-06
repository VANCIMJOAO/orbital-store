"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  validateUsername,
  validateSteamId,
  sanitizeUsername,
  sanitizeSteamId,
} from "@/lib/validation";

export default function CompletarPerfilPage() {
  const [username, setUsername] = useState("");
  const [steamId, setSteamId] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, profile, hasTournamentProfile, updateProfile, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  // Se já tem perfil completo, redireciona
  useEffect(() => {
    if (hasTournamentProfile) {
      router.push("/campeonatos");
    }
  }, [hasTournamentProfile, router]);

  // Preencher com dados existentes
  useEffect(() => {
    if (profile) {
      if (profile.username) setUsername(profile.username);
      if (profile.steam_id) setSteamId(profile.steam_id);
    }
  }, [profile]);

  // Se não está logado, redireciona para login
  useEffect(() => {
    if (!user && !loading) {
      router.push("/campeonatos/login");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validar username (apenas se não tiver um)
    if (!profile?.username) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        addToast(usernameValidation.error!, "error");
        return;
      }
    }

    // Validar Steam ID
    const steamIdValidation = validateSteamId(steamId);
    if (!steamIdValidation.isValid) {
      addToast(steamIdValidation.error!, "error");
      return;
    }

    setLoading(true);

    const updateData: Record<string, unknown> = {
      steam_id: sanitizeSteamId(steamId),
      is_tournament_player: true,
    };

    // Só atualiza username se não tiver um
    if (!profile?.username) {
      updateData.username = sanitizeUsername(username);
    }

    try {
      const { error } = await updateProfile(updateData);

      if (error) {
        console.error("Erro ao atualizar perfil:", error);
        addToast("Erro ao atualizar perfil. Tente novamente.", "error");
        setLoading(false);
        return;
      }

      await refreshProfile();
      addToast("Perfil completado com sucesso!", "success");

      // Usar window.location para garantir reload completo do estado
      window.location.href = "/campeonatos";
    } catch (err) {
      console.error("Erro inesperado:", err);
      addToast("Erro ao atualizar perfil. Tente novamente.", "error");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#A855F7]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A855F7]/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(#A855F7 1px, transparent 1px), linear-gradient(90deg, #A855F7 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Header */}
      <header className="relative z-10 h-16 border-b border-[#A855F7]/10">
        <div className="h-full flex items-center justify-center px-6">
          <Link href="/campeonatos" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center group-hover:bg-[#A855F7]/30 transition-colors">
              <span className="font-display text-[#A855F7] text-lg">O</span>
            </div>
            <span className="font-display text-[#F5F5DC] text-lg tracking-wider">
              ORBITAL ROXA
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#A855F7]/20 via-[#7C3AED]/20 to-[#A855F7]/20 rounded-2xl blur-xl opacity-50" />

            <div className="relative bg-[#0f0f15]/90 backdrop-blur-xl border border-[#A855F7]/20 rounded-2xl p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#A855F7]/20 to-[#7C3AED]/20 border border-[#A855F7]/30 mb-4">
                  <svg className="w-8 h-8 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">
                  COMPLETAR PERFIL
                </h1>
                <p className="text-[#A1A1AA] text-sm">
                  Para participar dos campeonatos, precisamos de mais algumas informacoes
                </p>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-xl p-4 mb-6">
                <svg className="w-5 h-5 text-[#A855F7] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#A1A1AA] text-sm">
                  Logado como <span className="text-[#F5F5DC] font-medium">{user.email}</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {!profile?.username && (
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                      NOME DE USUARIO <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-[#52525B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-xl pl-12 pr-4 py-3.5 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 focus:bg-[#1a1a2e] transition-all"
                        placeholder="seu_nickname"
                        required
                      />
                    </div>
                  </div>
                )}

                {profile?.username && (
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                      NOME DE USUARIO
                    </label>
                    <div className="bg-[#1a1a2e]/30 border border-[#27272A] rounded-xl px-4 py-3.5 text-[#F5F5DC]">
                      {profile.username}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="steamId" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                    STEAM ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[#52525B]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="steamId"
                      value={steamId}
                      onChange={(e) => setSteamId(e.target.value)}
                      className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-xl pl-12 pr-4 py-3.5 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 focus:bg-[#1a1a2e] transition-all"
                      placeholder="76561198xxxxxxxxx"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-[#52525B]">
                    Encontre seu Steam ID em{" "}
                    <a
                      href="https://steamid.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#A855F7] hover:text-[#C084FC]"
                    >
                      steamid.io
                    </a>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#A855F7] to-[#7C3AED] rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-r from-[#A855F7] to-[#9333EA] hover:from-[#9333EA] hover:to-[#7C3AED] disabled:from-[#A855F7]/50 disabled:to-[#9333EA]/50 text-white font-mono text-sm tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        SALVANDO...
                      </>
                    ) : (
                      <>
                        SALVAR E CONTINUAR
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
