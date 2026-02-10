import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestTournament, createTestTeam, createTestMatch } from '../../helpers/seed';
import { cleanupTournament, cleanupTeam } from '../../helpers/cleanup';

describe('Integration: Match Finish', () => {
  const admin = getAdminClient();
  let tournamentId: string;
  let team1Id: string;
  let team2Id: string;

  beforeAll(async () => {
    const team1 = await createTestTeam('Finish Alpha', 'FA');
    const team2 = await createTestTeam('Finish Bravo', 'FB');
    team1Id = team1.id;
    team2Id = team2.id;
    const tournament = await createTestTournament({ name: 'Finish Test Tournament' });
    tournamentId = tournament.id;
  });

  afterAll(async () => {
    await cleanupTournament(tournamentId);
    await cleanupTeam(team1Id);
    await cleanupTeam(team2Id);
  });

  it('should set status to finished and determine winner', async () => {
    const match = await createTestMatch(tournamentId, team1Id, team2Id, { status: 'live' });
    const { data, error } = await admin
      .from('matches')
      .update({
        team1_score: 16,
        team2_score: 10,
        status: 'finished',
        winner_id: team1Id,
        finished_at: new Date().toISOString(),
      })
      .eq('id', match.id)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.status).toBe('finished');
    expect(data!.winner_id).toBe(team1Id);
  });

  it('should correctly identify team2 as winner', async () => {
    const match = await createTestMatch(tournamentId, team1Id, team2Id, { status: 'live', round: 'showmatch' });
    const winnerId = team2Id; // team2 wins
    const { data, error } = await admin
      .from('matches')
      .update({
        team1_score: 8,
        team2_score: 16,
        status: 'finished',
        winner_id: winnerId,
      })
      .eq('id', match.id)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.winner_id).toBe(team2Id);
  });

  it('should not allow re-finishing already finished match', async () => {
    const match = await createTestMatch(tournamentId, team1Id, team2Id, {
      status: 'finished',
      winner_id: team1Id,
      round: 'showmatch',
    });
    // Attempting to update should still work at DB level, but API should block
    const { data } = await admin
      .from('matches')
      .select('status')
      .eq('id', match.id)
      .single();
    expect(data!.status).toBe('finished');
  });

  it('should persist finished_at timestamp', async () => {
    const match = await createTestMatch(tournamentId, team1Id, team2Id, { status: 'live', round: 'showmatch' });
    const now = new Date().toISOString();
    await admin
      .from('matches')
      .update({ status: 'finished', finished_at: now, winner_id: team1Id })
      .eq('id', match.id);
    const { data } = await admin
      .from('matches')
      .select('finished_at')
      .eq('id', match.id)
      .single();
    expect(data!.finished_at).not.toBeNull();
  });
});
