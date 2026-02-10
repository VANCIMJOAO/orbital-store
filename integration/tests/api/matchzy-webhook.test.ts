import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestTournament, createTestTeam, createTestMatch, createTestUser, createTestProfile, createTestTeamPlayer } from '../../helpers/seed';
import { cleanupTournament, cleanupTeam, cleanupUser } from '../../helpers/cleanup';

describe('Integration: MatchZy Webhook Data', () => {
  const admin = getAdminClient();
  let tournamentId: string;
  let team1Id: string;
  let team2Id: string;
  let matchId: string;
  let userId1: string;
  let userId2: string;

  beforeAll(async () => {
    const team1 = await createTestTeam('Webhook Alpha', 'WA');
    const team2 = await createTestTeam('Webhook Bravo', 'WB');
    team1Id = team1.id;
    team2Id = team2.id;
    const tournament = await createTestTournament({ name: 'Webhook Test Tournament' });
    tournamentId = tournament.id;
    const match = await createTestMatch(tournamentId, team1Id, team2Id, { status: 'live' });
    matchId = match.id;

    // Create players
    const user1 = await createTestUser(`wh_p1_${Date.now()}@test.com`, 'TestPass123!');
    userId1 = user1.id;
    await createTestProfile(userId1, { username: `wh_p1_${Date.now()}`, steam_id: `7656119800088${Math.floor(Math.random() * 9000)}` });
    await createTestTeamPlayer(team1Id, userId1);

    const user2 = await createTestUser(`wh_p2_${Date.now()}@test.com`, 'TestPass123!');
    userId2 = user2.id;
    await createTestProfile(userId2, { username: `wh_p2_${Date.now()}`, steam_id: `7656119800077${Math.floor(Math.random() * 9000)}` });
    await createTestTeamPlayer(team2Id, userId2);
  });

  afterAll(async () => {
    await cleanupTournament(tournamentId);
    await cleanupTeam(team1Id);
    await cleanupTeam(team2Id);
    await cleanupUser(userId1);
    await cleanupUser(userId2);
  });

  it('should update match status to live', async () => {
    const { data, error } = await admin
      .from('matches')
      .update({ status: 'live', is_live: true })
      .eq('id', matchId)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.status).toBe('live');
  });

  it('should insert match_round records', async () => {
    const { data, error } = await admin
      .from('match_rounds')
      .insert({
        match_id: matchId,
        round_number: 1,
        ct_score: 1,
        t_score: 0,
        winner_team_id: team1Id,
        win_reason: 'ct_win_elimination',
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.round_number).toBe(1);
    expect(data!.winner_team_id).toBe(team1Id);
  });

  it('should insert match_player_stats', async () => {
    const { data, error } = await admin
      .from('match_player_stats')
      .insert({
        match_id: matchId,
        profile_id: userId1,
        team_id: team1Id,
        kills: 25,
        deaths: 18,
        assists: 3,
        headshots: 12,
        total_damage: 2500,
        adr: 100.0,
        kast_percentage: 72.0,
        rating: 1.25,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.kills).toBe(25);
    expect(data!.rating).toBe(1.25);
  });

  it('should insert match_event for player_death', async () => {
    const { data, error } = await admin
      .from('match_events')
      .insert({
        match_id: matchId,
        event_type: 'player_death',
        round_number: 1,
        attacker_profile_id: userId1,
        victim_profile_id: userId2,
        weapon: 'ak47',
        is_headshot: true,
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.event_type).toBe('player_death');
    expect(data!.is_headshot).toBe(true);
  });

  it('should insert match_event for bomb_planted', async () => {
    const { data, error } = await admin
      .from('match_events')
      .insert({
        match_id: matchId,
        event_type: 'bomb_planted',
        round_number: 1,
        attacker_profile_id: userId2,
        event_data: { site: 'A' },
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.event_type).toBe('bomb_planted');
  });

  it('should insert match_maps and update winner', async () => {
    const { data: mapData, error: insertError } = await admin
      .from('match_maps')
      .insert({
        match_id: matchId,
        map_name: 'de_mirage',
        map_order: 1,
        team1_score: 16,
        team2_score: 10,
        status: 'finished',
        winner_id: team1Id,
      })
      .select()
      .single();
    expect(insertError).toBeNull();
    expect(mapData!.winner_id).toBe(team1Id);
  });

  it('should finalize match with series_end data', async () => {
    const { data, error } = await admin
      .from('matches')
      .update({
        status: 'finished',
        winner_id: team1Id,
        team1_score: 16,
        team2_score: 10,
        finished_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.status).toBe('finished');
    expect(data!.winner_id).toBe(team1Id);
  });

  it('should save demo_url to match_maps', async () => {
    const { data: maps } = await admin
      .from('match_maps')
      .select('id')
      .eq('match_id', matchId)
      .limit(1);
    if (maps && maps.length > 0) {
      const { data, error } = await admin
        .from('match_maps')
        .update({ demo_url: 'https://example.com/demo.dem' })
        .eq('id', maps[0].id)
        .select()
        .single();
      expect(error).toBeNull();
      expect(data!.demo_url).toBe('https://example.com/demo.dem');
    }
  });
});
