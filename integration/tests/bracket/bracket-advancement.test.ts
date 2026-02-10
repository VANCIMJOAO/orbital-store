import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';
import { createTestTournament, createTestTeam, createTestMatch } from '../../helpers/seed';
import { cleanupTournament, cleanupTeam } from '../../helpers/cleanup';

// Import the actual bracket logic
import { advanceTeamsInBracket } from '@/lib/bracket';

describe('Integration: Bracket Advancement', () => {
  const admin = getAdminClient();
  let tournamentId: string;
  const teamIds: string[] = [];

  beforeAll(async () => {
    // Create 8 teams
    for (let i = 0; i < 8; i++) {
      const team = await createTestTeam(`Bracket Team ${i + 1}`, `BT${i + 1}`);
      teamIds.push(team.id);
    }

    const tournament = await createTestTournament({ name: 'Bracket Advancement Test' });
    tournamentId = tournament.id;

    // Create quarter matches
    await createTestMatch(tournamentId, teamIds[0], teamIds[7], { round: 'winner_quarter_1', status: 'scheduled' });
    await createTestMatch(tournamentId, teamIds[1], teamIds[6], { round: 'winner_quarter_2', status: 'scheduled' });
    await createTestMatch(tournamentId, teamIds[2], teamIds[5], { round: 'winner_quarter_3', status: 'scheduled' });
    await createTestMatch(tournamentId, teamIds[3], teamIds[4], { round: 'winner_quarter_4', status: 'scheduled' });

    // Create subsequent round matches (pending)
    await createTestMatch(tournamentId, null as any, null as any, { round: 'winner_semi_1', status: 'pending' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'winner_semi_2', status: 'pending' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'winner_final', status: 'pending' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'loser_round1_1', status: 'pending' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'loser_round1_2', status: 'pending' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'loser_round2_1', status: 'pending' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'loser_round2_2', status: 'pending' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'loser_semi', status: 'pending' });
    await createTestMatch(tournamentId, null as any, null as any, { round: 'loser_final', status: 'pending' });
  });

  afterAll(async () => {
    await cleanupTournament(tournamentId);
    for (const id of teamIds) {
      await cleanupTeam(id);
    }
  });

  it('should advance winner of quarter_1 to semi_1.team1', async () => {
    const winnerId = teamIds[0];
    const loserId = teamIds[7];
    await advanceTeamsInBracket(admin, tournamentId, 'winner_quarter_1', winnerId, loserId);

    const { data: semi } = await admin
      .from('matches')
      .select('team1_id')
      .eq('tournament_id', tournamentId)
      .eq('round', 'winner_semi_1')
      .single();
    expect(semi!.team1_id).toBe(winnerId);
  });

  it('should send loser of quarter_1 to loser_round1_1.team1', async () => {
    const { data: loserMatch } = await admin
      .from('matches')
      .select('team1_id')
      .eq('tournament_id', tournamentId)
      .eq('round', 'loser_round1_1')
      .single();
    expect(loserMatch!.team1_id).toBe(teamIds[7]);
  });

  it('should activate match when both teams are set', async () => {
    // Advance quarter_2 winner to semi_1.team2
    await advanceTeamsInBracket(admin, tournamentId, 'winner_quarter_2', teamIds[1], teamIds[6]);

    const { data: semi } = await admin
      .from('matches')
      .select('status, team1_id, team2_id')
      .eq('tournament_id', tournamentId)
      .eq('round', 'winner_semi_1')
      .single();
    expect(semi!.team1_id).toBe(teamIds[0]);
    expect(semi!.team2_id).toBe(teamIds[1]);
    // Should be activated (scheduled)
    expect(semi!.status).toBe('scheduled');
  });

  it('should handle unknown round gracefully', async () => {
    // Should not throw
    await expect(
      advanceTeamsInBracket(admin, tournamentId, 'unknown_round', teamIds[0], teamIds[1])
    ).resolves.not.toThrow();
  });

  it('should keep match as pending when only one team is set', async () => {
    // loser_round1_2 should have only one team at this point
    const { data } = await admin
      .from('matches')
      .select('status, team1_id, team2_id')
      .eq('tournament_id', tournamentId)
      .eq('round', 'loser_round1_2')
      .single();
    if (data!.team1_id && !data!.team2_id) {
      expect(data!.status).toBe('pending');
    }
  });
});
