import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient, getAnonClient } from '../../helpers/supabase-client';
import { createTestTournament, createTestTeam, createTestMatch } from '../../helpers/seed';
import { cleanupTournament, cleanupTeam } from '../../helpers/cleanup';

describe('Integration: Matches RLS', () => {
  const admin = getAdminClient();
  let tournamentId: string;
  let team1Id: string;
  let team2Id: string;
  let matchId: string;

  beforeAll(async () => {
    const team1 = await createTestTeam('RLS Match Alpha', 'RMA');
    const team2 = await createTestTeam('RLS Match Bravo', 'RMB');
    team1Id = team1.id;
    team2Id = team2.id;
    const tournament = await createTestTournament({ name: 'RLS Match Test' });
    tournamentId = tournament.id;
    const match = await createTestMatch(tournamentId, team1Id, team2Id, { round: 'showmatch' });
    matchId = match.id;
  });

  afterAll(async () => {
    await cleanupTournament(tournamentId);
    await cleanupTeam(team1Id);
    await cleanupTeam(team2Id);
  });

  it('should allow anon to read matches', async () => {
    const anon = getAnonClient();
    const { data, error } = await anon
      .from('matches')
      .select('id, status')
      .eq('id', matchId)
      .single();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('should NOT allow anon to update matches', async () => {
    const anon = getAnonClient();
    const { error } = await anon
      .from('matches')
      .update({ status: 'hacked' })
      .eq('id', matchId);
    // RLS should block - either error or no rows affected
    const { data } = await admin
      .from('matches')
      .select('status')
      .eq('id', matchId)
      .single();
    expect(data!.status).not.toBe('hacked');
  });

  it('should NOT allow anon to delete matches', async () => {
    const anon = getAnonClient();
    const { error } = await anon
      .from('matches')
      .delete()
      .eq('id', matchId);
    // Verify match still exists
    const { data } = await admin
      .from('matches')
      .select('id')
      .eq('id', matchId)
      .single();
    expect(data).not.toBeNull();
  });
});
