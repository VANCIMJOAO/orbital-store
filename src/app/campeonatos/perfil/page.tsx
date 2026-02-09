"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import { TournamentHeader } from "@/components/TournamentHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface PlayerStats {
  matches: number;
  wins: number;
  losses: number;
  winrate: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: string;
  headshots: number;
  hsPercentage: string;
  totalDamage: number;
  adr: string;
  avgRating: string;
  roundsPlayed: number;
  firstKills: number;
  firstDeaths: number;
  fkFdDiff: number;
  clutchWins: number;
  clutchAttempts: number;
  clutchRate: string;
  aces: number;
  fourKills: number;
  threeKills: number;
  twoKills: number;
}

interface MatchHistoryEntry {
  matchId: string;
  mapName: string;
  date: string;
  result: "win" | "loss";
  score: string;
  playerTeam: { id: string; name: string; tag: string; logo_url: string | null } | null;
  opponentTeam: { id: string; name: string; tag: string; logo_url: string | null } | null;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    rating: number | null;
    adr: number | null;
  };
}

interface PlayerTeam {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  tier: "bronze" | "silver" | "gold" | "purple";
}

function computeAchievements(
  stats: PlayerStats | null,
  matchHistory: MatchHistoryEntry[],
  team: PlayerTeam | null,
): Achievement[] {
  const s = stats;
  return [
    // Partidas jogadas
    { id: "first_match", name: "Primeira Partida", description: "Jogue sua primeira partida", icon: "1", unlocked: (s?.matches || 0) >= 1, tier: "bronze" },
    { id: "veteran_5", name: "Veterano", description: "Jogue 5 partidas", icon: "5", unlocked: (s?.matches || 0) >= 5, tier: "silver" },
    { id: "veteran_10", name: "Experiente", description: "Jogue 10 partidas", icon: "10", unlocked: (s?.matches || 0) >= 10, tier: "gold" },
    // Vitórias
    { id: "first_win", name: "Primeira Vitória", description: "Vença sua primeira partida", icon: "W", unlocked: (s?.wins || 0) >= 1, tier: "bronze" },
    { id: "five_wins", name: "Dominante", description: "Vença 5 partidas", icon: "5W", unlocked: (s?.wins || 0) >= 5, tier: "gold" },
    // K/D
    { id: "positive_kd", name: "Positivo", description: "Tenha K/D acima de 1.0", icon: "K", unlocked: parseFloat(s?.kd || "0") >= 1.0 && (s?.matches || 0) > 0, tier: "silver" },
    { id: "kd_master", name: "Mestre do K/D", description: "Tenha K/D acima de 1.5", icon: "K+", unlocked: parseFloat(s?.kd || "0") >= 1.5 && (s?.matches || 0) > 0, tier: "gold" },
    // Kills
    { id: "kills_50", name: "Atirador", description: "Faça 50 kills no total", icon: "50", unlocked: (s?.kills || 0) >= 50, tier: "bronze" },
    { id: "kills_200", name: "Exterminador", description: "Faça 200 kills no total", icon: "200", unlocked: (s?.kills || 0) >= 200, tier: "gold" },
    // Headshots
    { id: "headhunter", name: "Caçador de Cabeças", description: "HS% acima de 50%", icon: "HS", unlocked: parseFloat(s?.hsPercentage || "0") >= 50 && (s?.kills || 0) > 0, tier: "silver" },
    // Multi-kills
    { id: "first_ace", name: "Ace!", description: "Faça um ace (5K em um round)", icon: "A", unlocked: (s?.aces || 0) >= 1, tier: "purple" },
    { id: "quad_kill", name: "Quadra Kill", description: "Faça um 4K em um round", icon: "4K", unlocked: (s?.fourKills || 0) >= 1, tier: "gold" },
    // Clutch
    { id: "clutch_master", name: "Clutch Master", description: "Vença um clutch", icon: "C", unlocked: (s?.clutchWins || 0) >= 1, tier: "purple" },
    // Rating
    { id: "star_player", name: "Estrela", description: "Rating médio acima de 1.2", icon: "R", unlocked: parseFloat(s?.avgRating || "0") >= 1.2 && (s?.matches || 0) > 0, tier: "gold" },
    // Time
    { id: "team_player", name: "Jogador de Time", description: "Faça parte de um time", icon: "T", unlocked: team !== null, tier: "bronze" },
    // First kills
    { id: "entry_fragger", name: "Entry Fragger", description: "Faça 10 first kills", icon: "FK", unlocked: (s?.firstKills || 0) >= 10, tier: "silver" },
  ];
}

