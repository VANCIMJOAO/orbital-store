"use client";

import Link from "next/link";
import { TournamentHeader } from "@/components/TournamentHeader";
import { useEffect, useState, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import { useGOTVMatches } from "@/hooks/useGOTV";
import type { Database } from "@/lib/database.types";

type Match = Database["public"]["Tables"]["matches"]["Row"];

interface MatchWithTeams extends Match {
  team1: { name: string; tag: string; logo_url: string | null } | null;
  team2: { name: string; tag: string; logo_url: string | null } | null;
}

const roundLabels: Record<string, string> = {
  winner_quarter_1: "Quartas - Winner",
  winner_quarter_2: "Quartas - Winner",
  winner_quarter_3: "Quartas - Winner",
  winner_quarter_4: "Quartas - Winner",
  winner_semi_1: "Semi-Final",
  winner_semi_2: "Semi-Final",
  winner_final: "Final Winner",
  loser_round1_1: "LR1",
  loser_round1_2: "LR1",
  loser_round2_1: "LR2",
  loser_round2_2: "LR2",
  loser_semi: "Semi - Loser",
  loser_final: "Final Loser",
  grand_final: "Grand Final",
};

interface LiveMatchEnriched {
  gotvMatchId: string;
  dbMatchId: string;
  mapName: string;
  scoreCT: number;
  scoreT: number;
  currentRound: number;
  team1: { name: string; tag: string; logo_url: string | null } | null;
  team2: { name: string; tag: string; logo_url: string | null } | null;
  round?: string;
}

function PartidasContent() {
  const { matches: liveMatches, serverOffline } = useGOTVMatches();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [upcomingMatches, setUpcomingMatches] = useState<MatchWithTeams[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<MatchWithTeams[]>([]);
  const [enrichedLiveMatches, setEnrichedLiveMatches] = useState<LiveMatchEnriched[]>([]);
  const [loading, setLoading] = useState(true);

  // Enrich GOTV live matches with real team names from Supabase
  useEffect(() => {
    async function enrichLiveMatches() {
      if (liveMatches.length === 0) {
        setEnrichedLiveMatches([]);
        return;
      }

      // Fetch DB data for matches that have dbMatchId
      const linked = liveMatches.filter((m) => m.dbMatchId);
      const unlinked = liveMatches.filter((m) => !m.dbMatchId);
      let dbMap = new Map<string, any>();

      if (linked.length > 0) {
        const dbIds = linked.map((m) => m.dbMatchId!);
        const { data: dbMatches } = await supabase
          .from("matches")
          .select(`
            id, round,
            team1:teams!matches_team1_id_fkey(name, tag, logo_url),
            team2:teams!matches_team2_id_fkey(name, tag, logo_url)
          `)
          .in("id", dbIds);

        dbMap = new Map((dbMatches || []).map((m: any) => [m.id, m]));
      }

      // For unlinked GOTV matches, try to find a matching match in the DB
      // Priority: status=live first, then first scheduled match (most likely the one being played)
      let fallbackMatch: any = null;
      if (unlinked.length > 0) {
        const { data: liveDb } = await supabase
          .from("matches")
          .select(`
            id, round, map_name,
            team1:teams!matches_team1_id_fkey(name, tag, logo_url),
            team2:teams!matches_team2_id_fkey(name, tag, logo_url)
          `)
          .in("status", ["live", "scheduled"])
          .order("scheduled_at", { ascending: true })
          .limit(1);

        if (liveDb && liveDb.length > 0) {
          fallbackMatch = liveDb[0];
        }
      }

      setEnrichedLiveMatches(
        liveMatches.map((live) => {
          const db = live.dbMatchId
            ? dbMap.get(live.dbMatchId)
            : fallbackMatch;
          return {
            gotvMatchId: live.matchId,
            dbMatchId: live.dbMatchId || db?.id || live.matchId,
            mapName: live.mapName || db?.map_name || "",
            scoreCT: live.scoreCT,
            scoreT: live.scoreT,
            currentRound: live.currentRound,
            team1: db?.team1 || null,
            team2: db?.team2 || null,
            round: db?.round || undefined,
          };
        })
      );
    }

    enrichLiveMatches();
  }, [liveMatches, supabase]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: tournament } = await supabase
          .from("tournaments")
          .select("id")
          .in("status", ["ongoing", "active", "registration", "upcoming", "draft"])
          .order("start_date", { ascending: false })
          .limit(1)
          .single();

        if (!tournament) return;

        // Buscar todas as partidas do torneio
        const { data: matchesData } = await supabase
          .from("matches")
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(name, tag, logo_url),
            team2:teams!matches_team2_id_fkey(name, tag, logo_url)
          `)
          .eq("tournament_id", tournament.id)
          .order("scheduled_at", { ascending: true });

        if (matchesData) {
          const all = matchesData as unknown as MatchWithTeams[];
          setUpcomingMatches(all.filter((m) => m.status === "scheduled" || m.status === "live" || m.status === "pending"));
          setFinishedMatches(all.filter((m) => m.status === "finished" || m.status === "cancelled").reverse());
        }
      } catch {
        // fetch error
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <TournamentHeader />

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="font-display text-2xl text-[#F5F5DC] mb-8">PARTIDAS</h1>

          {/* Partidas GOTV Ao Vivo */}
          {!serverOffline && enrichedLiveMatches.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="font-mono text-red-500 text-sm tracking-wider">PARTIDAS AO VIVO - GOTV</h2>
              </div>
              <div className="space-y-3 mb-8">
                {enrichedLiveMatches.map((match) => (
                  <Link
                    key={match.dbMatchId}
                    href={`/campeonatos/partida/${match.dbMatchId}`}
                    className="block bg-[#12121a] border border-red-500/30 rounded-lg p-4 hover:border-red-500/60 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-[#A855F7]">{match.mapName || "Mapa desconhecido"}</span>
                        {match.round && (
                          <span className="text-xs font-mono text-[#A1A1AA]">
                            {roundLabels[match.round] || match.round}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-mono text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        AO VIVO • ROUND {match.currentRound}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                          {match.team1?.logo_url ? (
                            <img src={match.team1.logo_url} alt={match.team1.tag} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="font-display text-sm text-[#A1A1AA]">
                              {match.team1?.tag?.substring(0, 3).toUpperCase() || "CT"}
                            </span>
                          )}
                        </div>
                        <span className="text-[#F5F5DC] font-display">{match.team1?.name || "Counter-Terrorists"}</span>
                      </div>
                      <div className="text-center">
                        <span className="font-display text-2xl">
                          <span className="text-[#3b82f6]">{match.scoreCT}</span>
                          <span className="text-[#A1A1AA] mx-2">:</span>
                          <span className="text-[#f59e0b]">{match.scoreT}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#F5F5DC] font-display">{match.team2?.name || "Terrorists"}</span>
                        <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                          {match.team2?.logo_url ? (
                            <img src={match.team2.logo_url} alt={match.team2.tag} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="font-display text-sm text-[#A1A1AA]">
                              {match.team2?.tag?.substring(0, 3).toUpperCase() || "T"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#27272A] flex items-center justify-end">
                      <span className="text-xs font-mono text-[#A855F7] flex items-center gap-1">
                        Ver detalhes
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Servidor GOTV Offline Notice */}
          {serverOffline && (
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm text-[#F5F5DC] block">Servidor GOTV Offline</span>
                  <span className="text-xs text-[#A1A1AA]">As partidas ao vivo aparecem aqui quando o servidor está ativo</span>
                </div>
                <Link
                  href="/campeonatos/ao-vivo"
                  className="ml-auto px-3 py-1.5 bg-[#A855F7]/20 border border-[#A855F7]/50 rounded text-xs font-mono text-[#A855F7] hover:bg-[#A855F7]/30 transition-colors"
                >
                  Ver status
                </Link>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs font-mono text-[#A1A1AA]">Carregando partidas...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Próximas Partidas (excluir as que já estão no GOTV ao vivo) */}
              {upcomingMatches.length > 0 && (() => {
                const gotvMatchIds = new Set(enrichedLiveMatches.map(m => m.dbMatchId));
                const filtered = upcomingMatches.filter(m => !gotvMatchIds.has(m.id));
                if (filtered.length === 0) return null;
                return (
                <>
                  <h2 className="font-mono text-[#A855F7] text-sm tracking-wider mb-4">PRÓXIMAS PARTIDAS</h2>
                  <div className="space-y-3 mb-8">
                    {filtered.map((match) => (
                      <Link
                        key={match.id}
                        href={`/campeonatos/partida/${match.id}`}
                        className={`block bg-[#12121a] border rounded-lg p-4 hover:border-[#A855F7]/50 transition-colors ${
                          match.status === "live" ? "border-red-500/30" : "border-[#27272A]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-[#A1A1AA]">
                            {roundLabels[match.round || ""] || match.round || ""}
                          </span>
                          {match.status === "live" ? (
                            <span className="flex items-center gap-1.5 text-xs font-mono text-red-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              AO VIVO
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-[#A1A1AA]">{formatTime(match.scheduled_at)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                              {match.team1?.logo_url ? (
                                <img src={match.team1.logo_url} alt={match.team1.tag} className="w-7 h-7 object-contain" />
                              ) : (
                                <span className="text-[8px] font-mono text-[#A1A1AA]">
                                  {match.team1?.tag?.substring(0, 3).toUpperCase() || "TBD"}
                                </span>
                              )}
                            </div>
                            <span className="text-[#F5F5DC]">{match.team1?.name || "TBD"}</span>
                          </div>
                          <span className="font-mono text-lg text-[#F5F5DC]">
                            {match.status === "live"
                              ? `${match.team1_score} - ${match.team2_score}`
                              : "vs"}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#F5F5DC]">{match.team2?.name || "TBD"}</span>
                            <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                              {match.team2?.logo_url ? (
                                <img src={match.team2.logo_url} alt={match.team2.tag} className="w-7 h-7 object-contain" />
                              ) : (
                                <span className="text-[8px] font-mono text-[#A1A1AA]">
                                  {match.team2?.tag?.substring(0, 3).toUpperCase() || "TBD"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
                );
              })()}

              {/* Partidas Finalizadas */}
              {finishedMatches.length > 0 && (
                <>
                  <h2 className="font-mono text-[#A1A1AA] text-sm tracking-wider mb-4">PARTIDAS ANTERIORES</h2>
                  <div className="space-y-3">
                    {finishedMatches.map((match) => (
                      <Link
                        key={match.id}
                        href={`/campeonatos/partida/${match.id}`}
                        className="block bg-[#12121a] border border-[#27272A] rounded-lg p-4 hover:border-[#A855F7]/50 transition-colors opacity-80"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-[#A1A1AA]">
                            {roundLabels[match.round || ""] || match.round || ""}
                          </span>
                          <span className="text-xs font-mono text-[#A1A1AA]">
                            {formatDate(match.finished_at || match.scheduled_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                              {match.team1?.logo_url ? (
                                <img src={match.team1.logo_url} alt={match.team1.tag} className="w-7 h-7 object-contain" />
                              ) : (
                                <span className="text-[8px] font-mono text-[#A1A1AA]">
                                  {match.team1?.tag?.substring(0, 3).toUpperCase() || "???"}
                                </span>
                              )}
                            </div>
                            <span className={match.winner_id === match.team1_id ? "text-[#22c55e] font-bold" : "text-[#A1A1AA]"}>
                              {match.team1?.name || "TBD"}
                            </span>
                          </div>
                          <span className="font-mono text-sm text-[#F5F5DC]">
                            {match.team1_score} - {match.team2_score}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={match.winner_id === match.team2_id ? "text-[#22c55e] font-bold" : "text-[#A1A1AA]"}>
                              {match.team2?.name || "TBD"}
                            </span>
                            <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                              {match.team2?.logo_url ? (
                                <img src={match.team2.logo_url} alt={match.team2.tag} className="w-7 h-7 object-contain" />
                              ) : (
                                <span className="text-[8px] font-mono text-[#A1A1AA]">
                                  {match.team2?.tag?.substring(0, 3).toUpperCase() || "???"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {upcomingMatches.length === 0 && finishedMatches.length === 0 && (
                <div className="flex items-center justify-center h-32">
                  <span className="text-sm text-[#A1A1AA]">Nenhuma partida encontrada</span>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PartidasPage() {
  return (
    <RequireTournamentProfile>
      <PartidasContent />
    </RequireTournamentProfile>
  );
}
