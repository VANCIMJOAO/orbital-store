"use client";

import Link from "next/link";
import { TournamentHeader } from "@/components/TournamentHeader";
import { useEffect, useState, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import type { Database } from "@/lib/database.types";

interface PlayerStat {
  profileId: string;
  username: string;
  teamName: string;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  totalDamage: number;
  roundsPlayed: number;
  adr: number;
  rating: number;
}

interface TeamStat {
  id: string;
  name: string;
  tag: string;
  logoUrl: string | null;
  matches: number;
  wins: number;
  losses: number;
  roundsWon: number;
  roundsLost: number;
  avgRating: number;
}

interface MapStat {
  name: string;
  matches: number;
  ctRoundsWon: number;
  tRoundsWon: number;
  totalRounds: number;
}

function EstatisticasContent() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [topPlayers, setTopPlayers] = useState<PlayerStat[]>([]);
  const [topTeams, setTopTeams] = useState<TeamStat[]>([]);
  const [mapStats, setMapStats] = useState<MapStat[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch player stats
        const { data: playerStatsData } = await supabase
          .from("match_player_stats")
          .select(`
            profile_id,
            team_id,
            kills,
            deaths,
            assists,
            headshots,
            total_damage,
            adr,
            rounds_played,
            matches!inner(tournament_id)
          `)
          .eq("matches.tournament_id", tournament.id);

        // Fetch finished matches for team stats
        const { data: matchesData } = await supabase
          .from("matches")
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(id, name, tag, logo_url),
            team2:teams!matches_team2_id_fkey(id, name, tag, logo_url)
          `)
          .eq("tournament_id", tournament.id)
          .eq("status", "finished");

        // Fetch round data for map stats
        const { data: roundsData } = await supabase
          .from("match_rounds")
          .select(`
            match_id,
            ct_team_id,
            t_team_id,
            winner_team_id,
            ct_score,
            t_score
          `);

        // Process player stats
        if (playerStatsData && playerStatsData.length > 0) {
          const playerAgg: Record<string, {
            kills: number; deaths: number; assists: number; headshots: number;
            totalDamage: number; roundsPlayed: number; teamId: string;
          }> = {};

          playerStatsData.forEach((stat) => {
            const pid = stat.profile_id;
            if (!playerAgg[pid]) {
              playerAgg[pid] = { kills: 0, deaths: 0, assists: 0, headshots: 0, totalDamage: 0, roundsPlayed: 0, teamId: stat.team_id || "" };
            }
            playerAgg[pid].kills += stat.kills || 0;
            playerAgg[pid].deaths += stat.deaths || 0;
            playerAgg[pid].assists += stat.assists || 0;
            playerAgg[pid].headshots += stat.headshots || 0;
            playerAgg[pid].totalDamage += stat.total_damage || 0;
            playerAgg[pid].roundsPlayed += stat.rounds_played || 0;
          });

          const profileIds = Object.keys(playerAgg);
          const teamIds = [...new Set(Object.values(playerAgg).map((p) => p.teamId).filter(Boolean))];

          const [profilesRes, teamsRes] = await Promise.all([
            supabase.from("profiles").select("id, username").in("id", profileIds),
            teamIds.length > 0
              ? supabase.from("teams").select("id, name").in("id", teamIds)
              : { data: [] },
          ]);

          const profileMap: Record<string, string> = {};
          profilesRes.data?.forEach((p) => { profileMap[p.id] = p.username; });

          const teamNameMap: Record<string, string> = {};
          (teamsRes.data || []).forEach((t: { id: string; name: string }) => { teamNameMap[t.id] = t.name; });

          const players: PlayerStat[] = Object.entries(playerAgg)
            .filter(([id]) => profileMap[id])
            .map(([id, stats]) => {
              const rp = stats.roundsPlayed || 1;
              const adr = stats.totalDamage / rp;
              const kd = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
              return {
                profileId: id,
                username: profileMap[id],
                teamName: teamNameMap[stats.teamId] || "",
                kills: stats.kills,
                deaths: stats.deaths,
                assists: stats.assists,
                headshots: stats.headshots,
                totalDamage: stats.totalDamage,
                roundsPlayed: rp,
                adr,
                rating: kd,
              };
            })
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 10);

          setTopPlayers(players);
        }

        // Process team stats
        if (matchesData && matchesData.length > 0) {
          const teamAgg: Record<string, {
            name: string; tag: string; logoUrl: string | null;
            wins: number; losses: number; roundsWon: number; roundsLost: number;
            totalRating: number; matchCount: number;
          }> = {};

          matchesData.forEach((match) => {
            const t1 = match.team1 as { id: string; name: string; tag: string; logo_url: string | null } | null;
            const t2 = match.team2 as { id: string; name: string; tag: string; logo_url: string | null } | null;
            if (!t1 || !t2 || !match.team1_id || !match.team2_id) return;

            [{ team: t1, id: match.team1_id, score: match.team1_score, oppScore: match.team2_score },
             { team: t2, id: match.team2_id, score: match.team2_score, oppScore: match.team1_score }]
              .forEach(({ team, id, score, oppScore }) => {
                if (!teamAgg[id]) {
                  teamAgg[id] = { name: team.name, tag: team.tag, logoUrl: team.logo_url, wins: 0, losses: 0, roundsWon: 0, roundsLost: 0, totalRating: 0, matchCount: 0 };
                }
                teamAgg[id].matchCount++;
                teamAgg[id].roundsWon += score || 0;
                teamAgg[id].roundsLost += oppScore || 0;
                if (match.winner_id === id) {
                  teamAgg[id].wins++;
                } else {
                  teamAgg[id].losses++;
                }
              });
          });

          const teams: TeamStat[] = Object.entries(teamAgg)
            .map(([id, stats]) => ({
              id,
              name: stats.name,
              tag: stats.tag,
              logoUrl: stats.logoUrl,
              matches: stats.matchCount,
              wins: stats.wins,
              losses: stats.losses,
              roundsWon: stats.roundsWon,
              roundsLost: stats.roundsLost,
              avgRating: stats.matchCount > 0 ? (stats.roundsWon / Math.max(stats.roundsLost, 1)) : 0,
            }))
            .sort((a, b) => b.wins - a.wins || b.avgRating - a.avgRating)
            .slice(0, 8);

          setTopTeams(teams);

          // Process map stats from matches
          const mapAgg: Record<string, { matches: number; ctRoundsWon: number; tRoundsWon: number; totalRounds: number }> = {};
          matchesData.forEach((match) => {
            const mapName = match.map_name;
            if (!mapName) return;
            if (!mapAgg[mapName]) {
              mapAgg[mapName] = { matches: 0, ctRoundsWon: 0, tRoundsWon: 0, totalRounds: 0 };
            }
            mapAgg[mapName].matches++;
            const total = (match.team1_score || 0) + (match.team2_score || 0);
            mapAgg[mapName].totalRounds += total;
            // Without detailed round data, estimate CT/T split as roughly 50/50
            mapAgg[mapName].ctRoundsWon += Math.ceil(total / 2);
            mapAgg[mapName].tRoundsWon += Math.floor(total / 2);
          });

          // If we have actual round data, use it for more accurate CT/T splits
          if (roundsData && roundsData.length > 0) {
            // Reset map stats and recalculate from round data
            const matchMapMap: Record<string, string> = {};
            matchesData.forEach((m) => { if (m.map_name) matchMapMap[m.id] = m.map_name; });

            const accurateMapAgg: Record<string, { ctWins: number; tWins: number }> = {};
            roundsData.forEach((round) => {
              const mapName = matchMapMap[round.match_id];
              if (!mapName) return;
              if (!accurateMapAgg[mapName]) accurateMapAgg[mapName] = { ctWins: 0, tWins: 0 };
              if (round.winner_team_id && round.ct_team_id && round.t_team_id) {
                if (round.winner_team_id === round.ct_team_id) {
                  accurateMapAgg[mapName].ctWins++;
                } else if (round.winner_team_id === round.t_team_id) {
                  accurateMapAgg[mapName].tWins++;
                }
              }
            });

            Object.entries(accurateMapAgg).forEach(([mapName, data]) => {
              if (mapAgg[mapName] && (data.ctWins > 0 || data.tWins > 0)) {
                mapAgg[mapName].ctRoundsWon = data.ctWins;
                mapAgg[mapName].tRoundsWon = data.tWins;
                mapAgg[mapName].totalRounds = data.ctWins + data.tWins;
              }
            });
          }

          const maps: MapStat[] = Object.entries(mapAgg)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.matches - a.matches);

          setMapStats(maps);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  const hsPercent = (hs: number, kills: number) => kills > 0 ? `${Math.round((hs / kills) * 100)}%` : "0%";

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <TournamentHeader />

      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="font-display text-2xl text-[#F5F5DC] mb-8">ESTATÍSTICAS</h1>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs font-mono text-[#A1A1AA]">Carregando estatísticas...</span>
              </div>
            </div>
          ) : topPlayers.length === 0 && topTeams.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <span className="text-[#52525B] text-4xl block mb-2">-</span>
                <span className="text-sm text-[#A1A1AA]">Estatísticas não disponíveis ainda</span>
                <span className="text-xs text-[#52525B] block mt-1">Os dados serão exibidos após partidas finalizadas</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Players */}
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
                <div className="p-4 border-b border-[#27272A]">
                  <h2 className="font-mono text-[#F5F5DC] text-sm tracking-wider">TOP PLAYERS</h2>
                </div>
                <div className="divide-y divide-[#27272A]">
                  <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                    <span className="col-span-2">PLAYER</span>
                    <span className="text-center">K</span>
                    <span className="text-center">D</span>
                    <span className="text-center">HS%</span>
                    <span className="text-center">ADR</span>
                    <span className="text-center">K/D</span>
                  </div>
                  {topPlayers.map((player, index) => (
                    <Link
                      key={player.profileId}
                      href={`/campeonatos/jogador/${player.profileId}`}
                      className="grid grid-cols-7 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors"
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <span className={`font-mono text-sm w-5 ${
                          index === 0 ? "text-[#FFD700]" : index === 1 ? "text-[#C0C0C0]" : index === 2 ? "text-[#CD7F32]" : "text-[#A1A1AA]"
                        }`}>{index + 1}</span>
                        <div>
                          <span className="text-sm text-[#F5F5DC] block">{player.username}</span>
                          <span className="text-[10px] text-[#A1A1AA]">{player.teamName}</span>
                        </div>
                      </div>
                      <span className="text-center text-sm font-mono text-[#22c55e] flex items-center justify-center">{player.kills}</span>
                      <span className="text-center text-sm font-mono text-[#ef4444] flex items-center justify-center">{player.deaths}</span>
                      <span className="text-center text-sm font-mono text-[#A1A1AA] flex items-center justify-center">{hsPercent(player.headshots, player.kills)}</span>
                      <span className="text-center text-sm font-mono text-[#A1A1AA] flex items-center justify-center">{player.adr.toFixed(1)}</span>
                      <span className="text-center text-sm font-mono text-[#A855F7] font-bold flex items-center justify-center">{player.rating.toFixed(2)}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Top Teams */}
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
                <div className="p-4 border-b border-[#27272A]">
                  <h2 className="font-mono text-[#F5F5DC] text-sm tracking-wider">TOP TIMES</h2>
                </div>
                <div className="divide-y divide-[#27272A]">
                  <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                    <span className="col-span-2">TIME</span>
                    <span className="text-center">V/D</span>
                    <span className="text-center">ROUNDS</span>
                    <span className="text-center">R.RATIO</span>
                  </div>
                  {topTeams.map((team, index) => (
                    <Link
                      key={team.id}
                      href={`/campeonatos/time/${team.id}`}
                      className="grid grid-cols-5 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors"
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <span className={`font-mono text-sm w-5 ${
                          index === 0 ? "text-[#FFD700]" : index === 1 ? "text-[#C0C0C0]" : index === 2 ? "text-[#CD7F32]" : "text-[#A1A1AA]"
                        }`}>{index + 1}</span>
                        <div className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.tag} className="w-6 h-6 object-contain" />
                          ) : (
                            <span className="text-[8px] font-mono text-[#A1A1AA]">{team.tag.substring(0, 3).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="text-sm text-[#F5F5DC]">{team.name}</span>
                      </div>
                      <span className="text-center text-sm font-mono text-[#22c55e] flex items-center justify-center">{team.wins}-{team.losses}</span>
                      <span className="text-center text-sm font-mono text-[#A1A1AA] flex items-center justify-center">{team.roundsWon}-{team.roundsLost}</span>
                      <span className="text-center text-sm font-mono text-[#A855F7] font-bold flex items-center justify-center">{team.avgRating.toFixed(2)}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Map Stats */}
              {mapStats.length > 0 && (
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg lg:col-span-2">
                  <div className="p-4 border-b border-[#27272A]">
                    <h2 className="font-mono text-[#F5F5DC] text-sm tracking-wider">ESTATÍSTICAS POR MAPA</h2>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
                    {mapStats.map((map) => {
                      const ctPct = map.totalRounds > 0 ? Math.round((map.ctRoundsWon / map.totalRounds) * 100) : 50;
                      const tPct = 100 - ctPct;
                      return (
                        <div key={map.name} className="bg-[#1a1a2e] rounded-lg p-4 text-center">
                          <span className="font-body text-[#F5F5DC] block mb-2">{map.name}</span>
                          <span className="text-xs text-[#A1A1AA] block mb-3">{map.matches} partida{map.matches !== 1 ? "s" : ""}</span>
                          <div className="flex justify-center gap-4">
                            <div>
                              <span className="text-[10px] text-[#3b82f6] block">CT</span>
                              <span className="font-mono text-sm text-[#F5F5DC]">{ctPct}%</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#f59e0b] block">TR</span>
                              <span className="font-mono text-sm text-[#F5F5DC]">{tPct}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EstatisticasPage() {
  return (
    <RequireTournamentProfile>
      <EstatisticasContent />
    </RequireTournamentProfile>
  );
}
