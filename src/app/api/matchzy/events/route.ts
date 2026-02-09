import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/logger";

const log = createLogger("matchzy-webhook");

// Criar cliente Supabase com service role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Token de autenticação para webhooks
const WEBHOOK_SECRET = process.env.MATCHZY_WEBHOOK_SECRET || "orbital_secret_token";

// ============================================================
// Tipos do MatchZy (baseados em Events.cs e MatchData.cs)
// ============================================================

interface MatchZyPlayerStats {
  kills: number;
  headshot_kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  enemies_flashed: number;
  friendlies_flashed: number;
  damage: number;
  utility_damage: number;
  knife_kills: number;
  suicides: number;
  team_kills: number;
  trade_kills: number;
  bomb_plants: number;
  bomb_defuses: number;
  first_kills_t: number;
  first_kills_ct: number;
  first_deaths_t: number;
  first_deaths_ct: number;
  kast: number;
  score: number;
  mvps: number;
  rounds_played: number;
  kills1: number;
  kills2: number;
  kills3: number;
  kills4: number;
  kills5: number;
  one_v1s: number;
  one_v2s: number;
  one_v3s: number;
  one_v4s: number;
  one_v5s: number;
}

interface MatchZyStatsPlayer {
  steamid: string;
  name: string;
  stats: MatchZyPlayerStats;
}

interface MatchZyStatsTeam {
  id: string;
  name: string;
  series_score: number;
  score: number;
  score_ct: number;
  score_t: number;
  players: MatchZyStatsPlayer[];
}

interface MatchZyWinner {
  side: string;
  team: string;
}

// Evento genérico com campos opcionais de cada tipo
interface MatchZyEvent {
  event: string;
  matchid?: string;
  map_number?: number;
  round_number?: number;
  round_time?: number;
  reason?: number;
  winner?: MatchZyWinner;
  team1?: MatchZyStatsTeam;
  team2?: MatchZyStatsTeam;
  // player_death fields
  player?: { steamid: string; name: string; side?: string };
  attacker?: { steamid: string; name: string; side?: string };
  assister?: { steamid: string; name: string; side?: string; friendly_fire?: boolean } | null;
  weapon?: { name: string };
  headshot?: boolean;
  penetrated?: boolean;
  thrusmoke?: boolean;
  attackerblind?: boolean;
  noscope?: boolean;
  // bomb events
  site?: string;
  // series_end
  time_until_restore?: number;
  team1_series_score?: number;
  team2_series_score?: number;
  // demo
  filename?: string;
  success?: boolean;
  // Catch-all
  [key: string]: unknown;
}

// ============================================================
// Caches
// ============================================================

// Cache de resolução de matchId numérico → UUID
const matchIdCache = new Map<string, string>();

// Cache de steamId → { profileId, teamId }
const steamIdCache = new Map<string, { profileId: string; teamId: string }>();

// Cache de matchId → match_map_id (mapa atual)
const matchMapCache = new Map<string, string>();

// ============================================================
// Helpers
// ============================================================

async function resolveMatchId(rawMatchId: string): Promise<string | null> {
  if (rawMatchId.includes("-")) return rawMatchId;

  const cached = matchIdCache.get(rawMatchId);
  if (cached) return cached;

  const { data } = await supabase
    .from("matches")
    .select("id")
    .filter("matchzy_config->>matchid", "eq", rawMatchId)
    .single();

  if (data?.id) {
    matchIdCache.set(rawMatchId, data.id);
    log.info(`Resolved matchId ${rawMatchId} → ${data.id}`);
    return data.id;
  }

  log.error(`Failed to resolve matchId: ${rawMatchId}`);
  return null;
}

