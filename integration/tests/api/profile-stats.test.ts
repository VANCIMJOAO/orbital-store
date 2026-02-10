import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestUser, createTestProfile, createTestTeam, createTestTournament, createTestMatch, createTestMatchPlayerStats } from '../../helpers/seed';
import { cleanupUser, cleanupTournament, cleanupTeam } from '../../helpers/cleanup';

describe('Integration: Profile Stats', () => {
  const admin = getAdminClient();
  let userId: string;
  let teamId: string;
  let tournamentId: string;
  let matchId: string;

  beforeAll(async () => {
    const user = await createTestUser(`stats_${Date.now()}@test.com`, 'TestPass123!');
    userId = user.id;
    await createTestProfile(userId, {
      username: `stats_${Date.now()}`,
      steam_id: `7656119800055${Math.floor(Math.random() * 9000)}`,
    });

    const team = await createTestTeam('Stats Alpha', 'STA');
    teamId = team.id;
    const tournament = await createTestTournament({ name: 'Stats Tournament' });
    tournamentId = tournament.id;
    const team2 = await createTestTeam('Stats Bravo', 'STB');
    const match = await createTestMatch(tournamentId, teamId, team2.id, {
      status: 'finished',
      winner_id: teamId,
      round: 'showmatch',
    });
    matchId = match.id;

    await createTestMatchPlayerStats(matchId, userId, teamId, {
      kills: 25, deaths: 15, assists: 8, headshots: 12,
      total_damage: 2500, adr: 100.0, kast_percentage: 75.0, rating: 1.30,
    });
  });

  afterAll(async () => {
    await cleanupTournament(tournamentId);
    await cleanupTeam(teamId);
    await cleanupUser(userId);
  });

  it('should read match_player_stats for user', async () => {
    const { data, error } = await admin
      .from('match_player_stats')
      .select('*')
      .eq('profile_id', userId)
      .eq('match_id', matchId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].kills).toBe(25);
    expect(data![0].rating).toBe(1.30);
  });

  it('should aggregate stats across matches', async () => {
    const { data } = await admin
      .from('match_player_stats')
      .select('kills, deaths, rating')
      .eq('profile_id', userId);
    expect(data!.length).toBeGreaterThan(0);
    const totalKills = data!.reduce((sum: number, row: any) => sum + row.kills, 0);
    expect(totalKills).toBeGreaterThanOrEqual(25);
  });

  it('should return empty for non-existent profile', async () => {
    const { data } = await admin
      .from('match_player_stats')
      .select('*')
      .eq('profile_id', '00000000-0000-0000-0000-000000000000');
    expect(data).toHaveLength(0);
  });
});
