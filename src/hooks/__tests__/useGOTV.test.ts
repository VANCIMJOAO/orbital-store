import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGOTV, useGOTVMatches, useGOTVMatchState } from '@/hooks/useGOTV';

// ============================================================
// MockWebSocket that captures instances
// ============================================================
const wsInstances: MockWS[] = [];

class MockWS {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;

  url: string;
  readyState = 0;
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  close = vi.fn(() => {
    this.readyState = 3;
    if (this.onclose) this.onclose(new CloseEvent('close'));
  });
  send = vi.fn();

  constructor(url: string) {
    this.url = url;
    wsInstances.push(this);
  }

  /** Manually open the connection (simulate async) */
  _open() {
    this.readyState = 1;
    if (this.onopen) this.onopen(new Event('open'));
  }

  /** Simulate receiving a message */
  _message(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  /** Simulate close */
  _close() {
    this.readyState = 3;
    if (this.onclose) this.onclose(new CloseEvent('close'));
  }
}

// Save original
const OriginalWebSocket = globalThis.WebSocket;

beforeEach(() => {
  wsInstances.length = 0;
  globalThis.WebSocket = MockWS as unknown as typeof WebSocket;
});

afterEach(() => {
  globalThis.WebSocket = OriginalWebSocket;
  vi.restoreAllMocks();
});

function getLastWs(): MockWS {
  return wsInstances[wsInstances.length - 1];
}

// ============================================================
// useGOTV
// ============================================================
describe('useGOTV', () => {
  describe('connection', () => {
    it('should build correct WebSocket URL with matchId', () => {
      renderHook(() => useGOTV({
        matchId: 'match-123',
        serverUrl: 'ws://localhost:8080',
        autoReconnect: false,
      }));

      expect(getLastWs().url).toBe('ws://localhost:8080/ws?match=match-123');
    });

    it('should prepend ws:// if serverUrl does not start with ws', () => {
      renderHook(() => useGOTV({
        matchId: 'match-123',
        serverUrl: 'localhost:8080',
        autoReconnect: false,
      }));

      expect(getLastWs().url).toBe('ws://localhost:8080/ws?match=match-123');
    });

    it('should set isConnected to true on open', () => {
      const { result } = renderHook(() => useGOTV({
        matchId: 'match-123',
        serverUrl: 'ws://localhost:8080',
        autoReconnect: false,
      }));

      expect(result.current.isConnected).toBe(false);

      act(() => {
        getLastWs()._open();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('message handling', () => {
    function renderAndConnect() {
      const hook = renderHook(() => useGOTV({
        matchId: 'match-123',
        serverUrl: 'ws://localhost:8080',
        autoReconnect: false,
      }));

      act(() => {
        getLastWs()._open();
      });

      return hook;
    }

    it('should update matchState on match_state message', () => {
      const { result } = renderAndConnect();

      const matchData = {
        mapName: 'de_mirage',
        players: [{ steamId: '123', name: 'Player1', team: 'CT', health: 100 }],
        scoreCT: 5,
        scoreT: 3,
      };

      act(() => {
        getLastWs()._message({ type: 'match_state', data: matchData });
      });

      expect(result.current.matchState).toBeDefined();
      expect(result.current.matchState!.mapName).toBe('de_mirage');
      expect(result.current.players).toHaveLength(1);
    });

    it('should process kill events into killFeed', () => {
      const { result } = renderAndConnect();

      const killEvent = {
        type: 'kill',
        tick: 1000,
        round: 1,
        data: {
          attacker: { name: 'Player1', team: 'CT', steamId: '111' },
          victim: { name: 'Player2', team: 'T', steamId: '222' },
          weapon: 'ak47',
          headshot: true,
        },
      };

      act(() => {
        getLastWs()._message({ type: 'event', data: killEvent });
      });

      expect(result.current.killFeed).toHaveLength(1);
      expect(result.current.killFeed[0].weapon).toBe('ak47');
      expect(result.current.killFeed[0].headshot).toBe(true);
    });

    it('should deduplicate kill events by id (same tick + victim)', () => {
      const { result } = renderAndConnect();

      const killEvent = {
        type: 'kill',
        tick: 1000,
        round: 1,
        data: {
          victim: { name: 'P2', team: 'T', steamId: '222' },
          weapon: 'ak47',
        },
      };

      act(() => {
        getLastWs()._message({ type: 'event', data: killEvent });
      });
      act(() => {
        getLastWs()._message({ type: 'event', data: killEvent });
      });

      expect(result.current.killFeed).toHaveLength(1);
    });

    it('should limit killFeed to 50 entries', () => {
      const { result } = renderAndConnect();

      act(() => {
        for (let i = 0; i < 60; i++) {
          getLastWs()._message({
            type: 'event',
            data: {
              type: 'kill',
              tick: i * 100,
              round: 1,
              data: {
                victim: { name: `P${i}`, team: 'T', steamId: `${i}` },
                weapon: 'ak47',
              },
            },
          });
        }
      });

      expect(result.current.killFeed.length).toBeLessThanOrEqual(50);
    });

    it('should process round_end into roundHistory', () => {
      const { result } = renderAndConnect();

      const roundEndEvent = {
        type: 'round_end',
        data: { round: 1, winner: 'CT', reason: 'bomb_defused', scoreCT: 1, scoreT: 0 },
      };

      act(() => {
        getLastWs()._message({ type: 'event', data: roundEndEvent });
      });

      expect(result.current.roundHistory).toHaveLength(1);
      expect(result.current.roundHistory[0].winner).toBe('CT');
    });

    it('should deduplicate roundHistory by round number', () => {
      const { result } = renderAndConnect();

      const event = {
        type: 'round_end',
        data: { round: 1, winner: 'CT', reason: 'elimination', scoreCT: 1, scoreT: 0 },
      };

      act(() => {
        getLastWs()._message({ type: 'event', data: event });
      });
      act(() => {
        getLastWs()._message({ type: 'event', data: event });
      });

      expect(result.current.roundHistory).toHaveLength(1);
    });

    it('should filter gameLog to only relevant event types', () => {
      const { result } = renderAndConnect();

      // Relevant: kill
      act(() => {
        getLastWs()._message({
          type: 'event',
          data: { type: 'kill', tick: 100, round: 1, data: { victim: { name: 'P', steamId: '1' } } },
        });
      });

      // Irrelevant: player_hurt
      act(() => {
        getLastWs()._message({
          type: 'event',
          data: { type: 'player_hurt', tick: 101, round: 1, data: {} },
        });
      });

      expect(result.current.gameLog).toHaveLength(1);
      expect(result.current.gameLog[0].type).toBe('kill');
    });

    it('should update matchZyState and sync with matchState on matchzy_state message', () => {
      const { result } = renderAndConnect();

      // First set matchState
      act(() => {
        getLastWs()._message({
          type: 'match_state',
          data: { mapName: 'de_mirage', players: [] },
        });
      });

      const mzState = {
        phase: 'live',
        isCapturing: true,
        team1: { name: 'Team A', score: 5 },
        team2: { name: 'Team B', score: 3 },
        currentRound: 9,
        currentHalf: 1,
        mapName: 'de_mirage',
      };

      act(() => {
        getLastWs()._message({ type: 'matchzy_state', data: mzState });
      });

      expect(result.current.phase).toBe('live');
      expect(result.current.isCapturing).toBe(true);
      expect(result.current.team1).toBeDefined();
      expect(result.current.team1!.name).toBe('Team A');
    });
  });

  describe('disconnection', () => {
    it('should clean up WebSocket on disconnect()', () => {
      const { result } = renderHook(() => useGOTV({
        matchId: 'match-123',
        serverUrl: 'ws://localhost:8080',
        autoReconnect: false,
      }));

      act(() => {
        getLastWs()._open();
      });

      expect(result.current.isConnected).toBe(true);

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
    });

    it('should set match status to ended on disconnected message', () => {
      const { result } = renderHook(() => useGOTV({
        matchId: 'match-123',
        serverUrl: 'ws://localhost:8080',
        autoReconnect: false,
      }));

      act(() => {
        getLastWs()._open();
      });

      // Set initial matchState
      act(() => {
        getLastWs()._message({
          type: 'match_state',
          data: { mapName: 'de_mirage', players: [], status: 'live' },
        });
      });

      act(() => {
        getLastWs()._message({ type: 'disconnected', data: {} });
      });

      expect(result.current.matchState!.status).toBe('ended');
    });
  });
});

// ============================================================
// useGOTVMatches
// ============================================================
describe('useGOTVMatches', () => {
  it('should convert ws:// to http:// for fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    renderHook(() => useGOTVMatches('ws://localhost:8080'));

    // Wait for effect to run
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/matches',
      expect.any(Object)
    );

    vi.unstubAllGlobals();
    // Re-assign WebSocket after unstub
    globalThis.WebSocket = MockWS as unknown as typeof WebSocket;
  });

  it('should set serverOffline on network TypeError', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() => useGOTVMatches('ws://localhost:8080'));

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.serverOffline).toBe(true);
    expect(result.current.matches).toHaveLength(0);

    vi.unstubAllGlobals();
    globalThis.WebSocket = MockWS as unknown as typeof WebSocket;
  });
});

// ============================================================
// useGOTVMatchState
// ============================================================
describe('useGOTVMatchState', () => {
  it('should fetch match state from REST API', async () => {
    const mockState = { mapName: 'de_mirage', scoreCT: 5, scoreT: 3 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockState),
    }));

    const { result } = renderHook(() => useGOTVMatchState('match-123', 'ws://localhost:8080'));

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.matchState).toEqual(mockState);
    expect(result.current.error).toBeNull();

    vi.unstubAllGlobals();
    globalThis.WebSocket = MockWS as unknown as typeof WebSocket;
  });

  it('should set error on 404 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    const { result } = renderHook(() => useGOTVMatchState('nonexistent', 'ws://localhost:8080'));

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.matchState).toBeNull();
    expect(result.current.error).toBe('Partida nao encontrada');

    vi.unstubAllGlobals();
    globalThis.WebSocket = MockWS as unknown as typeof WebSocket;
  });
});
