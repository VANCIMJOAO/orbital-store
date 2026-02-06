"use client";

import Link from "next/link";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";

function PartidaContent() {
  const partida = {
    id: 1,
    status: "AO VIVO",
    campeonato: "ORBITAL CUP 2026",
    fase: "Semi-Final",
    formato: "MD3 (Melhor de 3)",
    data: "04 Fev 2026",
    horario: "15:30",
  };

  const time1 = {
    nome: "FURIA",
    logo: "FUR",
    score: 1,
    mapasVencidos: ["Mirage"],
  };

  const time2 = {
    nome: "Imperial",
    logo: "IMP",
    score: 1,
    mapasVencidos: ["Inferno"],
  };

  const mapas = [
    { nome: "Mirage", vencedor: "FURIA", placar: "16-12", status: "finalizado" },
    { nome: "Inferno", vencedor: "Imperial", placar: "14-16", status: "finalizado" },
    { nome: "Ancient", vencedor: null, placar: "8-7", status: "ao_vivo" },
  ];

  const mapaAtual = {
    nome: "Ancient",
    placar: { time1: 8, time2: 7 },
    lado: { time1: "CT", time2: "TR" },
    round: 16,
  };

  const playersTime1 = [
    { nome: "KSCERATO", kills: 18, deaths: 12, adr: "95.2", rating: "1.42" },
    { nome: "yuurih", kills: 15, deaths: 11, adr: "82.4", rating: "1.28" },
    { nome: "FalleN", kills: 14, deaths: 13, adr: "78.1", rating: "1.15" },
    { nome: "chelo", kills: 12, deaths: 14, adr: "72.3", rating: "0.98" },
    { nome: "skullz", kills: 10, deaths: 15, adr: "68.5", rating: "0.85" },
  ];

  const playersTime2 = [
    { nome: "decenty", kills: 16, deaths: 13, adr: "88.4", rating: "1.25" },
    { nome: "noway", kills: 14, deaths: 12, adr: "79.2", rating: "1.18" },
    { nome: "VINI", kills: 13, deaths: 14, adr: "75.6", rating: "1.02" },
    { nome: "felps", kills: 11, deaths: 15, adr: "70.1", rating: "0.92" },
    { nome: "vnx", kills: 11, deaths: 15, adr: "69.8", rating: "0.88" },
  ];

  const rounds = [
    { num: 1, vencedor: "time1", tipo: "bomb" },
    { num: 2, vencedor: "time1", tipo: "elimination" },
    { num: 3, vencedor: "time2", tipo: "defuse" },
    { num: 4, vencedor: "time1", tipo: "time" },
    { num: 5, vencedor: "time2", tipo: "bomb" },
    { num: 6, vencedor: "time1", tipo: "elimination" },
    { num: 7, vencedor: "time1", tipo: "elimination" },
    { num: 8, vencedor: "time2", tipo: "bomb" },
    { num: 9, vencedor: "time1", tipo: "defuse" },
    { num: 10, vencedor: "time2", tipo: "elimination" },
    { num: 11, vencedor: "time1", tipo: "bomb" },
    { num: 12, vencedor: "time2", tipo: "defuse" },
    { num: 13, vencedor: "time2", tipo: "bomb" },
    { num: 14, vencedor: "time1", tipo: "elimination" },
    { num: 15, vencedor: "time2", tipo: "bomb" },
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

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link href="/campeonatos" className="text-[#A1A1AA] hover:text-[#F5F5DC]">CAMPEONATOS</Link>
            <span className="text-[#A1A1AA]">/</span>
            <span className="text-[#A855F7]">{partida.campeonato}</span>
            <span className="text-[#A1A1AA]">/</span>
            <span className="text-[#F5F5DC]">PARTIDA</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded text-xs font-mono text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              AO VIVO
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 pt-16 pb-8">
        {/* Placar Principal */}
        <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0A0A0A] py-8">
          <div className="max-w-5xl mx-auto px-6">
            {/* Info do Campeonato */}
            <div className="text-center mb-6">
              <span className="text-xs font-mono text-[#A855F7]">{partida.campeonato}</span>
              <span className="text-xs font-mono text-[#A1A1AA] mx-2">•</span>
              <span className="text-xs font-mono text-[#A1A1AA]">{partida.fase}</span>
              <span className="text-xs font-mono text-[#A1A1AA] mx-2">•</span>
              <span className="text-xs font-mono text-[#A1A1AA]">{partida.formato}</span>
            </div>

            {/* Placar */}
            <div className="flex items-center justify-center gap-8">
              {/* Time 1 */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-display text-2xl text-[#F5F5DC] block">{time1.nome}</span>
                  <div className="flex gap-1 justify-end mt-1">
                    {time1.mapasVencidos.map((mapa) => (
                      <span key={mapa} className="text-[8px] px-1.5 py-0.5 bg-[#22c55e]/20 text-[#22c55e] rounded">
                        {mapa}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-16 h-16 rounded-lg bg-[#27272A] border border-[#A855F7]/30 flex items-center justify-center">
                  <span className="font-mono text-[#A1A1AA]">{time1.logo}</span>
                </div>
              </div>

              {/* Placar Central */}
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl text-[#F5F5DC]">{time1.score}</span>
                <span className="font-display text-3xl text-[#A1A1AA]">:</span>
                <span className="font-display text-5xl text-[#F5F5DC]">{time2.score}</span>
              </div>

              {/* Time 2 */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-[#27272A] border border-[#A855F7]/30 flex items-center justify-center">
                  <span className="font-mono text-[#A1A1AA]">{time2.logo}</span>
                </div>
                <div className="text-left">
                  <span className="font-display text-2xl text-[#F5F5DC] block">{time2.nome}</span>
                  <div className="flex gap-1 mt-1">
                    {time2.mapasVencidos.map((mapa) => (
                      <span key={mapa} className="text-[8px] px-1.5 py-0.5 bg-[#22c55e]/20 text-[#22c55e] rounded">
                        {mapa}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mapas */}
            <div className="flex justify-center gap-4 mt-8">
              {mapas.map((mapa, i) => (
                <div
                  key={i}
                  className={`px-6 py-3 rounded-lg border ${
                    mapa.status === "ao_vivo"
                      ? "bg-[#A855F7]/10 border-[#A855F7]"
                      : "bg-[#12121a] border-[#27272A]"
                  }`}
                >
                  <div className="text-center">
                    <span className="text-xs font-mono text-[#A1A1AA] block mb-1">MAPA {i + 1}</span>
                    <span className="text-sm font-body text-[#F5F5DC] block">{mapa.nome}</span>
                    {mapa.status === "ao_vivo" ? (
                      <span className="text-sm font-mono text-[#A855F7] font-bold">{mapa.placar}</span>
                    ) : mapa.vencedor ? (
                      <span className="text-sm font-mono text-[#22c55e]">{mapa.placar}</span>
                    ) : (
                      <span className="text-xs font-mono text-[#A1A1AA]">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mapa Atual - Detalhes */}
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-[#F5F5DC]">{mapaAtual.nome}</span>
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded font-mono">AO VIVO</span>
              </div>
              <span className="text-xs font-mono text-[#A1A1AA]">Round {mapaAtual.round}</span>
            </div>

            {/* Placar do Mapa */}
            <div className="flex items-center justify-center gap-8 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-2 py-1 bg-[#3b82f6]/20 text-[#3b82f6] rounded">
                  {mapaAtual.lado.time1}
                </span>
                <span className="font-display text-3xl text-[#F5F5DC]">{mapaAtual.placar.time1}</span>
              </div>
              <span className="text-2xl text-[#A1A1AA]">:</span>
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl text-[#F5F5DC]">{mapaAtual.placar.time2}</span>
                <span className="text-xs font-mono px-2 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded">
                  {mapaAtual.lado.time2}
                </span>
              </div>
            </div>

            {/* Histórico de Rounds */}
            <div className="flex items-center justify-center gap-1">
              {rounds.map((round) => (
                <div
                  key={round.num}
                  className={`w-5 h-5 rounded text-[8px] font-mono flex items-center justify-center ${
                    round.vencedor === "time1"
                      ? "bg-[#3b82f6]/30 text-[#3b82f6]"
                      : "bg-[#f59e0b]/30 text-[#f59e0b]"
                  }`}
                  title={`Round ${round.num}: ${round.tipo}`}
                >
                  {round.num}
                </div>
              ))}
            </div>
          </div>

          {/* Stats dos Jogadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time 1 */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden">
              <div className="p-4 bg-[#1a1a2e] border-b border-[#27272A] flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#27272A] border border-[#A855F7]/30 flex items-center justify-center">
                  <span className="text-xs font-mono text-[#A1A1AA]">{time1.logo}</span>
                </div>
                <span className="font-display text-lg text-[#F5F5DC]">{time1.nome}</span>
              </div>
              <div className="divide-y divide-[#27272A]">
                {/* Header */}
                <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                  <span>PLAYER</span>
                  <span className="text-center">K</span>
                  <span className="text-center">D</span>
                  <span className="text-center">ADR</span>
                  <span className="text-center">RATING</span>
                </div>
                {playersTime1.map((player) => (
                  <div key={player.nome} className="grid grid-cols-5 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors">
                    <Link href="/campeonatos/perfil" className="text-sm text-[#F5F5DC] hover:text-[#A855F7]">
                      {player.nome}
                    </Link>
                    <span className="text-center text-sm font-mono text-[#22c55e]">{player.kills}</span>
                    <span className="text-center text-sm font-mono text-[#ef4444]">{player.deaths}</span>
                    <span className="text-center text-sm font-mono text-[#A1A1AA]">{player.adr}</span>
                    <span className={`text-center text-sm font-mono font-bold ${
                      parseFloat(player.rating) >= 1 ? "text-[#22c55e]" : "text-[#ef4444]"
                    }`}>
                      {player.rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time 2 */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden">
              <div className="p-4 bg-[#1a1a2e] border-b border-[#27272A] flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#27272A] border border-[#A855F7]/30 flex items-center justify-center">
                  <span className="text-xs font-mono text-[#A1A1AA]">{time2.logo}</span>
                </div>
                <span className="font-display text-lg text-[#F5F5DC]">{time2.nome}</span>
              </div>
              <div className="divide-y divide-[#27272A]">
                {/* Header */}
                <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                  <span>PLAYER</span>
                  <span className="text-center">K</span>
                  <span className="text-center">D</span>
                  <span className="text-center">ADR</span>
                  <span className="text-center">RATING</span>
                </div>
                {playersTime2.map((player) => (
                  <div key={player.nome} className="grid grid-cols-5 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors">
                    <Link href="/campeonatos/perfil" className="text-sm text-[#F5F5DC] hover:text-[#A855F7]">
                      {player.nome}
                    </Link>
                    <span className="text-center text-sm font-mono text-[#22c55e]">{player.kills}</span>
                    <span className="text-center text-sm font-mono text-[#ef4444]">{player.deaths}</span>
                    <span className="text-center text-sm font-mono text-[#A1A1AA]">{player.adr}</span>
                    <span className={`text-center text-sm font-mono font-bold ${
                      parseFloat(player.rating) >= 1 ? "text-[#22c55e]" : "text-[#ef4444]"
                    }`}>
                      {player.rating}
                    </span>
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

export default function PartidaPage() {
  return (
    <RequireTournamentProfile>
      <PartidaContent />
    </RequireTournamentProfile>
  );
}
