"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import type { Database } from "@/lib/database.types";

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];

interface MatchWithTeams extends Match {
  team1: { name: string; tag: string; logo_url: string | null } | null;
  team2: { name: string; tag: string; logo_url: string | null } | null;
}

interface TeamRanking {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  wins: number;
  losses: number;
  roundsWon: number;
  roundsLost: number;
}

const roundLabels: Record<string, string> = {
  winner_quarter_1: "Quartas - Winner",
  winner_quarter_2: "Quartas - Winner",
  winner_quarter_3: "Quartas - Winner",
  winner_quarter_4: "Quartas - Winner",
  winner_semi_1: "Semifinal - Winner",
  winner_semi_2: "Semifinal - Winner",
  winner_final: "Final - Winner",
  loser_round1_1: "Round 1 - Loser",
  loser_round1_2: "Round 1 - Loser",
  loser_round2_1: "Round 2 - Loser",
  loser_round2_2: "Round 2 - Loser",
  loser_semi: "Semifinal - Loser",
  loser_final: "Final - Loser",
  grand_final: "Grand Final",
};

function VisaoGeralContent() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [ranking, setRanking] = useState<TeamRanking[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: tournamentData } = await supabase
          .from("tournaments")
          .select("*")
          .in("status", ["ongoing", "active", "registration", "upcoming", "draft"])
          .order("start_date", { ascending: false })
          .limit(1)
          .single();

        if (!tournamentData) return;
        setTournament(tournamentData);

        // Fetch teams
        const { data: tournamentTeamsData } = await supabase
          .from("tournament_teams")
          .select("team_id, teams(*)")
          .eq("tournament_id", tournamentData.id)
          .in("status", ["confirmed", "registered"]);

        const teamsArray = (tournamentTeamsData || [])
          .map((tt) => (tt.teams as unknown) as Team)
          .filter(Boolean);
        setTeams(teamsArray);

        // Fetch all matches
        const { data: matchesData } = await supabase
          .from("matches")
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(name, tag, logo_url),
            team2:teams!matches_team2_id_fkey(name, tag, logo_url)
          `)
          .eq("tournament_id", tournamentData.id)
          .order("scheduled_at", { ascending: true });

        if (matchesData) {
          // Calculate team ranking from finished matches
          const finished = matchesData.filter((m) => m.status === "finished");
          const teamAgg: Record<string, { wins: number; losses: number; roundsWon: number; roundsLost: number }> = {};

          finished.forEach((match) => {
            if (!match.team1_id || !match.team2_id) return;
            if (!teamAgg[match.team1_id]) teamAgg[match.team1_id] = { wins: 0, losses: 0, roundsWon: 0, roundsLost: 0 };
            if (!teamAgg[match.team2_id]) teamAgg[match.team2_id] = { wins: 0, losses: 0, roundsWon: 0, roundsLost: 0 };

            teamAgg[match.team1_id].roundsWon += match.team1_score || 0;
            teamAgg[match.team1_id].roundsLost += match.team2_score || 0;
            teamAgg[match.team2_id].roundsWon += match.team2_score || 0;
            teamAgg[match.team2_id].roundsLost += match.team1_score || 0;

            if (match.winner_id === match.team1_id) {
              teamAgg[match.team1_id].wins++;
              teamAgg[match.team2_id].losses++;
            } else if (match.winner_id === match.team2_id) {
              teamAgg[match.team2_id].wins++;
              teamAgg[match.team1_id].losses++;
            }
          });

          const rankingData: TeamRanking[] = teamsArray.map((team) => ({
            id: team.id,
            name: team.name,
            tag: team.tag,
            logoUrl: team.logo_url,
            wins: teamAgg[team.id]?.wins || 0,
            losses: teamAgg[team.id]?.losses || 0,
            roundsWon: teamAgg[team.id]?.roundsWon || 0,
            roundsLost: teamAgg[team.id]?.roundsLost || 0,
          }));

          rankingData.sort((a, b) => b.wins - a.wins || (b.roundsWon - b.roundsLost) - (a.roundsWon - a.roundsLost));
          setRanking(rankingData);

          // Upcoming matches: scheduled, pending, or live
          const upcoming = (matchesData as unknown as MatchWithTeams[]).filter(
            (m) => m.status === "scheduled" || m.status === "live"
          );
          setUpcomingMatches(upcoming);
        }
      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine current phase based on matches
  const getCurrentPhase = () => {
    if (!ranking.length) return "Aguardando";
    const totalFinished = ranking.reduce((sum, t) => sum + t.wins + t.losses, 0) / 2;
    if (totalFinished === 0) return "Pré-torneio";
    if (totalFinished <= 4) return "Quartas de Final";
    if (totalFinished <= 6) return "Semifinais";
    if (totalFinished <= 10) return "Playoffs";
    return "Finais";
  };

  const statusLabel = tournament?.status === "ongoing" || tournament?.status === "active"
    ? "Em andamento"
    : tournament?.status === "registration"
    ? "Inscrições abertas"
    : tournament?.status === "upcoming"
    ? "Em breve"
    : "Rascunho";

  const statusColor = tournament?.status === "ongoing" || tournament?.status === "active"
    ? "bg-[#22c55e]/20 text-[#22c55e]"
    : tournament?.status === "registration"
    ? "bg-[#3b82f6]/20 text-[#3b82f6]"
    : "bg-[#A1A1AA]/20 text-[#A1A1AA]";

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0f0f15] border-b border-[#A855F7]/20">
        <div className="h-full flex items-center justify-between px-6">
          <Link href="/campeonatos" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center">
              <span className="font-display text-[#A855F7] text-lg">O</span>
            </div>
            <span className="font-display text-[#F5F5DC] text-lg tracking-wider hidden sm:block">ORBITAL ROXA</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/campeonatos/visao-geral" className="font-mono text-xs text-[#A855F7] tracking-wider">VISÃO GERAL</Link>
            <Link href="/campeonatos/partidas" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">PARTIDAS</Link>
            <Link href="/campeonatos/resultados" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">RESULTADOS</Link>
            <Link href="/campeonatos/estatisticas" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">ESTATÍSTICAS</Link>
          </nav>
          <div className="w-32" />
        </div>
      </header>

      <main className="flex-1 pt-16">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-xs font-mono text-[#A1A1AA]">Carregando...</span>
            </div>
          </div>
        ) : !tournament ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-sm text-[#A1A1AA]">Nenhum torneio encontrado</span>
          </div>
        ) : (
          <>
            {/* Banner */}
            <div className="relative h-64 bg-gradient-to-b from-[#1a1a2e] to-[#0A0A0A] flex items-center justify-center">
              <div className="text-center">
                <span className="font-display text-4xl text-[#F5F5DC] block mb-2">{tournament.name}</span>
                <span className="font-mono text-[#A855F7] text-sm">TORNEIO CS2</span>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <span className="text-xs text-[#A1A1AA]">
                    {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded font-mono ${statusColor}`}>{statusLabel}</span>
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
              {/* Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 text-center">
                  <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">PREMIAÇÃO</span>
                  <span className="font-display text-xl text-[#FFD700]">
                    {tournament.prize_pool ? `R$ ${Number(tournament.prize_pool).toLocaleString("pt-BR")}` : "A definir"}
                  </span>
                </div>
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 text-center">
                  <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">TIMES</span>
                  <span className="font-display text-xl text-[#F5F5DC]">{teams.length}</span>
                </div>
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 text-center">
                  <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">FORMATO</span>
                  <span className="font-mono text-sm text-[#A855F7]">Double Elimination</span>
                </div>
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 text-center">
                  <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">FASE ATUAL</span>
                  <span className="font-mono text-sm text-[#F5F5DC]">{getCurrentPhase()}</span>
                </div>
              </div>

              {/* Ranking */}
              <h2 className="font-mono text-[#F5F5DC] text-lg tracking-wider mb-4">RANKING</h2>
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden mb-8">
                <div className="divide-y divide-[#27272A]">
                  <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                    <span className="col-span-3">TIME</span>
                    <span className="text-center">V</span>
                    <span className="text-center">D</span>
                    <span className="text-center">ROUNDS</span>
                    <span className="text-center">SALDO</span>
                  </div>
                  {ranking.map((team, index) => {
                    const saldo = team.roundsWon - team.roundsLost;
                    return (
                      <Link
                        key={team.id}
                        href={`/campeonatos/time/${team.id}`}
                        className="grid grid-cols-7 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors"
                      >
                        <div className="col-span-3 flex items-center gap-2">
                          <span className={`font-mono text-sm w-5 ${
                            index === 0 ? "text-[#FFD700]" : index === 1 ? "text-[#C0C0C0]" : index === 2 ? "text-[#CD7F32]" : "text-[#A1A1AA]"
                          }`}>{index + 1}</span>
                          <div className="w-6 h-6 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                            {team.logoUrl ? (
                              <img src={team.logoUrl} alt={team.tag} className="w-5 h-5 object-contain" />
                            ) : (
                              <span className="text-[6px] font-mono text-[#A1A1AA]">{team.tag.substring(0, 3).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="text-sm text-[#F5F5DC]">{team.name}</span>
                        </div>
                        <span className="text-center text-sm font-mono text-[#22c55e] flex items-center justify-center">{team.wins}</span>
                        <span className="text-center text-sm font-mono text-[#ef4444] flex items-center justify-center">{team.losses}</span>
                        <span className="text-center text-sm font-mono text-[#A1A1AA] flex items-center justify-center">{team.roundsWon}-{team.roundsLost}</span>
                        <span className={`text-center text-sm font-mono flex items-center justify-center ${
                          saldo > 0 ? "text-[#22c55e]" : saldo < 0 ? "text-[#ef4444]" : "text-[#A1A1AA]"
                        }`}>
                          {saldo > 0 ? "+" : ""}{saldo}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Matches */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-[#F5F5DC] text-lg tracking-wider">PRÓXIMAS PARTIDAS</h2>
                <Link href="/campeonatos/bracket" className="text-xs font-mono text-[#A855F7] hover:text-[#C084FC]">
                  VER BRACKET →
                </Link>
              </div>
              {upcomingMatches.length === 0 ? (
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-8 text-center">
                  <span className="text-sm text-[#A1A1AA]">Nenhuma partida agendada no momento</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingMatches.map((match) => (
                    <Link
                      key={match.id}
                      href={`/campeonatos/partida/${match.id}`}
                      className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 hover:border-[#A855F7]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-[#A855F7]">
                          {roundLabels[match.round || ""] || match.round || ""}
                        </span>
                        <div className="flex items-center gap-2">
                          {match.status === "live" && (
                            <span className="px-1.5 py-0.5 bg-[#ef4444] rounded text-[8px] font-mono text-white animate-pulse">LIVE</span>
                          )}
                          <span className="text-xs font-mono text-[#A1A1AA]">{formatTime(match.scheduled_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                            {match.team1?.logo_url ? (
                              <img src={match.team1.logo_url} alt={match.team1.tag} className="w-7 h-7 object-contain" />
                            ) : (
                              <span className="text-xs font-mono text-[#A1A1AA]">
                                {match.team1?.tag?.substring(0, 3).toUpperCase() || "TBD"}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-[#F5F5DC]">{match.team1?.name || "TBD"}</span>
                        </div>
                        <span className="font-mono text-lg text-[#A1A1AA]">vs</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#F5F5DC]">{match.team2?.name || "TBD"}</span>
                          <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                            {match.team2?.logo_url ? (
                              <img src={match.team2.logo_url} alt={match.team2.tag} className="w-7 h-7 object-contain" />
                            ) : (
                              <span className="text-xs font-mono text-[#A1A1AA]">
                                {match.team2?.tag?.substring(0, 3).toUpperCase() || "TBD"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function VisaoGeralPage() {
  return (
    <RequireTournamentProfile>
      <VisaoGeralContent />
    </RequireTournamentProfile>
  );
}
