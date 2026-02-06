"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface PlayerProfile {
  id: string;
  username: string;
  steam_id: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  discord_username: string | null;
  created_at: string;
}

interface PlayerTeam {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
}

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

interface MatchHistoryItem {
  matchId: string;
  mapName: string;
  date: string;
  result: "win" | "loss";
  score: string;
  playerTeam: { id: string; name: string; tag: string; logo_url: string | null };
  opponentTeam: { id: string; name: string; tag: string; logo_url: string | null };
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    rating: number | null;
    adr: number | null;
  };
}

interface PlayerData {
  profile: PlayerProfile;
  team: PlayerTeam | null;
  stats: PlayerStats;
  matchHistory: MatchHistoryItem[];
}

export default function JogadorPage({ params }: { params: Promise<{ profileId: string }> }) {
  const resolvedParams = use(params);
  const { profile: currentUser } = useAuth();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "matches" | "stats">("overview");

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const response = await fetch(`/api/profiles/${resolvedParams.profileId}/stats`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Jogador não encontrado");
          } else {
            setError("Erro ao carregar perfil");
          }
          return;
        }
        const data = await response.json();
        setPlayerData(data);
      } catch {
        setError("Erro de conexão");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [resolvedParams.profileId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data desconhecida";
    const date = new Date(dateString);
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatMatchDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#A855F7]/30 border-t-[#A855F7] rounded-full animate-spin" />
          <span className="text-[#A1A1AA] font-mono text-sm">Carregando perfil...</span>
        </div>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#27272A] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">{error || "Jogador não encontrado"}</h1>
          <p className="text-[#A1A1AA] text-sm mb-6">O perfil que você está procurando não existe ou foi removido.</p>
          <Link
            href="/campeonatos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-xs rounded-lg transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const { profile, team, stats, matchHistory = [] } = playerData;
  const isOwnProfile = currentUser?.id === profile.id;

  // Rating color
  const getRatingColor = (rating: string) => {
    const r = parseFloat(rating);
    if (r >= 1.2) return "text-[#22c55e]";
    if (r >= 1.0) return "text-[#F5F5DC]";
    if (r >= 0.8) return "text-[#eab308]";
    return "text-[#ef4444]";
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header Simples */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0f0f15] border-b border-[#A855F7]/20">
        <div className="h-full flex items-center justify-between px-6">
          <Link href="/campeonatos" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center">
              <span className="font-display text-[#A855F7] text-lg">O</span>
            </div>
            <span className="font-display text-[#F5F5DC] text-lg tracking-wider hidden sm:block">
              ORBITAL ROXA
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors tracking-wider">
              INÍCIO
            </Link>
            <Link href="/campeonatos" className="font-mono text-xs text-[#A855F7] tracking-wider">
              CAMPEONATOS
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isOwnProfile && (
              <Link
                href="/campeonatos/perfil"
                className="px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
              >
                EDITAR PERFIL
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 pt-16">
        {/* Banner */}
        <div className="relative h-48 bg-gradient-to-r from-[#A855F7]/20 via-[#1a1a2e] to-[#7C3AED]/20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </div>

        {/* Info Principal */}
        <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center border-4 border-[#0A0A0A] shadow-lg shadow-[#A855F7]/20">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="font-display text-white text-5xl">
                  {profile.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="font-display text-3xl text-[#F5F5DC]">{profile.username}</h1>
                <span className="px-2 py-1 bg-[#A855F7]/20 border border-[#A855F7]/50 rounded text-xs font-mono text-[#A855F7]">
                  BR
                </span>
                {team && (
                  <Link
                    href={`/campeonatos/time/${team.id}`}
                    className="flex items-center gap-2 px-2 py-1 bg-[#27272A] hover:bg-[#3f3f46] rounded text-xs transition-colors"
                  >
                    {team.logo_url && (
                      <img src={team.logo_url} alt={team.name} className="w-4 h-4 object-contain" />
                    )}
                    <span className="font-mono text-[#F5F5DC]">{team.tag}</span>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-[#A1A1AA]">
                <span>Membro desde {formatDate(profile.created_at)}</span>
                {profile.steam_id && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                    {profile.steam_id.length > 12 ? `${profile.steam_id.slice(0, 12)}...` : profile.steam_id}
                  </span>
                )}
              </div>

              {/* Rating destaque */}
              <div className="flex items-center gap-6 mt-4">
                <div>
                  <span className="text-xs text-[#A1A1AA] block">Rating</span>
                  <span className={`font-display text-3xl ${getRatingColor(stats.avgRating)}`}>
                    {stats.avgRating}
                  </span>
                </div>
                <div className="h-10 w-px bg-[#27272A]" />
                <div>
                  <span className="text-xs text-[#A1A1AA] block">K/D</span>
                  <span className="font-display text-3xl text-[#F5F5DC]">{stats.kd}</span>
                </div>
                <div className="h-10 w-px bg-[#27272A]" />
                <div>
                  <span className="text-xs text-[#A1A1AA] block">ADR</span>
                  <span className="font-display text-3xl text-[#A855F7]">{stats.adr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 mt-8">
          <div className="flex gap-1 border-b border-[#27272A]">
            {(["overview", "matches", "stats"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-mono text-xs tracking-wider transition-colors relative ${
                  activeTab === tab
                    ? "text-[#A855F7]"
                    : "text-[#A1A1AA] hover:text-[#F5F5DC]"
                }`}
              >
                {tab === "overview" && "VISÃO GERAL"}
                {tab === "matches" && "PARTIDAS"}
                {tab === "stats" && "ESTATÍSTICAS"}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A855F7]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">PARTIDAS</span>
                    <span className="font-display text-2xl text-[#F5F5DC]">{stats.matches}</span>
                  </div>
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">WINRATE</span>
                    <span className="font-display text-2xl text-[#22c55e]">{stats.winrate}</span>
                  </div>
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">HS%</span>
                    <span className="font-display text-2xl text-[#A855F7]">{stats.hsPercentage}</span>
                  </div>
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">CLUTCH</span>
                    <span className="font-display text-2xl text-[#F5F5DC]">{stats.clutchRate}</span>
                  </div>
                </div>

                {/* Últimas Partidas */}
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
                  <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
                    <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">ÚLTIMAS PARTIDAS</h3>
                    {matchHistory.length > 0 && (
                      <button
                        onClick={() => setActiveTab("matches")}
                        className="text-xs text-[#A855F7] hover:underline"
                      >
                        Ver todas
                      </button>
                    )}
                  </div>
                  {matchHistory.length > 0 ? (
                    <div className="divide-y divide-[#27272A]">
                      {matchHistory.slice(0, 5).map((match) => (
                        <Link
                          key={match.matchId}
                          href={`/campeonatos/partida/${match.matchId}`}
                          className="flex items-center gap-4 p-4 hover:bg-[#1a1a2e] transition-colors"
                        >
                          <div className={`w-1 h-12 rounded-full ${match.result === "win" ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-[#A1A1AA]">{match.mapName}</span>
                              <span className="text-[10px] text-[#52525B]">{formatMatchDate(match.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#F5F5DC]">{match.playerTeam?.name || "Time"}</span>
                              <span className={`font-mono text-sm ${match.result === "win" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                                {match.score}
                              </span>
                              <span className="text-sm text-[#A1A1AA]">{match.opponentTeam?.name || "Oponente"}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm text-[#F5F5DC]">
                              {match.stats.kills}/{match.stats.deaths}/{match.stats.assists}
                            </div>
                            {match.stats.rating && (
                              <div className={`font-mono text-xs ${getRatingColor(match.stats.rating.toFixed(2))}`}>
                                {match.stats.rating.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-[#A1A1AA] text-sm">Nenhuma partida registrada</p>
                      <p className="text-[#52525B] text-xs mt-1">Participe de campeonatos para ver o histórico</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Lateral */}
              <div className="space-y-6">
                {/* Multi-kills */}
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                  <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">MULTI-KILLS</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#A1A1AA]">Aces (5K)</span>
                      <span className="font-mono text-sm text-[#F5F5DC]">{stats.aces}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#A1A1AA]">4 Kills</span>
                      <span className="font-mono text-sm text-[#F5F5DC]">{stats.fourKills}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#A1A1AA]">3 Kills</span>
                      <span className="font-mono text-sm text-[#F5F5DC]">{stats.threeKills}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#A1A1AA]">2 Kills</span>
                      <span className="font-mono text-sm text-[#F5F5DC]">{stats.twoKills}</span>
                    </div>
                  </div>
                </div>

                {/* Entry Stats */}
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                  <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">ENTRY FRAGS</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#A1A1AA]">First Kills</span>
                      <span className="font-mono text-sm text-[#22c55e]">{stats.firstKills}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#A1A1AA]">First Deaths</span>
                      <span className="font-mono text-sm text-[#ef4444]">{stats.firstDeaths}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#A1A1AA]">FK/FD Diff</span>
                      <span className={`font-mono text-sm ${stats.fkFdDiff >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {stats.fkFdDiff >= 0 ? "+" : ""}{stats.fkFdDiff}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Atual */}
                {team ? (
                  <Link
                    href={`/campeonatos/time/${team.id}`}
                    className="block bg-[#12121a] border border-[#27272A] rounded-lg p-4 hover:border-[#A855F7]/50 transition-colors"
                  >
                    <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">TIME ATUAL</h3>
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center">
                          <span className="font-display text-xl text-[#A855F7]">{team.tag[0]}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-display text-lg text-[#F5F5DC] block">{team.name}</span>
                        <span className="text-xs font-mono text-[#A1A1AA]">[{team.tag}]</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">TIME ATUAL</h3>
                    <div className="text-center py-2">
                      <p className="text-[#A1A1AA] text-sm">Sem time</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Matches Tab */}
          {activeTab === "matches" && (
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
              {matchHistory.length > 0 ? (
                <div className="divide-y divide-[#27272A]">
                  {matchHistory.map((match) => (
                    <Link
                      key={match.matchId}
                      href={`/campeonatos/partida/${match.matchId}`}
                      className="flex items-center gap-4 p-4 hover:bg-[#1a1a2e] transition-colors"
                    >
                      <div className={`w-1 h-14 rounded-full ${match.result === "win" ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
                      <div className="w-20">
                        <span className="font-mono text-xs text-[#A1A1AA] block">{match.mapName}</span>
                        <span className="text-[10px] text-[#52525B]">{formatMatchDate(match.date)}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          {match.playerTeam?.logo_url && (
                            <img src={match.playerTeam.logo_url} alt="" className="w-6 h-6 object-contain" />
                          )}
                          <span className="text-sm text-[#F5F5DC] truncate">{match.playerTeam?.name}</span>
                        </div>
                        <span className={`font-mono text-lg px-3 ${match.result === "win" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {match.score}
                        </span>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          {match.opponentTeam?.logo_url && (
                            <img src={match.opponentTeam.logo_url} alt="" className="w-6 h-6 object-contain" />
                          )}
                          <span className="text-sm text-[#A1A1AA] truncate">{match.opponentTeam?.name}</span>
                        </div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className="font-mono text-sm text-[#F5F5DC]">
                          {match.stats.kills} / {match.stats.deaths} / {match.stats.assists}
                        </div>
                        <div className="flex items-center justify-end gap-2 text-xs text-[#A1A1AA]">
                          {match.stats.rating && (
                            <span className={getRatingColor(match.stats.rating.toFixed(2))}>
                              {match.stats.rating.toFixed(2)}
                            </span>
                          )}
                          {match.stats.adr && (
                            <span>{match.stats.adr.toFixed(0)} ADR</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-[#A1A1AA] text-sm">Nenhuma partida registrada</p>
                  <p className="text-[#52525B] text-xs mt-1">Participe de campeonatos para ver o histórico</p>
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Combat Stats */}
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  COMBATE
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Total de Kills</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.kills}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Total de Deaths</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.deaths}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Total de Assists</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.assists}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">K/D Ratio</span>
                    <span className={`font-mono text-sm ${parseFloat(stats.kd) >= 1 ? "text-[#22c55e]" : "text-[#eab308]"}`}>
                      {stats.kd}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Headshots</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.headshots}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-[#A1A1AA]">HS%</span>
                    <span className="font-mono text-sm text-[#A855F7]">{stats.hsPercentage}</span>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  PERFORMANCE
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Rating Médio</span>
                    <span className={`font-mono text-sm ${getRatingColor(stats.avgRating)}`}>{stats.avgRating}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">ADR</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.adr}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Dano Total</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.totalDamage.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Rounds Jogados</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.roundsPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-[#A1A1AA]">Média K/R</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">
                      {stats.roundsPlayed > 0 ? (stats.kills / stats.roundsPlayed).toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Match Stats */}
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  PARTIDAS
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Total de Partidas</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.matches}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Vitórias</span>
                    <span className="font-mono text-sm text-[#22c55e]">{stats.wins}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Derrotas</span>
                    <span className="font-mono text-sm text-[#ef4444]">{stats.losses}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-[#A1A1AA]">Winrate</span>
                    <span className={`font-mono text-sm ${parseFloat(stats.winrate) >= 50 ? "text-[#22c55e]" : "text-[#eab308]"}`}>
                      {stats.winrate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clutch Stats */}
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  CLUTCHES
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Clutches Ganhos</span>
                    <span className="font-mono text-sm text-[#22c55e]">{stats.clutchWins}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Tentativas</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.clutchAttempts}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-[#A1A1AA]">Taxa de Sucesso</span>
                    <span className="font-mono text-sm text-[#A855F7]">{stats.clutchRate}</span>
                  </div>
                </div>
              </div>

              {/* Entry Stats */}
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  ENTRY FRAGS
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">First Kills</span>
                    <span className="font-mono text-sm text-[#22c55e]">{stats.firstKills}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">First Deaths</span>
                    <span className="font-mono text-sm text-[#ef4444]">{stats.firstDeaths}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-[#A1A1AA]">FK/FD Diff</span>
                    <span className={`font-mono text-sm ${stats.fkFdDiff >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {stats.fkFdDiff >= 0 ? "+" : ""}{stats.fkFdDiff}
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-kill Stats */}
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  MULTI-KILLS
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Aces (5K)</span>
                    <span className="font-mono text-sm text-[#eab308]">{stats.aces}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Quadra Kills</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.fourKills}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                    <span className="text-xs text-[#A1A1AA]">Triple Kills</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.threeKills}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-[#A1A1AA]">Double Kills</span>
                    <span className="font-mono text-sm text-[#F5F5DC]">{stats.twoKills}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f0f15] border-t border-[#27272A] py-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-xs text-[#52525B]">
            Orbital Roxa Campeonatos - Perfil do Jogador
          </span>
        </div>
      </footer>
    </div>
  );
}
