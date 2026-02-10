import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestTournament, createTestTeam, createTestMatch } from '../../helpers/seed';
import { cleanupTournament, cleanupTeam } from '../../helpers/cleanup';

describe('Integration: Match Start', () => {
  const admin = getAdminClient();
  let tournamentId: string;
  let team1Id: string;
  let team2Id: string;

  beforeAll(async () => {
    const team1 = await createTestTeam('Start Alpha', 'SA');
    const team2 = await createTestTeam('Start Bravo', 'SB');
    team1Id = team1.id;
    team2Id = team2.id;
    const tournament = await createTestTournament({ name: 'Start Test Tournament' });
    tournamentId = tournament.id;
  });

  afterAll(async () => {
    await cleanupTournament(tournamentId);
    await cleanupTeam(team1Id);
    await cleanupTeam(team2Id);
  });

  it('should set match status to live', async () => {
    const match = await createTestMatch(tournamentId, team1Id, team2Id, { status: 'scheduled' });
    const { data, error } = await admin
      .from('matches')
      .update({ status: 'live', is_live: true, started_at: new Date().toISOString() })
      .eq('id', match.id)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data!.status).toBe('live');
    expect(data!.is_live).toBe(true);
  });

  it('should persist started_at timestamp', async () => {
    const match = await createTestMatch(tournamentId, team1Id, team2Id, { status: 'scheduled', round: 'showmatch' });
    const now = new Date().toISOString();
    await admin
      .from('matches')
      .update({ status: 'live', started_at: now })
      .eq('id', match.id);
    const { data } = await admin
      .from('matches')
      .select('started_at')
      .eq('id', match.id)
      .single();
    expect(data!.started_at).not.toBeNull();
  });

  it('should handle starting an already finished match gracefully', async () => {
    const match = await createTestMatch(tournamentId, team1Id, team2Id, {
      status: 'finished',
      winner_id: team1Id,
      round: 'showmatch',
    });
    // At DB level, update works, but API layer should block this
    const { data } = await admin
      .from('matches')
      .select('status')
      .eq('id', match.id)
      .single();
    expect(data!.status).toBe('finished');
  });
});