function PerfilContent() {
  const { profile, updateProfile, refreshProfile, signOut } = useAuth();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    discord_username: profile?.discord_username || "",
  });
  const [saving, setSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [team, setTeam] = useState<PlayerTeam | null>(null);

  // Conquistas calculadas a partir dos stats
  const achievements = computeAchievements(stats, matchHistory, team);

  // Buscar stats reais da API
  useEffect(() => {
    async function fetchStats() {
      if (!profile?.id) return;
      setStatsLoading(true);
      try {
        const res = await fetch(`/api/profiles/${profile.id}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setMatchHistory(data.matchHistory || []);
          setTeam(data.team || null);
        }
      } catch {
        // fetch error
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [profile?.id]);

  // Calcular XP necessário para o próximo nível (1000 XP por nível)
  const xpPerLevel = 1000;
  const currentLevel = profile?.level || 1;
  const currentXp = profile?.xp || 0;
  const xpForCurrentLevel = currentXp % xpPerLevel;
  const xpProgress = (xpForCurrentLevel / xpPerLevel) * 100;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Data desconhecida";
    const date = new Date(dateString);
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatMatchDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/campeonatos/jogador/${profile?.username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      addToast("Link do perfil copiado!", "success");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      addToast("Link do perfil copiado!", "success");
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      discord_username: editForm.discord_username || null,
    });
    if (error) {
      addToast("Erro ao salvar alterações", "error");
    } else {
      await refreshProfile();
      addToast("Perfil atualizado!", "success");
      setIsEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <TournamentHeader />

      <main className="flex-1 pt-16">
        {/* Banner do Perfil */}
        <div className="relative h-48 bg-gradient-to-r from-[#A855F7]/20 via-[#1a1a2e] to-[#7C3AED]/20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </div>

        {/* Info Principal do Usuário */}
        <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Avatar Grande */}
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center border-4 border-[#0A0A0A] shadow-lg shadow-[#A855F7]/20">
              <span className="font-display text-white text-5xl">
                {profile?.username?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl text-[#F5F5DC]">{profile?.username}</h1>
                <span className="px-2 py-1 bg-[#A855F7]/20 border border-[#A855F7]/50 rounded text-xs font-mono text-[#A855F7]">
                  BR
                </span>
                {profile?.is_admin && (
                  <span className="px-2 py-1 bg-[#eab308]/20 border border-[#eab308]/50 rounded text-xs font-mono text-[#eab308] flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-[#A1A1AA] text-sm font-body mb-4">
                Membro desde {formatDate(profile?.created_at)}
              </p>

              {/* Barra de XP */}
              <div className="max-w-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-[#A855F7]">NÍVEL {currentLevel}</span>
                  <span className="font-mono text-xs text-[#A1A1AA]">{xpForCurrentLevel}/{xpPerLevel} XP</span>
                </div>
                <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full transition-all"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-[#eab308]/20 hover:bg-[#eab308]/30 border border-[#eab308]/50 text-[#eab308] font-mono text-xs rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  PAINEL ADMIN
                </Link>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
              >
                EDITAR PERFIL
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-xs rounded-lg transition-colors"
              >
                COMPARTILHAR
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Edição */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#12121a] border border-[#27272A] rounded-2xl p-6 w-full max-w-md">
              <h2 className="font-display text-xl text-[#F5F5DC] mb-6">EDITAR PERFIL</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#A1A1AA] mb-2">NOME DE USUÁRIO</label>
                  <div className="bg-[#1a1a2e]/50 border border-[#27272A] rounded-lg px-4 py-3 text-[#A1A1AA]">
                    {profile?.username}
                  </div>
                  <p className="text-[10px] text-[#52525B] mt-1">O nome de usuário não pode ser alterado</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A1A1AA] mb-2">STEAM ID</label>
                  <div className="bg-[#1a1a2e]/50 border border-[#27272A] rounded-lg px-4 py-3 text-[#A1A1AA]">
                    {profile?.steam_id}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A1A1AA] mb-2">DISCORD</label>
                  <input
                    type="text"
                    value={editForm.discord_username}
                    onChange={(e) => setEditForm({ ...editForm, discord_username: e.target.value })}
                    placeholder="usuario#0000"
                    className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-3 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  {saving ? "SALVANDO..." : "SALVAR"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Conteúdo */}
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Estatísticas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cards de Stats Principais */}
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">PARTIDAS</span>
                    <span className="font-display text-2xl text-[#F5F5DC]">{stats?.matches || 0}</span>
                  </div>
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">WINRATE</span>
                    <span className={`font-display text-2xl ${
                      parseFloat(stats?.winrate || "0") >= 50 ? "text-[#22c55e]" : "text-[#eab308]"
                    }`}>{stats?.winrate || "0%"}</span>
                  </div>
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">K/D</span>
                    <span className={`font-display text-2xl ${
                      parseFloat(stats?.kd || "0") >= 1 ? "text-[#22c55e]" : "text-[#ef4444]"
                    }`}>{stats?.kd || "0.00"}</span>
                  </div>
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">RATING</span>
                    <span className={`font-display text-2xl ${
                      parseFloat(stats?.avgRating || "0") >= 1 ? "text-[#22c55e]" : "text-[#F5F5DC]"
                    }`}>{stats?.avgRating || "0.00"}</span>
                  </div>
                </div>

                {/* Estatísticas Detalhadas */}
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
                  <div className="p-4 border-b border-[#27272A]">
                    <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">ESTATÍSTICAS DETALHADAS</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                      <span className="text-xs text-[#A1A1AA]">Vitórias</span>
                      <span className="font-mono text-sm text-[#22c55e]">{stats?.wins || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                      <span className="text-xs text-[#A1A1AA]">Derrotas</span>
                      <span className="font-mono text-sm text-[#eab308]">{stats?.losses || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                      <span className="text-xs text-[#A1A1AA]">Kills</span>
                      <span className="font-mono text-sm text-[#F5F5DC]">{stats?.kills || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                      <span className="text-xs text-[#A1A1AA]">Deaths</span>
                      <span className="font-mono text-sm text-[#F5F5DC]">{stats?.deaths || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                      <span className="text-xs text-[#A1A1AA]">Assists</span>
                      <span className="font-mono text-sm text-[#F5F5DC]">{stats?.assists || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                      <span className="text-xs text-[#A1A1AA]">HS%</span>
                      <span className="font-mono text-sm text-[#A855F7]">{stats?.hsPercentage || "0%"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                      <span className="text-xs text-[#A1A1AA]">ADR</span>
                      <span className="font-mono text-sm text-[#F5F5DC]">{stats?.adr || "0"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                      <span className="text-xs text-[#A1A1AA]">First Kills</span>
                      <span className="font-mono text-sm text-[#22c55e]">{stats?.firstKills || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                      <span className="text-xs text-[#A1A1AA]">Clutch Rate</span>
                      <span className="font-mono text-sm text-[#A855F7]">{stats?.clutchRate || "0%"}</span>
                    </div>
                  </div>
                </div>

                {/* Histórico de Partidas */}
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
                  <div className="p-4 border-b border-[#27272A]">
                    <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">HISTÓRICO DE PARTIDAS</h3>
                  </div>
                  {matchHistory.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-[#A1A1AA] text-sm">Nenhuma partida registrada ainda</p>
                      <p className="text-[#52525B] text-xs mt-1">Participe de campeonatos para ver seu histórico aqui</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#27272A]">
                      {matchHistory.map((match) => (
                        <Link
                          key={match.matchId}
                          href={`/campeonatos/partida/${match.matchId}`}
                          className="flex items-center gap-4 p-4 hover:bg-[#1a1a2e] transition-colors"
                        >
                          {/* Resultado */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                            match.result === "win"
                              ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                              : "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30"
                          }`}>
                            {match.result === "win" ? "W" : "L"}
                          </div>

                          {/* Info da Partida */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-[#F5F5DC] font-body truncate">
                                vs {match.opponentTeam?.name || "TBD"}
                              </span>
                              <span className="text-xs font-mono text-[#A1A1AA]">{match.score}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-[#52525B]">
                              <span>{match.mapName || "Mapa"}</span>
                              <span>-</span>
                              <span>{formatMatchDate(match.date)}</span>
                            </div>
                          </div>

                          {/* Stats do jogador nessa partida */}
                          <div className="flex items-center gap-4 text-xs font-mono">
                            <div className="text-center">
                              <span className="text-[#22c55e]">{match.stats.kills}</span>
                              <span className="text-[#52525B]">/</span>
                              <span className="text-[#ef4444]">{match.stats.deaths}</span>
                              <span className="text-[#52525B]">/</span>
                              <span className="text-[#A1A1AA]">{match.stats.assists}</span>
                            </div>
                            {match.stats.rating && (
                              <span className={`font-bold ${
                                Number(match.stats.rating) >= 1 ? "text-[#22c55e]" : "text-[#ef4444]"
                              }`}>
                                {Number(match.stats.rating).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Informações da Conta */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
              <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">INFORMAÇÕES</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-[#1a1a2e] rounded">
                  <svg className="w-5 h-5 text-[#A855F7]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  <div>
                    <span className="text-[10px] text-[#A1A1AA] block">Steam ID</span>
                    <span className="text-xs text-[#F5F5DC] font-mono">{profile?.steam_id}</span>
                  </div>
                </div>

                {profile?.discord_username && (
                  <div className="flex items-center gap-3 p-2 bg-[#1a1a2e] rounded">
                    <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <div>
                      <span className="text-[10px] text-[#A1A1AA] block">Discord</span>
                      <span className="text-xs text-[#F5F5DC]">{profile?.discord_username}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-2 bg-[#1a1a2e] rounded">
                  <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="text-[10px] text-[#A1A1AA] block">Membro desde</span>
                    <span className="text-xs text-[#F5F5DC]">{formatDate(profile?.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Atual */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
              <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">TIME ATUAL</h3>
              {team ? (
                <Link
                  href={`/campeonatos/time/${team.id}`}
                  className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#27272A] transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#27272A] border border-[#A855F7]/30 flex items-center justify-center overflow-hidden">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-xs font-mono text-[#A1A1AA]">{team.tag}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-body text-[#F5F5DC] block">{team.name}</span>
                    <span className="text-[10px] font-mono text-[#A1A1AA]">{team.tag}</span>
                  </div>
                </Link>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#A1A1AA] text-sm">Sem time</p>
                  <p className="text-[#52525B] text-xs mt-1">Junte-se a um time para competir</p>
                </div>
              )}
            </div>

            {/* Conquistas */}
            {!statsLoading && (
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
                <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
                  <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">CONQUISTAS</h3>
                  <span className="text-xs font-mono text-[#A855F7]">
                    {achievements.filter(a => a.unlocked).length}/{achievements.length}
                  </span>
                </div>
                <div className="p-3 grid grid-cols-4 gap-2">
                  {achievements.map((ach) => {
                    const tierColors = {
                      bronze: ach.unlocked ? "border-[#CD7F32]/60 bg-[#CD7F32]/10 text-[#CD7F32]" : "border-[#27272A] bg-[#0A0A0A] text-[#52525B]",
                      silver: ach.unlocked ? "border-[#C0C0C0]/60 bg-[#C0C0C0]/10 text-[#C0C0C0]" : "border-[#27272A] bg-[#0A0A0A] text-[#52525B]",
                      gold: ach.unlocked ? "border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]" : "border-[#27272A] bg-[#0A0A0A] text-[#52525B]",
                      purple: ach.unlocked ? "border-[#A855F7]/60 bg-[#A855F7]/10 text-[#A855F7]" : "border-[#27272A] bg-[#0A0A0A] text-[#52525B]",
                    };
                    return (
                      <div
                        key={ach.id}
                        className={`relative group rounded-lg border p-2 flex flex-col items-center justify-center aspect-square transition-all ${tierColors[ach.tier]} ${ach.unlocked ? "" : "opacity-40"}`}
                        title={`${ach.name}: ${ach.description}`}
                      >
                        <span className="font-mono text-xs font-bold">{ach.icon}</span>
                        <span className="text-[7px] font-mono mt-1 text-center leading-tight truncate w-full">
                          {ach.name}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                          <div className="bg-[#1a1a2e] border border-[#27272A] rounded-lg p-2 shadow-lg whitespace-nowrap">
                            <span className="text-[10px] text-[#F5F5DC] block font-mono font-bold">{ach.name}</span>
                            <span className="text-[9px] text-[#A1A1AA] block">{ach.description}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multi-kills */}
            {stats && (stats.aces > 0 || stats.fourKills > 0 || stats.threeKills > 0) && (
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">MULTI-KILLS</h3>
                <div className="space-y-2">
                  {stats.aces > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-[#A1A1AA]">Aces (5K)</span>
                      <span className="font-mono text-sm text-[#FFD700] font-bold">{stats.aces}</span>
                    </div>
                  )}
                  {stats.fourKills > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-[#A1A1AA]">4K</span>
                      <span className="font-mono text-sm text-[#A855F7]">{stats.fourKills}</span>
                    </div>
                  )}
                  {stats.threeKills > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-[#A1A1AA]">3K</span>
                      <span className="font-mono text-sm text-[#F5F5DC]">{stats.threeKills}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <RequireTournamentProfile>
      <PerfilContent />
    </RequireTournamentProfile>
  );
}
