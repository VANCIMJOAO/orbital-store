"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import type { Database } from "@/lib/database.types";

type Match = Database["public"]["Tables"]["matches"]["Row"];

interface MatchWithTeams extends Match {
  team1: { name: string; tag: string; logo_url: string | null } | null;
  team2: { name: string; tag: string; logo_url: string | null } | null;
}

const roundLabels: Record<string, string> = {
  winner_quarter_1: "Quartas - Winner",
  winner_quarter_2: "Quartas - Winner",
  winner_quarter_3: "Quartas - Winner",
  winner_quarter_4: "Quartas - Winner",
  winner_semi_1: "Semifinal - Winner",
  winner_semi_2: "Semifinal - Winner",
  winner_final: "Final - Winner",
  loser_round1_1: "Round 1 - Loser",
  loser_round1_2: "Round 1 - Loser",
  loser_round2_1: "Round 2 - Loser",
  loser_round2_2: "Round 2 - Loser",
  loser_semi: "Semifinal - Loser",
  loser_final: "Final - Loser",
  grand_final: "Grand Final",
};

function ResultadosContent() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: tournament } = await supabase
          .from("tournaments")
          .select("id")
          .in("status", ["ongoing", "active", "registration", "upcoming", "draft"])
          .order("start_date", { ascending: false })
          .limit(1)
          .single();

        if (!tournament) return;

        const { data: matchesData } = await supabase
          .from("matches")
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(name, tag, logo_url),
            team2:teams!matches_team2_id_fkey(name, tag, logo_url)
          `)
          .eq("tournament_id", tournament.id)
          .eq("status", "finished")
          .order("finished_at", { ascending: false });

        if (matchesData) {
          setMatches(matchesData as unknown as MatchWithTeams[]);
        }
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

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

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs font-mono text-[#A1A1AA]">Carregando resultados...</span>
              </div>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <span className="text-[#52525B] text-4xl block mb-2">-</span>
                <span className="text-sm text-[#A1A1AA]">Nenhum resultado disponível ainda</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/campeonatos/partida/${match.id}`}
                  className="block bg-[#12121a] border border-[#27272A] rounded-lg overflow-hidden hover:border-[#A855F7]/50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-[#A855F7]">
                        {roundLabels[match.round || ""] || match.round || ""}
                      </span>
                      <span className="text-xs font-mono text-[#A1A1AA]">
                        {formatDate(match.finished_at || match.scheduled_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                          {match.team1?.logo_url ? (
                            <img src={match.team1.logo_url} alt={match.team1.tag} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-xs font-mono text-[#A1A1AA]">
                              {match.team1?.tag?.substring(0, 3).toUpperCase() || "???"}
                            </span>
                          )}
                        </div>
                        <span className={`text-lg ${match.winner_id === match.team1_id ? "text-[#22c55e] font-bold" : "text-[#A1A1AA]"}`}>
                          {match.team1?.name || "TBD"}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="font-display text-2xl text-[#F5F5DC]">
                          {match.team1_score} - {match.team2_score}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${match.winner_id === match.team2_id ? "text-[#22c55e] font-bold" : "text-[#A1A1AA]"}`}>
                          {match.team2?.name || "TBD"}
                        </span>
                        <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center overflow-hidden">
                          {match.team2?.logo_url ? (
                            <img src={match.team2.logo_url} alt={match.team2.tag} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-xs font-mono text-[#A1A1AA]">
                              {match.team2?.tag?.substring(0, 3).toUpperCase() || "???"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-[#1a1a2e] border-t border-[#27272A]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#A1A1AA]">
                        {match.map_name || ""}
                      </span>
                      {match.best_of > 1 && (
                        <span className="text-[10px] font-mono text-[#A855F7]">MD{match.best_of}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
