"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { TournamentHeader } from "@/components/TournamentHeader";
import type { Database } from "@/lib/database.types";

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];

interface MatchWithTeams extends Match {
  team1: Team | null;
  team2: Team | null;
  tournament: { name: string };
}

interface TeamRanking {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
  wins: number;
  losses: number;
  points: number;
  status: "active" | "eliminated" | "champion";
}

interface TopPlayer {
  id: string;
  username: string;
  team_name: string | null;
  level: number;
  stats?: {
    kills: number;
    deaths: number;
    rating: number;
  };
}

export default function CampeonatosPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allMatches, setAllMatches] = useState<MatchWithTeams[]>([]);
  const [ranking, setRanking] = useState<TeamRanking[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"proximas" | "ao-vivo" | "finalizadas">("proximas");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Buscar torneio mais relevante (ongoing > registration > draft)
        const { data: tournamentData } = await supabase
          .from("tournaments")
          .select("*")
          .in("status", ["ongoing", "active", "registration", "upcoming", "draft"])
          .order("start_date", { ascending: false })
          .limit(1)
          .single();

        if (tournamentData) {
          setTournament(tournamentData);

          // Buscar times participantes do torneio
          const { data: tournamentTeamsData } = await supabase
            .from("tournament_teams")
            .select(`
              team_id,
              teams (*)
            `)
            .eq("tournament_id", tournamentData.id)
            .in("status", ["confirmed", "registered"]);

          if (tournamentTeamsData) {
            const teamsArray = tournamentTeamsData
              .map((tt) => (tt.teams as unknown) as Team)
              .filter(Boolean);
            setTeams(teamsArray);

            // Calcular ranking baseado nas partidas
            const { data: matchesData } = await supabase
              .from("matches")
              .select("*")
              .eq("tournament_id", tournamentData.id)
              .eq("status", "finished");

            if (matchesData) {
              const teamStats: Record<string, { wins: number; losses: number; loserBracketLosses: number }> = {};

              matchesData.forEach((match) => {
                if (!match.team1_id || !match.team2_id) return;
                if (!teamStats[match.team1_id]) teamStats[match.team1_id] = { wins: 0, losses: 0, loserBracketLosses: 0 };
                if (!teamStats[match.team2_id]) teamStats[match.team2_id] = { wins: 0, losses: 0, loserBracketLosses: 0 };

                const isLoserBracket = match.round?.startsWith("loser_");

                if (match.winner_id === match.team1_id) {
                  teamStats[match.team1_id].wins++;
                  teamStats[match.team2_id].losses++;
                  if (isLoserBracket) {
                    teamStats[match.team2_id].loserBracketLosses++;
                  }
                } else if (match.winner_id === match.team2_id) {
                  teamStats[match.team2_id].wins++;
                  teamStats[match.team1_id].losses++;
                  if (isLoserBracket) {
                    teamStats[match.team1_id].loserBracketLosses++;
                  }
                }
              });

              // Verificar campeão (vencedor da grand final)
              const grandFinal = matchesData.find(m => m.round === "grand_final" && m.status === "finished");
              const championId = grandFinal?.winner_id;

              // Determinar status de cada time
              const getTeamStatus = (teamId: string): "active" | "eliminated" | "champion" => {
                if (championId === teamId) return "champion";
                const stats = teamStats[teamId];
                if (!stats) return "active";
                // Eliminado = perdeu no loser bracket OU perdeu a grand final
                if (stats.loserBracketLosses > 0) return "eliminated";
                if (grandFinal && grandFinal.status === "finished" &&
                    (grandFinal.team1_id === teamId || grandFinal.team2_id === teamId) &&
                    grandFinal.winner_id !== teamId) {
                  return "eliminated";
                }
                return "active";
              };

              const rankingData: TeamRanking[] = teamsArray.map((team) => ({
                id: team.id,
                name: team.name,
                tag: team.tag,
                logo_url: team.logo_url,
                wins: teamStats[team.id]?.wins || 0,
                losses: teamStats[team.id]?.losses || 0,
                points: (teamStats[team.id]?.wins || 0) * 30,
                status: getTeamStatus(team.id),
              }));

              // Ordenar: campeão primeiro, depois por vitórias, depois eliminados por último
              rankingData.sort((a, b) => {
                if (a.status === "champion") return -1;
                if (b.status === "champion") return 1;
                if (a.status === "eliminated" && b.status !== "eliminated") return 1;
                if (b.status === "eliminated" && a.status !== "eliminated") return -1;
                return b.wins - a.wins || b.points - a.points;
              });

              setRanking(rankingData);
            }
          }

          // Buscar TODAS as partidas do torneio (bracket)
          const { data: allTournamentMatches } = await supabase
            .from("matches")
            .select(`
              *,
              team1:teams!matches_team1_id_fkey(*),
              team2:teams!matches_team2_id_fkey(*),
              tournament:tournaments!matches_tournament_id_fkey(name)
            `)
            .eq("tournament_id", tournamentData.id)
            .order("scheduled_at", { ascending: true });

          if (allTournamentMatches) {
            setAllMatches(allTournamentMatches as unknown as MatchWithTeams[]);
          }
        }

        // Buscar top players do campeonato baseado em K/D das partidas
        if (tournamentData) {
          // Buscar stats dos jogadores nas partidas deste torneio
          const { data: playerStatsData } = await supabase
            .from("match_player_stats")
            .select(`
              profile_id,
              kills,
              deaths,
              match_id,
              matches!inner(tournament_id)
            `)
            .eq("matches.tournament_id", tournamentData.id);

          if (playerStatsData && playerStatsData.length > 0) {
            // Agregar K/D por jogador
            const playerAgg: Record<string, { kills: number; deaths: number }> = {};
            playerStatsData.forEach((stat) => {
              if (!playerAgg[stat.profile_id]) {
                playerAgg[stat.profile_id] = { kills: 0, deaths: 0 };
              }
              playerAgg[stat.profile_id].kills += stat.kills || 0;
              playerAgg[stat.profile_id].deaths += stat.deaths || 0;
            });

            // Ordenar por K/D ratio (se mortes = 0, tratar como kills)
            const sortedPlayerIds = Object.entries(playerAgg)
              .map(([id, stats]) => ({
                id,
                kills: stats.kills,
                deaths: stats.deaths,
                kd: stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills,
              }))
              .sort((a, b) => {
                const diff = b.kd - a.kd;
                if (Math.abs(diff) < 0.001) return b.kills - a.kills || a.id.localeCompare(b.id);
                return diff;
              })
              .slice(0, 5);

            // Buscar perfis e times dos top players
            const profileIds = sortedPlayerIds.map((p) => p.id);
            const { data: profilesData } = await supabase
              .from("profiles")
              .select("id, username, level")
              .in("id", profileIds);

            const { data: teamPlayersData } = await supabase
              .from("team_players")
              .select("profile_id, teams(name)")
              .in("profile_id", profileIds)
              .eq("is_active", true);

            const teamMap: Record<string, string> = {};
            teamPlayersData?.forEach((tp) => {
              if (tp.teams) {
                teamMap[tp.profile_id] = (tp.teams as { name: string }).name;
              }
            });

            const profileMap: Record<string, { username: string; level: number }> = {};
            profilesData?.forEach((p) => {
              profileMap[p.id] = { username: p.username, level: p.level || 1 };
            });

            const topPlayersResult: TopPlayer[] = sortedPlayerIds
              .filter((p) => profileMap[p.id])
              .map((p) => ({
                id: p.id,
                username: profileMap[p.id].username,
                team_name: teamMap[p.id] || null,
                level: profileMap[p.id].level,
                stats: { kills: p.kills, deaths: p.deaths, rating: p.kd },
              }));

            setTopPlayers(topPlayersResult);
          } else {
            // Sem stats ainda - buscar jogadores dos times do campeonato
            const { data: ttData } = await supabase
              .from("tournament_teams")
              .select("team_id, teams(id, name, tag)")
              .eq("tournament_id", tournamentData.id)
              .in("status", ["confirmed", "registered"]);

            if (ttData && ttData.length > 0) {
              const teamIds = ttData.map((tt: { team_id: string }) => tt.team_id);

              // Criar mapa de team_id → team name
              const teamNameMap: Record<string, string> = {};
              ttData.forEach((tt) => {
                const team = tt.teams as unknown as { id: string; name: string; tag: string } | null;
                if (team) teamNameMap[tt.team_id] = team.name;
              });

              const { data: teamPlayersData } = await supabase
                .from("team_players")
                .select("profile_id, team_id, profiles(id, username, level)")
                .in("team_id", teamIds)
                .eq("is_active", true);

              if (teamPlayersData && teamPlayersData.length > 0) {
                // Sem stats, ordenar por level (desc) e depois created_at
                const shuffled = [...teamPlayersData].sort((a, b) => {
                  const profA = a.profiles as unknown as { level: number } | null;
                  const profB = b.profiles as unknown as { level: number } | null;
                  return (profB?.level || 0) - (profA?.level || 0);
                }).slice(0, 5);
                const topPlayersResult: TopPlayer[] = shuffled
                  .filter((tp) => tp.profiles)
                  .map((tp) => {
                    const prof = tp.profiles as unknown as { id: string; username: string; level: number };
                    return {
                      id: prof.id,
                      username: prof.username,
                      team_name: teamNameMap[tp.team_id] || null,
                      level: prof.level || 1,
                    };
                  });
                setTopPlayers(topPlayersResult);
              }
            }
          }
        }
      } catch {
        // fetch error
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  const formatMatchTime = (scheduledAt: string | null) => {
    if (!scheduledAt) return "";
    const date = new Date(scheduledAt);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // Converter round para label amigável
  const getRoundLabel = (round: string | null): string => {
    if (!round) return "";
    const labels: Record<string, string> = {
      winner_quarter_1: "QUARTAS W",
      winner_quarter_2: "QUARTAS W",
      winner_quarter_3: "QUARTAS W",
      winner_quarter_4: "QUARTAS W",
      winner_semi_1: "SEMI W",
      winner_semi_2: "SEMI W",
      winner_final: "FINAL W",
      loser_round1_1: "R1 LOSER",
      loser_round1_2: "R1 LOSER",
      loser_round2_1: "R2 LOSER",
      loser_round2_2: "R2 LOSER",
      loser_semi: "SEMI L",
      loser_final: "FINAL L",
      grand_final: "GRAND FINAL",
    };
    return labels[round] || round;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Menu Fixo no Topo */}
      <TournamentHeader />

      {/* Container Principal - abaixo do menu fixo */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar Esquerdo - Informações */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#0f0f15] border-r border-[#A855F7]/20 overflow-y-auto">
          {/* Status dos Times no Bracket */}
          <div className="border-b border-[#A855F7]/20">
            <div className="p-4 bg-[#12121a]">
              <h3 className="font-mono text-[#F5F5DC] text-xs tracking-wider">
                STATUS NO BRACKET
              </h3>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
                </div>
              ) : ranking.length === 0 ? (
                <p className="text-xs text-[#A1A1AA] text-center py-4">
                  Nenhum time no torneio ainda
                </p>
              ) : (
                ranking.map((team) => (
                  <div
                    key={team.id}
                    className={`flex items-center gap-3 p-2 rounded transition-colors group ${
                      team.status === "eliminated" ? "opacity-50" : "hover:bg-[#1a1a2e] cursor-pointer"
                    }`}
                  >
                    {/* Status Icon */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      team.status === "champion" ? "bg-[#FFD700]" :
                      team.status === "eliminated" ? "bg-[#ef4444]/20 border border-[#ef4444]/50" :
                      "bg-[#22c55e]/20 border border-[#22c55e]/50"
                    }`}>
                      {team.status === "champion" && (
                        <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      )}
                      {team.status === "eliminated" && (
                        <svg className="w-3 h-3 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      )}
                      {team.status === "active" && (
                        <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                      )}
                    </div>
                    {/* Logo */}
                    <div className="w-6 h-6 rounded bg-[#27272A] border border-[#A855F7]/20 flex items-center justify-center overflow-hidden">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-5 h-5 object-contain" />
                      ) : (
                        <span className="text-[6px] font-mono text-[#A1A1AA]">{team.tag}</span>
                      )}
                    </div>
                    {/* Nome e Stats */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-body block truncate ${
                        team.status === "champion" ? "text-[#FFD700] font-semibold" :
                        team.status === "eliminated" ? "text-[#52525B]" :
                        "text-[#F5F5DC] group-hover:text-[#A855F7]"
                      }`}>
                        {team.name}
                      </span>
                      <span className="text-[9px] font-mono text-[#52525B]">
                        {team.wins}W - {team.losses}L
                      </span>
                    </div>
                    {/* Badge de status */}
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                      team.status === "champion" ? "bg-[#FFD700]/20 text-[#FFD700]" :
                      team.status === "eliminated" ? "bg-[#ef4444]/10 text-[#ef4444]" :
                      "bg-[#22c55e]/10 text-[#22c55e]"
                    }`}>
                      {team.status === "champion" ? "CAMPEÃO" :
                       team.status === "eliminated" ? "ELIMINADO" : "ATIVO"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Players */}
          <div className="border-b border-[#A855F7]/20">
            <div className="p-4 bg-[#12121a]">
              <h3 className="font-mono text-[#F5F5DC] text-xs tracking-wider">
                TOP PLAYERS
              </h3>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
                </div>
              ) : topPlayers.length === 0 ? (
                <p className="text-xs text-[#A1A1AA] text-center py-4">
                  Nenhum jogador registrado ainda
                </p>
              ) : (
                topPlayers.map((player, index) => {
                  const kd = player.stats
                    ? (player.stats.deaths > 0
                        ? (player.stats.kills / player.stats.deaths).toFixed(2)
                        : player.stats.kills > 0
                        ? player.stats.kills.toFixed(2)
                        : null)
                    : null;
                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-2 hover:bg-[#1a1a2e] rounded cursor-pointer transition-colors group"
                    >
                      <span className={`font-mono text-sm w-5 text-center ${
                        index === 0 ? "text-[#FFD700]" :
                        index === 1 ? "text-[#C0C0C0]" :
                        index === 2 ? "text-[#CD7F32]" : "text-[#A1A1AA]"
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-xs font-body text-[#F5F5DC] group-hover:text-[#A855F7] transition-colors block">
                          {player.username}
                        </span>
                        <span className="text-[10px] font-mono text-[#A1A1AA]">
                          {player.team_name || "Sem time"}
                        </span>
                      </div>
                      <div className="text-right">
                        {kd ? (
                          <>
                            <span className={`text-xs font-mono font-bold block ${
                              Number(kd) >= 1.0 ? "text-[#22c55e]" : "text-[#ef4444]"
                            }`}>
                              {kd} K/D
                            </span>
                            <span className="text-[9px] font-mono text-[#52525B]">
                              {player.stats!.kills}K {player.stats!.deaths}D
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-[#52525B]">-</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Premiação - só aparece se tiver prize_pool */}
          {tournament?.prize_pool ? (
            <div className="border-b border-[#A855F7]/20">
              <div className="p-4 bg-[#12121a]">
                <h3 className="font-mono text-[#F5F5DC] text-xs tracking-wider">
                  PREMIACAO
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {/* Total */}
                <div className="bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-lg p-3 text-center mb-3">
                  <span className="text-[10px] font-mono text-[#A855F7] block">TOTAL</span>
                  <span className="font-mono text-lg text-[#F5F5DC] font-bold">
                    R$ {(Number(tournament.prize_pool) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Distribuição 1°, 2°, 3° */}
                {tournament.prize_distribution ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded border border-[#FFD700]/20">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🥇</span>
                        <span className="text-xs text-[#FFD700] font-mono">1° LUGAR</span>
                      </div>
                      <span className="font-mono text-sm text-[#FFD700] font-bold">
                        R$ {Number((tournament.prize_distribution as Record<string, number>)["1"] || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded border border-[#C0C0C0]/20">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🥈</span>
                        <span className="text-xs text-[#C0C0C0] font-mono">2° LUGAR</span>
                      </div>
                      <span className="font-mono text-sm text-[#C0C0C0] font-bold">
                        R$ {Number((tournament.prize_distribution as Record<string, number>)["2"] || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded border border-[#CD7F32]/20">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🥉</span>
                        <span className="text-xs text-[#CD7F32] font-mono">3° LUGAR</span>
                      </div>
                      <span className="font-mono text-sm text-[#CD7F32] font-bold">
                        R$ {Number((tournament.prize_distribution as Record<string, number>)["3"] || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥇</span>
                      <span className="text-xs text-[#F5F5DC]">1° Lugar</span>
                    </div>
                    <span className="font-mono text-sm text-[#FFD700] font-bold">
                      R$ {(Number(tournament.prize_pool) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Regras/Formato */}
          <div>
            <div className="p-4 bg-[#12121a]">
              <h3 className="font-mono text-[#F5F5DC] text-xs tracking-wider">
                FORMATO
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {tournament ? (
                <>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] mt-1.5" />
                    <span className="text-xs text-[#A1A1AA]">
                      {tournament.max_teams || "?"} times participantes
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] mt-1.5" />
                    <span className="text-xs text-[#A1A1AA]">
                      Formato: {tournament.format}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] mt-1.5" />
                    <span className="text-xs text-[#A1A1AA]">
                      Jogo: {tournament.game}
                    </span>
                  </div>
                  {tournament.rules && (
                    <Link
                      href={tournament.rules}
                      target="_blank"
                      className="block mt-4 text-center font-mono text-[10px] text-[#A855F7] hover:text-[#C084FC] transition-colors"
                    >
                      VER REGULAMENTO COMPLETO →
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-xs text-[#A1A1AA] text-center">
                  Nenhum torneio ativo
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Conteúdo Central */}
        <main className="flex-1 ml-64 mr-72 min-h-[calc(100vh-4rem)] bg-[#0A0A0A]">
          {/* Banner do Campeonato */}
          <div className="relative w-full h-[280px]">
            {tournament?.banner_url ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${tournament.banner_url})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-[#1a1a2e] border border-dashed border-[#A855F7]/50 flex items-center justify-center">
                <span className="font-mono text-[#A855F7]/30 text-xs absolute top-2 left-2">
                  IMAGEM DO CAMPEONATO (BANNER)
                </span>
              </div>
            )}
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
            {/* Conteúdo sobre a imagem */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="font-display text-3xl text-[#F5F5DC] block mb-2">
                  {tournament?.name || "ORBITAL CUP"}
                </span>
                <span className="font-mono text-[#A855F7] text-sm">
                  {tournament?.game ? `TORNEIO ${tournament.game.toUpperCase()}` : "TORNEIO"}
                </span>
                {/* Logos dos times participantes */}
                {teams.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      {teams.slice(0, 8).map((team) => (
                        <div
                          key={team.id}
                          className="w-12 h-12 rounded bg-[#27272A] border border-[#A855F7]/50 flex items-center justify-center"
                          title={team.name}
                        >
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-10 h-10 object-contain" />
                          ) : (
                            <span className="text-[8px] text-[#A1A1AA] font-mono">{team.tag}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {teams.length === 0 && !loading && (
                  <div className="mt-6">
                    <p className="text-xs text-[#A1A1AA]">
                      Inscrições em breve
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Área de Informações do Torneio */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
              </div>
            ) : tournament ? (
              <>
                {/* Resumo do Bracket */}
                {allMatches.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-mono text-[#A1A1AA] text-sm tracking-wider">
                        PROGRESSO DO BRACKET
                      </h2>
                      <Link
                        href={`/campeonatos/bracket`}
                        className="text-xs font-mono text-[#A855F7] hover:text-[#C084FC] transition-colors"
                      >
                        VER BRACKET COMPLETO →
                      </Link>
                    </div>

                    {/* Stats do Torneio */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-[#12121a] p-4 rounded-lg border border-[#27272A] text-center">
                        <span className="text-2xl font-display text-[#A855F7]">
                          {allMatches.filter(m => m.status === "finished").length}
                        </span>
                        <span className="text-[10px] font-mono text-[#A1A1AA] block mt-1">FINALIZADAS</span>
                      </div>
                      <div className="bg-[#12121a] p-4 rounded-lg border border-[#27272A] text-center">
                        <span className="text-2xl font-display text-red-500">
                          {allMatches.filter(m => m.status === "live").length}
                        </span>
                        <span className="text-[10px] font-mono text-[#A1A1AA] block mt-1">AO VIVO</span>
                      </div>
                      <div className="bg-[#12121a] p-4 rounded-lg border border-[#27272A] text-center">
                        <span className="text-2xl font-display text-[#3b82f6]">
                          {allMatches.filter(m => m.status === "scheduled").length}
                        </span>
                        <span className="text-[10px] font-mono text-[#A1A1AA] block mt-1">AGENDADAS</span>
                      </div>
                      <div className="bg-[#12121a] p-4 rounded-lg border border-[#27272A] text-center">
                        <span className="text-2xl font-display text-[#F5F5DC]">
                          {ranking.filter(t => t.status === "active").length}
                        </span>
                        <span className="text-[10px] font-mono text-[#A1A1AA] block mt-1">TIMES ATIVOS</span>
                      </div>
                    </div>

                    {/* Partida ao Vivo em Destaque */}
                    {allMatches.filter(m => m.status === "live").map(liveMatch => (
                      <div
                        key={liveMatch.id}
                        onClick={() => router.push(`/campeonatos/partida/${liveMatch.id}`)}
                        className="bg-gradient-to-r from-red-500/10 via-[#12121a] to-red-500/10 border border-red-500/50 rounded-xl p-6 cursor-pointer hover:border-red-500 transition-all"
                      >
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs font-mono text-red-500 font-bold">AO VIVO AGORA</span>
                          <span className="text-[10px] font-mono text-[#A855F7] px-2 py-0.5 bg-[#A855F7]/10 rounded">
                            {getRoundLabel(liveMatch.round)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          {/* Time 1 */}
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-[#27272A] border border-[#A855F7]/20 flex items-center justify-center overflow-hidden">
                              {liveMatch.team1?.logo_url ? (
                                <img src={liveMatch.team1.logo_url} alt={liveMatch.team1.name} className="w-12 h-12 object-contain" />
                              ) : (
                                <span className="text-sm font-mono text-[#A1A1AA]">{liveMatch.team1?.tag}</span>
                              )}
                            </div>
                            <div className="text-left">
                              <span className="font-display text-xl text-[#F5F5DC] block">{liveMatch.team1?.name}</span>
                              <span className="text-xs font-mono text-[#A1A1AA]">{liveMatch.team1?.tag}</span>
                            </div>
                          </div>
                          {/* Placar */}
                          <div className="flex items-center gap-4">
                            <span className="text-4xl font-display text-[#F5F5DC]">{liveMatch.team1_score}</span>
                            <span className="text-2xl text-[#52525B]">:</span>
                            <span className="text-4xl font-display text-[#F5F5DC]">{liveMatch.team2_score}</span>
                          </div>
                          {/* Time 2 */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="font-display text-xl text-[#F5F5DC] block">{liveMatch.team2?.name}</span>
                              <span className="text-xs font-mono text-[#A1A1AA]">{liveMatch.team2?.tag}</span>
                            </div>
                            <div className="w-16 h-16 rounded-lg bg-[#27272A] border border-[#A855F7]/20 flex items-center justify-center overflow-hidden">
                              {liveMatch.team2?.logo_url ? (
                                <img src={liveMatch.team2.logo_url} alt={liveMatch.team2.name} className="w-12 h-12 object-contain" />
                              ) : (
                                <span className="text-sm font-mono text-[#A1A1AA]">{liveMatch.team2?.tag}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-center">
                          <span className="text-xs font-mono text-red-500 flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            CLIQUE PARA ASSISTIR AO VIVO
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Próxima Partida */}
                    {(() => {
                      const nextMatch = allMatches
                        .filter(m => m.status === "scheduled" && m.team1 && m.team2)
                        .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())[0];

                      if (!nextMatch || allMatches.some(m => m.status === "live")) return null;

                      return (
                        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6">
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <span className="text-xs font-mono text-[#3b82f6]">PRÓXIMA PARTIDA</span>
                            <span className="text-[10px] font-mono text-[#A855F7] px-2 py-0.5 bg-[#A855F7]/10 rounded">
                              {getRoundLabel(nextMatch.round)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            {/* Time 1 */}
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-[#27272A] border border-[#A855F7]/20 flex items-center justify-center overflow-hidden">
                                {nextMatch.team1?.logo_url ? (
                                  <img src={nextMatch.team1.logo_url} alt={nextMatch.team1.name} className="w-10 h-10 object-contain" />
                                ) : (
                                  <span className="text-xs font-mono text-[#A1A1AA]">{nextMatch.team1?.tag}</span>
                                )}
                              </div>
                              <span className="font-display text-lg text-[#F5F5DC]">{nextMatch.team1?.name}</span>
                            </div>
                            {/* VS */}
                            <div className="text-center">
                              <span className="text-2xl font-display text-[#A855F7]">VS</span>
                              <span className="text-xs font-mono text-[#A1A1AA] block mt-1">
                                {nextMatch.scheduled_at ? new Date(nextMatch.scheduled_at).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }) : "Horário TBD"}
                              </span>
                            </div>
                            {/* Time 2 */}
                            <div className="flex items-center gap-3">
                              <span className="font-display text-lg text-[#F5F5DC]">{nextMatch.team2?.name}</span>
                              <div className="w-12 h-12 rounded-lg bg-[#27272A] border border-[#A855F7]/20 flex items-center justify-center overflow-hidden">
                                {nextMatch.team2?.logo_url ? (
                                  <img src={nextMatch.team2.logo_url} alt={nextMatch.team2.name} className="w-10 h-10 object-contain" />
                                ) : (
                                  <span className="text-xs font-mono text-[#A1A1AA]">{nextMatch.team2?.tag}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Sobre o Torneio */}
                <div className="space-y-4">
                  <h2 className="font-mono text-[#A1A1AA] text-sm tracking-wider">
                    SOBRE O TORNEIO
                  </h2>
                  <div className="bg-[#12121a] p-4 rounded-lg border border-[#27272A]">
                    {tournament.description ? (
                      <p className="text-sm text-[#F5F5DC]">{tournament.description}</p>
                    ) : (
                      <p className="text-sm text-[#A1A1AA]">
                        Bem-vindo ao {tournament.name}! Acompanhe as partidas, rankings e estatísticas do torneio.
                      </p>
                    )}
                    <div className="flex gap-6 mt-4 text-xs text-[#A1A1AA]">
                      {tournament.start_date && (
                        <div>
                          <span className="text-[#A855F7]">Início:</span>{" "}
                          {new Date(tournament.start_date).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                      {tournament.end_date && (
                        <div>
                          <span className="text-[#A855F7]">Término:</span>{" "}
                          {new Date(tournament.end_date).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                      <div>
                        <span className="text-[#A855F7]">Status:</span>{" "}
                        <span className={
                          tournament.status === "ongoing" ? "text-[#22c55e]" :
                          tournament.status === "registration" ? "text-[#3b82f6]" :
                          tournament.status === "draft" ? "text-[#eab308]" :
                          tournament.status === "finished" ? "text-[#A1A1AA]" : "text-[#A1A1AA]"
                        }>
                          {tournament.status === "ongoing" ? "Em andamento" :
                           tournament.status === "registration" ? "Inscrições abertas" :
                           tournament.status === "draft" ? "Em preparação" :
                           tournament.status === "finished" ? "Finalizado" : tournament.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#A1A1AA]">
                  Nenhum torneio ativo no momento
                </p>
                <p className="text-xs text-[#A1A1AA]/70 mt-2">
                  Fique ligado para novidades!
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar Direito - Partidas do Bracket */}
        <aside className="fixed right-0 top-16 bottom-0 w-72 bg-[#0f0f15] border-l border-[#A855F7]/20 overflow-y-auto">
          {/* Header do Sidebar com Tabs */}
          <div className="sticky top-0 bg-[#0f0f15] border-b border-[#A855F7]/20">
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">
                  PARTIDAS
                </h3>
                {allMatches.some(m => m.status === "live") && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-red-500">AO VIVO</span>
                  </div>
                )}
              </div>
              {/* Tabs */}
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("ao-vivo")}
                  className={`flex-1 px-2 py-1.5 rounded text-[10px] font-mono transition-colors ${
                    activeTab === "ao-vivo"
                      ? "bg-red-500/20 text-red-500 border border-red-500/50"
                      : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
                  }`}
                >
                  AO VIVO ({allMatches.filter(m => m.status === "live").length})
                </button>
                <button
                  onClick={() => setActiveTab("proximas")}
                  className={`flex-1 px-2 py-1.5 rounded text-[10px] font-mono transition-colors ${
                    activeTab === "proximas"
                      ? "bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/50"
                      : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
                  }`}
                >
                  PRÓXIMAS
                </button>
                <button
                  onClick={() => setActiveTab("finalizadas")}
                  className={`flex-1 px-2 py-1.5 rounded text-[10px] font-mono transition-colors ${
                    activeTab === "finalizadas"
                      ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/50"
                      : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
                  }`}
                >
                  RESULTADOS
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Partidas */}
          <div className="p-2 space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
              </div>
            ) : (() => {
              // Filtrar partidas baseado na tab ativa
              const filteredMatches = allMatches.filter(m => {
                if (activeTab === "ao-vivo") return m.status === "live";
                if (activeTab === "proximas") return m.status === "scheduled" && m.team1 && m.team2;
                if (activeTab === "finalizadas") return m.status === "finished";
                return false;
              }).sort((a, b) => {
                if (activeTab === "finalizadas") {
                  // Mais recentes primeiro
                  return new Date(b.finished_at || 0).getTime() - new Date(a.finished_at || 0).getTime();
                }
                // Próximas por horário
                return new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime();
              });

              if (filteredMatches.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-xs text-[#A1A1AA]">
                      {activeTab === "ao-vivo" && "Nenhuma partida ao vivo"}
                      {activeTab === "proximas" && "Nenhuma partida agendada"}
                      {activeTab === "finalizadas" && "Nenhum resultado ainda"}
                    </p>
                  </div>
                );
              }

              return filteredMatches.map((partida) => (
                <div
                  key={partida.id}
                  onClick={() => {
                    router.push(`/campeonatos/partida/${partida.id}`);
                  }}
                  className={`bg-[#12121a] border rounded-lg p-3 transition-all group cursor-pointer ${
                    partida.status === "live"
                      ? "border-red-500/50 hover:border-red-500"
                      : partida.status === "finished"
                      ? "border-[#22c55e]/30 hover:border-[#22c55e]/50"
                      : "border-[#27272A] hover:border-[#A855F7]/50"
                  }`}
                >
                  {/* Status, Round e Horário */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {partida.status === "live" ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-red-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          AO VIVO
                        </span>
                      ) : partida.status === "finished" ? (
                        <span className="text-[10px] font-mono text-[#22c55e]">
                          FINAL
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#A1A1AA]">
                          {formatMatchTime(partida.scheduled_at)}
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-[#A855F7]/70 uppercase px-1.5 py-0.5 bg-[#A855F7]/10 rounded">
                      {getRoundLabel(partida.round)}
                    </span>
                  </div>

                  {/* Time 1 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#27272A] border border-[#A855F7]/20 flex items-center justify-center overflow-hidden">
                        {partida.team1?.logo_url ? (
                          <img src={partida.team1.logo_url} alt={partida.team1.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="text-[8px] font-mono text-[#A1A1AA]">
                            {partida.team1?.tag || "?"}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-body transition-colors ${
                        partida.status === "finished" && partida.winner_id === partida.team1_id
                          ? "text-[#22c55e] font-semibold"
                          : "text-[#F5F5DC] group-hover:text-[#A855F7]"
                      }`}>
                        {partida.team1?.name || "TBD"}
                      </span>
                    </div>
                    {(partida.status === "live" || partida.status === "finished") && (
                      <span className={`font-mono text-lg font-bold ${
                        partida.winner_id === partida.team1_id
                          ? "text-[#22c55e]"
                          : partida.status === "finished"
                          ? "text-[#52525B]"
                          : "text-[#F5F5DC]"
                      }`}>
                        {partida.team1_score}
                      </span>
                    )}
                  </div>

                  {/* Divisor */}
                  <div className="border-t border-dashed border-[#27272A] my-2" />

                  {/* Time 2 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[#27272A] border border-[#A855F7]/20 flex items-center justify-center overflow-hidden">
                        {partida.team2?.logo_url ? (
                          <img src={partida.team2.logo_url} alt={partida.team2.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="text-[8px] font-mono text-[#A1A1AA]">
                            {partida.team2?.tag || "?"}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-body transition-colors ${
                        partida.status === "finished" && partida.winner_id === partida.team2_id
                          ? "text-[#22c55e] font-semibold"
                          : "text-[#F5F5DC] group-hover:text-[#A855F7]"
                      }`}>
                        {partida.team2?.name || "TBD"}
                      </span>
                    </div>
                    {(partida.status === "live" || partida.status === "finished") && (
                      <span className={`font-mono text-lg font-bold ${
                        partida.winner_id === partida.team2_id
                          ? "text-[#22c55e]"
                          : partida.status === "finished"
                          ? "text-[#52525B]"
                          : "text-[#F5F5DC]"
                      }`}>
                        {partida.team2_score}
                      </span>
                    )}
                  </div>

                  {/* Link para assistir */}
                  {partida.status === "live" && (
                    <div className="mt-3 pt-2 border-t border-[#27272A]">
                      <span className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-red-500">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        CLIQUE PARA ASSISTIR
                      </span>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>

          {/* Footer do Sidebar */}
          <div className="sticky bottom-0 bg-[#0f0f15] border-t border-[#A855F7]/20 p-3">
            <Link
              href="/campeonatos/partidas"
              className="block text-center font-mono text-xs text-[#A855F7] hover:text-[#C084FC] transition-colors"
            >
              VER BRACKET COMPLETO →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
