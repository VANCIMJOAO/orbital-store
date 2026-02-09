"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TournamentHeader } from "@/components/TournamentHeader";
import { useGOTVMatches, useGOTV } from "@/hooks/useGOTV";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { GOTVPlayerState, KillFeedEntry } from "@/lib/gotv/types";

interface DBLiveMatch {
  id: string;
  team1: { name: string; tag: string } | null;
  team2: { name: string; tag: string } | null;
  team1_score: number;
  team2_score: number;
  scheduled_at: string | null;
  round: string | null;
  tournament: { name: string } | null;
}

// Componente para exibir uma partida ao vivo
function LiveMatchViewer({ matchId }: { matchId: string }) {
  const {
    matchState,
    players,
    killFeed,
    roundHistory,
    isConnected,
    isConnecting,
  } = useGOTV({ matchId });

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#A1A1AA] font-mono text-sm">Conectando...</span>
        </div>
      </div>
    );
  }

  if (!matchState) {
    return (
      <div className="text-center py-12">
        <span className="text-[#A1A1AA] font-mono text-sm">Aguardando dados da partida...</span>
      </div>
    );
  }

  const playersCT = players.filter((p) => p.team === "CT");
  const playersT = players.filter((p) => p.team === "T");

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-xs font-mono text-[#A1A1AA]">
            {isConnected ? "CONECTADO" : "DESCONECTADO"}
          </span>
        </div>
        <span className="text-xs font-mono text-[#A1A1AA]">
          Tick: {matchState.lastTick}
        </span>
      </div>

      {/* Placar Principal */}
      <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-6">
        <div className="text-center mb-4">
          <span className="text-xs font-mono text-[#A855F7]">{matchState.mapName || "Mapa desconhecido"}</span>
          <span className="text-xs font-mono text-[#A1A1AA] mx-2">•</span>
          <span className="text-xs font-mono text-[#A1A1AA]">Round {matchState.currentRound}</span>
          <span className="text-xs font-mono text-[#A1A1AA] mx-2">•</span>
          <span className={`text-xs font-mono ${
            matchState.roundPhase === "live" ? "text-green-500" :
            matchState.roundPhase === "freezetime" ? "text-blue-500" :
            matchState.roundPhase === "bomb_planted" ? "text-red-500" :
            "text-[#A1A1AA]"
          }`}>
            {matchState.roundPhase.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-center gap-8">
          {/* CT Side */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="font-display text-xl text-[#3b82f6] block">
                {matchState.teamCT?.name || "Counter-Terrorists"}
              </span>
              <span className="text-xs font-mono text-[#A1A1AA]">CT</span>
            </div>
            <span className="font-display text-4xl text-[#3b82f6]">{matchState.scoreCT}</span>
          </div>

          <span className="text-2xl text-[#A1A1AA]">:</span>

          {/* T Side */}
          <div className="flex items-center gap-4">
            <span className="font-display text-4xl text-[#f59e0b]">{matchState.scoreT}</span>
            <div className="text-left">
              <span className="font-display text-xl text-[#f59e0b] block">
                {matchState.teamT?.name || "Terrorists"}
              </span>
              <span className="text-xs font-mono text-[#A1A1AA]">T</span>
            </div>
          </div>
        </div>

        {/* Bomb State */}
        {matchState.bomb && (
          <div className="text-center mt-4">
            <span className={`text-xs font-mono px-3 py-1 rounded ${
              matchState.bomb.state === "planted" ? "bg-red-500/20 text-red-500" :
              matchState.bomb.state === "defused" ? "bg-green-500/20 text-green-500" :
              matchState.bomb.state === "exploded" ? "bg-orange-500/20 text-orange-500" :
              "bg-[#27272A] text-[#A1A1AA]"
            }`}>
              BOMBA: {matchState.bomb.state.toUpperCase()}
              {matchState.bomb.site && ` - SITE ${matchState.bomb.site}`}
            </span>
          </div>
        )}
      </div>

      {/* Round History */}
      {roundHistory.length > 0 && (
        <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
          <h3 className="text-xs font-mono text-[#A1A1AA] mb-3">HISTÓRICO DE ROUNDS</h3>
          <div className="flex flex-wrap gap-1">
            {roundHistory.map((round, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded text-[10px] font-mono flex items-center justify-center ${
                  round.winner === "CT"
                    ? "bg-[#3b82f6]/30 text-[#3b82f6]"
                    : "bg-[#f59e0b]/30 text-[#f59e0b]"
                }`}
                title={round.reason}
              >
                {round.round}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Players - Tabelas Unificadas (CT em cima, T embaixo) */}
      <div className="space-y-4">
        {/* CT Players */}
        <div className="bg-[#12121a] border border-[#3b82f6]/30 rounded-lg overflow-hidden">
          <div className="p-3 bg-[#3b82f6]/10 border-b border-[#3b82f6]/30">
            <span className="font-mono text-sm text-[#3b82f6]">COUNTER-TERRORISTS</span>
          </div>
          <div className="divide-y divide-[#27272A]">
            <div className="grid grid-cols-6 gap-2 px-3 py-2 text-[10px] font-mono text-[#A1A1AA]">
              <span className="col-span-2">PLAYER</span>
              <span className="text-center">HP</span>
              <span className="text-center">K</span>
              <span className="text-center">D</span>
              <span className="text-center">$</span>
            </div>
            {playersCT.map((player, index) => (
              <PlayerRow key={`ct-${player.steamId}-${index}`} player={player} />
            ))}
            {playersCT.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-[#A1A1AA]">
                Sem jogadores
              </div>
            )}
          </div>
        </div>

        {/* T Players */}
        <div className="bg-[#12121a] border border-[#f59e0b]/30 rounded-lg overflow-hidden">
          <div className="p-3 bg-[#f59e0b]/10 border-b border-[#f59e0b]/30">
            <span className="font-mono text-sm text-[#f59e0b]">TERRORISTS</span>
          </div>
          <div className="divide-y divide-[#27272A]">
            <div className="grid grid-cols-6 gap-2 px-3 py-2 text-[10px] font-mono text-[#A1A1AA]">
              <span className="col-span-2">PLAYER</span>
              <span className="text-center">HP</span>
              <span className="text-center">K</span>
              <span className="text-center">D</span>
              <span className="text-center">$</span>
            </div>
            {playersT.map((player, index) => (
              <PlayerRow key={`t-${player.steamId}-${index}`} player={player} />
            ))}
            {playersT.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-[#A1A1AA]">
                Sem jogadores
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kill Feed agrupado por rounds */}
      {killFeed.length > 0 && (
        <div className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden">
          <div className="p-3 border-b border-[#27272A]">
            <h3 className="text-xs font-mono text-[#A1A1AA]">KILL FEED</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {(() => {
              // Agrupar kills por round
              const killsByRound = killFeed.reduce((acc, kill) => {
                const round = kill.round || 0;
                if (!acc[round]) acc[round] = [];
                acc[round].push(kill);
                return acc;
              }, {} as Record<number, KillFeedEntry[]>);

              // Ordenar rounds do mais recente para o mais antigo
              const sortedRounds = Object.keys(killsByRound).map(Number).sort((a, b) => b - a);

              return sortedRounds.map((round) => (
                <div key={`round-${round}`}>
                  <div className="px-3 py-1.5 bg-[#0A0A0A] sticky top-0">
                    <span className="text-[10px] font-mono text-[#A855F7]">ROUND {round}</span>
                  </div>
                  {killsByRound[round].map((kill, index) => (
                    <KillFeedRow key={`${kill.id || 'kill'}-${index}`} kill={kill} />
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de linha do jogador
function PlayerRow({ player }: { player: GOTVPlayerState }) {
  return (
    <div className={`grid grid-cols-6 gap-2 px-3 py-2 ${!player.isAlive ? "opacity-40" : ""}`}>
      <div className="col-span-2 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${player.isAlive ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-sm text-[#F5F5DC] truncate">{player.name}</span>
      </div>
      <span className={`text-center text-sm font-mono ${
        player.health > 50 ? "text-green-500" :
        player.health > 25 ? "text-yellow-500" :
        player.health > 0 ? "text-red-500" :
        "text-[#A1A1AA]"
      }`}>
        {player.health}
      </span>
      <span className="text-center text-sm font-mono text-[#22c55e]">{player.kills}</span>
      <span className="text-center text-sm font-mono text-[#ef4444]">{player.deaths}</span>
      <span className="text-center text-sm font-mono text-[#A1A1AA]">${player.money}</span>
    </div>
  );
}

// Componente de linha do kill feed
function KillFeedRow({ kill }: { kill: KillFeedEntry }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className={kill.attacker?.team === "CT" ? "text-[#3b82f6]" : "text-[#f59e0b]"}>
        {kill.attacker?.name || "World"}
      </span>
      <span className="text-[#A1A1AA] flex items-center gap-1">
        {kill.headshot && <span className="text-red-500">HS</span>}
        {kill.wallbang && <span className="text-yellow-500">WB</span>}
        [{kill.weapon}]
      </span>
      <span className={kill.victim.team === "CT" ? "text-[#3b82f6]" : "text-[#f59e0b]"}>
        {kill.victim.name}
      </span>
    </div>
  );
}

// Página principal
export default function AoVivoPage() {
  const { matches, isLoading, serverOffline } = useGOTVMatches();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [dbLiveMatches, setDbLiveMatches] = useState<DBLiveMatch[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  // Buscar partidas live do banco quando GOTV está offline
  useEffect(() => {
    if (!serverOffline) return;
    setDbLoading(true);
    const supabase = createBrowserSupabaseClient();
    supabase
      .from("matches")
      .select(`
        id,
        team1_score,
        team2_score,
        scheduled_at,
        round,
        tournament:tournaments(name),
        team1:teams!matches_team1_id_fkey(name, tag),
        team2:teams!matches_team2_id_fkey(name, tag)
      `)
      .eq("status", "live")
      .then(({ data }) => {
        if (data) setDbLiveMatches(data as DBLiveMatch[]);
        setDbLoading(false);
      });
  }, [serverOffline]);

  // Filtrar partidas ativas (atualizadas nos últimos 2 minutos) e ordenar pela mais recente
  const activeMatches = useMemo(() => {
    const now = new Date().getTime();
    const twoMinutesAgo = now - 2 * 60 * 1000;

    return matches
      .filter((match) => {
        if (!match.updatedAt) return true;
        const updatedTime = new Date(match.updatedAt).getTime();
        return updatedTime > twoMinutesAgo;
      })
      .sort((a, b) => {
        // Ordenar pela mais recente (mais fragmentos = mais recente)
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [matches]);

  // Auto-selecionar a partida mais recente quando não há seleção
  useEffect(() => {
    if (!selectedMatch && activeMatches.length > 0) {
      setSelectedMatch(activeMatches[0].matchId);
    }
    // Se a partida selecionada não existe mais nas ativas, selecionar a mais recente
    if (selectedMatch && !activeMatches.find(m => m.matchId === selectedMatch) && activeMatches.length > 0) {
      setSelectedMatch(activeMatches[0].matchId);
    }
  }, [activeMatches, selectedMatch]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <TournamentHeader
        rightContent={
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono ${
              serverOffline
                ? "bg-red-500/20 border border-red-500/50 text-red-500"
                : "bg-green-500/20 border border-green-500/50 text-green-500"
            }`}>
              <span className={`w-2 h-2 rounded-full ${serverOffline ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
              {serverOffline ? "SERVIDOR OFFLINE" : "SERVIDOR ONLINE"}
            </span>
          </div>
        }
      />

      {/* Conteúdo */}
      <main className="flex-1 pt-20 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-2xl text-[#F5F5DC] mb-6">PARTIDAS AO VIVO</h1>

          {serverOffline ? (
            <div className="space-y-6">
              <div className="bg-[#12121a] border border-[#eab308]/30 rounded-lg p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-[#eab308] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-[#eab308] text-sm font-medium">Servidor GOTV offline</p>
                  <p className="text-[#A1A1AA] text-xs">
                    Dados em tempo real indisponiveis. Mostrando partidas ao vivo do banco de dados.
                  </p>
                </div>
              </div>

              {dbLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[#A1A1AA] font-mono text-sm">Carregando...</span>
                  </div>
                </div>
              ) : dbLiveMatches.length === 0 ? (
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#27272A] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="font-display text-xl text-[#F5F5DC] mb-2">Nenhuma partida ao vivo</h2>
                  <p className="text-[#A1A1AA] text-sm">
                    Nao ha partidas em andamento no momento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dbLiveMatches.map((match) => (
                    <Link
                      key={match.id}
                      href={`/campeonatos/partida/${match.id}`}
                      className="bg-[#12121a] border border-[#27272A] hover:border-[#A855F7]/30 rounded-xl p-6 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono text-[#A1A1AA]">
                          {match.tournament?.name || "Campeonato"}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-[#ef4444]/20 rounded text-[10px] font-mono text-[#ef4444]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
                          AO VIVO
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center mb-2">
                            <span className="text-xs font-mono text-[#A1A1AA]">{match.team1?.tag || "T1"}</span>
                          </div>
                          <span className="text-sm text-[#F5F5DC]">{match.team1?.name || "Time 1"}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-display text-3xl text-[#F5F5DC]">{match.team1_score}</span>
                          <span className="text-[#52525B]">:</span>
                          <span className="font-display text-3xl text-[#F5F5DC]">{match.team2_score}</span>
                        </div>

                        <div className="text-center">
                          <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center mb-2">
                            <span className="text-xs font-mono text-[#A1A1AA]">{match.team2?.tag || "T2"}</span>
                          </div>
                          <span className="text-sm text-[#F5F5DC]">{match.team2?.name || "Time 2"}</span>
                        </div>
                      </div>

                      {match.round && (
                        <p className="text-center text-[10px] font-mono text-[#52525B] mt-3 capitalize">
                          {match.round.replaceAll("_", " ")}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                <span className="text-[#A1A1AA] font-mono text-sm">Carregando partidas...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Partidas */}
              <div className="lg:col-span-1">
                <div className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-[#27272A]">
                    <h2 className="font-mono text-sm text-[#F5F5DC]">
                      PARTIDAS ATIVAS ({activeMatches.length})
                    </h2>
                  </div>

                  {activeMatches.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#27272A] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-[#A1A1AA] text-sm mb-2">Nenhuma partida ao vivo</p>
                      <p className="text-xs font-mono text-[#A1A1AA]">
                        Configure um servidor CS2 para transmitir
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#27272A]">
                      {activeMatches.map((match) => {
                        const linkId = match.dbMatchId || match.matchId;
                        return (
                          <div
                            key={match.matchId}
                            className={`p-4 hover:bg-[#1a1a2e] transition-colors ${
                              selectedMatch === match.matchId ? "bg-[#A855F7]/10 border-l-2 border-l-[#A855F7]" : ""
                            }`}
                          >
                            <button
                              onClick={() => setSelectedMatch(match.matchId)}
                              className="w-full text-left"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm text-[#F5F5DC]">{match.mapName || "Unknown Map"}</span>
                                <span className="flex items-center gap-1 text-xs font-mono text-green-500">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  LIVE
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-display">
                                  <span className="text-[#3b82f6]">{match.scoreCT}</span>
                                  <span className="text-[#A1A1AA] mx-2">:</span>
                                  <span className="text-[#f59e0b]">{match.scoreT}</span>
                                </span>
                                <span className="text-xs font-mono text-[#A1A1AA]">
                                  R{match.currentRound}
                                </span>
                              </div>
                            </button>
                            <div className="mt-2 pt-2 border-t border-[#27272A]">
                              <Link
                                href={`/campeonatos/partida/${linkId}`}
                                className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-[#A855F7]/20 hover:bg-[#A855F7]/30 border border-[#A855F7]/50 rounded text-xs font-mono text-[#A855F7] transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                ABRIR PÁGINA DA PARTIDA
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Debug Info */}
                <div className="mt-4 bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                  <h3 className="text-xs font-mono text-[#A1A1AA] mb-2">DEBUG INFO</h3>
                  <div className="space-y-1 text-xs font-mono">
                    <p className="text-[#A1A1AA]">Server: <span className="text-[#F5F5DC]">Railway (Production)</span></p>
                    <p className="text-[#A1A1AA]">Status: <span className={serverOffline ? "text-red-500" : "text-green-500"}>{serverOffline ? "Offline" : "Online"}</span></p>
                    <p className="text-[#A1A1AA]">Matches: <span className="text-[#F5F5DC]">{activeMatches.length}</span></p>
                  </div>
                </div>
              </div>

              {/* Visualizador da Partida */}
              <div className="lg:col-span-2">
                {selectedMatch ? (
                  <LiveMatchViewer matchId={selectedMatch} />
                ) : (
                  <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#27272A] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <h2 className="font-display text-xl text-[#F5F5DC] mb-2">Selecione uma partida</h2>
                    <p className="text-[#A1A1AA] text-sm">
                      Clique em uma partida na lista ao lado para ver os detalhes em tempo real
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
