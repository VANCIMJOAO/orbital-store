"use client";

import Link from "next/link";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";

function EstatisticasContent() {
  const topPlayers = [
    { pos: 1, nome: "KSCERATO", time: "FURIA", rating: "1.42", kills: 186, deaths: 124, hs: "52%", adr: "95.2" },
    { pos: 2, nome: "yuurih", time: "FURIA", rating: "1.35", kills: 172, deaths: 132, hs: "48%", adr: "88.4" },
    { pos: 3, nome: "decenty", time: "Imperial", rating: "1.28", kills: 165, deaths: 138, hs: "45%", adr: "82.1" },
    { pos: 4, nome: "biguzera", time: "paiN", rating: "1.25", kills: 158, deaths: 142, hs: "51%", adr: "79.8" },
    { pos: 5, nome: "noway", time: "Imperial", rating: "1.22", kills: 152, deaths: 136, hs: "44%", adr: "78.2" },
  ];

  const topTimes = [
    { pos: 1, nome: "FURIA", partidas: 6, vitorias: 6, rounds: "96-62", rating: "1.28" },
    { pos: 2, nome: "Imperial", partidas: 5, vitorias: 4, rounds: "82-68", rating: "1.18" },
    { pos: 3, nome: "paiN", partidas: 5, vitorias: 4, rounds: "78-65", rating: "1.12" },
    { pos: 4, nome: "LOUD", partidas: 4, vitorias: 3, rounds: "65-58", rating: "1.08" },
  ];

  const mapasStats = [
    { nome: "Mirage", partidas: 8, ctWinrate: "54%", trWinrate: "46%" },
    { nome: "Inferno", partidas: 7, ctWinrate: "52%", trWinrate: "48%" },
    { nome: "Ancient", partidas: 6, ctWinrate: "58%", trWinrate: "42%" },
    { nome: "Nuke", partidas: 5, ctWinrate: "62%", trWinrate: "38%" },
    { nome: "Dust2", partidas: 4, ctWinrate: "48%", trWinrate: "52%" },
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
            <Link href="/campeonatos/partidas" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">PARTIDAS</Link>
            <Link href="/campeonatos/resultados" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">RESULTADOS</Link>
            <Link href="/campeonatos/estatisticas" className="font-mono text-xs text-[#A855F7] tracking-wider">ESTATÍSTICAS</Link>
          </nav>
          <div className="w-32" />
        </div>
      </header>

      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="font-display text-2xl text-[#F5F5DC] mb-8">ESTATÍSTICAS</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Players */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
              <div className="p-4 border-b border-[#27272A]">
                <h2 className="font-mono text-[#F5F5DC] text-sm tracking-wider">TOP PLAYERS</h2>
              </div>
              <div className="divide-y divide-[#27272A]">
                <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                  <span className="col-span-2">PLAYER</span>
                  <span className="text-center">K</span>
                  <span className="text-center">D</span>
                  <span className="text-center">HS%</span>
                  <span className="text-center">ADR</span>
                  <span className="text-center">RATING</span>
                </div>
                {topPlayers.map((player) => (
                  <Link
                    key={player.nome}
                    href="/campeonatos/perfil"
                    className="grid grid-cols-7 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors"
                  >
                    <div className="col-span-2 flex items-center gap-2">
                      <span className={`font-mono text-sm w-5 ${
                        player.pos === 1 ? "text-[#FFD700]" : player.pos === 2 ? "text-[#C0C0C0]" : player.pos === 3 ? "text-[#CD7F32]" : "text-[#A1A1AA]"
                      }`}>{player.pos}</span>
                      <div>
                        <span className="text-sm text-[#F5F5DC] block">{player.nome}</span>
                        <span className="text-[10px] text-[#A1A1AA]">{player.time}</span>
                      </div>
                    </div>
                    <span className="text-center text-sm font-mono text-[#22c55e] flex items-center justify-center">{player.kills}</span>
                    <span className="text-center text-sm font-mono text-[#ef4444] flex items-center justify-center">{player.deaths}</span>
                    <span className="text-center text-sm font-mono text-[#A1A1AA] flex items-center justify-center">{player.hs}</span>
                    <span className="text-center text-sm font-mono text-[#A1A1AA] flex items-center justify-center">{player.adr}</span>
                    <span className="text-center text-sm font-mono text-[#A855F7] font-bold flex items-center justify-center">{player.rating}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Times */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
              <div className="p-4 border-b border-[#27272A]">
                <h2 className="font-mono text-[#F5F5DC] text-sm tracking-wider">TOP TIMES</h2>
              </div>
              <div className="divide-y divide-[#27272A]">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                  <span className="col-span-2">TIME</span>
                  <span className="text-center">V/D</span>
                  <span className="text-center">ROUNDS</span>
                  <span className="text-center">RATING</span>
                </div>
                {topTimes.map((time) => (
                  <Link
                    key={time.nome}
                    href="/campeonatos/time"
                    className="grid grid-cols-5 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors"
                  >
                    <div className="col-span-2 flex items-center gap-2">
                      <span className={`font-mono text-sm w-5 ${
                        time.pos === 1 ? "text-[#FFD700]" : time.pos === 2 ? "text-[#C0C0C0]" : time.pos === 3 ? "text-[#CD7F32]" : "text-[#A1A1AA]"
                      }`}>{time.pos}</span>
                      <div className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center">
                        <span className="text-[8px] font-mono text-[#A1A1AA]">{time.nome.slice(0,3).toUpperCase()}</span>
                      </div>
                      <span className="text-sm text-[#F5F5DC]">{time.nome}</span>
                    </div>
                    <span className="text-center text-sm font-mono text-[#22c55e] flex items-center justify-center">{time.vitorias}-{time.partidas - time.vitorias}</span>
                    <span className="text-center text-sm font-mono text-[#A1A1AA] flex items-center justify-center">{time.rounds}</span>
                    <span className="text-center text-sm font-mono text-[#A855F7] font-bold flex items-center justify-center">{time.rating}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Stats por Mapa */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg lg:col-span-2">
              <div className="p-4 border-b border-[#27272A]">
                <h2 className="font-mono text-[#F5F5DC] text-sm tracking-wider">ESTATÍSTICAS POR MAPA</h2>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
                {mapasStats.map((mapa) => (
                  <div key={mapa.nome} className="bg-[#1a1a2e] rounded-lg p-4 text-center">
                    <span className="font-body text-[#F5F5DC] block mb-2">{mapa.nome}</span>
                    <span className="text-xs text-[#A1A1AA] block mb-3">{mapa.partidas} partidas</span>
                    <div className="flex justify-center gap-4">
                      <div>
                        <span className="text-[10px] text-[#3b82f6] block">CT</span>
                        <span className="font-mono text-sm text-[#F5F5DC]">{mapa.ctWinrate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#f59e0b] block">TR</span>
                        <span className="font-mono text-sm text-[#F5F5DC]">{mapa.trWinrate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EstatisticasPage() {
  return (
    <RequireTournamentProfile>
      <EstatisticasContent />
    </RequireTournamentProfile>
  );
}
