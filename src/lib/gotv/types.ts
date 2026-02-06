// Tipos para o sistema GOTV de partidas ao vivo

export interface GOTVFragment {
  matchId: string;
  fragmentNumber: number;
  type: 'start' | 'full' | 'delta';
  data: Buffer;
  timestamp: number;
}

// Fase da partida (máquina de estados)
export type MatchPhase = 'idle' | 'warmup' | 'knife' | 'live' | 'halftime' | 'overtime' | 'paused' | 'finished';

// Time identificado automaticamente (formato legado)
export interface IdentifiedTeam {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string;
  side: 'CT' | 'T';
}

// Time com informações completas (novo formato)
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
    position?: { x: number; y: number; z: number };
    timeRemaining?: number;
    site?: 'A' | 'B';
  };
  players: GOTVPlayerState[];
  lastTick: number;
  // Times identificados (formato legado - CT/T)
  teamCT?: IdentifiedTeam;
  teamT?: IdentifiedTeam;
  // Metadados
  totalBytes?: number;
  fragmentCount?: number;
  updatedAt?: string;

  // === NOVO: Dados do MatchZy ===
  phase?: MatchPhase;
  isCapturing?: boolean;
  bestOf?: number;
  currentMap?: number;
  currentHalf?: number;
  // Times persistentes (não mudam com o lado)
  team1?: MatchTeamInfo;
  team2?: MatchTeamInfo;
  team1StartSide?: 'CT' | 'T';
  knifeWinner?: 'team1' | 'team2';
}

export interface GOTVPlayerState {
  steamId: string;
  name: string;
  team: 'CT' | 'T' | 'SPEC';
  health: number;
  armor: number;
  hasHelmet: boolean;
  hasDefuser: boolean;
  money: number;
  isAlive: boolean;
  position: { x: number; y: number; z: number };
  viewAngle: number;
  activeWeapon: string;
  weapons: string[];
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  damage: number;
  roundKills: number;
  roundDamage: number;
}

export interface GOTVKillEvent {
  tick: number;
  round: number;
  attackerSteamId: string;
  attackerName: string;
  attackerTeam: 'CT' | 'T';
  attackerPosition: { x: number; y: number; z: number };
  victimSteamId: string;
  victimName: string;
  victimTeam: 'CT' | 'T';
  victimPosition: { x: number; y: number; z: number };
  weapon: string;
  headshot: boolean;
  penetrated: boolean;
  throughSmoke: boolean;
  noScope: boolean;
  assistedFlash: boolean;
  assisterSteamId?: string;
  assisterName?: string;
}

export interface GOTVRoundEndEvent {
  tick: number;
  round: number;
  winner: 'CT' | 'T';
  reason: string;
  scoreCT: number;
  scoreT: number;
  duration: number;
}

export interface GOTVBombEvent {
  tick: number;
  round: number;
  type: 'planted' | 'defused' | 'exploded' | 'dropped' | 'pickup';
  playerSteamId?: string;
  playerName?: string;
  site?: 'A' | 'B';
  position: { x: number; y: number; z: number };
}

export interface GOTVPlayerHurtEvent {
  tick: number;
  round: number;
  attackerSteamId: string;
  victimSteamId: string;
  damage: number;
  weapon: string;
}

export interface GOTVRoundStartEvent {
  tick: number;
  round: number;
}

export interface GOTVFreezetimeEndEvent {
  tick: number;
  round: number;
}

export type GOTVEvent =
  | { type: 'kill'; data: GOTVKillEvent }
  | { type: 'round_end'; data: GOTVRoundEndEvent }
  | { type: 'bomb_planted'; data: GOTVBombEvent }
  | { type: 'bomb_defused'; data: GOTVBombEvent }
  | { type: 'bomb_exploded'; data: GOTVBombEvent }
  | { type: 'player_hurt'; data: GOTVPlayerHurtEvent }
  | { type: 'round_start'; data: GOTVRoundStartEvent }
  | { type: 'freezetime_end'; data: GOTVFreezetimeEndEvent };

export interface WebSocketMessage {
  type: 'match_state' | 'event' | 'player_update' | 'connected' | 'disconnected' | 'fragment' | 'matchzy_state' | 'phase_change' | 'side_swap';
  matchId: string;
  data: GOTVMatchState | GOTVEvent | GOTVPlayerState[] | FragmentData | MatchZyState | null;
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
  knifeWinner?: 'team1' | 'team2';
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

export interface FragmentData {
  fragment: number;
  type: string;
  size: number;
}

// Tipos para lista de partidas ativas
export interface ActiveMatchInfo {
  matchId: string;
  status: string;
  mapName: string;
  scoreCT: number;
  scoreT: number;
  currentRound: number;
  clients: number;
  fragmentCount?: number;
  totalBytes?: number;
  updatedAt?: string;
  teamCT?: IdentifiedTeam;
  teamT?: IdentifiedTeam;
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

// Tipos para histórico de rounds
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
    site?: 'A' | 'B';
    // Round end data
    winner?: 'CT' | 'T';
    reason?: string;
    scoreCT?: number;
    scoreT?: number;
  };
}
