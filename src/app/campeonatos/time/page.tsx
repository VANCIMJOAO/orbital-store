"use client";

import Link from "next/link";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";

function TimeContent() {
  const time = {
    nome: "FURIA",
    logo: "FUR",
    pais: "BR",
    fundacao: "2017",
    ranking: 1,
    pontos: 150,
    regiao: "América do Sul",
  };

  const estatisticas = {
    partidas: 24,
    vitorias: 18,
    derrotas: 6,
    winrate: "75%",
    mapasJogados: 58,
    mapasVencidos: 42,
    roundsVencidos: 856,
    roundsPerdidos: 724,
  };

  const jogadores = [
    { nome: "KSCERATO", funcao: "Rifler", pais: "BR", idade: 24, rating: "1.32", kills: 456, deaths: 312, hs: "52%" },
    { nome: "yuurih", funcao: "Rifler", pais: "BR", idade: 23, rating: "1.28", kills: 423, deaths: 298, hs: "48%" },
    { nome: "FalleN", funcao: "AWPer/IGL", pais: "BR", idade: 33, rating: "1.15", kills: 389, deaths: 342, hs: "35%" },
    { nome: "chelo", funcao: "Entry", pais: "BR", idade: 25, rating: "1.08", kills: 378, deaths: 356, hs: "45%" },
    { nome: "skullz", funcao: "Support", pais: "BR", idade: 22, rating: "0.98", kills: 312, deaths: 328, hs: "42%" },
  ];

  const coach = { nome: "guerri", pais: "BR" };

  const historicoPartidas = [
    { id: 1, adversario: "Imperial", resultado: "Vitória", placar: "2-1", data: "04 Fev", campeonato: "ORBITAL CUP" },
    { id: 2, adversario: "paiN", resultado: "Vitória", placar: "2-0", data: "03 Fev", campeonato: "ORBITAL CUP" },
    { id: 3, adversario: "LOUD", resultado: "Vitória", placar: "2-1", data: "02 Fev", campeonato: "ORBITAL CUP" },
    { id: 4, adversario: "MIBR", resultado: "Vitória", placar: "2-0", data: "01 Fev", campeonato: "ORBITAL CUP" },
    { id: 5, adversario: "Fluxo", resultado: "Derrota", placar: "1-2", data: "31 Jan", campeonato: "ORBITAL CUP" },
  ];

  const mapasStats = [
    { nome: "Mirage", partidas: 12, vitorias: 10, winrate: "83%" },
    { nome: "Inferno", partidas: 10, vitorias: 7, winrate: "70%" },
    { nome: "Ancient", partidas: 8, vitorias: 6, winrate: "75%" },
    { nome: "Nuke", partidas: 6, vitorias: 5, winrate: "83%" },
    { nome: "Anubis", partidas: 5, vitorias: 3, winrate: "60%" },
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

          <div className="flex items-center gap-2 text-xs font-mono">
            <Link href="/campeonatos" className="text-[#A1A1AA] hover:text-[#F5F5DC]">CAMPEONATOS</Link>
            <span className="text-[#A1A1AA]">/</span>
            <span className="text-[#F5F5DC]">TIME</span>
          </div>

          <div className="w-32" />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 pt-16">
        {/* Banner do Time */}
        <div className="relative h-48 bg-gradient-to-r from-[#A855F7]/20 via-[#1a1a2e] to-[#7C3AED]/20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </div>

        {/* Info Principal */}
        <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo do Time */}
            <div className="w-32 h-32 rounded-2xl bg-[#27272A] border-4 border-[#0A0A0A] shadow-lg flex items-center justify-center">
              <span className="font-display text-4xl text-[#A1A1AA]">{time.logo}</span>
            </div>

            {/* Info */}
            <div className="flex-1 pt-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl text-[#F5F5DC]">{time.nome}</h1>
                <span className="px-2 py-1 bg-[#A855F7]/20 border border-[#A855F7]/50 rounded text-xs font-mono text-[#A855F7]">
                  {time.pais}
                </span>
                <span className="px-2 py-1 bg-[#FFD700]/20 border border-[#FFD700]/50 rounded text-xs font-mono text-[#FFD700]">
                  #{time.ranking}
                </span>
              </div>
              <p className="text-[#A1A1AA] text-sm font-body">
                Fundado em {time.fundacao} • {time.regiao} • {time.pontos} pontos
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Conteúdo */}
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">PARTIDAS</span>
                <span className="font-display text-2xl text-[#F5F5DC]">{estatisticas.partidas}</span>
              </div>
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">WINRATE</span>
                <span className="font-display text-2xl text-[#22c55e]">{estatisticas.winrate}</span>
              </div>
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">VITÓRIAS</span>
                <span className="font-display text-2xl text-[#22c55e]">{estatisticas.vitorias}</span>
              </div>
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">DERROTAS</span>
                <span className="font-display text-2xl text-[#ef4444]">{estatisticas.derrotas}</span>
              </div>
            </div>

            {/* Elenco */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
              <div className="p-4 border-b border-[#27272A]">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">ELENCO</h3>
              </div>
              <div className="divide-y divide-[#27272A]">
                {/* Header */}
                <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] font-mono text-[#A1A1AA]">
                  <span className="col-span-2">JOGADOR</span>
                  <span>FUNÇÃO</span>
                  <span className="text-center">K</span>
                  <span className="text-center">D</span>
                  <span className="text-center">HS%</span>
                  <span className="text-center">RATING</span>
                </div>
                {jogadores.map((jogador) => (
                  <div key={jogador.nome} className="grid grid-cols-7 gap-2 px-4 py-3 hover:bg-[#1a1a2e] transition-colors">
                    <Link href="/campeonatos/perfil" className="col-span-2 flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center">
                        <span className="font-mono text-white text-xs">{jogador.nome[0]}</span>
                      </div>
                      <div>
                        <span className="text-sm text-[#F5F5DC] hover:text-[#A855F7] block">{jogador.nome}</span>
                        <span className="text-[10px] text-[#A1A1AA]">{jogador.pais}</span>
                      </div>
                    </Link>
                    <span className="text-xs text-[#A1A1AA] flex items-center">{jogador.funcao}</span>
                    <span className="text-center text-sm font-mono text-[#22c55e] flex items-center justify-center">{jogador.kills}</span>
                    <span className="text-center text-sm font-mono text-[#ef4444] flex items-center justify-center">{jogador.deaths}</span>
                    <span className="text-center text-sm font-mono text-[#A1A1AA] flex items-center justify-center">{jogador.hs}</span>
                    <span className={`text-center text-sm font-mono font-bold flex items-center justify-center ${
                      parseFloat(jogador.rating) >= 1 ? "text-[#22c55e]" : "text-[#ef4444]"
                    }`}>
                      {jogador.rating}
                    </span>
                  </div>
                ))}
                {/* Coach */}
                <div className="px-4 py-3 bg-[#1a1a2e]/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#A1A1AA]">Coach:</span>
                    <span className="text-sm text-[#F5F5DC]">{coach.nome}</span>
                    <span className="text-xs text-[#A1A1AA]">({coach.pais})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico de Partidas */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
              <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">ÚLTIMAS PARTIDAS</h3>
                <Link href="/campeonatos/resultados" className="text-xs font-mono text-[#A855F7] hover:text-[#C084FC]">
                  VER TODAS →
                </Link>
              </div>
              <div className="divide-y divide-[#27272A]">
                {historicoPartidas.map((partida) => (
                  <Link
                    key={partida.id}
                    href="/campeonatos/partida"
                    className="flex items-center justify-between p-4 hover:bg-[#1a1a2e] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1 h-10 rounded ${partida.resultado === "Vitória" ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
                      <div>
                        <span className="text-sm text-[#F5F5DC] block">vs {partida.adversario}</span>
                        <span className="text-xs text-[#A1A1AA]">{partida.campeonato}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-sm block ${partida.resultado === "Vitória" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {partida.placar}
                      </span>
                      <span className="text-xs text-[#A1A1AA]">{partida.data}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats por Mapa */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
              <div className="p-4 border-b border-[#27272A]">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">MAPAS</h3>
              </div>
              <div className="p-4 space-y-3">
                {mapasStats.map((mapa) => (
                  <div key={mapa.nome}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#F5F5DC]">{mapa.nome}</span>
                      <span className="text-xs font-mono text-[#A855F7]">{mapa.winrate}</span>
                    </div>
                    <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full"
                        style={{ width: mapa.winrate }}
                      />
                    </div>
                    <span className="text-[10px] text-[#A1A1AA]">{mapa.vitorias}V - {mapa.partidas - mapa.vitorias}D</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
              <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">INFORMAÇÕES</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-[#A1A1AA]">Região</span>
                  <span className="text-xs text-[#F5F5DC]">{time.regiao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#A1A1AA]">Fundação</span>
                  <span className="text-xs text-[#F5F5DC]">{time.fundacao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#A1A1AA]">Ranking</span>
                  <span className="text-xs text-[#FFD700]">#{time.ranking}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#A1A1AA]">Pontos</span>
                  <span className="text-xs text-[#A855F7]">{time.pontos}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TimePage() {
  return (
    <RequireTournamentProfile>
      <TimeContent />
    </RequireTournamentProfile>
  );
}