// Resolver steamId para profileId e teamId via team_players
async function resolveSteamId(
  steamId: string,
  matchId: string
): Promise<{ profileId: string; teamId: string } | null> {
  const cacheKey = `${matchId}:${steamId}`;
  const cached = steamIdCache.get(cacheKey);
  if (cached) return cached;

  // Buscar o match para saber team1_id e team2_id
  const { data: match } = await supabase
    .from("matches")
    .select("team1_id, team2_id")
    .eq("id", matchId)
    .single();

  if (!match) return null;

  // Buscar em team_players dos dois times
  const teamIds = [match.team1_id, match.team2_id].filter(Boolean);
  const { data: players } = await supabase
    .from("team_players")
    .select("profile_id, team_id, steam_id")
    .in("team_id", teamIds)
    .eq("is_active", true);

  if (!players) return null;

  // Cachear todos os jogadores deste match
  for (const p of players) {
    if (p.steam_id) {
      const key = `${matchId}:${p.steam_id}`;
      steamIdCache.set(key, { profileId: p.profile_id, teamId: p.team_id });
    }
  }

  // Também buscar por profiles.steam_id como fallback
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, steam_id")
    .not("steam_id", "is", null);

  if (profiles) {
    for (const profile of profiles) {
      if (profile.steam_id) {
        // Verificar se este profile está em algum dos times
        const player = players.find(p => p.profile_id === profile.id);
        if (player) {
          const key = `${matchId}:${profile.steam_id}`;
          if (!steamIdCache.has(key)) {
            steamIdCache.set(key, { profileId: profile.id, teamId: player.team_id });
          }
        }
      }
    }
  }

  return steamIdCache.get(cacheKey) || null;
}

// Obter ou criar match_map para o mapa atual
async function getOrCreateMatchMap(
  matchId: string,
  mapNumber: number,
  mapName?: string
): Promise<string | null> {
  const cacheKey = `${matchId}:${mapNumber}`;
  const cached = matchMapCache.get(cacheKey);
  if (cached) return cached;

  // Verificar se já existe
  const { data: existing } = await supabase
    .from("match_maps")
    .select("id")
    .eq("match_id", matchId)
    .eq("map_order", mapNumber)
    .single();

  if (existing) {
    matchMapCache.set(cacheKey, existing.id);
    return existing.id;
  }

  // Buscar nome do mapa da veto_data ou match
  let resolvedMapName = mapName || "unknown";
  if (!mapName) {
    const { data: match } = await supabase
      .from("matches")
      .select("veto_data, map_name")
      .eq("id", matchId)
      .single();

    if (match) {
      const veto = match.veto_data as { maps?: string[] } | null;
      if (veto?.maps && veto.maps[mapNumber]) {
        resolvedMapName = veto.maps[mapNumber];
      } else if (match.map_name) {
        resolvedMapName = match.map_name;
      }
    }
  }

  // Criar novo match_map
  const { data: newMap, error } = await supabase
    .from("match_maps")
    .insert({
      match_id: matchId,
      map_name: resolvedMapName,
      map_order: mapNumber,
      status: "live",
    })
    .select("id")
    .single();

  if (error) {
    log.error("Error creating match_map:", error);
    return null;
  }

  if (newMap) {
    matchMapCache.set(cacheKey, newMap.id);
    return newMap.id;
  }

  return null;
}

// Calcular rating simplificado (baseado em HLTV 2.0)
function calculateRating(stats: MatchZyPlayerStats): number {
  const rounds = stats.rounds_played || 1;
  const kpr = stats.kills / rounds;
  const spr = (rounds - stats.deaths) / rounds;
  const rmk = (stats.kills1 + 4 * stats.kills2 + 9 * stats.kills3 + 16 * stats.kills4 + 25 * stats.kills5) / rounds;
  const dpr = stats.deaths / rounds;
  const adr = stats.damage / rounds;

  const rating = 0.0073 * (adr) + 0.3591 * kpr - 0.5329 * dpr + 0.2372 * (stats.kast / 100) + 0.0032 * rmk + 0.1587;
  return Math.round(rating * 100) / 100;
}

// ============================================================
// Persistência de player stats
// ============================================================

