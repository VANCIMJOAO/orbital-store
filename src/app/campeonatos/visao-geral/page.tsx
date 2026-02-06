"use client";

import Link from "next/link";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";

function VisaoGeralContent() {
  const campeonato = {
    nome: "ORBITAL CUP 2026",
    subtitulo: "TORNEIO CS2",
    dataInicio: "01 Fev 2026",
    dataFim: "15 Fev 2026",
    premiacao: "R$ 8.500",
    times: 8,
    formato: "Fase de grupos + Playoffs",
    status: "Em andamento",
  };

  const grupos = [
    {
      nome: "Grupo A",
      times: [
        { pos: 1, nome: "FURIA", logo: "FUR", v: 3, d: 0, saldo: "+6" },
        { pos: 2, nome: "paiN", logo: "PNG", v: 2, d: 1, saldo: "+2" },
        { pos: 3, nome: "Fluxo", logo: "FLX", v: 1, d: 2, saldo: "-2" },
        { pos: 4, nome: "RED", logo: "RED", v: 0, d: 3, saldo: "-6" },
      ],
    },
    {
      nome: "Grupo B",
      times: [
        { pos: 1, nome: "Imperial", logo: "IMP", v: 3, d: 0, saldo: "+5" },
        { pos: 2, nome: "LOUD", logo: "LOU", v: 2, d: 1, saldo: "+3" },
        { pos: 3, nome: "MIBR", logo: "MBR", v: 1, d: 2, saldo: "-3" },
        { pos: 4, nome: "Sharks", logo: "SHK", v: 0, d: 3, saldo: "-5" },
      ],
    },
  ];

  const proximasPartidas = [
    { id: 1, time1: "FURIA", time2: "Imperial", horario: "15:30", fase: "Semi-Final" },
    { id: 2, time1: "paiN", time2: "LOUD", horario: "18:00", fase: "Semi-Final" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0f0f15] border-b border-[#A855F7]/20">
        <div className="h-full flex items-center justify-between px-6">
          <Link href="/campeonatos" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center">
              <span className="font-display text-[#A855F7] text-lg">O</span>
            </div>
            <span className="font-display text-[#F5F5DC] text-lg tracking-wider hidden sm:block">
              ORBITAL ROXA
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/campeonatos/visao-geral" className="font-mono text-xs text-[#A855F7] tracking-wider">VISÃO GERAL</Link>
            <Link href="/campeonatos/partidas" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">PARTIDAS</Link>
            <Link href="/campeonatos/resultados" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">RESULTADOS</Link>
            <Link href="/campeonatos/estatisticas" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] tracking-wider">ESTATÍSTICAS</Link>
          </nav>

          <div className="w-32" />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 pt-16">
        {/* Banner */}
        <div className="relative h-64 bg-gradient-to-b from-[#1a1a2e] to-[#0A0A0A] flex items-center justify-center">
          <div className="text-center">
            <span className="font-display text-4xl text-[#F5F5DC] block mb-2">{campeonato.nome}</span>
            <span className="font-mono text-[#A855F7] text-sm">{campeonato.subtitulo}</span>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-xs text-[#A1A1AA]">{campeonato.dataInicio} - {campeonato.dataFim}</span>
              <span className="px-2 py-1 bg-[#22c55e]/20 text-[#22c55e] text-xs rounded font-mono">{campeonato.status}</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 text-center">
              <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">PREMIAÇÃO</span>
              <span className="font-display text-xl text-[#FFD700]">{campeonato.premiacao}</span>
            </div>
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 text-center">
              <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">TIMES</span>
              <span className="font-display text-xl text-[#F5F5DC]">{campeonato.times}</span>
            </div>
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 text-center">
              <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">FORMATO</span>
              <span className="font-mono text-sm text-[#A855F7]">{campeonato.formato}</span>
            </div>
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 text-center">
              <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">FASE ATUAL</span>
              <span className="font-mono text-sm text-[#F5F5DC]">Playoffs</span>
            </div>
          </div>

          {/* Tabelas dos Grupos */}
          <h2 className="font-mono text-[#F5F5DC] text-lg tracking-wider mb-4">FASE DE GRUPOS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {grupos.map((grupo) => (
              <div key={grupo.nome} className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden">
                <div className="p-4 bg-[#1a1a2e] border-b border-[#27272A]">
                  <h3 className="font-mono text-[#F5F5DC] text-sm">{grupo.nome}</h3>
                </div>
                <div className="divide-y divide-[#27272A]">
                  {/* Header */}
                  <div className="grid grid-cols-6 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                    <span className="col-span-3">TIME</span>
                    <span className="text-center">V</span>
                    <span className="text-center">D</span>
                    <span className="text-center">SALDO</span>
                  </div>
                  {grupo.times.map((time) => (
                    <Link
                      key={time.nome}
                      href="/campeonatos/time"
                      className={`grid grid-cols-6 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors ${
                        time.pos <= 2 ? "bg-[#22c55e]/5" : ""
                      }`}
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        <span className={`font-mono text-sm w-5 ${
                          time.pos === 1 ? "text-[#FFD700]" : time.pos === 2 ? "text-[#C0C0C0]" : "text-[#A1A1AA]"
                        }`}>
                          {time.pos}
                        </span>
                        <div className="w-6 h-6 rounded bg-[#27272A] flex items-center justify-center">
                          <span className="text-[6px] font-mono text-[#A1A1AA]">{time.logo}</span>
                        </div>
                        <span className="text-sm text-[#F5F5DC]">{time.nome}</span>
                      </div>
                      <span className="text-center text-sm font-mono text-[#22c55e]">{time.v}</span>
                      <span className="text-center text-sm font-mono text-[#ef4444]">{time.d}</span>
                      <span className={`text-center text-sm font-mono ${
                        time.saldo.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"
                      }`}>
                        {time.saldo}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Próximas Partidas */}
          <h2 className="font-mono text-[#F5F5DC] text-lg tracking-wider mb-4">PRÓXIMAS PARTIDAS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proximasPartidas.map((partida) => (
              <Link
                key={partida.id}
                href="/campeonatos/partida"
                className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 hover:border-[#A855F7]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[#A855F7]">{partida.fase}</span>
                  <span className="text-xs font-mono text-[#A1A1AA]">{partida.horario}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center">
                      <span className="text-xs font-mono text-[#A1A1AA]">{partida.time1.slice(0, 3).toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-[#F5F5DC]">{partida.time1}</span>
                  </div>
                  <span className="font-mono text-lg text-[#A1A1AA]">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#F5F5DC]">{partida.time2}</span>
                    <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center">
                      <span className="text-xs font-mono text-[#A1A1AA]">{partida.time2.slice(0, 3).toUpperCase()}</span>
                    </div>
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

export default function VisaoGeralPage() {
  return (
    <RequireTournamentProfile>
      <VisaoGeralContent />
    </RequireTournamentProfile>
  );
}
