"use client";

import Link from "next/link";
import { TournamentHeader } from "@/components/TournamentHeader";
import { useEffect, useState, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import type { Database } from "@/lib/database.types";

type Team = Database["public"]["Tables"]["teams"]["Row"];

function TimeListContent() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
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

        const { data: tournamentTeams } = await supabase
          .from("tournament_teams")
          .select("team_id, teams(*)")
          .eq("tournament_id", tournament.id)
          .in("status", ["confirmed", "registered"]);

        if (tournamentTeams) {
          const teamsArray = tournamentTeams
            .map((tt) => (tt.teams as unknown) as Team)
            .filter(Boolean);
          setTeams(teamsArray);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <TournamentHeader />

      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="font-display text-2xl text-[#F5F5DC] mb-8">TIMES</h1>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs font-mono text-[#A1A1AA]">Carregando times...</span>
              </div>
            </div>
          ) : teams.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-sm text-[#A1A1AA]">Nenhum time encontrado</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/campeonatos/time/${team.id}`}
                  className="bg-[#12121a] border border-[#27272A] rounded-lg p-6 hover:border-[#A855F7]/50 transition-colors flex flex-col items-center gap-3"
                >
                  <div className="w-20 h-20 rounded-xl bg-[#27272A] flex items-center justify-center overflow-hidden">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.tag} className="w-14 h-14 object-contain" />
                    ) : (
                      <span className="font-display text-2xl text-[#A1A1AA]">{team.tag.substring(0, 3)}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <span className="font-display text-lg text-[#F5F5DC] block">{team.name}</span>
                    <span className="text-xs font-mono text-[#A1A1AA]">{team.tag}</span>
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

export default function TimeListPage() {
  return (
    <RequireTournamentProfile>
      <TimeListContent />
    </RequireTournamentProfile>
  );
}
