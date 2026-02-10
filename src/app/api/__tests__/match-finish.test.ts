import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ============================================================
// vi.hoisted() runs before vi.mock() hoisting, solving TDZ issues
// ============================================================
const { mockSupabaseChain, mockAdvance, mockRequireAdmin } = vi.hoisted(() => {
  const chain = {
    from: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };
  return {
    mockSupabaseChain: chain,
    mockAdvance: vi.fn(),
    mockRequireAdmin: vi.fn(),
  };
});

function resetChain() {
  mockSupabaseChain.from.mockReturnValue(mockSupabaseChain);
  mockSupabaseChain.select.mockReturnValue(mockSupabaseChain);
  mockSupabaseChain.update.mockReturnValue(mockSupabaseChain);
  mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain);
  mockSupabaseChain.single.mockResolvedValue({ data: null, error: null });
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseChain),
}));

vi.mock('@/lib/bracket', () => ({
  advanceTeamsInBracket: (...args: unknown[]) => mockAdvance(...args),
}));

vi.mock('@/lib/admin-auth', () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));

// Import AFTER mocks
import { POST } from '@/app/api/matches/[id]/finish/route';

function createRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/matches/test-id/finish', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const mockParams = Promise.resolve({ id: 'match-001' });

describe('POST /api/matches/[id]/finish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockAdvance.mockResolvedValue(undefined);
    mockRequireAdmin.mockResolvedValue({
      user: { id: 'admin-user' },
      profile: { is_admin: true },
    });
  });

  it('should return 401 when not admin', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAdmin.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const response = await POST(createRequest({ team1_score: 16, team2_score: 10 }), { params: mockParams });
    expect(response.status).toBe(401);
  });

  it('should return 400 when scores are missing', async () => {
    const response = await POST(createRequest({}), { params: mockParams });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('should return 400 when match is a tie', async () => {
    const response = await POST(
      createRequest({ team1_score: 10, team2_score: 10 }),
      { params: mockParams }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('tie');
  });

  it('should return 404 when match not found', async () => {
    mockSupabaseChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const response = await POST(
      createRequest({ team1_score: 16, team2_score: 10 }),
      { params: mockParams }
    );

    expect(response.status).toBe(404);
  });

  it('should return 400 when match is already finished', async () => {
    mockSupabaseChain.single.mockResolvedValueOnce({
      data: { id: 'match-001', status: 'finished', team1_id: 't1', team2_id: 't2' },
      error: null,
    });

    const response = await POST(
      createRequest({ team1_score: 16, team2_score: 10 }),
      { params: mockParams }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('already finished');
  });

  it('should finish match and determine correct winner (team1 wins)', async () => {
    mockSupabaseChain.single
      .mockResolvedValueOnce({
        data: {
          id: 'match-001', status: 'live',
          team1_id: 'team-alpha', team2_id: 'team-beta',
          tournament_id: 'tourn-1', round: 'winner_quarter_1',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'match-001', status: 'finished', winner_id: 'team-alpha' },
        error: null,
      });

    const response = await POST(
      createRequest({ team1_score: 16, team2_score: 10 }),
      { params: mockParams }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.winner_id).toBe('team-alpha');
  });

  it('should finish match and determine correct winner (team2 wins)', async () => {
    mockSupabaseChain.single
      .mockResolvedValueOnce({
        data: {
          id: 'match-001', status: 'live',
          team1_id: 'team-alpha', team2_id: 'team-beta',
          tournament_id: 'tourn-1', round: 'winner_quarter_1',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'match-001', status: 'finished', winner_id: 'team-beta' },
        error: null,
      });

    const response = await POST(
      createRequest({ team1_score: 10, team2_score: 16 }),
      { params: mockParams }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.winner_id).toBe('team-beta');
  });

  it('should call advanceTeamsInBracket with correct arguments', async () => {
    mockSupabaseChain.single
      .mockResolvedValueOnce({
        data: {
          id: 'match-001', status: 'live',
          team1_id: 'team-alpha', team2_id: 'team-beta',
          tournament_id: 'tourn-1', round: 'winner_semi_1',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'match-001', status: 'finished' },
        error: null,
      });

    await POST(
      createRequest({ team1_score: 16, team2_score: 5 }),
      { params: mockParams }
    );

    expect(mockAdvance).toHaveBeenCalledWith(
      expect.anything(),
      'tourn-1',
      'winner_semi_1',
      'team-alpha',
      'team-beta'
    );
  });
});
