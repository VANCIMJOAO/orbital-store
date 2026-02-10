import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceTeamsInBracket } from '@/lib/bracket';

// Mock logger to silence output
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// ============================================================
// Supabase mock helper for bracket tests
// ============================================================
function createBracketSupabaseMock(options: {
  matchOnSelect?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
  selectError?: { message: string } | null;
} = {}) {
  const { matchOnSelect = null, updateError = null, selectError = null } = options;

  const updateCalls: Array<{ data: Record<string, unknown>; table: string; filters: Record<string, string> }> = [];

  const mock = {
    from: vi.fn((table: string) => {
      const chain = {
        update: vi.fn((data: Record<string, unknown>) => {
          const updateChain = {
            eq: vi.fn((_field: string, _value: string) => {
              // Track the update call
              const call = { data, table, filters: {} as Record<string, string> };
              // Return another eq for chaining (tournament_id.eq + round.eq)
              return {
                eq: vi.fn((field2: string, value2: string) => {
                  call.filters = { [_field]: _value, [field2]: value2 };
                  updateCalls.push(call);
                  return {
                    select: vi.fn(() => ({
                      single: vi.fn().mockResolvedValue({ data: null, error: updateError }),
                    })),
                    then: (resolve: (val: unknown) => void) => resolve({ data: null, error: updateError }),
                  };
                }),
              };
            }),
          };
          return updateChain;
        }),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: matchOnSelect,
                error: selectError,
              }),
            })),
          })),
        })),
      };
      return chain;
    }),
    _updateCalls: updateCalls,
  };

  return mock;
}

describe('advanceTeamsInBracket', () => {
  const tournamentId = 'tournament-001';
  const winnerId = 'team-winner';
  const loserId = 'team-loser';

  // ============================================================
  // Winner Bracket Quarters
  // ============================================================
  describe('Winner Bracket Quarters', () => {
    it('winner_quarter_1: winner → winner_semi_1 (team1), loser → loser_round1_1 (team1)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'winner_quarter_1', winnerId, loserId);

      const updates = mock._updateCalls;
      // Should have 2 update calls (winner + loser)
      expect(updates.length).toBeGreaterThanOrEqual(2);

      const winnerUpdate = updates.find(u => u.filters.round === 'winner_semi_1');
      expect(winnerUpdate).toBeDefined();
      expect(winnerUpdate!.data).toHaveProperty('team1_id', winnerId);

      const loserUpdate = updates.find(u => u.filters.round === 'loser_round1_1');
      expect(loserUpdate).toBeDefined();
      expect(loserUpdate!.data).toHaveProperty('team1_id', loserId);
    });

    it('winner_quarter_2: winner → winner_semi_1 (team2), loser → loser_round1_1 (team2)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'winner_quarter_2', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'winner_semi_1');
      expect(winnerUpdate!.data).toHaveProperty('team2_id', winnerId);

      const loserUpdate = updates.find(u => u.filters.round === 'loser_round1_1');
      expect(loserUpdate!.data).toHaveProperty('team2_id', loserId);
    });

    it('winner_quarter_3: winner → winner_semi_2 (team1), loser → loser_round1_2 (team1)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'winner_quarter_3', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'winner_semi_2');
      expect(winnerUpdate!.data).toHaveProperty('team1_id', winnerId);

      const loserUpdate = updates.find(u => u.filters.round === 'loser_round1_2');
      expect(loserUpdate!.data).toHaveProperty('team1_id', loserId);
    });

    it('winner_quarter_4: winner → winner_semi_2 (team2), loser → loser_round1_2 (team2)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'winner_quarter_4', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'winner_semi_2');
      expect(winnerUpdate!.data).toHaveProperty('team2_id', winnerId);

      const loserUpdate = updates.find(u => u.filters.round === 'loser_round1_2');
      expect(loserUpdate!.data).toHaveProperty('team2_id', loserId);
    });
  });

  // ============================================================
  // Winner Bracket Semis
  // ============================================================
  describe('Winner Bracket Semis', () => {
    it('winner_semi_1: winner → winner_final (team1), loser → loser_round2_1 (team1)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'winner_semi_1', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'winner_final');
      expect(winnerUpdate!.data).toHaveProperty('team1_id', winnerId);

      const loserUpdate = updates.find(u => u.filters.round === 'loser_round2_1');
      expect(loserUpdate!.data).toHaveProperty('team1_id', loserId);
    });

    it('winner_semi_2: winner → winner_final (team2), loser → loser_round2_2 (team1)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'winner_semi_2', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'winner_final');
      expect(winnerUpdate!.data).toHaveProperty('team2_id', winnerId);

      const loserUpdate = updates.find(u => u.filters.round === 'loser_round2_2');
      expect(loserUpdate!.data).toHaveProperty('team1_id', loserId);
    });
  });

  // ============================================================
  // Winner Final
  // ============================================================
  describe('Winner Final', () => {
    it('winner_final: winner → grand_final (team1), loser → loser_final (team1)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'winner_final', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'grand_final');
      expect(winnerUpdate!.data).toHaveProperty('team1_id', winnerId);

      const loserUpdate = updates.find(u => u.filters.round === 'loser_final');
      expect(loserUpdate!.data).toHaveProperty('team1_id', loserId);
    });
  });

  // ============================================================
  // Loser Bracket
  // ============================================================
  describe('Loser Bracket', () => {
    it('loser_round1_1: winner → loser_round2_1 (team2), no loser destination', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'loser_round1_1', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'loser_round2_1');
      expect(winnerUpdate!.data).toHaveProperty('team2_id', winnerId);

      // No loser destination - loser is eliminated
      const loserUpdate = updates.find(u => u.data['team1_id'] === loserId || u.data['team2_id'] === loserId);
      expect(loserUpdate).toBeUndefined();
    });

    it('loser_round1_2: winner → loser_round2_2 (team2)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'loser_round1_2', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'loser_round2_2');
      expect(winnerUpdate!.data).toHaveProperty('team2_id', winnerId);
    });

    it('loser_round2_1: winner → loser_semi (team1)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'loser_round2_1', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'loser_semi');
      expect(winnerUpdate!.data).toHaveProperty('team1_id', winnerId);
    });

    it('loser_round2_2: winner → loser_semi (team2)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'loser_round2_2', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'loser_semi');
      expect(winnerUpdate!.data).toHaveProperty('team2_id', winnerId);
    });

    it('loser_semi: winner → loser_final (team2)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'loser_semi', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'loser_final');
      expect(winnerUpdate!.data).toHaveProperty('team2_id', winnerId);
    });

    it('loser_final: winner → grand_final (team2)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'loser_final', winnerId, loserId);

      const updates = mock._updateCalls;
      const winnerUpdate = updates.find(u => u.filters.round === 'grand_final');
      expect(winnerUpdate!.data).toHaveProperty('team2_id', winnerId);
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================
  describe('Edge Cases', () => {
    it('should do nothing for unknown round (e.g. grand_final)', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'grand_final', winnerId, loserId);

      expect(mock._updateCalls).toHaveLength(0);
    });

    it('should do nothing for completely invalid round name', async () => {
      const mock = createBracketSupabaseMock();
      await advanceTeamsInBracket(mock as any, tournamentId, 'nonexistent_round', winnerId, loserId);

      expect(mock._updateCalls).toHaveLength(0);
    });
  });
});
