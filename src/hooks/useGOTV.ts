"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  GOTVMatchState,
  GOTVEvent,
  GOTVPlayerState,
  WebSocketMessage,
  KillFeedEntry,
  RoundHistoryEntry,
  ActiveMatchInfo,
  GameLogEvent,
  MatchZyState,
  MatchPhase
} from '@/lib/gotv/types';

interface UseGOTVOptions {
  matchId: string;
  serverUrl?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface UseGOTVReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  matchState: GOTVMatchState | null;
  matchZyState: MatchZyState | null;
  players: GOTVPlayerState[];
  events: GOTVEvent[];
  killFeed: KillFeedEntry[];
  roundHistory: RoundHistoryEntry[];
  gameLog: GameLogEvent[];
  connect: () => void;
  disconnect: () => void;
  // Helpers para acessar times de forma consistente
  team1: MatchZyState['team1'] | null;
  team2: MatchZyState['team2'] | null;
  phase: MatchPhase;
  isCapturing: boolean;
}

/**
 * Hook para conectar e receber dados em tempo real de uma partida via WebSocket
 * Conecta ao servidor GOTV e mantém o estado da partida atualizado
 */
export function useGOTV(options: UseGOTVOptions): UseGOTVReturn {
  const {
    matchId,
    serverUrl = process.env.NEXT_PUBLIC_GOTV_SERVER_URL || 'ws://localhost:8080',
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchState, setMatchState] = useState<GOTVMatchState | null>(null);
  const [matchZyState, setMatchZyState] = useState<MatchZyState | null>(null);
  const [players, setPlayers] = useState<GOTVPlayerState[]>([]);
  const [events, setEvents] = useState<GOTVEvent[]>([]);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryEntry[]>([]);
  const [gameLog, setGameLog] = useState<GameLogEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  // Processar evento de kill para o feed
  const processKillEvent = useCallback((event: GOTVEvent) => {
    if (event.type !== 'kill') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventAny = event as any;
    const killData = eventAny.data || {};
    // O tick e round estão no nível do evento, não dentro de data
    const tick = eventAny.tick || Date.now();
    const round = eventAny.round || 0;

    const killEntry: KillFeedEntry = {
      id: `kill-${tick}-${killData.victim?.steamId || '0'}`,
      round: round,
      attacker: killData.attacker ? {
        name: killData.attacker.name,
        team: killData.attacker.team,
        steamId: killData.attacker.steamId,
      } : null,
      victim: {
        name: killData.victim?.name || 'Unknown',
        team: killData.victim?.team || 'T',
        steamId: killData.victim?.steamId || '0',
      },
      weapon: killData.weapon || 'unknown',
      headshot: killData.headshot || false,
      wallbang: killData.wallbang || false,
      throughSmoke: killData.throughSmoke || false,
      noScope: killData.noScope || false,
      timestamp: Date.now(),
    };

    // Evitar duplicatas baseado no tick
    setKillFeed(prev => {
      const exists = prev.some(k => k.id === killEntry.id);
      if (exists) return prev;
      return [...prev.slice(-49), killEntry];
    });
  }, []);

  // Processar evento de fim de round para o historico
  const processRoundEndEvent = useCallback((event: GOTVEvent) => {
    if (event.type !== 'round_end') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roundData = event.data as any;
    const roundEntry: RoundHistoryEntry = {
      round: roundData.round || 0,
      winner: roundData.winner || 'CT',
      reason: roundData.reason || 'unknown',
      scoreCT: roundData.scoreCT || 0,
      scoreT: roundData.scoreT || 0,
    };

    // Evitar duplicatas baseado no número do round
    setRoundHistory(prev => {
      const exists = prev.some(r => r.round === roundEntry.round);
      if (exists) return prev;
      return [...prev, roundEntry];
    });
  }, []);

  // Processar qualquer evento para o Game Log unificado
  const processGameLogEvent = useCallback((event: GOTVEvent) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventAny = event as any;
    const eventData = eventAny.data || {};
    const tick = eventAny.tick || 0;
    const round = eventAny.round || 0;
    const eventType = event.type;

    // Só processar eventos relevantes para o game log
    const relevantTypes = ['kill', 'bomb_planted', 'bomb_defused', 'bomb_exploded', 'round_start', 'round_end'];
    if (!relevantTypes.includes(eventType)) return;

    const gameLogEntry: GameLogEvent = {
      id: `${eventType}-${tick}-${round}`,
      type: eventType as GameLogEvent['type'],
      round,
      tick,
      timestamp: Date.now(),
      data: {
        // Kill data
        attacker: eventData.attacker || null,
        victim: eventData.victim,
        weapon: eventData.weapon,
        headshot: eventData.headshot,
        wallbang: eventData.wallbang,
        throughSmoke: eventData.throughSmoke,
        noScope: eventData.noScope,
        // Bomb data
        planter: eventData.planter,
        defuser: eventData.defuser,
        site: eventData.site,
        // Round end data
        winner: eventData.winner,
        reason: eventData.reason,
        scoreCT: eventData.scoreCT,
        scoreT: eventData.scoreT,
      },
    };

    // Evitar duplicatas baseado no id
    setGameLog(prev => {
      const exists = prev.some(e => e.id === gameLogEntry.id);
      if (exists) return prev;
      return [...prev.slice(-99), gameLogEntry];
    });
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Construir URL do WebSocket
      const wsUrl = serverUrl.startsWith('ws')
        ? `${serverUrl}/ws?match=${matchId}`
        : `ws://${serverUrl}/ws?match=${matchId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[GOTV Hook] Connected to match:', matchId);
        setIsConnected(true);
        isConnectedRef.current = true;
        setIsConnecting(false);
        setError(null);
        // Reset kill feed, round history e game log ao conectar para evitar duplicatas
        setKillFeed([]);
        setRoundHistory([]);
        setEvents([]);
        setGameLog([]);
      };

      ws.onclose = () => {
        const wasConnected = isConnectedRef.current;
        setIsConnected(false);
        isConnectedRef.current = false;
        setIsConnecting(false);
        wsRef.current = null;

        if (wasConnected) {
          console.log('[GOTV Hook] Disconnected from match:', matchId);
        }

        // Auto-reconnect silenciosamente
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = () => {
        // Silenciar erro - onclose ja vai tratar a reconexao
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'connected':
            case 'match_state':
              if (message.data && 'mapName' in message.data) {
                const state = message.data as GOTVMatchState;
                setMatchState(state);
                setPlayers(state.players);
              }
              break;

            case 'player_update':
              if (Array.isArray(message.data)) {
                setPlayers(message.data as GOTVPlayerState[]);
              }
              break;

            case 'event':
              if (message.data && 'type' in message.data) {
                const gotvEvent = message.data as GOTVEvent;
                setEvents(prev => [...prev.slice(-99), gotvEvent]);

                // Processar eventos especificos
                processKillEvent(gotvEvent);
                processRoundEndEvent(gotvEvent);
                processGameLogEvent(gotvEvent);
              }
              break;

            case 'matchzy_state':
              // Atualização de estado do MatchZy
              if (message.data && 'phase' in message.data) {
                const mzState = message.data as MatchZyState;
                setMatchZyState(mzState);

                // Sincronizar dados do MatchZy com matchState
                setMatchState(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    phase: mzState.phase,
                    isCapturing: mzState.isCapturing,
                    team1: mzState.team1,
                    team2: mzState.team2,
                    currentRound: mzState.currentRound,
                    currentHalf: mzState.currentHalf,
                  };
                });
              }
              break;

            case 'phase_change':
              // Mudança de fase da partida
              console.log('[GOTV Hook] Phase changed:', message.data);
              break;

            case 'side_swap':
              // Troca de lado (halftime/overtime)
              console.log('[GOTV Hook] Sides swapped:', message.data);
              break;

            case 'disconnected':
              setMatchState(prev => prev ? { ...prev, status: 'ended' } : null);
              break;
          }
        } catch (err) {
          console.error('[GOTV Hook] Failed to parse message:', err);
        }
      };
    } catch (err) {
      console.error('[GOTV Hook] Failed to connect:', err);
      setError('Falha ao conectar ao servidor GOTV');
      setIsConnecting(false);
    }
  }, [matchId, serverUrl, autoReconnect, reconnectInterval, processKillEvent, processRoundEndEvent, processGameLogEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    isConnectedRef.current = false;
    setIsConnecting(false);
  }, []);

  // Conectar automaticamente ao montar
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]); // Reconectar se matchId mudar

  // Calcular valores derivados para fácil acesso
  const team1 = matchZyState?.team1 || matchState?.team1 || null;
  const team2 = matchZyState?.team2 || matchState?.team2 || null;
  const phase: MatchPhase = matchZyState?.phase || matchState?.phase || 'idle';
  const isCapturing = matchZyState?.isCapturing || matchState?.isCapturing || false;

  return {
    isConnected,
    isConnecting,
    error,
    matchState,
    matchZyState,
    players,
    events,
    killFeed,
    roundHistory,
    gameLog,
    connect,
    disconnect,
    // Helpers para times
    team1,
    team2,
    phase,
    isCapturing,
  };
}

/**
 * Hook para buscar lista de partidas ativas do servidor GOTV
 * Faz polling a cada 10 segundos para atualizar a lista
 */
export function useGOTVMatches(serverUrl?: string) {
  const baseUrl = serverUrl || process.env.NEXT_PUBLIC_GOTV_SERVER_URL || 'http://localhost:8080';

  const [matches, setMatches] = useState<ActiveMatchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverOffline, setServerOffline] = useState(false);

  const fetchMatches = useCallback(async () => {
    try {
      setIsLoading(true);

      // Construir URL HTTP a partir da URL WebSocket
      let httpUrl = baseUrl;
      if (baseUrl.startsWith('wss://')) {
        httpUrl = baseUrl.replace('wss://', 'https://');
      } else if (baseUrl.startsWith('ws://')) {
        httpUrl = baseUrl.replace('ws://', 'http://');
      }

      const response = await fetch(`${httpUrl}/api/matches`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) throw new Error('Failed to fetch matches');

      const data = await response.json();
      setMatches(data.matches || []);
      setError(null);
      setServerOffline(false);
    } catch (err) {
      // Silenciar erro quando servidor esta offline
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) {
        setServerOffline(true);
        setMatches([]);
        setError(null);
      } else {
        console.error('[GOTV Hook] Failed to fetch matches:', err);
        setError('Falha ao buscar partidas');
      }
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchMatches();

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchMatches, 10000);

    return () => clearInterval(interval);
  }, [fetchMatches]);

  return { matches, isLoading, error, serverOffline, refetch: fetchMatches };
}

/**
 * Hook para buscar estado de uma partida especifica via REST API
 * Util quando nao precisa de WebSocket (ex: preview de partida)
 */
export function useGOTVMatchState(matchId: string, serverUrl?: string) {
  const baseUrl = serverUrl || process.env.NEXT_PUBLIC_GOTV_SERVER_URL || 'http://localhost:8080';

  const [matchState, setMatchState] = useState<GOTVMatchState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchState = useCallback(async () => {
    if (!matchId) return;

    try {
      setIsLoading(true);

      // Construir URL HTTP a partir da URL WebSocket
      let httpUrl = baseUrl;
      if (baseUrl.startsWith('wss://')) {
        httpUrl = baseUrl.replace('wss://', 'https://');
      } else if (baseUrl.startsWith('ws://')) {
        httpUrl = baseUrl.replace('ws://', 'http://');
      }

      const response = await fetch(`${httpUrl}/api/match/${matchId}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setMatchState(null);
          setError('Partida nao encontrada');
        } else {
          throw new Error('Failed to fetch match state');
        }
        return;
      }

      const data = await response.json();
      setMatchState(data);
      setError(null);
    } catch (err) {
      console.error('[GOTV Hook] Failed to fetch match state:', err);
      setError('Falha ao buscar estado da partida');
    } finally {
      setIsLoading(false);
    }
  }, [matchId, baseUrl]);

  useEffect(() => {
    fetchMatchState();
  }, [fetchMatchState]);

  return { matchState, isLoading, error, refetch: fetchMatchState };
}
