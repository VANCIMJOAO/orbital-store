"use client";

import Link from "next/link";
import { TournamentHeader } from "@/components/TournamentHeader";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import TournamentBracket from "@/components/TournamentBracket";
import type { Database } from "@/lib/database.types";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];

interface MatchWithTeams extends Match {
  team1: { name: string; tag: string; logo_url: string | null } | null;
  team2: { name: string; tag: string; logo_url: string | null } | null;
}

function BracketContent() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [tournamentName, setTournamentName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: tournament } = await supabase
          .from("tournaments")
          .select("*")
          .in("status", ["ongoing", "active", "registration", "upcoming", "draft"])
          .order("start_date", { ascending: false })
          .limit(1)
          .single();

        if (!tournament) return;
        setTournamentName(tournament.name || "");

        const { data: matchesData } = await supabase
          .from("matches")
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(name, tag, logo_url),
            team2:teams!matches_team2_id_fkey(name, tag, logo_url)
          `)
          .eq("tournament_id", tournament.id)
          .order("scheduled_at", { ascending: true });

        if (matchesData) {
          setMatches(matchesData as unknown as MatchWithTeams[]);
        }
      } catch (error) {
        console.error("Error fetching bracket data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <TournamentHeader />

      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl text-[#F5F5DC]">BRACKET</h1>
              {tournamentName && (
                <span className="text-xs font-mono text-[#A855F7] mt-1 block">{tournamentName}</span>
              )}
            </div>
            <span className="text-xs font-mono text-[#A1A1AA]">DOUBLE ELIMINATION</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs font-mono text-[#A1A1AA]">Carregando bracket...</span>
              </div>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <span className="text-[#52525B] text-4xl block mb-2">[ ]</span>
                <span className="text-sm text-[#A1A1AA]">Nenhuma partida encontrada</span>
              </div>
            </div>
          ) : (
            <TournamentBracket
              matches={matches}
              onMatchClick={(match) => router.push(`/campeonatos/partida/${match.id}`)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function BracketPage() {
  return (
    <RequireTournamentProfile>
      <BracketContent />
    </RequireTournamentProfile>
  );
}
