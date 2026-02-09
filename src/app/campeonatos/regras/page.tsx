"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface TournamentInfo {
  name: string;
  prize_pool: number | null;
}

export default function RegrasPage() {
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);

  useEffect(() => {
    const fetchTournament = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from("tournaments")
        .select("name, prize_pool")
        .in("status", ["ongoing", "registration"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setTournament(data);
      }
    };
    fetchTournament();
  }, []);

  const tournamentName = tournament?.name || "Torneio CS2";
  const prizePool = tournament?.prize_pool || 0;

  // Distribuição padrão: 60% 1º, 25% 2º, 15% 3º
  const prize1 = prizePool > 0 ? Math.round(prizePool * 0.6) : 0;
  const prize2 = prizePool > 0 ? Math.round(prizePool * 0.25) : 0;
  const prize3 = prizePool > 0 ? prizePool - prize1 - prize2 : 0;

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

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
          <div className="w-32" />
        </div>
      </header>

      <main className="flex-1 pt-16">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">REGULAMENTO</h1>
          <p className="text-[#A1A1AA] text-sm mb-8">{tournamentName}</p>

          <div className="space-y-8">
            {/* Seção 1 */}
            <section className="bg-[#12121a] border border-[#27272A] rounded-lg p-6">
              <h2 className="font-mono text-[#A855F7] text-sm tracking-wider mb-4">1. FORMATO DO TORNEIO</h2>
              <ul className="space-y-3 text-sm text-[#A1A1AA]">
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  8 times participantes em chave de eliminação dupla
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  Winner Bracket e Loser Bracket
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  Partidas em MD1 (Bo1) até as semifinais
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  Semifinais e finais em MD3 (Bo3)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  Grande Final: MD3 (Bo3)
                </li>
              </ul>
            </section>

            {/* Seção 2 */}
            <section className="bg-[#12121a] border border-[#27272A] rounded-lg p-6">
              <h2 className="font-mono text-[#A855F7] text-sm tracking-wider mb-4">2. PREMIAÇÃO</h2>
              {prizePool > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[#27272A]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥇</span>
                      <span className="text-[#F5F5DC]">1º Lugar</span>
                    </div>
                    <span className="font-mono text-[#FFD700] font-bold">{formatCurrency(prize1)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#27272A]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥈</span>
                      <span className="text-[#F5F5DC]">2º Lugar</span>
                    </div>
                    <span className="font-mono text-[#C0C0C0] font-bold">{formatCurrency(prize2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#27272A]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥉</span>
                      <span className="text-[#F5F5DC]">3º Lugar</span>
                    </div>
                    <span className="font-mono text-[#CD7F32] font-bold">{formatCurrency(prize3)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[#A1A1AA]">Total</span>
                    <span className="font-mono text-[#A855F7] font-bold">{formatCurrency(prizePool)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#A1A1AA]">Premiação a ser definida pela administração do torneio.</p>
              )}
            </section>

            {/* Seção 3 */}
            <section className="bg-[#12121a] border border-[#27272A] rounded-lg p-6">
              <h2 className="font-mono text-[#A855F7] text-sm tracking-wider mb-4">3. MAPAS</h2>
              <p className="text-sm text-[#A1A1AA] mb-4">Pool de mapas ativos do CS2:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Mirage", "Inferno", "Ancient", "Nuke", "Anubis", "Vertigo", "Dust2"].map((mapa) => (
                  <div key={mapa} className="bg-[#1a1a2e] rounded px-3 py-2 text-center">
                    <span className="text-sm text-[#F5F5DC]">{mapa}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Seção 4 */}
            <section className="bg-[#12121a] border border-[#27272A] rounded-lg p-6">
              <h2 className="font-mono text-[#A855F7] text-sm tracking-wider mb-4">4. REGRAS GERAIS</h2>
              <ul className="space-y-3 text-sm text-[#A1A1AA]">
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  Times devem estar prontos 15 minutos antes do horário marcado
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  Atraso máximo de 10 minutos, após isso será considerado W.O.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  Uso de cheats ou exploits resultará em desclassificação imediata
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  Cada time pode solicitar até 4 pausas técnicas por mapa (máx. 2 min cada)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A855F7]">•</span>
                  Decisões dos admins são finais e incontestáveis
                </li>
              </ul>
            </section>

            {/* Seção 5 */}
            <section className="bg-[#12121a] border border-[#27272A] rounded-lg p-6">
              <h2 className="font-mono text-[#A855F7] text-sm tracking-wider mb-4">5. CONFIGURAÇÕES DE SERVIDOR</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Rounds por metade</span>
                  <span className="font-mono text-[#F5F5DC]">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Rounds para vencer</span>
                  <span className="font-mono text-[#F5F5DC]">13</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Overtime rounds</span>
                  <span className="font-mono text-[#F5F5DC]">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Dinheiro inicial OT</span>
                  <span className="font-mono text-[#F5F5DC]">$10.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Tickrate</span>
                  <span className="font-mono text-[#F5F5DC]">128</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Anti-cheat</span>
                  <span className="font-mono text-[#F5F5DC]">VAC + FACEIT</span>
                </div>
              </div>
            </section>

            {/* Contato */}
            <section className="bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-lg p-6 text-center">
              <h2 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-2">DÚVIDAS?</h2>
              <p className="text-sm text-[#A1A1AA] mb-4">Entre em contato com a administração do torneio</p>
              <a href="mailto:contato@orbitalroxa.com" className="font-mono text-sm text-[#A855F7] hover:text-[#C084FC]">
                contato@orbitalroxa.com
              </a>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
