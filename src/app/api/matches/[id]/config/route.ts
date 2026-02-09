import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';
import { requireAdmin } from '@/lib/admin-auth';
import { createLogger } from '@/lib/logger';

const log = createLogger('match-config');

// Supabase client com service role para acesso admin
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Interface para a configuração do MatchZy
interface MatchZyConfig {
  matchid: number;
  num_maps: number;
  maplist: string[];
  skip_veto: boolean;
  side_type: 'knife' | 'standard' | 'never_knife';
  players_per_team: number;
  min_players_to_ready: number;
  team1: {
    name: string;
    tag: string;
    flag?: string;
    players: Record<string, string>; // steamId -> nome
  };
  team2: {
    name: string;
    tag: string;
    flag?: string;
    players: Record<string, string>;
  };
  cvars?: Record<string, string>;
}

// GET /api/matches/[id]/config
// Retorna a configuração JSON para o MatchZy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;

    // Buscar a partida com os times
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(*),
        team2:teams!matches_team2_id_fkey(*),
        tournament:tournaments(*)
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Partida não encontrada' },
        { status: 404 }
      );
    }

    if (!match.team1_id || !match.team2_id) {
      return NextResponse.json(
        { error: 'Partida ainda não tem ambos os times definidos' },
        { status: 400 }
      );
    }

    // Buscar jogadores do time 1
    const { data: team1Players, error: team1Error } = await supabase
      .from('team_players')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('team_id', match.team1_id)
      .eq('is_active', true);

    if (team1Error) {
      return NextResponse.json(
        { error: 'Erro ao buscar jogadores do time 1' },
        { status: 500 }
      );
    }

    // Buscar jogadores do time 2
    const { data: team2Players, error: team2Error } = await supabase
      .from('team_players')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('team_id', match.team2_id)
      .eq('is_active', true);

    if (team2Error) {
      return NextResponse.json(
        { error: 'Erro ao buscar jogadores do time 2' },
        { status: 500 }
      );
    }

    // Converter jogadores para o formato do MatchZy
    const team1PlayersMap: Record<string, string> = {};
    team1Players?.forEach((tp) => {
      // Prioridade: steam_id do team_player > steam_id do profile
      const steamId = tp.steam_id || (tp.profile as any)?.steam_id;
      const name = tp.nickname || (tp.profile as any)?.username || 'Player';
      if (steamId) {
        team1PlayersMap[steamId] = name;
      }
    });

    const team2PlayersMap: Record<string, string> = {};
    team2Players?.forEach((tp) => {
      const steamId = tp.steam_id || (tp.profile as any)?.steam_id;
      const name = tp.nickname || (tp.profile as any)?.username || 'Player';
      if (steamId) {
        team2PlayersMap[steamId] = name;
      }
    });

    // Determinar mapas - usar veto_data.maps se disponível (BO1, BO3, BO5)
    const bestOf = match.best_of || 1;
    let maplist: string[];

    if (match.veto_data) {
      const veto = match.veto_data as { maps?: string[]; completed?: boolean };
      if (veto.completed && veto.maps && veto.maps.length > 0) {
        maplist = veto.maps;
      } else {
        maplist = [match.map_name || 'de_ancient'];
      }
    } else {
      maplist = [match.map_name || 'de_ancient'];
    }

    // URL do GOTV server para receber eventos
    const gotvServerUrl = (process.env.GOTV_SERVER_URL || 'http://localhost:8080').trim();
    const matchzyAuthToken = (process.env.MATCHZY_AUTH_TOKEN || 'orbital_secret_token').trim();

    // MatchZy exige matchid como inteiro (Int32) - converter UUID para número
    // Usa os primeiros 8 hex do UUID e garante que cabe em Int32 (max 2147483647)
    const rawNumeric = parseInt(matchId.replace(/-/g, '').substring(0, 8), 16);
    const numericMatchId = rawNumeric % 2147483647;

    // Montar configuração do MatchZy
    const config: MatchZyConfig = {
      matchid: numericMatchId,
      num_maps: maplist.length,
      maplist: maplist,
      skip_veto: true, // Veto é feito no nosso sistema, não in-game
      side_type: 'knife', // Knife round para decidir lado
      players_per_team: 5,
      min_players_to_ready: 5,
      team1: {
        name: (match.team1 as any)?.name || 'Time 1',
        tag: (match.team1 as any)?.tag || 'T1',
        players: team1PlayersMap,
      },
      team2: {
        name: (match.team2 as any)?.name || 'Time 2',
        tag: (match.team2 as any)?.tag || 'T2',
        players: team2PlayersMap,
      },
      cvars: {
        matchzy_remote_log_url: `${gotvServerUrl}/api/matchzy/events`,
        matchzy_remote_log_header_key: 'Authorization',
        matchzy_remote_log_header_value: `Bearer ${matchzyAuthToken}`,
        // UUID real da partida para o GOTV server identificar no banco
        orbital_match_uuid: matchId,
      },
    };

    // Salvar config na partida
    await supabase
      .from('matches')
      .update({ matchzy_config: config as any })
      .eq('id', matchId);

    return NextResponse.json(config);
  } catch (error) {
    log.error('Erro ao gerar config MatchZy', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/matches/[id]/config (admin only)
// Salva uma configuração customizada para a partida
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: matchId } = await params;
    const body = await request.json();

    // Validar campos obrigatórios
    if (!body.maplist || !Array.isArray(body.maplist)) {
      return NextResponse.json(
        { error: 'maplist é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar a partida com a config customizada
    const { error } = await supabase
      .from('matches')
      .update({
        matchzy_config: body,
        map_name: body.maplist[0],
        best_of: body.num_maps || 1,
      })
      .eq('id', matchId);

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao salvar configuração' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, config: body });
  } catch (error) {
    log.error('Erro ao salvar config MatchZy', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