async function persistPlayerStats(
  matchId: string,
  matchMapId: string | null,
  statsTeam1: MatchZyStatsTeam | undefined,
  statsTeam2: MatchZyStatsTeam | undefined
) {
  if (!statsTeam1?.players && !statsTeam2?.players) return;

  const allPlayers: { team: MatchZyStatsTeam; player: MatchZyStatsPlayer }[] = [];

  if (statsTeam1?.players) {
    for (const p of statsTeam1.players) {
      allPlayers.push({ team: statsTeam1, player: p });
    }
  }
  if (statsTeam2?.players) {
    for (const p of statsTeam2.players) {
      allPlayers.push({ team: statsTeam2, player: p });
    }
  }

  for (const { player } of allPlayers) {
    const resolved = await resolveSteamId(player.steamid, matchId);
    if (!resolved) {
      log.info(`Could not resolve steamId ${player.steamid} (${player.name}), skipping stats`);
      continue;
    }

    const s = player.stats;
    const rounds = s.rounds_played || 1;
    const rating = calculateRating(s);

    const statsRow = {
      match_id: matchId,
      match_map_id: matchMapId,
      profile_id: resolved.profileId,
      team_id: resolved.teamId,
      kills: s.kills,
      deaths: s.deaths,
      assists: s.assists,
      headshots: s.headshot_kills,
      total_damage: s.damage,
      adr: Math.round(s.damage / rounds),
      kast_percentage: s.kast,
      rating: rating,
      rounds_played: s.rounds_played,
      rounds_with_kill: s.kills1 + s.kills2 + s.kills3 + s.kills4 + s.kills5,
      rounds_survived: s.rounds_played - s.deaths,
      first_kills: s.first_kills_t + s.first_kills_ct,
      first_deaths: s.first_deaths_t + s.first_deaths_ct,
      clutch_wins: s.one_v1s + s.one_v2s + s.one_v3s + s.one_v4s + s.one_v5s,
      clutch_attempts: 0, // MatchZy não envia tentativas, só vitórias
      two_kills: s.kills2,
      three_kills: s.kills3,
      four_kills: s.kills4,
      aces: s.kills5,
      flash_assists: s.flash_assists,
      enemies_flashed: s.enemies_flashed,
      equipment_value_total: 0, // Não enviado pelo MatchZy
      ct_kills: s.first_kills_ct, // Aproximação
      t_kills: s.first_kills_t,   // Aproximação
      ct_deaths: s.first_deaths_ct,
      t_deaths: s.first_deaths_t,
    };

    // Upsert: atualizar se já existe para este match+player(+map)
    const { error } = await supabase
      .from("match_player_stats")
      .upsert(statsRow, {
        onConflict: matchMapId
          ? "match_id,profile_id,match_map_id"
          : "match_id,profile_id",
      });

    if (error) {
      // Se upsert falha (constraint não existe), tentar delete+insert
      if (error.code === "42P10" || error.message?.includes("constraint")) {
        // Delete existing e inserir novo
        const deleteFilter = supabase
          .from("match_player_stats")
          .delete()
          .eq("match_id", matchId)
          .eq("profile_id", resolved.profileId);

        if (matchMapId) {
          await deleteFilter.eq("match_map_id", matchMapId);
        } else {
          await deleteFilter;
        }

        await supabase.from("match_player_stats").insert(statsRow);
      } else {
        log.error(`Error upserting stats for ${player.name}:`, error);
      }
    }
  }

  log.info(`Persisted stats for ${allPlayers.length} players (match: ${matchId})`);
}

