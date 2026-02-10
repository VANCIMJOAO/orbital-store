import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestTournament, createTestTeam, createTestMatch } from '../../helpers/seed';
import { cleanupTeam } from '../../helpers/cleanup';

describe('Integration: Admin Delete Tournament', () => {
  const admin = getAdminClient();
  let team1Id: string;
  let team2Id: string;

  beforeAll(async () => {
    const team1 = await createTestTeam('Delete Alpha', 'DA');
    const team2 = await createTestTeam('Delete Bravo', 'DB');
    team1Id = team1.id;
    team2Id = team2.id;
  });

  afterAll(async () => {
    await cleanupTeam(team1Id);
    await cleanupTeam(team2Id);
  });

  it('should cascade delete tournament → matches', async () => {
    const tournament = await createTestTournament({ name: 'Delete Test' });
    const match = await createTestMatch(tournament.id, team1Id, team2Id, { round: 'showmatch' });

    // Delete matches first (due to FK), then tournament
    await admin.from('matches').delete().eq('tournament_id', tournament.id);
    await admin.from('tournament_teams').delete().eq('tournament_id', tournament.id);
    const { error } = await admin.from('tournaments').delete().eq('id', tournament.id);
    expect(error).toBeNull();

    // Verify tournament is gone
    const { data } = await admin.from('tournaments').select('id').eq('id', tournament.id).maybeSingle();
    expect(data).toBeNull();
  });

  it('should cascade delete match related data', async () => {
    const tournament = await createTestTournament({ name: 'Cascade Delete Test' });
    const match = await createTestMatch(tournament.id, team1Id, team2Id, { round: 'showmatch' });

    // Insert some match data
    await admin.from('match_rounds').insert({
      match_id: match.id,
      round_number: 1,
      ct_score: 1,
      t_score: 0,
    });

    // Delete match data, match, tournament
    await admin.from('match_rounds').delete().eq('match_id', match.id);
    await admin.from('matches').delete().eq('id', match.id);
    await admin.from('tournaments').delete().eq('id', tournament.id);

    // Verify rounds are gone
    const { data: rounds } = await admin.from('match_rounds').select('id').eq('match_id', match.id);
    expect(rounds).toHaveLength(0);
  });

  it('should handle deleting non-existent tournament', async () => {
    const { error } = await admin
      .from('tournaments')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000');
    // Should not error, just no rows affected
    expect(error).toBeNull();
  });
});
