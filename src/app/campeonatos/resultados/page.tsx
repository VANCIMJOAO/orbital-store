"use client";

import Link from "next/link";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";

function ResultadosContent() {
  const resultados = [
    { id: 1, time1: "FURIA", time2: "paiN", placar: "2-0", vencedor: "FURIA", data: "03 Fev", fase: "Quartas de Final", mapas: ["Mirage 16-10", "Inferno 16-12"] },
    { id: 2, time1: "Imperial", time2: "LOUD", placar: "2-1", vencedor: "Imperial", data: "03 Fev", fase: "Quartas de Final", mapas: ["Dust2 16-14", "Nuke 12-16", "Ancient 16-9"] },
    { id: 3, time1: "FURIA", time2: "Fluxo", placar: "2-0", vencedor: "FURIA", data: "02 Fev", fase: "Fase de Grupos", mapas: ["Mirage 16-8", "Ancient 16-11"] },
    { id: 4, time1: "paiN", time2: "RED", placar: "2-1", vencedor: "paiN", data: "02 Fev", fase: "Fase de Grupos", mapas: ["Inferno 14-16", "Dust2 16-10", "Nuke 16-12"] },
    { id: 5, time1: "Imperial", time2: "MIBR", placar: "2-0", vencedor: "Imperial", data: "01 Fev", fase: "Fase de Grupos", mapas: ["Ancient 16-9", "Mirage 16-13"] },
    { id: 6, time1: "LOUD", time2: "Sharks", placar: "2-0", vencedor: "LOUD", data: "01 Fev", fase: "Fase de Grupos", mapas: ["Nuke 16-7", "Vertigo 16-11"] },
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
            <Link href="/campeonatos/resultados" className="font-mono text-xs text-[#A855F7] tracking-wider">RESULTADOS</Link>
            <Link href="/campeonatos/estatisticas" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">ESTATÍSTICAS</Link>
          </nav>
          <div className="w-32" />
        </div>
      </header>

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="font-display text-2xl text-[#F5F5DC] mb-8">RESULTADOS</h1>

          <div className="space-y-4">
            {resultados.map((resultado) => (
              <Link
                key={resultado.id}
                href="/campeonatos/partida"
                className="block bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden hover:border-[#A855F7]/50 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-[#A855F7]">{resultado.fase}</span>
                    <span className="text-xs font-mono text-[#A1A1AA]">{resultado.data}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center">
                        <span className="text-xs font-mono text-[#A1A1AA]">{resultado.time1.slice(0,3).toUpperCase()}</span>
                      </div>
                      <span className={`text-lg ${resultado.vencedor === resultado.time1 ? "text-[#22c55e] font-bold" : "text-[#A1A1AA]"}`}>
                        {resultado.time1}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="font-display text-2xl text-[#F5F5DC]">{resultado.placar}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${resultado.vencedor === resultado.time2 ? "text-[#22c55e] font-bold" : "text-[#A1A1AA]"}`}>
                        {resultado.time2}
                      </span>
                      <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center">
                        <span className="text-xs font-mono text-[#A1A1AA]">{resultado.time2.slice(0,3).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 bg-[#1a1a2e] border-t border-[#27272A]">
                  <div className="flex gap-3">
                    {resultado.mapas.map((mapa, i) => (
                      <span key={i} className="text-xs text-[#A1A1AA]">{mapa}</span>
                    ))}
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

export default function ResultadosPage() {
  return (
    <RequireTournamentProfile>
      <ResultadosContent />
    </RequireTournamentProfile>
  );
}