// Atualizar stats agregadas no profile
async function updateProfileAggregateStats(matchId: string) {
  // Buscar todos os stats desta partida
  const { data: allStats } = await supabase
    .from("match_player_stats")
    .select("profile_id, kills, deaths, headshots, rating, rounds_played")
    .eq("match_id", matchId);

  if (!allStats || allStats.length === 0) return;

  // Agrupar por profile_id (pode ter múltiplos mapas)
  const byProfile = new Map<string, typeof allStats>();
  for (const stat of allStats) {
    const existing = byProfile.get(stat.profile_id) || [];
    existing.push(stat);
    byProfile.set(stat.profile_id, existing);
  }

  for (const [profileId, stats] of byProfile) {
    const totalKills = stats.reduce((sum, s) => sum + s.kills, 0);
    const totalDeaths = stats.reduce((sum, s) => sum + s.deaths, 0);
    const totalHeadshots = stats.reduce((sum, s) => sum + s.headshots, 0);
    const avgRating = stats.reduce((sum, s) => sum + (s.rating || 0), 0) / stats.length;

    // Buscar profile atual para incrementar
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_kills, total_deaths, total_matches, average_rating, headshot_percentage")
      .eq("id", profileId)
      .single();

    if (!profile) continue;

    const prevMatches = profile.total_matches || 0;
    const prevKills = profile.total_kills || 0;
    const prevDeaths = profile.total_deaths || 0;
    const prevRating = profile.average_rating || 0;

    const newMatches = prevMatches + 1;
    const newKills = prevKills + totalKills;
    const newDeaths = prevDeaths + totalDeaths;
    const newRating = prevMatches > 0
      ? (prevRating * prevMatches + avgRating) / newMatches
      : avgRating;
    const newHsPercent = newKills > 0
      ? Math.round(((prevKills > 0 ? (profile.headshot_percentage || 0) * prevKills / 100 : 0) + totalHeadshots) / newKills * 100)
      : 0;

    await supabase
      .from("profiles")
      .update({
        total_kills: newKills,
        total_deaths: newDeaths,
        total_matches: newMatches,
        average_rating: Math.round(newRating * 100) / 100,
        headshot_percentage: newHsPercent,
      })
      .eq("id", profileId);
  }

  log.info(`Updated aggregate stats for ${byProfile.size} profiles`);
}

