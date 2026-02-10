import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ============================================================
// vi.hoisted() to avoid TDZ issues with vi.mock() hoisting
// ============================================================
const { mockSupabaseChain } = vi.hoisted(() => {
  const chain = {
    from: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    insert: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    in: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  return { mockSupabaseChain: chain };
});

function resetChain() {
  Object.values(mockSupabaseChain).forEach(fn => fn.mockReturnValue(mockSupabaseChain));
  mockSupabaseChain.single.mockResolvedValue({ data: null, error: null });
  mockSupabaseChain.maybeSingle.mockResolvedValue({ data: null, error: null });
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseChain),
}));

vi.mock('@/lib/bracket', () => ({
  advanceTeamsInBracket: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Import after mocks
import { GET, POST } from '@/app/api/matchzy/events/route';

function createWebhookRequest(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new NextRequest('http://localhost/api/matchzy/events', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('MatchZy Webhook - /api/matchzy/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  // ============================================================
  // GET - Health check
  // ============================================================
  describe('GET', () => {
    it('should return status ok with list of handled events', async () => {
      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe('ok');
      expect(body.events_handled).toBeDefined();
      expect(Array.isArray(body.events_handled)).toBe(true);
      expect(body.events_handled.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // POST - Authentication
  // ============================================================
  describe('POST - Authentication', () => {
    it('should return 401 when no Authorization header', async () => {
      const request = createWebhookRequest({ event: 'going_live', matchid: '123' });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 401 when token is invalid', async () => {
      const request = createWebhookRequest(
        { event: 'going_live', matchid: '123' },
        'wrong-token'
      );
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should accept request with valid token', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: { id: 'uuid-match-1', status: 'live', team1_id: 't1', team2_id: 't2' },
        error: null,
      });

      const request = createWebhookRequest(
        { event: 'going_live', matchid: 'uuid-match-1' },
        'test-webhook-secret'
      );

      const response = await POST(request);
      expect(response.status).not.toBe(401);
    });
  });

  // ============================================================
  // POST - going_live
  // ============================================================
  describe('POST - going_live event', () => {
    it('should update match to live status', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: {
          id: 'uuid-match-1', status: 'scheduled',
          team1_id: 't1', team2_id: 't2', tournament_id: 'tourn-1',
        },
        error: null,
      });

      const request = createWebhookRequest(
        { event: 'going_live', matchid: 'uuid-match-1', map_number: 0 },
        'test-webhook-secret'
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockSupabaseChain.update).toHaveBeenCalled();
    });
  });

  // ============================================================
  // POST - series_end
  // ============================================================
  describe('POST - series_end event', () => {
    it('should process series_end and return 200', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: {
          id: 'uuid-match-1', status: 'live',
          team1_id: 't1', team2_id: 't2',
          tournament_id: 'tourn-1', round: 'winner_quarter_1',
          team1_score: 0, team2_score: 0,
        },
        error: null,
      });

      const request = createWebhookRequest(
        {
          event: 'series_end',
          matchid: 'uuid-match-1',
          team1_series_score: 2,
          team2_series_score: 1,
          time_until_restore: 0,
          winner: { side: 'team1', team: 'Team Alpha' },
        },
        'test-webhook-secret'
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  // ============================================================
  // POST - Unknown events
  // ============================================================
  describe('POST - Unknown events', () => {
    it('should return 200 for unhandled event types', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { id: 'uuid-match-1', status: 'live', team1_id: 't1', team2_id: 't2' },
        error: null,
      });

      const request = createWebhookRequest(
        { event: 'demo_upload_ended', matchid: 'uuid-match-1', filename: 'test.dem', success: true },
        'test-webhook-secret'
      );

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });
});
