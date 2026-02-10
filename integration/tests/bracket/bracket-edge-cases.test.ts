import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestTournament, createTestTeam, createTestMatch } from '../../helpers/seed';
import { cleanupTournament, cleanupTeam } from '../../helpers/cleanup';
import { advanceTeamsInBracket } from '@/lib/bracket';

describe('Integration: Bracket Edge Cases', () => {
  const admin = getAdminClient();
  let tournamentId: string;
  let team1Id: string;
  let team2Id: string;

  beforeAll(async () => {
    const team1 = await createTestTeam('Edge Alpha', 'EA');
    const team2 = await createTestTeam('Edge Bravo', 'EB');
    team1Id = team1.id;
    team2Id = team2.id;
    const tournament = await createTestTournament({ name: 'Edge Case Tournament' });
    tournamentId = tournament.id;
  });

  afterAll(async () => {
    await cleanupTournament(tournamentId);
    await cleanupTeam(team1Id);
    await cleanupTeam(team2Id);
  });

  it('should handle unknown round without errors', async () => {
    await expect(
      advanceTeamsInBracket(admin, tournamentId, 'grand_final', team1Id, team2Id)
    ).resolves.not.toThrow();
  });

  it('should handle double-advancement idempotently', async () => {
    // Create matches
    await createTestMatch(tournamentId, team1Id, team2Id, { round: 'winner_quarter_1', status: 'scheduled' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'winner_semi_1', status: 'pending' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'loser_round1_1', status: 'pending' });

    // Advance twice
    await advanceTeamsInBracket(admin, tournamentId, 'winner_quarter_1', team1Id, team2Id);
    await advanceTeamsInBracket(admin, tournamentId, 'winner_quarter_1', team1Id, team2Id);

    // Should not create duplicate entries
    const { data: semi } = await admin
      .from('matches')
      .select('team1_id')
      .eq('tournament_id', tournamentId)
      .eq('round', 'winner_semi_1')
      .single();
    expect(semi!.team1_id).toBe(team1Id);
  });

  it('should handle match with only one team remaining pending', async () => {
    const newTournament = await createTestTournament({ name: 'Pending Test' });
    await createTestMatch(newTournament.id, null as any, null as any, { round: 'loser_round2_1', status: 'pending' });

    // Set only team1
    await admin
      .from('matches')
      .update({ team1_id: team1Id })
      .eq('tournament_id', newTournament.id)
      .eq('round', 'loser_round2_1');

    const { data } = await admin
      .from('matches')
      .select('status')
      .eq('tournament_id', newTournament.id)
      .eq('round', 'loser_round2_1')
      .single();
    expect(data!.status).toBe('pending');

    await cleanupTournament(newTournament.id);
  });
});