// ============================================================
// Event Handlers
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      log.info("[MatchZy Webhook] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event: MatchZyEvent = await request.json();
    log.info(`Received event: ${event.event} matchid: ${event.matchid}`);

    // Resolver matchId numérico para UUID
    if (event.matchid) {
      const resolvedId = await resolveMatchId(String(event.matchid));
      if (!resolvedId) {
        log.error("Could not resolve matchId:", event.matchid);
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      event.matchid = resolvedId;
    }

    switch (event.event) {
      case "going_live":
        await handleGoingLive(event);
        break;
      case "round_end":
        await handleRoundEnd(event);
        break;
      case "map_result":
        await handleMapResult(event);
        break;
      case "series_end":
        await handleSeriesEnd(event);
        break;
      case "side_picked":
        await handleSidePicked(event);
        break;
      case "player_death":
        await handlePlayerDeath(event);
        break;
      case "bomb_planted":
        await handleBombEvent(event, "bomb_planted");
        break;
      case "bomb_defused":
        await handleBombEvent(event, "bomb_defused");
        break;
      case "demo_upload_ended":
        await handleDemoUpload(event);
        break;
      default:
        log.info("[MatchZy Webhook] Unhandled event:", event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Partida começou (saiu do warmup)
async function handleGoingLive(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  const mapNumber = event.map_number || 0;
  const now = new Date();

  // Atualizar status da partida para live
  const { data: match, error } = await supabase
    .from("matches")
    .update({
      status: "live",
      match_phase: "live",
      started_at: now.toISOString(),
      is_live: true,
    })
    .eq("id", matchId)
    .select()
    .single();

  if (error) {
    log.error("Error updating match to live:", error);
    return;
  }

  log.info(`Match going live: ${matchId} (map ${mapNumber})`);

  // Criar registro match_map para este mapa
  await getOrCreateMatchMap(matchId, mapNumber);

  // Verificar se houve atraso e propagar
  if (match?.scheduled_at) {
    const scheduledTime = new Date(match.scheduled_at);
    const delayMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);
    if (delayMinutes > 5) {
      log.info(`Match ${matchId} started ${delayMinutes} minutes late, propagating delay`);
      await propagateDelay(match.tournament_id, matchId, delayMinutes);
    }
  }
}

// Round terminou
async function handleRoundEnd(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  const mapNumber = event.map_number || 0;
  const roundNumber = event.round_number || 0;
  const team1 = event.team1 as MatchZyStatsTeam | undefined;
  const team2 = event.team2 as MatchZyStatsTeam | undefined;

  // Atualizar placar da partida
  await supabase
    .from("matches")
    .update({
      team1_score: team1?.score || 0,
      team2_score: team2?.score || 0,
    })
    .eq("id", matchId);

  // Obter match_map_id
  const matchMapId = await getOrCreateMatchMap(matchId, mapNumber);

  // Buscar match para saber team IDs
  const { data: match } = await supabase
    .from("matches")
    .select("team1_id, team2_id")
    .eq("id", matchId)
    .single();

  // Determinar vencedor do round
  const winnerSide = event.winner?.side; // "CT" ou "T"
  const winnerTeamStr = event.winner?.team; // "team1" ou "team2"
  let winnerTeamId: string | null = null;
  let ctTeamId: string | null = null;
  let tTeamId: string | null = null;

  if (match && winnerTeamStr) {
    winnerTeamId = winnerTeamStr === "team1" ? match.team1_id : match.team2_id;
    // Inferir lados pelo vencedor
    if (winnerSide === "CT") {
      ctTeamId = winnerTeamId;
      tTeamId = winnerTeamStr === "team1" ? match.team2_id : match.team1_id;
    } else {
      tTeamId = winnerTeamId;
      ctTeamId = winnerTeamStr === "team1" ? match.team2_id : match.team1_id;
    }
  }

  // Win reason mapping (MatchZy reason codes)
  const reasonMap: Record<number, string> = {
    1: "target_bombed",
    7: "bomb_defused",
    8: "terrorists_killed",
    9: "cts_killed",
    10: "round_time_expired",
    12: "target_saved",
    17: "terrorists_surrender",
    18: "cts_surrender",
  };

  // Persistir match_round
  const roundData = {
    match_id: matchId,
    match_map_id: matchMapId,
    round_number: roundNumber,
    winner_team_id: winnerTeamId,
    win_reason: event.reason ? (reasonMap[event.reason] || `reason_${event.reason}`) : null,
    ct_team_id: ctTeamId,
    t_team_id: tTeamId,
    ct_score: team1?.score_ct ?? team1?.score ?? 0,
    t_score: team1?.score_t ?? team2?.score ?? 0,
    duration_seconds: event.round_time ? Math.round(event.round_time) : null,
  };

  const { error: roundError } = await supabase
    .from("match_rounds")
    .insert(roundData);

  if (roundError) {
    // Se round já existe (duplicata), ignorar
    if (roundError.code !== "23505") {
      log.error("Error inserting match_round:", roundError);
    }
  }

  // Persistir player stats (acumuladas até este round)
  await persistPlayerStats(matchId, matchMapId, team1, team2);
}

// Player morreu
async function handlePlayerDeath(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  const mapNumber = event.map_number || 0;
  const matchMapId = await getOrCreateMatchMap(matchId, mapNumber);

  // Resolver attacker e victim
  let attackerProfileId: string | null = null;
  let victimProfileId: string | null = null;

  if (event.attacker?.steamid) {
    const resolved = await resolveSteamId(event.attacker.steamid, matchId);
    if (resolved) attackerProfileId = resolved.profileId;
  }
  if (event.player?.steamid) {
    const resolved = await resolveSteamId(event.player.steamid, matchId);
    if (resolved) victimProfileId = resolved.profileId;
  }

  const { error } = await supabase
    .from("match_events")
    .insert({
      match_id: matchId,
      match_map_id: matchMapId,
      event_type: "player_death",
      round_number: event.round_number || 0,
      attacker_profile_id: attackerProfileId,
      victim_profile_id: victimProfileId,
      weapon: event.weapon?.name || null,
      is_headshot: event.headshot || false,
      event_data: {
        attacker_side: event.attacker?.side,
        victim_side: event.player?.side,
        penetrated: event.penetrated,
        thrusmoke: event.thrusmoke,
        attackerblind: event.attackerblind,
        noscope: event.noscope,
        assister: event.assister ? {
          steamid: event.assister.steamid,
          name: event.assister.name,
          friendly_fire: event.assister.friendly_fire,
        } : null,
      },
    });

  if (error) {
    log.error("Error inserting player_death event:", error);
  }
}

// Bomb plantada/defusada
async function handleBombEvent(event: MatchZyEvent, eventType: string) {
  const matchId = event.matchid;
  if (!matchId) return;

  const mapNumber = event.map_number || 0;
  const matchMapId = await getOrCreateMatchMap(matchId, mapNumber);

  let playerProfileId: string | null = null;
  if (event.player?.steamid) {
    const resolved = await resolveSteamId(event.player.steamid, matchId);
    if (resolved) playerProfileId = resolved.profileId;
  }

  await supabase
    .from("match_events")
    .insert({
      match_id: matchId,
      match_map_id: matchMapId,
      event_type: eventType,
      round_number: event.round_number || 0,
      attacker_profile_id: eventType === "bomb_planted" ? playerProfileId : null,
      victim_profile_id: null,
      weapon: null,
      is_headshot: false,
      event_data: {
        site: event.site,
        player_steamid: event.player?.steamid,
        player_name: event.player?.name,
        defuser_profile_id: eventType === "bomb_defused" ? playerProfileId : null,
      },
    });
}

// Mapa terminou
async function handleMapResult(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  const mapNumber = event.map_number || 0;
  const team1 = event.team1 as MatchZyStatsTeam | undefined;
  const team2 = event.team2 as MatchZyStatsTeam | undefined;
  const team1Score = team1?.score || 0;
  const team2Score = team2?.score || 0;

  // Buscar partida atual para saber best_of e maps_won
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("best_of, maps_won_team1, maps_won_team2, current_map_index, team1_id, team2_id")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) {
    log.error("Error fetching match for map_result:", fetchError);
    await supabase
      .from("matches")
      .update({ team1_score: team1Score, team2_score: team2Score })
      .eq("id", matchId);
    return;
  }

  const mapWinner = team1Score > team2Score ? "team1" : "team2";
  const winnerTeamId = mapWinner === "team1" ? match.team1_id : match.team2_id;
  const newMapsWonTeam1 = (match.maps_won_team1 || 0) + (mapWinner === "team1" ? 1 : 0);
  const newMapsWonTeam2 = (match.maps_won_team2 || 0) + (mapWinner === "team2" ? 1 : 0);
  const newMapIndex = (match.current_map_index || 0) + 1;

  // Atualizar scores e maps_won
  await supabase
    .from("matches")
    .update({
      team1_score: team1Score,
      team2_score: team2Score,
      maps_won_team1: newMapsWonTeam1,
      maps_won_team2: newMapsWonTeam2,
      current_map_index: newMapIndex,
    })
    .eq("id", matchId);

  // Atualizar match_map com resultado final
  const matchMapId = await getOrCreateMatchMap(matchId, mapNumber);
  if (matchMapId) {
    await supabase
      .from("match_maps")
      .update({
        team1_score: team1Score,
        team2_score: team2Score,
        winner_id: winnerTeamId,
        status: "finished",
      })
      .eq("id", matchMapId);
  }

  // Persistir stats finais dos jogadores para este mapa
  await persistPlayerStats(matchId, matchMapId, team1, team2);

  log.info(
    `Map ${newMapIndex} result: ${team1Score}-${team2Score} (winner: ${mapWinner}). ` +
    `Series: ${newMapsWonTeam1}-${newMapsWonTeam2} (Bo${match.best_of || 1})`
  );

  // Se Bo1, a partida terminou
  if ((match.best_of || 1) <= 1) {
    log.info("Bo1 map finished, triggering series end");
    await handleSeriesEnd(event);
    return;
  }

  // Se Bo3/Bo5, verificar se alguém ganhou maioria
  const mapsNeeded = Math.ceil((match.best_of || 1) / 2);
  if (newMapsWonTeam1 >= mapsNeeded || newMapsWonTeam2 >= mapsNeeded) {
    log.info(`Series decided: ${newMapsWonTeam1}-${newMapsWonTeam2}, triggering series end`);
    await handleSeriesEnd(event);
    return;
  }

  log.info(`Series continues, next map ${newMapIndex + 1} of Bo${match.best_of}`);
}

// Série terminou
async function handleSeriesEnd(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) {
    log.error("Error fetching match for series_end:", fetchError);
    return;
  }

  // Evitar finalizar duas vezes
  if (match.status === "finished") {
    log.info("Match already finished, skipping:", matchId);
    return;
  }

  const winnerId = match.team1_score > match.team2_score ? match.team1_id : match.team2_id;
  const loserId = match.team1_score > match.team2_score ? match.team2_id : match.team1_id;

  await supabase
    .from("matches")
    .update({
      status: "finished",
      match_phase: "finished",
      is_live: false,
      finished_at: new Date().toISOString(),
      winner_id: winnerId,
    })
    .eq("id", matchId);

  log.info(
    `Match FINISHED: ${matchId} | Score: ${match.team1_score}-${match.team2_score} | Winner: ${winnerId}`
  );

  // Atualizar stats agregadas nos profiles
  await updateProfileAggregateStats(matchId);

  // Avançar times no bracket
  if (match.tournament_id && match.round) {
    await advanceTeamsInBracket(match.tournament_id, match.round, winnerId!, loserId!);
  }
}

// Time escolheu lado
async function handleSidePicked(event: MatchZyEvent) {
  log.info("Side picked:", event);
}

// Demo upload finalizado
async function handleDemoUpload(event: MatchZyEvent) {
  const matchId = event.matchid;
  if (!matchId) return;

  const filename = event.filename as string | undefined;
  const success = event.success !== false;

  log.info(
    `Demo upload ${success ? "succeeded" : "failed"}: ${filename} (match: ${matchId})`
  );

  if (!success || !filename) return;

  // Salvar filename da demo no match_maps
  const mapNumber = event.map_number || 0;
  const matchMapId = await getOrCreateMatchMap(matchId, mapNumber);

  if (matchMapId) {
    const { error } = await supabase
      .from("match_maps")
      .update({ demo_url: filename })
      .eq("id", matchMapId);

    if (error) {
      log.error(`Failed to save demo_url for match_map ${matchMapId}:`, error);
    } else {
      log.info(`Demo saved: ${filename} → match_map ${matchMapId}`);
    }
  }
}

// ============================================================
// Bracket & Scheduling
// ============================================================

async function propagateDelay(tournamentId: string, currentMatchId: string, delayMinutes: number) {
  const { data: futureMatches, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .neq("id", currentMatchId)
    .in("status", ["scheduled", "pending"])
    .order("scheduled_at", { ascending: true });

  if (error || !futureMatches) {
    log.error("Error fetching future matches:", error);
    return;
  }

  const adjustedDelay = Math.max(delayMinutes, 10);

  for (const match of futureMatches) {
    if (match.scheduled_at) {
      const currentTime = new Date(match.scheduled_at);
      const newTime = new Date(currentTime.getTime() + adjustedDelay * 60000);

      await supabase
        .from("matches")
        .update({ scheduled_at: newTime.toISOString() })
        .eq("id", match.id);

      log.info(`Adjusted match ${match.id} time by ${adjustedDelay} minutes`);
    }
  }
}

async function advanceTeamsInBracket(
  tournamentId: string,
  currentRound: string,
  winnerId: string,
  loserId: string
) {
  const bracketAdvancement: Record<string, { winnerGoesTo: string; loserGoesTo?: string; winnerPosition: "team1" | "team2"; loserPosition?: "team1" | "team2" }> = {
    winner_quarter_1: { winnerGoesTo: "winner_semi_1", loserGoesTo: "loser_round1_1", winnerPosition: "team1", loserPosition: "team1" },
    winner_quarter_2: { winnerGoesTo: "winner_semi_1", loserGoesTo: "loser_round1_1", winnerPosition: "team2", loserPosition: "team2" },
    winner_quarter_3: { winnerGoesTo: "winner_semi_2", loserGoesTo: "loser_round1_2", winnerPosition: "team1", loserPosition: "team1" },
    winner_quarter_4: { winnerGoesTo: "winner_semi_2", loserGoesTo: "loser_round1_2", winnerPosition: "team2", loserPosition: "team2" },
    winner_semi_1: { winnerGoesTo: "winner_final", loserGoesTo: "loser_round2_1", winnerPosition: "team1", loserPosition: "team1" },
    winner_semi_2: { winnerGoesTo: "winner_final", loserGoesTo: "loser_round2_2", winnerPosition: "team2", loserPosition: "team1" },
    winner_final: { winnerGoesTo: "grand_final", loserGoesTo: "loser_final", winnerPosition: "team1", loserPosition: "team1" },
    loser_round1_1: { winnerGoesTo: "loser_round2_1", winnerPosition: "team2" },
    loser_round1_2: { winnerGoesTo: "loser_round2_2", winnerPosition: "team2" },
    loser_round2_1: { winnerGoesTo: "loser_semi", winnerPosition: "team1" },
    loser_round2_2: { winnerGoesTo: "loser_semi", winnerPosition: "team2" },
    loser_semi: { winnerGoesTo: "loser_final", winnerPosition: "team2" },
    loser_final: { winnerGoesTo: "grand_final", winnerPosition: "team2" },
  };

  const advancement = bracketAdvancement[currentRound];
  if (!advancement) {
    log.info("No advancement mapping for round:", currentRound);
    return;
  }

  if (advancement.winnerGoesTo) {
    const winnerField = advancement.winnerPosition === "team1" ? "team1_id" : "team2_id";
    const { error: winnerError } = await supabase
      .from("matches")
      .update({ [winnerField]: winnerId })
      .eq("tournament_id", tournamentId)
      .eq("round", advancement.winnerGoesTo);

    if (winnerError) {
      log.error("Error advancing winner:", winnerError);
    } else {
      log.info(`Advanced winner ${winnerId} to ${advancement.winnerGoesTo} as ${advancement.winnerPosition}`);
    }

    await checkAndActivateMatch(tournamentId, advancement.winnerGoesTo);
  }

  if (advancement.loserGoesTo && advancement.loserPosition) {
    const loserField = advancement.loserPosition === "team1" ? "team1_id" : "team2_id";
    const { error: loserError } = await supabase
      .from("matches")
      .update({ [loserField]: loserId })
      .eq("tournament_id", tournamentId)
      .eq("round", advancement.loserGoesTo);

    if (loserError) {
      log.error("Error sending loser to bracket:", loserError);
    } else {
      log.info(`Sent loser ${loserId} to ${advancement.loserGoesTo} as ${advancement.loserPosition}`);
    }

    await checkAndActivateMatch(tournamentId, advancement.loserGoesTo);
  }
}

async function checkAndActivateMatch(tournamentId: string, round: string) {
  const { data: match, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("round", round)
    .single();

  if (error || !match) return;

  if (match.status === "pending" && match.team1_id && match.team2_id && match.team1_id !== match.team2_id) {
    await supabase
      .from("matches")
      .update({ status: "scheduled" })
      .eq("id", match.id);

    log.info(`Activated match ${match.id} (${round}) - both teams ready`);
  }
}

// GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "MatchZy webhook endpoint is running",
    events_handled: [
      "going_live", "round_end", "map_result", "series_end",
      "side_picked", "player_death", "bomb_planted", "bomb_defused",
      "demo_upload_ended",
    ],
    timestamp: new Date().toISOString(),
  });
}
