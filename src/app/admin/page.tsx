"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  totalTeams: number;
  totalPlayers: number;
  totalMatches: number;
  liveMatches: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTournaments: 0,
    activeTournaments: 0,
    totalTeams: 0,
    totalPlayers: 0,
    totalMatches: 0,
    liveMatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createBrowserSupabaseClient();

      const [tournaments, teams, players, matches] = await Promise.all([
        supabase.from("tournaments").select("id, status", { count: "exact" }),
        supabase.from("teams").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }).eq("is_tournament_player", true),
        supabase.from("matches").select("id, status", { count: "exact" }),
      ]);

      setStats({
        totalTournaments: tournaments.count || 0,
        activeTournaments: tournaments.data?.filter(t => t.status === "ongoing").length || 0,
        totalTeams: teams.count || 0,
        totalPlayers: players.count || 0,
        totalMatches: matches.count || 0,
        liveMatches: matches.data?.filter(m => m.status === "live").length || 0,
      });

      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "CAMPEONATOS",
      value: stats.totalTournaments,
      subValue: `${stats.activeTournaments} ativos`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: "from-[#A855F7] to-[#7C3AED]",
      href: "/admin/campeonatos",
    },
    {
      label: "TIMES",
      value: stats.totalTeams,
      subValue: "cadastrados",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "from-[#22c55e] to-[#16a34a]",
      href: "/admin/times",
    },
    {
      label: "JOGADORES",
      value: stats.totalPlayers,
      subValue: "registrados",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "from-[#3b82f6] to-[#2563eb]",
      href: "/admin/jogadores",
    },
    {
      label: "PARTIDAS",
      value: stats.totalMatches,
      subValue: `${stats.liveMatches} ao vivo`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: "from-[#f59e0b] to-[#d97706]",
      href: "/admin/partidas",
    },
  ];

  const quickActions = [
    { label: "Novo Campeonato", href: "/admin/campeonatos/novo", icon: "+" },
    { label: "Novo Time", href: "/admin/times/novo", icon: "+" },
    { label: "Nova Partida", href: "/admin/partidas/nova", icon: "+" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#F5F5DC]">Dashboard</h2>
          <p className="text-[#A1A1AA] text-sm mt-1">Visao geral do sistema de campeonatos</p>
        </div>

        <div className="flex gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-2 px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-xs rounded-lg transition-colors"
            >
              <span className="text-lg leading-none">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-[#12121a] border border-[#27272A] hover:border-[#A855F7]/50 rounded-xl p-6 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                  {card.label}
                </span>
                {loading ? (
                  <div className="h-10 w-16 bg-[#27272A] rounded animate-pulse mt-2" />
                ) : (
                  <div className="mt-2">
                    <span className="font-display text-4xl text-[#F5F5DC]">
                      {card.value}
                    </span>
                    <span className="block text-xs text-[#A1A1AA] mt-1">
                      {card.subValue}
                    </span>
                  </div>
                )}
              </div>
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white opacity-80 group-hover:opacity-100 transition-opacity`}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Start Guide */}
      <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6">
        <h3 className="font-display text-lg text-[#F5F5DC] mb-4">Como Comecar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[#A855F7] font-bold">1</span>
            </div>
            <div>
              <h4 className="font-mono text-sm text-[#F5F5DC] mb-1">Criar Campeonato</h4>
              <p className="text-xs text-[#A1A1AA]">
                Configure nome, formato, premiacao e datas do campeonato.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[#A855F7] font-bold">2</span>
            </div>
            <div>
              <h4 className="font-mono text-sm text-[#F5F5DC] mb-1">Cadastrar Times</h4>
              <p className="text-xs text-[#A1A1AA]">
                Adicione os times e seus jogadores ao sistema.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[#A855F7] font-bold">3</span>
            </div>
            <div>
              <h4 className="font-mono text-sm text-[#F5F5DC] mb-1">Agendar Partidas</h4>
              <p className="text-xs text-[#A1A1AA]">
                Crie o cronograma e acompanhe os resultados em tempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!loading && stats.totalTournaments === 0 && (
        <div className="bg-[#12121a] border border-dashed border-[#A855F7]/30 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#A855F7]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="font-display text-xl text-[#F5F5DC] mb-2">Nenhum campeonato ainda</h3>
          <p className="text-[#A1A1AA] text-sm mb-6">
            Comece criando seu primeiro campeonato para gerenciar times e partidas.
          </p>
          <Link
            href="/admin/campeonatos/novo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-sm rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Criar Primeiro Campeonato
          </Link>
        </div>
      )}
    </div>
  );
}
