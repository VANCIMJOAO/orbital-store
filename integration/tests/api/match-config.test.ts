import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestTournament, createTestTeam, createTestMatch, createTestProfile, createTestUser, createTestTeamPlayer } from '../../helpers/seed';
import { cleanupTournament, cleanupTeam, cleanupUser } from '../../helpers/cleanup';

describe('Integration: Match Config', () => {
  const admin = getAdminClient();
  let tournamentId: string;
  let team1Id: string;
  let team2Id: string;
  let matchId: string;
  let userId: string;

  beforeAll(async () => {
    const team1 = await createTestTeam('Config Alpha', 'CA');
    const team2 = await createTestTeam('Config Bravo', 'CB');
    team1Id = team1.id;
    team2Id = team2.id;
    const tournament = await createTestTournament({ name: 'Config Test Tournament' });
    tournamentId = tournament.id;

    // Create a user and add as team player
    const user = await createTestUser(`config_test_${Date.now()}@test.com`, 'TestPass123!');
    userId = user.id;
    await createTestProfile(userId, { username: `config_${Date.now()}`, steam_id: `7656119800099${Math.floor(Math.random() * 9000)}` });
    await createTestTeamPlayer(team1Id, userId);

    const match = await createTestMatch(tournamentId, team1Id, team2Id);
    matchId = match.id;
  });

  afterAll(async () => {
    await cleanupTournament(tournamentId);
    await cleanupTeam(team1Id);
    await cleanupTeam(team2Id);
    await cleanupUser(userId);
  });

  it('should read match with teams and players', async () => {
    const { data, error } = await admin
      .from('matches')
      .select('*, team1:teams!team1_id(*, team_players(*, profile:profiles!profile_id(username, steam_id)))')
      .eq('id', matchId)
      .single();
    expect(error).toBeNull();
    expect(data!.team1).not.toBeNull();
  });

  it('should return null for non-existent match', async () => {
    const { data } = await admin
      .from('matches')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .maybeSingle();
    expect(data).toBeNull();
  });

  it('should save matchzy_config to match', async () => {
    const config = { maplist: 'de_mirage', num_maps: 1 };
    const { data, error } = await admin
      .from('matches')
      .update({ matchzy_config: config })
      .eq('id', matchId)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.matchzy_config).toEqual(config);
  });

  it('should save veto_data as JSON', async () => {
    const vetoData = [
      { step: 1, team: 'Config Alpha', action: 'ban', map: 'de_ancient' },
    ];
    const { data, error } = await admin
      .from('matches')
      .update({ veto_data: vetoData })
      .eq('id', matchId)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.veto_data).toHaveLength(1);
  });
});
