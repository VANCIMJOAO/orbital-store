import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';
import { createLogger } from '@/lib/logger';

const log = createLogger('profile-stats');

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/profiles/[id]/stats
// Retorna estatísticas agregadas do jogador
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;

    // Buscar perfil do jogador
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      // Tentar buscar por username
      const { data: profileByUsername, error: usernameError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', profileId)
        .single();

      if (usernameError || !profileByUsername) {
        return NextResponse.json(
          { error: 'Jogador não encontrado' },
          { status: 404 }
        );
      }

      // Continua com o perfil encontrado por username
      return fetchPlayerStats(profileByUsername);
    }

    return fetchPlayerStats(profile);
  } catch (error) {
    log.error('Erro ao buscar stats do jogador', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function fetchPlayerStats(profile: Database['public']['Tables']['profiles']['Row']) {
  // Buscar estatísticas agregadas de todas as partidas
  const { data: stats, error: statsError } = await supabase
    .from('match_player_stats')
    .select('*')
    .eq('profile_id', profile.id);

  // Buscar time atual do jogador
  const { data: teamPlayer } = await supabase
    .from('team_players')
    .select(`
      *,
      team:teams(*)
    `)
    .eq('profile_id', profile.id)
    .eq('is_active', true)
    .single();

  // Buscar histórico de partidas
  const { data: matchHistory } = await supabase
    .from('match_player_stats')
    .select(`
      *,
      match:matches(
        id,
        status,
        map_name,
        score_team1,
        score_team2,
        match_phase,
        scheduled_at,
        team1:teams!matches_team1_id_fkey(id, name, tag, logo_url),
        team2:teams!matches_team2_id_fkey(id, name, tag, logo_url)
      )
    `)
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Calcular estatísticas agregadas
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalHeadshots = 0;
  let totalDamage = 0;
  let totalRounds = 0;
  let totalMatches = stats?.length || 0;
  let totalWins = 0;
  let totalFirstKills = 0;
  let totalFirstDeaths = 0;
  let totalClutchWins = 0;
  let totalClutchAttempts = 0;
  let totalAces = 0;
  let total4k = 0;
  let total3k = 0;
  let total2k = 0;
  let ratingSum = 0;

  stats?.forEach((stat) => {
    totalKills += stat.kills || 0;
    totalDeaths += stat.deaths || 0;
    totalAssists += stat.assists || 0;
    totalHeadshots += stat.headshots || 0;
    totalDamage += stat.total_damage || 0;
    totalRounds += stat.rounds_played || 0;
    totalFirstKills += stat.first_kills || 0;
    totalFirstDeaths += stat.first_deaths || 0;
    totalClutchWins += stat.clutch_wins || 0;
    totalClutchAttempts += stat.clutch_attempts || 0;
    totalAces += stat.aces || 0;
    total4k += stat.four_kills || 0;
    total3k += stat.three_kills || 0;
    total2k += stat.two_kills || 0;
    if (stat.rating) ratingSum += Number(stat.rating);
  });

  // Contar vitórias (precisa comparar com o resultado da partida)
  matchHistory?.forEach((mh) => {
    const match = mh.match as any;
    if (match) {
      const playerTeamId = mh.team_id;
      const isTeam1 = playerTeamId === (match.team1 as any)?.id;
      const team1Won = (match.score_team1 || 0) > (match.score_team2 || 0);
      if ((isTeam1 && team1Won) || (!isTeam1 && !team1Won)) {
        totalWins++;
      }
    }
  });

  // Calcular médias e percentuais
  const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
  const hsPercentage = totalKills > 0 ? ((totalHeadshots / totalKills) * 100).toFixed(1) : '0.0';
  const adr = totalRounds > 0 ? (totalDamage / totalRounds).toFixed(1) : '0.0';
  const winrate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : '0.0';
  const avgRating = totalMatches > 0 ? (ratingSum / totalMatches).toFixed(2) : '0.00';
  const fkFdDiff = totalFirstKills - totalFirstDeaths;
  const clutchRate = totalClutchAttempts > 0
    ? ((totalClutchWins / totalClutchAttempts) * 100).toFixed(1)
    : '0.0';

  // Formatar histórico de partidas para o frontend
  const formattedMatchHistory = (matchHistory || []).map((mh) => {
    const match = mh.match as any;
    if (!match) return null;

    const playerTeamId = mh.team_id;
    const team1 = match.team1 as any;
    const team2 = match.team2 as any;
    const isTeam1 = playerTeamId === team1?.id;
    const team1Won = (match.score_team1 || 0) > (match.score_team2 || 0);
    const won = (isTeam1 && team1Won) || (!isTeam1 && !team1Won);

    return {
      matchId: match.id,
      mapName: match.map_name,
      date: match.scheduled_at,
      result: won ? 'win' : 'loss',
      score: `${match.score_team1 || 0}-${match.score_team2 || 0}`,
      playerTeam: isTeam1 ? team1 : team2,
      opponentTeam: isTeam1 ? team2 : team1,
      stats: {
        kills: mh.kills,
        deaths: mh.deaths,
        assists: mh.assists,
        rating: mh.rating,
        adr: mh.adr,
      },
    };
  }).filter(Boolean);

  return NextResponse.json({
    profile: {
      id: profile.id,
      username: profile.username,
      steam_id: profile.steam_id,
      avatar_url: profile.avatar_url,
      level: profile.level,
      xp: profile.xp,
      discord_username: profile.discord_username,
      created_at: profile.created_at,
    },
    team: teamPlayer?.team || null,
    stats: {
      matches: totalMatches,
      wins: totalWins,
      losses: totalMatches - totalWins,
      winrate: `${winrate}%`,
      kills: totalKills,
      deaths: totalDeaths,
      assists: totalAssists,
      kd,
      headshots: totalHeadshots,
      hsPercentage: `${hsPercentage}%`,
      totalDamage,
      adr,
      avgRating,
      roundsPlayed: totalRounds,
      firstKills: totalFirstKills,
      firstDeaths: totalFirstDeaths,
      fkFdDiff,
      clutchWins: totalClutchWins,
      clutchAttempts: totalClutchAttempts,
      clutchRate: `${clutchRate}%`,
      aces: totalAces,
      fourKills: total4k,
      threeKills: total3k,
      twoKills: total2k,
    },
    matchHistory: formattedMatchHistory || [],
  });
}
