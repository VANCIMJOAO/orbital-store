// Pool competitivo de mapas CS2 (atualizado para 2025)
export const CS2_MAP_POOL = [
  "de_mirage",
  "de_ancient",
  "de_inferno",
  "de_nuke",
  "de_overpass",
  "de_anubis",
  "de_dust2",
];

// Nomes amigáveis dos mapas (sem prefixo de_)
export const MAP_DISPLAY_NAMES: Record<string, string> = {
  de_mirage: "Mirage",
  de_ancient: "Ancient",
  de_inferno: "Inferno",
  de_nuke: "Nuke",
  de_overpass: "Overpass",
  de_anubis: "Anubis",
  de_dust2: "Dust2",
};

// Cores de gradiente por mapa (para cards visuais estilo ESL)
export const MAP_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  de_mirage: { from: "#1a3a5c", to: "#0d1f33", accent: "#4a9eff" },
  de_ancient: { from: "#2d4a2d", to: "#1a2e1a", accent: "#6abf6a" },
  de_inferno: { from: "#5c3a1a", to: "#331f0d", accent: "#ff9f4a" },
  de_nuke: { from: "#4a4a2d", to: "#2e2e1a", accent: "#bfbf6a" },
  de_overpass: { from: "#2d3a4a", to: "#1a2433", accent: "#6a9fbf" },
  de_anubis: { from: "#4a2d3a", to: "#331a24", accent: "#bf6a9f" },
  de_dust2: { from: "#5c4a2d", to: "#33291a", accent: "#d4a862" },
};

// Formato do veto por best_of
// BO1: 6 bans alternados, 1 leftover
// BO3: 2 bans, 2 picks, 2 bans, 1 leftover
export type VetoAction = "ban" | "pick" | "leftover";

export interface VetoSequenceStep {
  action: VetoAction;
  // "team1" ou "team2" (relativo a quem começa)
  // "first" = time que começa, "second" = outro time
  actor: "first" | "second";
}

export const VETO_SEQUENCE_BO1: VetoSequenceStep[] = [
  { action: "ban", actor: "first" },
  { action: "ban", actor: "second" },
  { action: "ban", actor: "first" },
  { action: "ban", actor: "second" },
  { action: "ban", actor: "first" },
  { action: "ban", actor: "second" },
  // Último mapa sobra automaticamente
];

export const VETO_SEQUENCE_BO3: VetoSequenceStep[] = [
  { action: "ban", actor: "first" },
  { action: "ban", actor: "second" },
  { action: "pick", actor: "first" },
  { action: "pick", actor: "second" },
  { action: "ban", actor: "first" },
  { action: "ban", actor: "second" },
  // Último mapa sobra automaticamente
];

// Tipo para veto_data salvo no banco
export interface VetoStep {
  team: string; // "team1" | "team2" | "-"
  action: VetoAction | "leftover";
  map: string;
  order: number;
}

export interface VetoData {
  first_team: "team1" | "team2";
  steps: VetoStep[];
  maps: string[]; // mapas que serão jogados na ordem
  completed: boolean;
}
