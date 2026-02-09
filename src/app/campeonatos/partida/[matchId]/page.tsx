"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGOTV } from "@/hooks/useGOTV";
import { supabase } from "@/lib/supabase";
import { TournamentHeader } from "@/components/TournamentHeader";
import type { GOTVPlayerState, GameLogEvent } from "@/lib/gotv/types";

// Tipo para dados do Supabase (pré-match)
interface SupabaseMatchData {
  id: string;
  status: string;
  scheduled_at: string | null;
  round: string | null;
  best_of: number;
  team1_score: number;
  team2_score: number;
  map_name: string | null;
  team1: { id: string; name: string; tag: string; logo_url: string | null } | null;
  team2: { id: string; name: string; tag: string; logo_url: string | null } | null;
  tournament: { name: string } | null;
}

interface SupabasePlayer {
  profile_id: string;
  role: string | null;
  steam_id: string | null;
  nickname: string | null;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
    level: number | null;
    steam_id: string | null;
  } | null;
}

// Verifica se o jogador tem dados suficientes para calcular estatísticas
function hasPlayerStats(player: GOTVPlayerState): boolean {
  return player.kills > 0 || player.deaths > 0 || player.damage > 0 || player.assists > 0;
}

// Função para calcular Swing (impacto no round)
// Baseado em: kills, deaths, damage, assists - quanto o jogador impactou as chances do time
function calculateSwing(player: GOTVPlayerState, roundsPlayed: number): number | null {
  if (roundsPlayed === 0 || !hasPlayerStats(player)) return null;

  const kpr = player.kills / roundsPlayed;
  const dpr = player.deaths / roundsPlayed;
  const adr = player.damage / roundsPlayed;
  const apr = player.assists / roundsPlayed;

  // Swing = impacto líquido por round (positivo = ajudou, negativo = prejudicou)
  const swing = (kpr * 0.8) + (apr * 0.3) + (adr * 0.005) - (dpr * 0.5);

  return swing * 100;
}

// Função para calcular KAST
// KAST = % de rounds com Kill, Assist, Survived ou Traded
function calculateKAST(player: GOTVPlayerState, roundsPlayed: number): number | null {
  if (roundsPlayed === 0 || !hasPlayerStats(player)) return null;

  // Estimativa: rounds com contribuição
  const roundsWithKill = Math.min(player.kills, roundsPlayed);
  const roundsWithAssist = Math.min(player.assists, roundsPlayed - roundsWithKill);
  const roundsSurvived = roundsPlayed - player.deaths;

  const kastRounds = Math.min(roundsPlayed, roundsWithKill + roundsWithAssist + Math.max(0, roundsSurvived - roundsWithKill));

  return Math.round((kastRounds / roundsPlayed) * 100);
}

// Função para calcular Rating 3.0
function calculateRating(player: GOTVPlayerState, roundsPlayed: number): number | null {
  if (roundsPlayed === 0 || !hasPlayerStats(player)) return null;

  const kpr = player.kills / roundsPlayed;
  const dpr = player.deaths / roundsPlayed;
  const adr = player.damage / roundsPlayed;
  const apr = player.assists / roundsPlayed;
  const kast = (calculateKAST(player, roundsPlayed) ?? 0) / 100;

  const rating = (
    0.2688 * kpr +
    0.0073 * adr +
    0.2215 * kast +
    0.1415 * apr -
    0.2173 * dpr +
    0.4908
  );

  return Math.max(0, Math.min(2.5, rating));
}

