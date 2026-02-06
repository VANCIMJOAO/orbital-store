"use client";

import Link from "next/link";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import { useGOTVMatches } from "@/hooks/useGOTV";

function PartidasContent() {
  const { matches: liveMatches, serverOffline } = useGOTVMatches();

  const partidas = [
    { id: 1, time1: "FURIA", time2: "Imperial", placar: "1-1", status: "AO VIVO", horario: "", fase: "Semi-Final" },
    { id: 2, time1: "paiN", time2: "LOUD", placar: null, status: "EM BREVE", horario: "18:00", fase: "Semi-Final" },
    { id: 3, time1: "TBD", time2: "TBD", placar: null, status: "EM BREVE", horario: "20:30", fase: "Final" },
  ];

  const partidasAnteriores = [
    { id: 4, time1: "FURIA", time2: "paiN", placar: "2-0", vencedor: "FURIA", data: "03 Fev", fase: "Quartas" },
    { id: 5, time1: "Imperial", time2: "LOUD", placar: "2-1", vencedor: "Imperial", data: "03 Fev", fase: "Quartas" },
    { id: 6, time1: "FURIA", time2: "Fluxo", placar: "2-0", vencedor: "FURIA", data: "02 Fev", fase: "Grupos" },
    { id: 7, time1: "paiN", time2: "RED", placar: "2-1", vencedor: "paiN", data: "02 Fev", fase: "Grupos" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0f0f15] border-b border-[#A855F7]/20">
        <div className="h-full flex items-center justify-between px-6">
          <Link href="/campeonatos" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center">
              <span className="font-display text-[#A855F7] text-lg">O</span>
            </div>
            <span className="font-display text-[#F5F5DC] text-lg tracking-wider hidden sm:block">ORBITAL ROXA</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/campeonatos/visao-geral" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">VISÃO GERAL</Link>
            <Link href="/campeonatos/partidas" className="font-mono text-xs text-[#A855F7] tracking-wider">PARTIDAS</Link>
            <Link href="/campeonatos/ao-vivo" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              AO VIVO
            </Link>
            <Link href="/campeonatos/resultados" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">RESULTADOS</Link>
            <Link href="/campeonatos/estatisticas" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">ESTATÍSTICAS</Link>
          </nav>
          <div className="w-32" />
        </div>
      </header>

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="font-display text-2xl text-[#F5F5DC] mb-8">PARTIDAS</h1>

          {/* Partidas GOTV Ao Vivo */}
          {!serverOffline && liveMatches.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="font-mono text-red-500 text-sm tracking-wider">PARTIDAS AO VIVO - GOTV</h2>
              </div>
              <div className="space-y-3 mb-8">
                {liveMatches.map((match) => (
                  <Link
                    key={match.matchId}
                    href={`/campeonatos/partida/${match.matchId}`}
                    className="block bg-[#12121a] border border-red-500/30 rounded-lg p-4 hover:border-red-500/60 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-[#A855F7]">{match.mapName || "Mapa desconhecido"}</span>
                      <span className="flex items-center gap-1.5 text-xs font-mono text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        AO VIVO • ROUND {match.currentRound}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-[#3b82f6]/20 border border-[#3b82f6]/50 flex items-center justify-center">
                          <span className="font-display text-[#3b82f6]">CT</span>
                        </div>
                        <span className="text-[#F5F5DC] font-display">Counter-Terrorists</span>
                      </div>
                      <div className="text-center">
                        <span className="font-display text-2xl">
                          <span className="text-[#3b82f6]">{match.scoreCT}</span>
                          <span className="text-[#A1A1AA] mx-2">:</span>
                          <span className="text-[#f59e0b]">{match.scoreT}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#F5F5DC] font-display">Terrorists</span>
                        <div className="w-12 h-12 rounded bg-[#f59e0b]/20 border border-[#f59e0b]/50 flex items-center justify-center">
                          <span className="font-display text-[#f59e0b]">T</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#27272A] flex items-center justify-between">
                      <span className="text-xs font-mono text-[#A1A1AA]">
                        ID: {match.matchId.slice(0, 12)}...
                      </span>
                      <span className="text-xs font-mono text-[#A855F7] flex items-center gap-1">
                        Ver detalhes
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Servidor GOTV Offline Notice */}
          {serverOffline && (
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#27272A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm text-[#F5F5DC] block">Servidor GOTV Offline</span>
                  <span className="text-xs text-[#A1A1AA]">As partidas ao vivo aparecem aqui quando o servidor está ativo</span>
                </div>
                <Link
                  href="/campeonatos/ao-vivo"
                  className="ml-auto px-3 py-1.5 bg-[#A855F7]/20 border border-[#A855F7]/50 rounded text-xs font-mono text-[#A855F7] hover:bg-[#A855F7]/30 transition-colors"
                >
                  Ver status
                </Link>
              </div>
            </div>
          )}

          {/* Partidas de Hoje */}
          <h2 className="font-mono text-[#A855F7] text-sm tracking-wider mb-4">HOJE</h2>
          <div className="space-y-3 mb-8">
            {partidas.map((partida) => (
              <Link
                key={partida.id}
                href="/campeonatos/partida"
                className="block bg-[#12121a] border border-[#27272A] rounded-lg p-4 hover:border-[#A855F7]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#A1A1AA]">{partida.fase}</span>
                  {partida.status === "AO VIVO" ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-red-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      AO VIVO
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-[#A1A1AA]">{partida.horario}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center">
                      <span className="text-[8px] font-mono text-[#A1A1AA]">{partida.time1.slice(0,3).toUpperCase()}</span>
                    </div>
                    <span className="text-[#F5F5DC]">{partida.time1}</span>
                  </div>
                  <span className="font-mono text-lg text-[#F5F5DC]">{partida.placar || "vs"}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#F5F5DC]">{partida.time2}</span>
                    <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center">
                      <span className="text-[8px] font-mono text-[#A1A1AA]">{partida.time2.slice(0,3).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Partidas Anteriores */}
          <h2 className="font-mono text-[#A1A1AA] text-sm tracking-wider mb-4">PARTIDAS ANTERIORES</h2>
          <div className="space-y-3">
            {partidasAnteriores.map((partida) => (
              <Link
                key={partida.id}
                href="/campeonatos/partida"
                className="block bg-[#12121a] border border-[#27272A] rounded-lg p-4 hover:border-[#A855F7]/50 transition-colors opacity-70"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#A1A1AA]">{partida.fase}</span>
                  <span className="text-xs font-mono text-[#A1A1AA]">{partida.data}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={partida.vencedor === partida.time1 ? "text-[#22c55e]" : "text-[#A1A1AA]"}>
                      {partida.time1}
                    </span>
                  </div>
                  <span className="font-mono text-sm text-[#A1A1AA]">{partida.placar}</span>
                  <div className="flex items-center gap-3">
                    <span className={partida.vencedor === partida.time2 ? "text-[#22c55e]" : "text-[#A1A1AA]"}>
                      {partida.time2}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PartidasPage() {
  return (
    <RequireTournamentProfile>
      <PartidasContent />
    </RequireTournamentProfile>
  );
}
