"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import type { Database } from "@/lib/database.types";

type Team = Database["public"]["Tables"]["teams"]["Row"];

interface PlayerInfo {
  profileId: string;
  username: string;
  role: string | null;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  totalDamage: number;
  roundsPlayed: number;
  adr: number;
  rating: number;
}

interface MatchHistory {
  id: string;
  opponentName: string;
  opponentTag: string;
  opponentLogoUrl: string | null;
  result: "win" | "loss";
  teamScore: number;
  opponentScore: number;
  date: string | null;
  round: string | null;
}

interface MapStat {
  name: string;
  matches: number;
  wins: number;
  winrate: number;
}

const roundLabels: Record<string, string> = {
  winner_quarter_1: "Quartas",
  winner_quarter_2: "Quartas",
  winner_quarter_3: "Quartas",
  winner_quarter_4: "Quartas",
  winner_semi_1: "Semi",
  winner_semi_2: "Semi",
  winner_final: "Final W",
  loser_round1_1: "LR1",
  loser_round1_2: "LR1",
  loser_round2_1: "LR2",
  loser_round2_2: "LR2",
  loser_semi: "L Semi",
  loser_final: "L Final",
  grand_final: "GF",
};

function TimeContent() {
  const params = useParams();
  const teamId = params.teamId as string;
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [mapStats, setMapStats] = useState<MapStat[]>([]);
  const [totalWins, setTotalWins] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const [totalRoundsWon, setTotalRoundsWon] = useState(0);
  const [totalRoundsLost, setTotalRoundsLost] = useState(0);
  const [ranking, setRanking] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!teamId) return;
      setLoading(true);
      try {
        // Fetch team
        const { data: teamData } = await supabase
          .from("teams")
          .select("*")
          .eq("id", teamId)
          .single();

        if (!teamData) return;
        setTeam(teamData);

        // Fetch team players with profiles
        const { data: teamPlayersData } = await supabase
          .from("team_players")
          .select("profile_id, role, nickname, profiles(id, username)")
          .eq("team_id", teamId)
          .eq("is_active", true);

        // Fetch matches where this team participated
        const { data: matchesData } = await supabase
          .from("matches")
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(id, name, tag, logo_url),
            team2:teams!matches_team2_id_fkey(id, name, tag, logo_url)
          `)
          .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
          .eq("status", "finished")
          .order("finished_at", { ascending: false });

        // Process match history
        let wins = 0;
        let losses = 0;
        let rWon = 0;
        let rLost = 0;
        const history: MatchHistory[] = [];
        const mapAgg: Record<string, { matches: number; wins: number }> = {};

        if (matchesData) {
          matchesData.forEach((match) => {
            const isTeam1 = match.team1_id === teamId;
            const opponent = isTeam1
              ? (match.team2 as { id: string; name: string; tag: string; logo_url: string | null } | null)
              : (match.team1 as { id: string; name: string; tag: string; logo_url: string | null } | null);
            const teamScore = isTeam1 ? (match.team1_score || 0) : (match.team2_score || 0);
            const oppScore = isTeam1 ? (match.team2_score || 0) : (match.team1_score || 0);
            const won = match.winner_id === teamId;

            rWon += teamScore;
            rLost += oppScore;

            if (won) wins++;
            else losses++;

            history.push({
              id: match.id,
              opponentName: opponent?.name || "TBD",
              opponentTag: opponent?.tag || "???",
              opponentLogoUrl: opponent?.logo_url || null,
              result: won ? "win" : "loss",
              teamScore,
              opponentScore: oppScore,
              date: match.finished_at || match.scheduled_at,
              round: match.round,
            });

            // Map stats
            const mapName = match.map_name;
            if (mapName) {
              if (!mapAgg[mapName]) mapAgg[mapName] = { matches: 0, wins: 0 };
              mapAgg[mapName].matches++;
              if (won) mapAgg[mapName].wins++;
            }
          });
        }

        setTotalWins(wins);
        setTotalLosses(losses);
        setTotalRoundsWon(rWon);
        setTotalRoundsLost(rLost);
        setMatchHistory(history);

        const maps: MapStat[] = Object.entries(mapAgg)
          .map(([name, stats]) => ({
            name,
            matches: stats.matches,
            wins: stats.wins,
            winrate: stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0,
          }))
          .sort((a, b) => b.matches - a.matches);
        setMapStats(maps);

        // Fetch player stats for this team from match_player_stats
        const profileIds = (teamPlayersData || [])
          .map((tp) => tp.profile_id)
          .filter(Boolean);

        const profileMap: Record<string, { username: string; role: string | null }> = {};
        (teamPlayersData || []).forEach((tp) => {
          const prof = tp.profiles as { id: string; username: string } | null;
          if (prof) {
            profileMap[tp.profile_id] = {
              username: tp.nickname || prof.username,
              role: tp.role,
            };
          }
        });

        if (profileIds.length > 0) {
          const { data: statsData } = await supabase
            .from("match_player_stats")
            .select("profile_id, kills, deaths, assists, headshots, total_damage, rounds_played, adr")
            .eq("team_id", teamId);

          if (statsData && statsData.length > 0) {
            const playerAgg: Record<string, {
              kills: number; deaths: number; assists: number; headshots: number;
              totalDamage: number; roundsPlayed: number;
            }> = {};

            statsData.forEach((stat) => {
              const pid = stat.profile_id;
              if (!profileMap[pid]) return;
              if (!playerAgg[pid]) {
                playerAgg[pid] = { kills: 0, deaths: 0, assists: 0, headshots: 0, totalDamage: 0, roundsPlayed: 0 };
              }
              playerAgg[pid].kills += stat.kills || 0;
              playerAgg[pid].deaths += stat.deaths || 0;
              playerAgg[pid].assists += stat.assists || 0;
              playerAgg[pid].headshots += stat.headshots || 0;
              playerAgg[pid].totalDamage += stat.total_damage || 0;
              playerAgg[pid].roundsPlayed += stat.rounds_played || 0;
            });

            const playersResult: PlayerInfo[] = Object.entries(playerAgg)
              .map(([pid, stats]) => {
                const rp = stats.roundsPlayed || 1;
                return {
                  profileId: pid,
                  username: profileMap[pid]?.username || "Player",
                  role: profileMap[pid]?.role || null,
                  kills: stats.kills,
                  deaths: stats.deaths,
                  assists: stats.assists,
                  headshots: stats.headshots,
                  totalDamage: stats.totalDamage,
                  roundsPlayed: rp,
                  adr: rp > 0 ? stats.totalDamage / rp : 0,
                  rating: stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills,
                };
              })
              .sort((a, b) => b.rating - a.rating);

            setPlayers(playersResult);
          } else {
            // No stats yet, show players without stats
            const playersResult: PlayerInfo[] = profileIds
              .filter((pid) => profileMap[pid])
              .map((pid) => ({
                profileId: pid,
                username: profileMap[pid].username,
                role: profileMap[pid].role,
                kills: 0, deaths: 0, assists: 0, headshots: 0,
                totalDamage: 0, roundsPlayed: 0, adr: 0, rating: 0,
              }));
            setPlayers(playersResult);
          }
        }

        // Calculate team ranking within tournament
        const { data: tournamentTeam } = await supabase
          .from("tournament_teams")
          .select("tournament_id")
          .eq("team_id", teamId)
          .limit(1)
          .single();

        if (tournamentTeam) {
          const { data: allTeamsMatches } = await supabase
            .from("matches")
            .select("team1_id, team2_id, winner_id")
            .eq("tournament_id", tournamentTeam.tournament_id)
            .eq("status", "finished");

          if (allTeamsMatches) {
            const teamWins: Record<string, number> = {};
            allTeamsMatches.forEach((m) => {
              if (m.winner_id) {
                teamWins[m.winner_id] = (teamWins[m.winner_id] || 0) + 1;
              }
            });
            const sorted = Object.entries(teamWins).sort((a, b) => b[1] - a[1]);
            const idx = sorted.findIndex(([id]) => id === teamId);
            setRanking(idx >= 0 ? idx + 1 : 0);
          }
        }
      } catch {
        // fetch error
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, teamId]);

  const totalMatches = totalWins + totalLosses;
  const winrate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const hsPercent = (hs: number, kills: number) => kills > 0 ? `${Math.round((hs / kills) * 100)}%` : "-";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

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
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link href="/campeonatos" className="text-[#A1A1AA] hover:text-[#F5F5DC]">CAMPEONATOS</Link>
            <span className="text-[#A1A1AA]">/</span>
            <span className="text-[#F5F5DC]">{team?.tag || "TIME"}</span>
          </div>
          <div className="w-32" />
        </div>
      </header>

      <main className="flex-1 pt-16">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-xs font-mono text-[#A1A1AA]">Carregando time...</span>
            </div>
          </div>
        ) : !team ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-sm text-[#A1A1AA]">Time não encontrado</span>
              <Link href="/campeonatos" className="block text-xs font-mono text-[#A855F7] mt-2 hover:text-[#C084FC]">
                Voltar ao hub
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Banner */}
            <div className="relative h-48 bg-gradient-to-r from-[#A855F7]/20 via-[#1a1a2e] to-[#7C3AED]/20">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            </div>

            {/* Team Info */}
            <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-32 h-32 rounded-2xl bg-[#27272A] border-4 border-[#0A0A0A] shadow-lg flex items-center justify-center overflow-hidden">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.tag} className="w-24 h-24 object-contain" />
                  ) : (
                    <span className="font-display text-4xl text-[#A1A1AA]">{team.tag.substring(0, 3)}</span>
                  )}
                </div>
                <div className="flex-1 pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-display text-3xl text-[#F5F5DC]">{team.name}</h1>
                    <span className="px-2 py-1 bg-[#A855F7]/20 border border-[#A855F7]/50 rounded text-xs font-mono text-[#A855F7]">
                      {team.tag}
                    </span>
                    {ranking > 0 && (
                      <span className="px-2 py-1 bg-[#FFD700]/20 border border-[#FFD700]/50 rounded text-xs font-mono text-[#FFD700]">
                        #{ranking}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">PARTIDAS</span>
                    <span className="font-display text-2xl text-[#F5F5DC]">{totalMatches}</span>
                  </div>
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">WINRATE</span>
                    <span className="font-display text-2xl text-[#22c55e]">{winrate}%</span>
                  </div>
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">VITÓRIAS</span>
                    <span className="font-display text-2xl text-[#22c55e]">{totalWins}</span>
                  </div>
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                    <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">DERROTAS</span>
                    <span className="font-display text-2xl text-[#ef4444]">{totalLosses}</span>
                  </div>
                </div>

                {/* Roster */}
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
                  <div className="p-4 border-b border-[#27272A]">
                    <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">ELENCO</h3>
                  </div>
                  <div className="divide-y divide-[#27272A]">
                    <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                      <span className="col-span-2">JOGADOR</span>
                      <span>FUNÇÃO</span>
                      <span className="text-center">K</span>
                      <span className="text-center">D</span>
                      <span className="text-center">HS%</span>
                      <span className="text-center">K/D</span>
                    </div>
                    {players.map((player) => (
                      <Link
                        key={player.profileId}
                        href={`/campeonatos/jogador/${player.profileId}`}
                        className="grid grid-cols-7 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors"
                      >
                        <div className="col-span-2 flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center">
                            <span className="font-mono text-white text-xs">{player.username[0]?.toUpperCase()}</span>
                          </div>
                          <span className="text-sm text-[#F5F5DC] hover:text-[#A855F7]">{player.username}</span>
                        </div>
                        <span className="text-xs text-[#A1A1AA] flex items-center">{player.role || "-"}</span>
                        <span className="text-center text-sm font-mono text-[#22c55e] flex items-center justify-center">
                          {player.kills || "-"}
                        </span>
                        <span className="text-center text-sm font-mono text-[#ef4444] flex items-center justify-center">
                          {player.deaths || "-"}
                        </span>
                        <span className="text-center text-sm font-mono text-[#A1A1AA] flex items-center justify-center">
                          {player.kills > 0 ? hsPercent(player.headshots, player.kills) : "-"}
                        </span>
                        <span className={`text-center text-sm font-mono font-bold flex items-center justify-center ${
                          player.rating >= 1 ? "text-[#22c55e]" : player.rating > 0 ? "text-[#ef4444]" : "text-[#A1A1AA]"
                        }`}>
                          {player.rating > 0 ? player.rating.toFixed(2) : "-"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Match History */}
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
                  <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
                    <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">ÚLTIMAS PARTIDAS</h3>
                    <Link href="/campeonatos/resultados" className="text-xs font-mono text-[#A855F7] hover:text-[#C084FC]">
                      VER TODAS →
                    </Link>
                  </div>
                  <div className="divide-y divide-[#27272A]">
                    {matchHistory.length === 0 ? (
                      <div className="p-4 text-center text-sm text-[#A1A1AA]">
                        Nenhuma partida finalizada
                      </div>
                    ) : (
                      matchHistory.slice(0, 5).map((match) => (
                        <Link
                          key={match.id}
                          href={`/campeonatos/partida/${match.id}`}
                          className="flex items-center justify-between p-4 hover:bg-[#1a1a2e] transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-1 h-10 rounded ${match.result === "win" ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
                            <div>
                              <span className="text-sm text-[#F5F5DC] block">vs {match.opponentName}</span>
                              <span className="text-xs text-[#A1A1AA]">
                                {roundLabels[match.round || ""] || match.round || ""}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-mono text-sm block ${match.result === "win" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                              {match.teamScore}-{match.opponentScore}
                            </span>
                            <span className="text-xs text-[#A1A1AA]">{formatDate(match.date)}</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Map Stats */}
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
                  <div className="p-4 border-b border-[#27272A]">
                    <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">MAPAS</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {mapStats.length === 0 ? (
                      <span className="text-xs text-[#A1A1AA]">Sem dados de mapa</span>
                    ) : (
                      mapStats.map((map) => (
                        <div key={map.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#F5F5DC]">{map.name}</span>
                            <span className="text-xs font-mono text-[#A855F7]">{map.winrate}%</span>
                          </div>
                          <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full"
                              style={{ width: `${map.winrate}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#A1A1AA]">{map.wins}V - {map.matches - map.wins}D</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                  <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">INFORMAÇÕES</h3>
                  <div className="space-y-3">
                    {ranking > 0 && (
                      <div className="flex justify-between">
                        <span className="text-xs text-[#A1A1AA]">Ranking</span>
                        <span className="text-xs text-[#FFD700]">#{ranking}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-xs text-[#A1A1AA]">Rounds Won</span>
                      <span className="text-xs text-[#22c55e]">{totalRoundsWon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#A1A1AA]">Rounds Lost</span>
                      <span className="text-xs text-[#ef4444]">{totalRoundsLost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#A1A1AA]">Round Diff</span>
                      <span className={`text-xs ${(totalRoundsWon - totalRoundsLost) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {totalRoundsWon - totalRoundsLost > 0 ? "+" : ""}{totalRoundsWon - totalRoundsLost}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-[#A1A1AA]">Jogadores</span>
                      <span className="text-xs text-[#F5F5DC]">{players.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function TimePage() {
  return (
    <RequireTournamentProfile>
      <TimeContent />
    </RequireTournamentProfile>
  );
}