// Componente de tabela de scoreboard estilo Gamersclub
function TeamScoreboardTable({
  players,
  teamName,
  teamSide,
  currentRound,
  dbPlayers,
  teamLogo,
}: {
  players: GOTVPlayerState[];
  teamName: string;
  teamSide: 'CT' | 'T';
  currentRound: number;
  dbPlayers?: SupabasePlayer[];
  teamLogo?: string | null;
}) {
  const teamColorClass = teamSide === 'CT' ? 'text-[#3b82f6]' : 'text-[#f59e0b]';
  const teamBgClass = teamSide === 'CT' ? 'bg-[#3b82f6]/10' : 'bg-[#f59e0b]/10';
  const teamBorderClass = teamSide === 'CT' ? 'border-[#3b82f6]/30' : 'border-[#f59e0b]/30';
  const teamIconBg = teamSide === 'CT' ? 'bg-[#3b82f6]' : 'bg-[#f59e0b]';

  const roundsPlayed = Math.max(1, currentRound);

  // Criar set de steamIds online (do GOTV)
  const onlineSteamIds = new Set(players.map(p => p.steamId));

  // Merge: jogadores GOTV (com stats) + jogadores DB que não estão no GOTV (offline)
  type MergedPlayer = {
    type: 'gotv';
    gotv: GOTVPlayerState;
    db?: SupabasePlayer;
  } | {
    type: 'db_only';
    db: SupabasePlayer;
  };

  const merged: MergedPlayer[] = [];

  // Primeiro: jogadores GOTV (ordenados por rating)
  const sortedGotv = [...players].sort((a, b) => {
    const ratingA = calculateRating(a, roundsPlayed) ?? 0;
    const ratingB = calculateRating(b, roundsPlayed) ?? 0;
    return ratingB - ratingA;
  });

  for (const gotvPlayer of sortedGotv) {
    // Tentar achar DB match pelo steamId
    const dbMatch = dbPlayers?.find(dp => {
      const dbSteamId = dp.steam_id || dp.profiles?.steam_id || '';
      return dbSteamId === gotvPlayer.steamId;
    });
    merged.push({ type: 'gotv', gotv: gotvPlayer, db: dbMatch });
  }

  // Depois: jogadores DB que NÃO estão no GOTV (offline)
  if (dbPlayers) {
    for (const dbPlayer of dbPlayers) {
      const dbSteamId = dbPlayer.steam_id || dbPlayer.profiles?.steam_id || '';
      if (!dbSteamId || !onlineSteamIds.has(dbSteamId)) {
        merged.push({ type: 'db_only', db: dbPlayer });
      }
    }
  }

  return (
    <div className={`bg-[#1a1a2e] border ${teamBorderClass} rounded-lg overflow-hidden`}>
      {/* Header do time */}
      <div className={`${teamBgClass} px-4 py-3 flex items-center gap-3 border-b ${teamBorderClass}`}>
        {teamLogo ? (
          <img src={teamLogo} alt={teamName} className="w-6 h-6 rounded object-cover" />
        ) : (
          <div className={`w-6 h-6 rounded ${teamIconBg} flex items-center justify-center`}>
            <span className="text-white text-xs font-bold">{teamSide === 'CT' ? 'CT' : 'TR'}</span>
          </div>
        )}
        <span className={`font-display text-base ${teamColorClass}`}>{teamName}</span>
      </div>

      {/* Tabela de jogadores */}
      <table className="w-full">
        <thead>
          <tr className="text-[11px] font-mono text-[#71717A] border-b border-[#27272A]">
            <th className="text-left px-4 py-2.5 w-[35%]">
              <span className="text-[#f59e0b]">P</span> Players
            </th>
            <th className="text-center px-3 py-2.5 w-[13%] border-l border-[#27272A]">K-D</th>
            <th className="text-center px-3 py-2.5 w-[13%] border-l border-[#27272A] group relative cursor-help">
              <span>Swing</span>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-2 bg-[#1a1a2e] border border-[#27272A] rounded-lg shadow-lg text-left">
                <p className="text-[10px] text-[#A1A1AA] leading-relaxed">How much, on average, a player changed their team&apos;s chances of winning a round based on team economy, side, kills, deaths, damage, trading, and flash assists</p>
              </div>
            </th>
            <th className="text-center px-3 py-2.5 w-[13%] border-l border-[#27272A] group relative cursor-help">
              <span>ADR</span>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-40 p-2 bg-[#1a1a2e] border border-[#27272A] rounded-lg shadow-lg text-left">
                <p className="text-[10px] text-[#A1A1AA] leading-relaxed">Average damage per round.</p>
              </div>
            </th>
            <th className="text-center px-3 py-2.5 w-[13%] border-l border-[#27272A] group relative cursor-help">
              <span>KAST</span>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-52 p-2 bg-[#1a1a2e] border border-[#27272A] rounded-lg shadow-lg text-left">
                <p className="text-[10px] text-[#A1A1AA] leading-relaxed">Percentage of rounds in which the player either had a kill, assist, survived or was traded.</p>
              </div>
            </th>
            <th className="text-right px-4 py-2.5 w-[13%] border-l border-[#27272A] group relative cursor-help">
              <span>Rating</span>
              <span className="text-[9px] text-[#52525B] ml-1">3.0</span>
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 w-56 p-2 bg-[#1a1a2e] border border-[#27272A] rounded-lg shadow-lg text-left">
                <p className="text-[10px] text-[#A1A1AA] leading-relaxed">The rating tells us if the player put up above or below average numbers, with 1.00 being the average.</p>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {merged.map((entry, idx) => {
            if (entry.type === 'gotv') {
              const player = entry.gotv;
              const dbInfo = entry.db;
              const avatarUrl = dbInfo?.profiles?.avatar_url;
              const profileId = dbInfo?.profiles?.id;
              const role = dbInfo?.role;

              const kd = `${player.kills}-${player.deaths}`;
              const swing = calculateSwing(player, roundsPlayed);
              const swingStr = swing !== null
                ? (swing >= 0 ? `+${swing.toFixed(2)}%` : `${swing.toFixed(2)}%`)
                : '-';
              const swingColor = swing !== null
                ? (swing > 0 ? 'text-[#22c55e]' : swing < 0 ? 'text-[#ef4444]' : 'text-[#71717A]')
                : 'text-[#71717A]';
              const adr = player.damage > 0 ? (player.damage / roundsPlayed).toFixed(1) : '-';
              const kast = calculateKAST(player, roundsPlayed);
              const rating = calculateRating(player, roundsPlayed);

              const getRatingColor = (r: number | null) => {
                if (r === null) return 'text-[#71717A]';
                if (r >= 1.20) return 'text-[#22c55e]';
                if (r >= 1.05) return 'text-[#F5F5DC]';
                if (r >= 0.90) return 'text-[#f59e0b]';
                return 'text-[#ef4444]';
              };

              return (
                <tr
                  key={`gotv-${player.steamId}-${idx}`}
                  className="border-b border-[#27272A]/50 hover:bg-[#252540] transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={player.name} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-[#71717A]">
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        {profileId ? (
                          <Link
                            href={`/campeonatos/jogador/${profileId}`}
                            className="text-sm text-[#F5F5DC] font-medium hover:text-[#A855F7] transition-colors"
                          >
                            {player.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-[#F5F5DC] font-medium">{player.name}</span>
                        )}
                        {role && (
                          <span className="text-[9px] font-mono text-[#71717A] uppercase">{role}</span>
                        )}
                        {player.steamId === "0" && (
                          <span className="text-[9px] font-mono text-[#71717A]">BOT</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                    <span className="text-sm font-mono text-[#F5F5DC]">{kd}</span>
                  </td>
                  <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                    <span className={`text-sm font-mono ${swingColor}`}>{swingStr}</span>
                  </td>
                  <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                    <span className="text-sm font-mono text-[#F5F5DC]">{adr}</span>
                  </td>
                  <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                    <span className="text-sm font-mono text-[#F5F5DC]">{kast !== null ? `${kast}%` : '-'}</span>
                  </td>
                  <td className="text-right px-4 py-2.5 border-l border-[#27272A]">
                    <span className={`text-sm font-bold font-mono ${getRatingColor(rating)}`}>
                      {rating !== null ? rating.toFixed(2) : '-'}
                    </span>
                  </td>
                </tr>
              );
            } else {
              // Jogador offline (só do DB)
              const db = entry.db;
              const playerName = db.nickname || db.profiles?.username || 'Jogador';
              const avatarUrl = db.profiles?.avatar_url;
              const profileId = db.profiles?.id;

              return (
                <tr
                  key={`db-${db.profile_id}-${idx}`}
                  className="border-b border-[#27272A]/50 opacity-40"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={playerName} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-[#71717A]">
                            {playerName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        {profileId ? (
                          <Link
                            href={`/campeonatos/jogador/${profileId}`}
                            className="text-sm text-[#F5F5DC] font-medium hover:text-[#A855F7] transition-colors"
                          >
                            {playerName}
                          </Link>
                        ) : (
                          <span className="text-sm text-[#F5F5DC] font-medium">{playerName}</span>
                        )}
                        {db.role && (
                          <span className="text-[9px] font-mono text-[#71717A] uppercase">{db.role}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                    <span className="text-sm font-mono text-[#71717A]">-</span>
                  </td>
                  <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                    <span className="text-sm font-mono text-[#71717A]">-</span>
                  </td>
                  <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                    <span className="text-sm font-mono text-[#71717A]">-</span>
                  </td>
                  <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                    <span className="text-sm font-mono text-[#71717A]">-</span>
                  </td>
                  <td className="text-right px-4 py-2.5 border-l border-[#27272A]">
                    <span className="text-sm font-bold font-mono text-[#71717A]">-</span>
                  </td>
                </tr>
              );
            }
          })}
          {merged.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#71717A]">
                Sem jogadores
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Mapeamento de armas para ícones/nomes curtos
// Mapeamento de nomes de armas para arquivos SVG
const weaponSvgMap: Record<string, string> = {
  'ak47': 'ak47',
  'weapon_ak47': 'ak47',
  'm4a1': 'm4a1',
  'weapon_m4a1': 'm4a1',
  'm4a1_silencer': 'm4a1_silencer',
  'weapon_m4a1_silencer': 'm4a1_silencer',
  'awp': 'awp',
  'weapon_awp': 'awp',
  'deagle': 'deagle',
  'weapon_deagle': 'deagle',
  'usp_silencer': 'usp_silencer',
  'weapon_usp_silencer': 'usp_silencer',
  'glock': 'glock',
  'weapon_glock': 'glock',
  'hkp2000': 'hkp2000',
  'weapon_hkp2000': 'hkp2000',
  'famas': 'famas',
  'weapon_famas': 'famas',
  'galilar': 'galilar',
  'weapon_galilar': 'galilar',
  'aug': 'aug',
  'weapon_aug': 'aug',
  'sg556': 'sg556',
  'weapon_sg556': 'sg556',
  'ssg08': 'ssg08',
  'weapon_ssg08': 'ssg08',
  'mac10': 'mac10',
  'weapon_mac10': 'mac10',
  'mp9': 'mp9',
  'weapon_mp9': 'mp9',
  'mp7': 'mp7',
  'weapon_mp7': 'mp7',
  'mp5sd': 'mp5sd',
  'weapon_mp5sd': 'mp5sd',
  'ump45': 'ump451',
  'weapon_ump45': 'ump451',
  'p90': 'p90',
  'weapon_p90': 'p90',
  'bizon': 'bizon',
  'weapon_bizon': 'bizon',
  'nova': 'nova',
  'weapon_nova': 'nova',
  'xm1014': 'xm1014',
  'weapon_xm1014': 'xm1014',
  'sawedoff': 'sawedoff',
  'weapon_sawedoff': 'sawedoff',
  'mag7': 'mag7',
  'weapon_mag7': 'mag7',
  'm249': 'm249',
  'weapon_m249': 'm249',
  'negev': 'negev',
  'weapon_negev': 'negev',
  'scar20': 'scar20',
  'weapon_scar20': 'scar20',
  'g3sg1': 'g3sg1',
  'weapon_g3sg1': 'g3sg1',
  'p250': 'p250',
  'weapon_p250': 'p250',
  'fiveseven': 'fiveseven',
  'weapon_fiveseven': 'fiveseven',
  'tec9': 'tec9',
  'weapon_tec9': 'tec9',
  'cz75a': 'cz75a',
  'weapon_cz75a': 'cz75a',
  'elite': 'elite',
  'weapon_elite': 'elite',
  'revolver': 'revolver',
  'weapon_revolver': 'revolver',
  'knife': 'knife',
  'weapon_knife': 'knife',
  'weapon_knife_t': 'knife_t',
  'bayonet': 'bayonet',
  'weapon_bayonet': 'bayonet',
  'c4': 'c4',
  'weapon_c4': 'c4',
  'hegrenade': 'hegrenade',
  'weapon_hegrenade': 'hegrenade',
  'flashbang': 'flashbang',
  'weapon_flashbang': 'flashbang',
  'smokegrenade': 'smokegrenade',
  'weapon_smokegrenade': 'smokegrenade',
  'molotov': 'molotov',
  'weapon_molotov': 'molotov',
  'incgrenade': 'incgrenade0',
  'weapon_incgrenade': 'incgrenade0',
  'decoy': 'decoy',
  'weapon_decoy': 'decoy',
  'taser': 'taser',
  'weapon_taser': 'taser',
};

// Componente para renderizar ícone de arma
function WeaponIcon({ weapon, className }: { weapon: string; className?: string }) {
  // Normalizar o nome da arma - remover prefixo weapon_, converter para minúsculas,
  // remover espaços e hífens, tratar formatos alternativos
  let normalized = weapon.toLowerCase()
    .replace('weapon_', '')
    .replace(/-/g, '')
    .replace(/\s+/g, '')
    .replace('silencer', '_silencer');

  // Mapeamentos especiais para nomes com formatos diferentes
  const specialMappings: Record<string, string> = {
    'ssg08': 'ssg08',
    'glock18': 'glock',
    'p2000': 'hkp2000',
    'usps': 'usp_silencer',
    'm4a1s': 'm4a1_silencer',
    'm4a4': 'm4a1',
    'sg553': 'sg556',
    'galil': 'galilar',
    'ump45': 'ump451',
    'dualberettas': 'elite',
    'r8revolver': 'revolver',
    'zeus': 'taser',
    'zeusx27': 'taser',
    'deserteagle': 'deagle',
    'ak47': 'ak47',
    'mp5sd': 'mp5sd',
    'pp_bizon': 'bizon',
    'ppbizon': 'bizon',
    'cz75auto': 'cz75a',
    'sawedoff': 'sawedoff',
    'xm1014': 'xm1014',
    'negev': 'negev',
    'm249': 'm249',
    'mag7': 'mag7',
    'nova': 'nova',
    'p90': 'p90',
    'mp7': 'mp7',
    'mp9': 'mp9',
    'mac10': 'mac10',
    'aug': 'aug',
    'famas': 'famas',
    'p250': 'p250',
    'tec9': 'tec9',
    'fiveseven': 'fiveseven',
    '57': 'fiveseven',
    'scar20': 'scar20',
    'g3sg1': 'g3sg1',
    'awp': 'awp',
  };

  // Verificar mapeamentos especiais primeiro
  let svgName = specialMappings[normalized] || weaponSvgMap[normalized] || weaponSvgMap[`weapon_${normalized}`];

  // Se ainda não encontrou, tentar o formato original
  if (!svgName) {
    svgName = weaponSvgMap[weapon.toLowerCase()];
  }

  if (svgName) {
    return (
      <img
        src={`/weapons/${svgName}.svg`}
        alt={weapon}
        className={className || "h-4 w-auto max-w-[60px]"}
        style={{ filter: 'brightness(0.7)' }}
      />
    );
  }

  // Fallback para texto se não encontrar o SVG
  const fallbackName = weapon.replace('weapon_', '').toUpperCase();
  return <span className="text-[10px] font-mono text-[#666]">{fallbackName}</span>;
}

// Componente LiveScorebot - Estilo HLTV
function LiveScorebot({
  playersCT,
  playersT,
  teamCTName,
  teamTName,
  scoreCT,
  scoreT,
  currentRound,
  mapName,
  roundPhase,
  roundTimeRemaining,
}: {
  playersCT: GOTVPlayerState[];
  playersT: GOTVPlayerState[];
  teamCTName: string;
  teamTName: string;
  scoreCT: number;
  scoreT: number;
  currentRound: number;
  mapName: string;
  roundPhase: string;
  roundTimeRemaining?: number;
}) {
  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return '-:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const roundsPlayed = Math.max(1, currentRound);

  // Ordenar jogadores por kills (maior primeiro)
  const sortedCT = [...playersCT].sort((a, b) => b.kills - a.kills);
  const sortedT = [...playersT].sort((a, b) => b.kills - a.kills);

  const aliveCT = playersCT.filter(p => p.isAlive).length;
  const aliveT = playersT.filter(p => p.isAlive).length;

  // Ícone de armadura SVG
  const ArmorIcon = ({ hasHelmet, className }: { hasHelmet: boolean; className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      {hasHelmet ? (
        // Kevlar + Helmet
        <path d="M12 1C7.6 1 4 4.6 4 9v6c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4V9c0-4.4-3.6-8-8-8zm0 2c3.3 0 6 2.7 6 6v6c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V9c0-3.3 2.7-6 6-6zm0 1c-2.8 0-5 2.2-5 5v2h10V9c0-2.8-2.2-5-5-5z"/>
      ) : (
        // Kevlar only
        <path d="M12 2C8 2 4.5 5.5 4.5 9.5v5c0 1.7 1.3 3 3 3h9c1.7 0 3-1.3 3-3v-5C19.5 5.5 16 2 12 2zm0 2c2.8 0 5.5 2.7 5.5 5.5v5c0 .6-.4 1-1 1h-9c-.6 0-1-.4-1-1v-5C6.5 6.7 9.2 4 12 4z"/>
      )}
    </svg>
  );

  // Ícone de defuse kit SVG
  const DefuserIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 3v2H5v2h2v2H5v2h2v2H5v2h2v2H5v2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v-2h-2v-2h2v-2h-2v-2h2V9h-2V7h2V5h-2V3h-2v2h-2V3h-2v2H9V3H7zm2 4h6v10H9V7z"/>
    </svg>
  );

  // Ícone de C4 SVG
  const BombIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
  );

  // Ícone de skull SVG
  const SkullIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 2.3.8 4.4 2 6v3c0 .6.4 1 1 1h3v-2h2v2h4v-2h2v2h3c.6 0 1-.4 1-1v-3c1.2-1.6 2-3.7 2-6 0-5.5-4.5-10-10-10zm-3 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  );

  // Linha de jogador estilo HLTV
  const PlayerRow = ({ player, side }: { player: GOTVPlayerState; side: 'CT' | 'T' }) => {
    const sideColor = side === 'CT' ? '#6ba5e7' : '#dea345';
    const sideBgAlive = side === 'CT' ? 'bg-[#1a2a3d]' : 'bg-[#3d2a1a]';
    const adr = player.damage > 0 ? Math.round(player.damage / roundsPlayed) : 0;
    const hasC4 = player.weapons?.some(w => w.includes('c4')) ?? false;

    return (
      <tr className={`${player.isAlive ? sideBgAlive : 'bg-[#0d0d12]'} ${!player.isAlive ? 'opacity-50' : ''}`}>
        {/* Nome do jogador */}
        <td className="py-1 pl-3 pr-2 w-[140px]">
          <span className={`text-[11px] font-medium truncate block ${player.isAlive ? 'text-white' : 'text-[#666]'}`}>
            {player.name}
          </span>
        </td>
        {/* Arma principal */}
        <td className="py-1 px-1 w-[80px]">
          <div className="flex items-center justify-start">
            {player.isAlive && player.activeWeapon && (
              <WeaponIcon weapon={player.activeWeapon} className="h-3.5 w-auto max-w-[70px]" />
            )}
          </div>
        </td>
        {/* Equipamento (armor/defuser/c4) */}
        <td className="py-1 px-1 w-[50px]">
          <div className="flex items-center justify-center gap-0.5">
            {player.isAlive && player.armor > 0 && (
              <ArmorIcon hasHelmet={player.hasHelmet} className="w-3 h-3 text-[#888]" />
            )}
            {player.isAlive && side === 'CT' && player.hasDefuser && (
              <DefuserIcon className="w-3 h-3 text-[#6ba5e7]" />
            )}
            {player.isAlive && hasC4 && (
              <BombIcon className="w-3 h-3 text-[#dea345]" />
            )}
          </div>
        </td>
        {/* HP */}
        <td className="py-1 px-1 w-[70px]">
          {player.isAlive ? (
            <div className="flex items-center gap-1">
              <div className="w-[40px] h-[6px] bg-[#1a1a1a] rounded-sm overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${player.health}%`,
                    backgroundColor: player.health > 50 ? '#4ade80' : player.health > 25 ? '#facc15' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#888] w-[20px] text-right">{player.health}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <SkullIcon className="w-3 h-3 text-[#ef4444]" />
            </div>
          )}
        </td>
        {/* Money */}
        <td className="py-1 px-1 w-[55px] text-right">
          <span className="text-[10px] font-mono" style={{ color: sideColor }}>${player.money}</span>
        </td>
        {/* K */}
        <td className="py-1 px-1 w-[28px] text-center">
          <span className="text-[11px] font-mono text-white">{player.kills}</span>
        </td>
        {/* A */}
        <td className="py-1 px-1 w-[28px] text-center">
          <span className="text-[11px] font-mono text-[#666]">{player.assists}</span>
        </td>
        {/* D */}
        <td className="py-1 px-1 w-[28px] text-center">
          <span className="text-[11px] font-mono text-[#666]">{player.deaths}</span>
        </td>
        {/* ADR */}
        <td className="py-1 pr-3 pl-1 w-[40px] text-right">
          <span className="text-[11px] font-mono text-[#888]">{adr}</span>
        </td>
      </tr>
    );
  };

  // Header da tabela do time
  const TeamTableHeader = ({ side, teamName, score }: { side: 'CT' | 'T'; teamName: string; score: number }) => {
    const sideColor = side === 'CT' ? '#6ba5e7' : '#dea345';
    const sideBg = side === 'CT' ? 'bg-[#1a2a3d]' : 'bg-[#3d2a1a]';

    return (
      <thead>
        <tr className={sideBg}>
          <th className="py-2 pl-3 pr-2 text-left" colSpan={5}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: sideColor, color: '#fff' }}>
                {side}
              </span>
              <span className="text-xs font-medium text-white">{teamName}</span>
              <span className="text-lg font-bold ml-auto" style={{ color: sideColor }}>{score}</span>
            </div>
          </th>
          <th className="py-2 px-1 w-[28px] text-center text-[9px] font-medium text-[#666] uppercase">K</th>
          <th className="py-2 px-1 w-[28px] text-center text-[9px] font-medium text-[#666] uppercase">A</th>
          <th className="py-2 px-1 w-[28px] text-center text-[9px] font-medium text-[#666] uppercase">D</th>
          <th className="py-2 pr-3 pl-1 w-[40px] text-right text-[9px] font-medium text-[#666] uppercase">ADR</th>
        </tr>
      </thead>
    );
  };

  // Status do round
  const getRoundStatus = () => {
    switch (roundPhase) {
      case 'bomb_planted':
        return { text: 'BOMB PLANTED', color: '#ef4444', pulse: true };
      case 'freezetime':
        return { text: 'BUY TIME', color: '#666', pulse: false };
      case 'live':
        return { text: 'LIVE', color: '#4ade80', pulse: true };
      case 'over':
        return { text: 'ROUND OVER', color: '#666', pulse: false };
      case 'warmup':
        return { text: 'WARMUP', color: '#facc15', pulse: false };
      default:
        return { text: roundPhase?.toUpperCase() || 'UNKNOWN', color: '#666', pulse: false };
    }
  };

  const roundStatus = getRoundStatus();

  return (
    <div className="space-y-2">
      {/* Box 1: Header com placar central */}
      <div className="bg-[#0d0d12] rounded-lg overflow-hidden border border-[#1f1f2e]">
        <div className="bg-[#0a0a0f] px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Info do round */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-[#666] uppercase">Round {currentRound}</span>
              <span className="text-[10px] font-mono text-[#444]">|</span>
              <span className="text-[10px] font-mono text-[#666]">{mapName || 'Map'}</span>
            </div>

            {/* Placar central */}
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-[#6ba5e7]">{scoreCT}</span>
              <span className="text-lg text-[#333]">:</span>
              <span className="text-2xl font-bold text-[#dea345]">{scoreT}</span>
            </div>

            {/* Timer e status */}
            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] font-mono uppercase ${roundStatus.pulse ? 'animate-pulse' : ''}`}
                style={{ color: roundStatus.color }}
              >
                {roundStatus.text}
              </span>
              <span className="text-sm font-mono text-white">{formatTime(roundTimeRemaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Box 2: Indicadores de jogadores vivos */}
      <div className="bg-[#0d0d12] rounded-lg overflow-hidden border border-[#1f1f2e]">
        <div className="bg-[#08080c] py-3 px-4 flex items-center justify-center gap-8">
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={`ct-alive-${i}`}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  i < aliveCT
                    ? 'bg-[#6ba5e7] shadow-[0_0_6px_#6ba5e7]'
                    : 'bg-[#1a2a3d] border border-[#2a3a4d]'
                }`}
              />
            ))}
          </div>

          <div className="text-[10px] font-mono text-[#444]">VS</div>

          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={`t-alive-${i}`}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  i < aliveT
                    ? 'bg-[#dea345] shadow-[0_0_6px_#dea345]'
                    : 'bg-[#3d2a1a] border border-[#4d3a2a]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Box 3: Tabela CT */}
      <div className="bg-[#0d0d12] rounded-lg overflow-hidden border border-[#1f1f2e]">
        <table className="w-full border-collapse">
          <TeamTableHeader side="CT" teamName={teamCTName} score={scoreCT} />
          <tbody className="divide-y divide-[#1f1f2e]/50">
            {sortedCT.map((player, idx) => (
              <PlayerRow key={`ct-${player.steamId}-${idx}`} player={player} side="CT" />
            ))}
            {sortedCT.length === 0 && (
              <tr><td colSpan={9} className="py-4 text-center text-[11px] text-[#666]">Aguardando jogadores CT...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Box 4: Tabela T */}
      <div className="bg-[#0d0d12] rounded-lg overflow-hidden border border-[#1f1f2e]">
        <table className="w-full border-collapse">
          <TeamTableHeader side="T" teamName={teamTName} score={scoreT} />
          <tbody className="divide-y divide-[#1f1f2e]/50">
            {sortedT.map((player, idx) => (
              <PlayerRow key={`t-${player.steamId}-${idx}`} player={player} side="T" />
            ))}
            {sortedT.length === 0 && (
              <tr><td colSpan={9} className="py-4 text-center text-[11px] text-[#666]">Aguardando jogadores T...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente de seção de Mapas (Veto)
function MapsSection({
  teamCT,
  teamT,
  currentMap,
}: {
  teamCT: string;
  teamT: string;
  currentMap: string;
}) {
  // Mock de veto de mapas - depois será substituído por dados reais
  const vetoSteps = [
    { team: teamT, action: 'removed', map: 'Mirage' },
    { team: teamCT, action: 'removed', map: 'Inferno' },
    { team: teamT, action: 'picked', map: 'Overpass' },
    { team: teamCT, action: 'picked', map: 'Nuke' },
    { team: teamT, action: 'removed', map: 'Dust2' },
    { team: teamCT, action: 'removed', map: 'Anubis' },
    { team: '-', action: 'leftover', map: 'Ancient' },
  ];

  // Mock de mapas da série
  const maps = [
    { name: 'Overpass', teamCTScore: 13, teamTScore: 5, picker: teamT, status: 'completed', winner: teamCT },
    { name: 'Nuke', teamCTScore: 6, teamTScore: 13, picker: teamCT, status: 'completed', winner: teamT },
    { name: currentMap || 'Ancient', teamCTScore: 0, teamTScore: 0, picker: '-', status: 'live', winner: null },
  ];

  return (
    <div className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#27272A]">
        <h3 className="font-mono text-sm text-[#F5F5DC]">MAPS</h3>
        <span className="text-xs text-[#A1A1AA]">Best of 3</span>
      </div>

      {/* Veto de mapas */}
      <div className="p-4 border-b border-[#27272A] space-y-1.5">
        {vetoSteps.map((step, index) => (
          <div key={index} className="text-xs font-mono">
            <span className="text-[#A1A1AA]">{index + 1}. </span>
            <span className={step.team === teamCT ? 'text-[#3b82f6]' : step.team === teamT ? 'text-[#f59e0b]' : 'text-[#A1A1AA]'}>
              {step.team}
            </span>
            <span className={`ml-1 ${step.action === 'picked' ? 'text-green-500' : step.action === 'removed' ? 'text-red-500' : 'text-[#A1A1AA]'}`}>
              {step.action}
            </span>
            <span className="text-[#F5F5DC] ml-1">{step.map}</span>
          </div>
        ))}
      </div>

      {/* Mapas da série */}
      <div className="divide-y divide-[#27272A]">
        {maps.map((map, index) => (
          <div key={index} className={`p-3 ${map.status === 'live' ? 'bg-[#A855F7]/10' : ''}`}>
            {/* Nome do mapa com badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-1 w-8 rounded ${
                map.status === 'live' ? 'bg-[#A855F7]' :
                map.winner === teamCT ? 'bg-[#3b82f6]' :
                map.winner === teamT ? 'bg-[#f59e0b]' : 'bg-[#27272A]'
              }`} />
              <span className="font-display text-sm text-[#F5F5DC]">{map.name}</span>
              {map.status === 'live' && (
                <span className="px-1.5 py-0.5 bg-[#A855F7]/20 text-[#A855F7] text-[10px] font-mono rounded animate-pulse">
                  LIVE
                </span>
              )}
            </div>

            {/* Placar do mapa */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`font-display ${map.winner === teamCT ? 'text-[#3b82f6]' : 'text-[#A1A1AA]'}`}>
                  {teamCT}
                </span>
                {map.picker === teamCT && (
                  <span className="text-[8px] bg-[#3b82f6]/20 text-[#3b82f6] px-1 rounded">PICK</span>
                )}
              </div>
              <div className="font-mono">
                <span className={map.winner === teamCT ? 'text-[#3b82f6]' : 'text-[#A1A1AA]'}>{map.teamCTScore}</span>
                <span className="text-[#A1A1AA] mx-1">-</span>
                <span className={map.winner === teamT ? 'text-[#f59e0b]' : 'text-[#A1A1AA]'}>{map.teamTScore}</span>
              </div>
              <div className="flex items-center gap-2">
                {map.picker === teamT && (
                  <span className="text-[8px] bg-[#f59e0b]/20 text-[#f59e0b] px-1 rounded">PICK</span>
                )}
                <span className={`font-display ${map.winner === teamT ? 'text-[#f59e0b]' : 'text-[#A1A1AA]'}`}>
                  {teamT}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente de seção Watch (Streams)
function WatchSection() {
  // Mock de streams - depois será substituído por dados reais
  const streams = [
    { name: 'HLTV Live', viewers: null, isOfficial: true, lang: null },
    { name: 'zoneR', viewers: 2347, isOfficial: false, lang: '🇷🇺' },
    { name: 'Lent', viewers: 759, isOfficial: false, lang: '🇷🇺' },
    { name: 'CCT 2', viewers: 682, isOfficial: false, lang: '🇧🇷' },
    { name: 'hooch', viewers: 584, isOfficial: false, lang: '🇷🇺' },
    { name: 'BetBoom 3', viewers: 250, isOfficial: false, lang: '🇧🇷' },
  ];

  return (
    <div className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#27272A]">
        <h3 className="font-mono text-sm text-[#F5F5DC]">WATCH</h3>
      </div>

      <div className="divide-y divide-[#27272A]">
        {streams.map((stream, index) => (
          <div
            key={index}
            className={`p-3 flex items-center justify-between hover:bg-[#1a1a2e] cursor-pointer transition-colors ${
              stream.isOfficial ? 'bg-[#A855F7]/10' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              {stream.lang && <span className="text-sm">{stream.lang}</span>}
              <span className={`text-sm ${stream.isOfficial ? 'text-[#A855F7] font-display' : 'text-[#F5F5DC]'}`}>
                {stream.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {stream.viewers && (
                <span className="text-xs font-mono text-[#A1A1AA]">{stream.viewers.toLocaleString()}</span>
              )}
              <svg className="w-4 h-4 text-[#A1A1AA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15,3 21,3 21,9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente de Game Log (todos os eventos do round)
function GameLog({
  events,
  currentRound
}: {
  events: GameLogEvent[];
  currentRound: number;
}) {
  // Agrupar eventos por round
  const eventsByRound = events.reduce((acc, event) => {
    const round = event.round || 0;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(event);
    return acc;
  }, {} as Record<number, GameLogEvent[]>);

  // Ordenar rounds do mais recente para o mais antigo
  const sortedRounds = Object.keys(eventsByRound)
    .map(Number)
    .sort((a, b) => b - a);

  // Ordenar eventos dentro de cada round por tick (mais novo primeiro, mais antigo embaixo)
  // Quando ticks são iguais, round_end deve aparecer por último (no topo visualmente)
  const sortEventsByTick = (events: GameLogEvent[]) => {
    // Prioridade: menor número = aparece primeiro no sort descrescente = topo visual
    const typePriority: Record<string, number> = {
      'round_end': 0,      // Sempre no topo (último cronologicamente)
      'bomb_exploded': 1,  // Logo abaixo do round_end
      'bomb_defused': 1,
      'kill': 2,           // Kills no meio
      'bomb_planted': 3,   // Plantio antes das kills
      'round_start': 4,    // Início do round na base
    };

    return [...events].sort((a, b) => {
      // Primeiro, ordenar por tick (decrescente)
      if (a.tick !== b.tick) {
        return b.tick - a.tick;
      }
      // Se ticks iguais, ordenar por prioridade de tipo
      return (typePriority[a.type] ?? 2) - (typePriority[b.type] ?? 2);
    });
  };

  // Renderizar evento individual
  const renderEvent = (event: GameLogEvent, index: number) => {
    switch (event.type) {
      case 'kill':
        return (
          <div key={event.id} className="px-4 py-3 hover:bg-[#1a1a2e] transition-colors">
            <div className="flex items-center gap-3 text-sm">
              <span className={`font-display ${event.data.attacker?.team === "CT" ? "text-[#3b82f6]" : "text-[#f59e0b]"}`}>
                {event.data.attacker?.name || "World"}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#27272A]">
                {event.data.headshot && (
                  <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M12 14c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5z" />
                  </svg>
                )}
                {event.data.wallbang && <span className="text-[10px] text-yellow-500 font-mono">WB</span>}
                {event.data.throughSmoke && <span className="text-[10px] text-gray-400 font-mono">SMOKE</span>}
                {event.data.noScope && <span className="text-[10px] text-purple-500 font-mono">NOSCOPE</span>}
                <span className="text-xs font-mono text-[#A1A1AA]">{event.data.weapon}</span>
              </div>
              <span className={`font-display ${event.data.victim?.team === "CT" ? "text-[#3b82f6]" : "text-[#f59e0b]"}`}>
                {event.data.victim?.name}
              </span>
            </div>
          </div>
        );

      case 'bomb_planted':
        return (
          <div key={event.id} className="px-4 py-3 bg-red-500/10 border-l-4 border-red-500">
            <div className="flex items-center gap-3 text-sm">
              <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z" />
              </svg>
              <span className="text-red-500 font-display font-semibold">Bomba plantada</span>
              <span className="text-xs font-mono text-[#A1A1AA] bg-[#27272A] px-2 py-0.5 rounded">Site {event.data.site}</span>
              {event.data.planter && (
                <span className="text-xs text-[#f59e0b]">por {event.data.planter.name}</span>
              )}
            </div>
          </div>
        );

      case 'bomb_defused':
        return (
          <div key={event.id} className="px-4 py-3 bg-[#3b82f6]/10 border-l-4 border-[#3b82f6]">
            <div className="flex items-center gap-3 text-sm">
              <svg className="w-4 h-4 text-[#3b82f6]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span className="text-[#3b82f6] font-display font-semibold">Bomba desarmada</span>
              {event.data.defuser && (
                <span className="text-xs text-[#3b82f6]">por {event.data.defuser.name}</span>
              )}
            </div>
          </div>
        );

      case 'bomb_exploded':
        return (
          <div key={event.id} className="px-4 py-3 bg-[#f59e0b]/10 border-l-4 border-[#f59e0b]">
            <div className="flex items-center gap-3 text-sm">
              <svg className="w-4 h-4 text-[#f59e0b]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-[#f59e0b] font-display font-semibold">Bomba explodiu</span>
            </div>
          </div>
        );

      case 'round_end':
        const winnerColor = event.data.winner === 'CT' ? 'text-[#3b82f6]' : 'text-[#f59e0b]';
        const winnerBg = event.data.winner === 'CT' ? 'bg-[#3b82f6]/20 border-[#3b82f6]' : 'bg-[#f59e0b]/20 border-[#f59e0b]';
        return (
          <div key={event.id} className={`px-4 py-3 ${winnerBg} border-l-4`}>
            <div className="flex items-center gap-3 text-sm">
              <svg className={`w-4 h-4 ${winnerColor}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className={`font-display font-semibold ${winnerColor}`}>
                Vencedor: {event.data.winner}
              </span>
              <span className="text-sm font-mono text-[#F5F5DC] bg-[#27272A] px-2 py-0.5 rounded">
                {event.data.scoreCT} - {event.data.scoreT}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Contar kills por round
  const getKillCount = (roundEvents: GameLogEvent[]) => {
    return roundEvents.filter(e => e.type === 'kill').length;
  };

  return (
    <div className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
        <h3 className="font-mono text-sm text-[#F5F5DC]">GAME LOG</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#A1A1AA]">
            Aguardando eventos...
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {sortedRounds.map((round) => (
              <div
                key={`round-${round}`}
                className="bg-[#0A0A0A] rounded-xl overflow-hidden border border-[#27272A]"
              >
                {/* Header do Round */}
                <div className="px-4 py-3 bg-gradient-to-r from-[#A855F7]/20 to-transparent border-b border-[#27272A]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-[#A855F7]">
                        ROUND {round}
                      </span>
                      {round === currentRound && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 text-[10px] font-mono rounded-full animate-pulse">
                          ● LIVE
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-[#A1A1AA] bg-[#27272A]/50 px-2 py-1 rounded">
                      {getKillCount(eventsByRound[round])} kill{getKillCount(eventsByRound[round]) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {/* Eventos do round */}
                <div className="divide-y divide-[#27272A]/50">
                  {sortEventsByTick(eventsByRound[round]).map((event, index) => renderEvent(event, index))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente do placar principal expandido
function MainScoreboard({
  teamCT,
  teamT,
  scoreCT,
  scoreT,
  mapName,
  currentRound,
  roundPhase,
}: {
  teamCT?: { name: string; logo?: string };
  teamT?: { name: string; logo?: string };
  scoreCT: number;
  scoreT: number;
  mapName: string;
  currentRound: number;
  roundPhase: string;
}) {
  return (
    <div className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden">
      {/* Header com mapa e fase */}
      <div className="bg-[#0A0A0A] p-3 flex items-center justify-between border-b border-[#27272A]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#A855F7]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="font-mono text-sm text-[#A855F7]">{mapName || "Mapa desconhecido"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#A1A1AA]">ROUND {currentRound}</span>
          <span className={`px-2 py-1 rounded text-xs font-mono ${
            roundPhase === "live" ? "bg-green-500/20 text-green-500" :
            roundPhase === "freezetime" ? "bg-blue-500/20 text-blue-500" :
            roundPhase === "bomb_planted" ? "bg-red-500/20 text-red-500 animate-pulse" :
            roundPhase === "over" ? "bg-gray-500/20 text-gray-500" :
            "bg-[#27272A] text-[#A1A1AA]"
          }`}>
            {roundPhase.toUpperCase().replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Placar principal */}
      <div className="p-6">
        <div className="flex items-center justify-center gap-8">
          {/* CT Side */}
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-4">
              <div>
                <span className="font-display text-2xl text-[#3b82f6] block">
                  {teamCT?.name || "Counter-Terrorists"}
                </span>
                <span className="text-xs font-mono text-[#A1A1AA]">CT SIDE</span>
              </div>
              {teamCT?.logo ? (
                <img src={teamCT.logo} alt={teamCT.name} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-[#3b82f6]/20 border border-[#3b82f6]/50 flex items-center justify-center">
                  <span className="font-display text-2xl text-[#3b82f6]">CT</span>
                </div>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-4 px-8">
            <span className="font-display text-6xl text-[#3b82f6]">{scoreCT}</span>
            <span className="text-4xl text-[#A1A1AA]">:</span>
            <span className="font-display text-6xl text-[#f59e0b]">{scoreT}</span>
          </div>

          {/* T Side */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-4">
              {teamT?.logo ? (
                <img src={teamT.logo} alt={teamT.name} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-[#f59e0b]/20 border border-[#f59e0b]/50 flex items-center justify-center">
                  <span className="font-display text-2xl text-[#f59e0b]">T</span>
                </div>
              )}
              <div>
                <span className="font-display text-2xl text-[#f59e0b] block">
                  {teamT?.name || "Terrorists"}
                </span>
                <span className="text-xs font-mono text-[#A1A1AA]">T SIDE</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Componente de tabela pré-partida com jogadores do Supabase
function PreMatchPlayerTable({
  teamPlayers,
  teamName,
  teamLogo,
  teamSide,
  onlineSteamIds,
}: {
  teamPlayers: SupabasePlayer[];
  teamName: string;
  teamLogo: string | null;
  teamSide: 'CT' | 'T';
  onlineSteamIds: Set<string>;
}) {
  const teamColorClass = teamSide === 'CT' ? 'text-[#3b82f6]' : 'text-[#f59e0b]';
  const teamBgClass = teamSide === 'CT' ? 'bg-[#3b82f6]/10' : 'bg-[#f59e0b]/10';
  const teamBorderClass = teamSide === 'CT' ? 'border-[#3b82f6]/30' : 'border-[#f59e0b]/30';
  const teamIconBg = teamSide === 'CT' ? 'bg-[#3b82f6]' : 'bg-[#f59e0b]';

  return (
    <div className={`bg-[#1a1a2e] border ${teamBorderClass} rounded-lg overflow-hidden`}>
      {/* Header do time */}
      <div className={`${teamBgClass} px-4 py-3 flex items-center gap-3 border-b ${teamBorderClass}`}>
        {teamLogo ? (
          <img src={teamLogo} alt={teamName} className="w-6 h-6 rounded object-cover" />
        ) : (
          <div className={`w-6 h-6 rounded ${teamIconBg} flex items-center justify-center`}>
            <span className="text-white text-xs font-bold">{teamSide}</span>
          </div>
        )}
        <span className={`font-display text-base ${teamColorClass}`}>{teamName}</span>
      </div>

      {/* Tabela de jogadores */}
      <table className="w-full">
        <thead>
          <tr className="text-[11px] font-mono text-[#71717A] border-b border-[#27272A]">
            <th className="text-left px-4 py-2.5 w-[35%]">
              <span className="text-[#f59e0b]">P</span> Players
            </th>
            <th className="text-center px-3 py-2.5 w-[13%] border-l border-[#27272A]">K-D</th>
            <th className="text-center px-3 py-2.5 w-[13%] border-l border-[#27272A]">Swing</th>
            <th className="text-center px-3 py-2.5 w-[13%] border-l border-[#27272A]">ADR</th>
            <th className="text-center px-3 py-2.5 w-[13%] border-l border-[#27272A]">KAST</th>
            <th className="text-right px-4 py-2.5 w-[13%] border-l border-[#27272A]">
              <span>Rating</span>
              <span className="text-[9px] text-[#52525B] ml-1">3.0</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {teamPlayers.map((tp) => {
            const playerName = tp.nickname || tp.profiles?.username || 'Jogador';
            const steamId = tp.steam_id || tp.profiles?.steam_id || '';
            const isOnline = steamId ? onlineSteamIds.has(steamId) : false;
            const avatarUrl = tp.profiles?.avatar_url;
            const profileId = tp.profiles?.id;

            return (
              <tr
                key={tp.profile_id}
                className={`border-b border-[#27272A]/50 transition-colors ${
                  isOnline ? 'hover:bg-[#252540]' : 'opacity-40'
                }`}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={playerName} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-[#71717A]">
                          {playerName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Nome + link para perfil */}
                    <div className="flex flex-col">
                      {profileId ? (
                        <Link
                          href={`/campeonatos/jogador/${profileId}`}
                          className="text-sm text-[#F5F5DC] font-medium hover:text-[#A855F7] transition-colors"
                        >
                          {playerName}
                        </Link>
                      ) : (
                        <span className="text-sm text-[#F5F5DC] font-medium">{playerName}</span>
                      )}
                      {tp.role && (
                        <span className="text-[9px] font-mono text-[#71717A] uppercase">{tp.role}</span>
                      )}
                    </div>
                    {/* Indicador online */}
                    {isOnline && (
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-auto" title="No servidor" />
                    )}
                  </div>
                </td>
                <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                  <span className="text-sm font-mono text-[#71717A]">-</span>
                </td>
                <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                  <span className="text-sm font-mono text-[#71717A]">-</span>
                </td>
                <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                  <span className="text-sm font-mono text-[#71717A]">-</span>
                </td>
                <td className="text-center px-3 py-2.5 border-l border-[#27272A]">
                  <span className="text-sm font-mono text-[#71717A]">-</span>
                </td>
                <td className="text-right px-4 py-2.5 border-l border-[#27272A]">
                  <span className="text-sm font-bold font-mono text-[#71717A]">-</span>
                </td>
              </tr>
            );
          })}
          {teamPlayers.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#71717A]">
                Sem jogadores cadastrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Helper: detectar se matchId é um UUID do Supabase
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Página principal da partida
export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const rawMatchId = params.matchId as string;
  const [matchId, setMatchId] = useState<string>(rawMatchId);
  const [resolving, setResolving] = useState(!isUUID(rawMatchId));

  // Se matchId não é UUID (é GOTV stream ID), resolver via GOTV server
  useEffect(() => {
    if (isUUID(rawMatchId)) {
      setMatchId(rawMatchId);
      setResolving(false);
      return;
    }

    async function resolveGOTVId() {
      try {
        const gotvUrl = process.env.NEXT_PUBLIC_GOTV_SERVER_URL || 'http://localhost:8080';
        let httpUrl = gotvUrl;
        if (gotvUrl.startsWith('wss://')) httpUrl = gotvUrl.replace('wss://', 'https://');
        else if (gotvUrl.startsWith('ws://')) httpUrl = gotvUrl.replace('ws://', 'http://');

        const res = await fetch(`${httpUrl}/api/matches`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          const found = (data.matches || []).find((m: any) => m.matchId === rawMatchId && m.dbMatchId);
          if (found?.dbMatchId) {
            router.replace(`/campeonatos/partida/${found.dbMatchId}`);
            return;
          }
        }
      } catch {
        // GOTV server offline, fallback
      }
      // No match found - use raw ID (will show error page)
      setMatchId(rawMatchId);
      setResolving(false);
    }

    resolveGOTVId();
  }, [rawMatchId, router]);

  // Dados do Supabase (pré-partida)
  const [dbMatch, setDbMatch] = useState<SupabaseMatchData | null>(null);
  const [team1Players, setTeam1Players] = useState<SupabasePlayer[]>([]);
  const [team2Players, setTeam2Players] = useState<SupabasePlayer[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  const {
    matchState,
    players,
    gameLog,
    isConnected,
    isConnecting,
    team1,
    team2,
    phase,
  } = useGOTV({ matchId });

  // Buscar dados da partida no Supabase
  useEffect(() => {
    async function fetchMatchData() {
      try {
        const { data: match, error } = await supabase
          .from("matches")
          .select(`
            id, status, scheduled_at, round, best_of, team1_score, team2_score, map_name,
            team1:teams!matches_team1_id_fkey(id, name, tag, logo_url),
            team2:teams!matches_team2_id_fkey(id, name, tag, logo_url),
            tournament:tournaments!matches_tournament_id_fkey(name)
          `)
          .eq("id", matchId)
          .single();

        if (error || !match) {
          setDbError(true);
          setDbLoading(false);
          return;
        }

        setDbMatch(match as unknown as SupabaseMatchData);

        // Buscar jogadores dos dois times em paralelo
        const team1Id = (match.team1 as unknown as { id: string })?.id;
        const team2Id = (match.team2 as unknown as { id: string })?.id;

        const [t1, t2] = await Promise.all([
          team1Id
            ? supabase
                .from("team_players")
                .select("profile_id, role, steam_id, nickname, profiles(id, username, avatar_url, level, steam_id)")
                .eq("team_id", team1Id)
                .eq("is_active", true)
            : Promise.resolve({ data: [] }),
          team2Id
            ? supabase
                .from("team_players")
                .select("profile_id, role, steam_id, nickname, profiles(id, username, avatar_url, level, steam_id)")
                .eq("team_id", team2Id)
                .eq("is_active", true)
            : Promise.resolve({ data: [] }),
        ]);

        setTeam1Players((t1.data || []) as unknown as SupabasePlayer[]);
        setTeam2Players((t2.data || []) as unknown as SupabasePlayer[]);
      } catch {
        setDbError(true);
      } finally {
        setDbLoading(false);
      }
    }

    fetchMatchData();
  }, [matchId]);

  // Set de steamIds online (jogadores conectados ao GOTV)
  const onlineSteamIds = new Set(
    players.filter(p => p.steamId && p.steamId !== "0").map(p => p.steamId)
  );

  // Determinar nomes dos times (preferir team1/team2 do MatchZy quando disponíveis)
  const isGenericName = (name: string) =>
    !name || name === "Counter-Terrorists" || name === "Terrorists" || name === "CT" || name === "T";

  const getTeamName = (side: 'CT' | 'T', fallback: string) => {
    // Preferir nomes do MatchZy (team1/team2 com sides)
    if (team1 && team2) {
      if (team1.currentSide === side && !isGenericName(team1.name)) return team1.name;
      if (team2.currentSide === side && !isGenericName(team2.name)) return team2.name;
    }
    // Fallback do Supabase primeiro (mais confiável que GOTV genérico)
    if (!isGenericName(fallback)) return fallback;
    // Último recurso: GOTV
    if (side === 'CT' && matchState?.teamCT?.name) return matchState.teamCT.name;
    if (side === 'T' && matchState?.teamT?.name) return matchState.teamT.name;
    return fallback;
  };

  const teamCTName = getTeamName('CT', dbMatch?.team1?.name || 'Counter-Terrorists');
  const teamTName = getTeamName('T', dbMatch?.team2?.name || 'Terrorists');

  // Ordenar jogadores por kills
  const sortedPlayersCT = players
    .filter((p) => p.team === "CT")
    .sort((a, b) => b.kills - a.kills);

  const sortedPlayersT = players
    .filter((p) => p.team === "T")
    .sort((a, b) => b.kills - a.kills);

  // Estado de carregamento inicial (resolver GOTV ID + Supabase + GOTV)
  if (resolving || dbLoading || (isConnecting && !matchState)) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#A1A1AA] font-mono text-sm">Carregando partida...</span>
        </div>
      </div>
    );
  }

  // Partida realmente não encontrada no banco
  if (dbError && !dbMatch && !matchState) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <TournamentHeader />
        <main className="flex-1 pt-20 pb-8 px-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#27272A] flex items-center justify-center">
              <svg className="w-10 h-10 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">Partida não encontrada</h1>
            <p className="text-[#A1A1AA] text-sm mb-6">
              A partida pode ter sido removida ou o link está incorreto.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-[#27272A] text-[#F5F5DC] rounded-lg font-mono text-sm hover:bg-[#3f3f46] transition-colors"
              >
                Voltar
              </button>
              <Link
                href="/campeonatos"
                className="px-4 py-2 bg-[#A855F7] text-white rounded-lg font-mono text-sm hover:bg-[#9333EA] transition-colors"
              >
                Ver campeonatos
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // === PRÉ-PARTIDA: Temos dados do Supabase mas sem GOTV (partida ainda não começou) ===
  if (!matchState && dbMatch) {
    const scheduledDate = dbMatch.scheduled_at ? new Date(dbMatch.scheduled_at) : null;
    const roundLabel = dbMatch.round?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';

    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <TournamentHeader />

        {/* Conteúdo pré-partida */}
        <main className="flex-1 pt-20 pb-8 px-4">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Placar principal pré-partida */}
            <div className="bg-[#0f0f15] border border-[#27272A] rounded-xl p-6">
              {/* Torneio e round */}
              <div className="text-center mb-4">
                {dbMatch.tournament?.name && (
                  <span className="text-[#A855F7] text-xs font-mono uppercase tracking-wider">
                    {dbMatch.tournament.name}
                  </span>
                )}
                {roundLabel && (
                  <span className="text-[#71717A] text-xs font-mono ml-2">
                    {roundLabel}
                  </span>
                )}
                {dbMatch.best_of > 1 && (
                  <span className="text-[#52525B] text-xs font-mono ml-2">
                    BO{dbMatch.best_of}
                  </span>
                )}
              </div>

              {/* Times vs Times */}
              <div className="flex items-center justify-center gap-8">
                {/* Time 1 */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-[#1a1a2e] border border-[#27272A] flex items-center justify-center overflow-hidden">
                    {dbMatch.team1?.logo_url ? (
                      <img src={dbMatch.team1.logo_url} alt={dbMatch.team1.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="font-display text-2xl text-[#3b82f6]">
                        {dbMatch.team1?.tag?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <span className="font-display text-lg text-[#F5F5DC]">{dbMatch.team1?.name || 'TBD'}</span>
                  {dbMatch.team1?.tag && (
                    <span className="text-[10px] font-mono text-[#71717A]">{dbMatch.team1.tag}</span>
                  )}
                </div>

                {/* Score / VS */}
                <div className="flex flex-col items-center gap-1">
                  {dbMatch.status === 'finished' ? (
                    <div className="flex items-center gap-3">
                      <span className="font-display text-4xl text-[#F5F5DC]">{dbMatch.team1_score}</span>
                      <span className="text-[#71717A] text-lg">:</span>
                      <span className="font-display text-4xl text-[#F5F5DC]">{dbMatch.team2_score}</span>
                    </div>
                  ) : (
                    <span className="font-display text-3xl text-[#71717A]">VS</span>
                  )}
                  {scheduledDate && dbMatch.status !== 'finished' && (
                    <div className="flex flex-col items-center gap-0.5 mt-2">
                      <span className="text-[#A1A1AA] text-xs font-mono">
                        {scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <span className="text-[#F5F5DC] text-sm font-mono font-bold">
                        {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Time 2 */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-[#1a1a2e] border border-[#27272A] flex items-center justify-center overflow-hidden">
                    {dbMatch.team2?.logo_url ? (
                      <img src={dbMatch.team2.logo_url} alt={dbMatch.team2.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="font-display text-2xl text-[#f59e0b]">
                        {dbMatch.team2?.tag?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <span className="font-display text-lg text-[#F5F5DC]">{dbMatch.team2?.name || 'TBD'}</span>
                  {dbMatch.team2?.tag && (
                    <span className="text-[10px] font-mono text-[#71717A]">{dbMatch.team2.tag}</span>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              {isConnecting && (
                <div className="text-center mt-4">
                  <span className="inline-flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
                    <span className="w-3 h-3 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                    Conectando ao servidor...
                  </span>
                </div>
              )}
            </div>

            {/* Tabelas de jogadores */}
            <div className="space-y-4">
              <PreMatchPlayerTable
                teamPlayers={team1Players}
                teamName={dbMatch.team1?.name || 'Time 1'}
                teamLogo={dbMatch.team1?.logo_url || null}
                teamSide="CT"
                onlineSteamIds={onlineSteamIds}
              />
              <PreMatchPlayerTable
                teamPlayers={team2Players}
                teamName={dbMatch.team2?.name || 'Time 2'}
                teamLogo={dbMatch.team2?.logo_url || null}
                teamSide="T"
                onlineSteamIds={onlineSteamIds}
              />
            </div>

          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <TournamentHeader />

      {/* Conteúdo */}
      <main className="flex-1 pt-20 pb-8 px-4">
        <div className="space-y-4">
          {/* Placar principal */}
          {matchState && (
            <MainScoreboard
              teamCT={matchState.teamCT?.name && matchState.teamCT.name !== "Counter-Terrorists"
                ? { name: matchState.teamCT.name, logo: matchState.teamCT.logoUrl }
                : { name: dbMatch?.team1?.name || matchState.teamCT?.name || "Counter-Terrorists", logo: dbMatch?.team1?.logo_url || matchState.teamCT?.logoUrl }}
              teamT={matchState.teamT?.name && matchState.teamT.name !== "Terrorists"
                ? { name: matchState.teamT.name, logo: matchState.teamT.logoUrl }
                : { name: dbMatch?.team2?.name || matchState.teamT?.name || "Terrorists", logo: dbMatch?.team2?.logo_url || matchState.teamT?.logoUrl }}
              scoreCT={matchState.scoreCT}
              scoreT={matchState.scoreT}
              mapName={matchState.mapName || dbMatch?.map_name || ""}
              currentRound={matchState.currentRound}
              roundPhase={matchState.roundPhase}
            />
          )}

          {/* Layout principal: Maps | Scoreboard + Kill Feed | Watch */}
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-4">
            {/* Coluna esquerda: Maps */}
            <div className="order-2 lg:order-1">
              <MapsSection
                teamCT={teamCTName}
                teamT={teamTName}
                currentMap={matchState?.mapName || dbMatch?.map_name || ""}
              />
            </div>

            {/* Área central: Scorebot + Scoreboards + Kill Feed */}
            <div className="order-1 lg:order-2 space-y-4">
              {/* Indicador de fase (se disponível) */}
              {phase && phase !== 'live' && phase !== 'idle' && (
                <div className="text-center">
                  <span className={`inline-block px-3 py-1 text-xs font-mono rounded ${
                    phase === 'warmup' ? 'bg-yellow-500/20 text-yellow-500' :
                    phase === 'knife' ? 'bg-orange-500/20 text-orange-500' :
                    phase === 'halftime' ? 'bg-blue-500/20 text-blue-500' :
                    phase === 'overtime' ? 'bg-red-500/20 text-red-500' :
                    phase === 'paused' ? 'bg-gray-500/20 text-gray-500' :
                    phase === 'finished' ? 'bg-green-500/20 text-green-500' :
                    'bg-purple-500/20 text-purple-500'
                  }`}>
                    {phase === 'warmup' && 'WARMUP'}
                    {phase === 'knife' && 'KNIFE ROUND'}
                    {phase === 'halftime' && 'HALFTIME'}
                    {phase === 'overtime' && 'OVERTIME'}
                    {phase === 'paused' && 'PAUSADO'}
                    {phase === 'finished' && 'FINALIZADO'}
                  </span>
                </div>
              )}

              {/* Live Scorebot - Estado atual do round */}
              <LiveScorebot
                playersCT={sortedPlayersCT}
                playersT={sortedPlayersT}
                teamCTName={teamCTName}
                teamTName={teamTName}
                scoreCT={matchState?.scoreCT || 0}
                scoreT={matchState?.scoreT || 0}
                currentRound={matchState?.currentRound || 1}
                mapName={matchState?.mapName || dbMatch?.map_name || ""}
                roundPhase={matchState?.roundPhase || "live"}
                roundTimeRemaining={matchState?.roundTimeRemaining}
              />

              {/* Game Log - Entre o scorebot e as tabelas */}
              <GameLog
                events={gameLog}
                currentRound={matchState?.currentRound || 0}
              />

              {/* Scoreboards um embaixo do outro */}
              <div className="space-y-4">
                {/* CT Scoreboard */}
                <TeamScoreboardTable
                  players={sortedPlayersCT}
                  teamName={teamCTName}
                  teamSide="CT"
                  currentRound={matchState?.currentRound || 1}
                  dbPlayers={teamCTName === dbMatch?.team1?.name ? team1Players : teamCTName === dbMatch?.team2?.name ? team2Players : undefined}
                  teamLogo={teamCTName === dbMatch?.team1?.name ? dbMatch?.team1?.logo_url : teamCTName === dbMatch?.team2?.name ? dbMatch?.team2?.logo_url : null}
                />

                {/* T Scoreboard */}
                <TeamScoreboardTable
                  players={sortedPlayersT}
                  teamName={teamTName}
                  teamSide="T"
                  currentRound={matchState?.currentRound || 1}
                  dbPlayers={teamTName === dbMatch?.team2?.name ? team2Players : teamTName === dbMatch?.team1?.name ? team1Players : undefined}
                  teamLogo={teamTName === dbMatch?.team2?.name ? dbMatch?.team2?.logo_url : teamTName === dbMatch?.team1?.name ? dbMatch?.team1?.logo_url : null}
                />
              </div>
            </div>

            {/* Coluna direita: Watch */}
            <div className="order-3 lg:order-3">
              <WatchSection />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
