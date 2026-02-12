// Tipos para o sistema de partidas ao vivo (MatchZy + WebSocket)

// Fase da partida (maquina de estados)
export type MatchPhase = 'idle' | 'warmup' | 'knife' | 'live' | 'halftime' | 'overtime' | 'paused' | 'finished';

// Time com informacoes completas
export interface MatchTeamInfo {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string;
  currentSide: 'CT' | 'T';
  score: number;
  mapsWon: number;
}

export interface GOTVMatchState {
  matchId: string;
  status: 'connecting' | 'live' | 'paused' | 'ended' | 'warmup';
  mapName: string;
  scoreCT: number;
  scoreT: number;
  currentRound: number;
  roundPhase: 'freezetime' | 'live' | 'over' | 'bomb_planted' | 'defuse' | 'warmup';
  roundTimeRemaining?: number;
  bomb?: {
    state: 'carried' | 'planted' | 'dropped' | 'defused' | 'exploded';
    site?: 'A' | 'B';
    timeRemaining?: number;
  };
  players: GOTVPlayerState[];
  lastTick: number;
  updatedAt?: string;

  // Dados do MatchZy
  phase?: MatchPhase;
  isCapturing?: boolean;
  bestOf?: number;
  currentMap?: number;
  currentHalf?: number;
  // Times persistentes (nao mudam com o lado)
  team1?: MatchTeamInfo;
  team2?: MatchTeamInfo;
  team1StartSide?: 'CT' | 'T';
  // Times por lado (legado, mantidos para compatibilidade do frontend)
  teamCT?: { id?: string; name: string; tag?: string; logoUrl?: string; side: 'CT' };
  teamT?: { id?: string; name: string; tag?: string; logoUrl?: string; side: 'T' };
}

export interface GOTVPlayerState {
  steamId: string;
  name: string;
  team: 'CT' | 'T' | 'SPEC';
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  damage: number;
  // Campos mantidos para compatibilidade do frontend (nao populados pelo MatchZy)
  health: number;
  armor: number;
  hasHelmet: boolean;
  hasDefuser: boolean;
  money: number;
  isAlive: boolean;
  position?: { x: number; y: number; z: number };
  viewAngle?: number;
  activeWeapon?: string;
  weapons?: string[];
  roundKills?: number;
  roundDamage?: number;
}

export interface GOTVKillEvent {
  tick: number;
  round: number;
  attacker?: {
    name: string;
    team: 'CT' | 'T';
    steamId: string;
  } | null;
  victim: {
    name: string;
    team: 'CT' | 'T';
    steamId: string;
  };
  weapon: string;
  headshot: boolean;
  wallbang: boolean;
  throughSmoke: boolean;
  noScope: boolean;
}

export interface GOTVRoundEndEvent {
  round: number;
  winner: 'CT' | 'T';
  reason: string;
  scoreCT: number;
  scoreT: number;
}

export interface GOTVBombEvent {
  tick: number;
  round: number;
  planter?: {
    name: string;
    team: 'CT' | 'T';
    steamId: string;
  };
  defuser?: {
    name: string;
    team: 'CT' | 'T';
    steamId: string;
  };
  site?: string;
}

export type GOTVEvent =
  | { type: 'kill'; tick: number; round: number; data: GOTVKillEvent }
  | { type: 'round_end'; tick: number; round: number; data: GOTVRoundEndEvent }
  | { type: 'bomb_planted'; tick: number; round: number; data: GOTVBombEvent }
  | { type: 'bomb_defused'; tick: number; round: number; data: GOTVBombEvent };

export interface WebSocketMessage {
  type: 'match_state' | 'event' | 'connected' | 'disconnected' | 'matchzy_state' | 'phase_change' | 'side_swap';
  matchId: string;
  data: GOTVMatchState | GOTVEvent | GOTVPlayerState[] | MatchZyState | null;
  timestamp: number;
}

// Estado do MatchZy (recebido via WebSocket)
export interface MatchZyState {
  matchId: string;
  phase: MatchPhase;
  isCapturing: boolean;
  bestOf: number;
  currentMap: number;
  currentRound: number;
  currentHalf: number;
  team1?: MatchTeamInfo;
  team2?: MatchTeamInfo;
  team1StartSide?: 'CT' | 'T';
  mapName?: string;
  lastEvent?: MatchZyEvent;
  updatedAt: string;
}

export interface MatchZyEvent {
  event: string;
  matchid: string;
  map_number?: number;
  timestamp?: string;
  data?: Record<string, unknown>;
}

// Tipos para lista de partidas ativas
export interface ActiveMatchInfo {
  matchId: string;
  dbMatchId?: string;
  status: string;
  mapName: string;
  scoreCT: number;
  scoreT: number;
  currentRound: number;
  clients: number;
  updatedAt?: string;
}

// Tipos para eventos formatados para o feed de kills
export interface KillFeedEntry {
  id: string;
  round: number;
  attacker: {
    name: string;
    team: 'CT' | 'T';
    steamId: string;
  } | null;
  victim: {
    name: string;
    team: 'CT' | 'T';
    steamId: string;
  };
  weapon: string;
  headshot: boolean;
  wallbang: boolean;
  throughSmoke: boolean;
  noScope: boolean;
  timestamp: number;
}

// Tipos para historico de rounds
export interface RoundHistoryEntry {
  round: number;
  winner: 'CT' | 'T';
  reason: string;
  scoreCT: number;
  scoreT: number;
}

// Tipos para eventos do Game Log (unificado)
export type GameLogEventType = 'kill' | 'bomb_planted' | 'bomb_defused' | 'bomb_exploded' | 'round_start' | 'round_end';

export interface GameLogEvent {
  id: string;
  type: GameLogEventType;
  round: number;
  tick: number;
  timestamp: number;
  data: {
    // Kill data
    attacker?: { name: string; team: 'CT' | 'T'; steamId: string } | null;
    victim?: { name: string; team: 'CT' | 'T'; steamId: string };
    weapon?: string;
    headshot?: boolean;
    wallbang?: boolean;
    throughSmoke?: boolean;
    noScope?: boolean;
    // Bomb data
    planter?: { name: string; steamId: string; team: 'CT' | 'T' };
    defuser?: { name: string; steamId: string; team: 'CT' | 'T' };
    site?: string;
    // Round end data
    winner?: 'CT' | 'T';
    reason?: string;
    scoreCT?: number;
    scoreT?: number;
  };
}
