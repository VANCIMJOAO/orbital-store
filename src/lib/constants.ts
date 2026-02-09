// Pool competitivo de mapas CS2 (atualizado para 2025)
export const CS2_MAP_POOL = [
  "de_mirage",
  "de_inferno",
  "de_ancient",
  "de_nuke",
  "de_anubis",
  "de_vertigo",
  "de_dust2",
];

// Nomes amigáveis dos mapas (sem prefixo de_)
export const MAP_DISPLAY_NAMES: Record<string, string> = {
  de_mirage: "Mirage",
  de_inferno: "Inferno",
  de_ancient: "Ancient",
  de_nuke: "Nuke",
  de_anubis: "Anubis",
  de_vertigo: "Vertigo",
  de_dust2: "Dust2",
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
