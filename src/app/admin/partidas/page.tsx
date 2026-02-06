"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface Match {
  id: string;
  tournament_id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number;
  team2_score: number;
  winner_id: string | null;
  status: string;
  round: string | null;
  scheduled_at: string | null;
  tournament?: { name: string };
  team1?: { name: string; tag: string };
  team2?: { name: string; tag: string };
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "bg-[#3b82f6]/20", text: "text-[#3b82f6]", label: "AGENDADA" },
  live: { bg: "bg-[#ef4444]/20", text: "text-[#ef4444]", label: "AO VIVO" },
  finished: { bg: "bg-[#22c55e]/20", text: "text-[#22c55e]", label: "FINALIZADA" },
  cancelled: { bg: "bg-[#52525B]/20", text: "text-[#A1A1AA]", label: "CANCELADA" },
};

export default function PartidasAdmin() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          tournament:tournaments(name),
          team1:teams!matches_team1_id_fkey(name, tag),
          team2:teams!matches_team2_id_fkey(name, tag)
        `)
        .order("scheduled_at", { ascending: false });

      if (!error && data) {
        setMatches(data);
      }
      setLoading(false);
    };

    fetchMatches();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#F5F5DC]">Partidas</h2>
          <p className="text-[#A1A1AA] text-sm mt-1">Gerencie as partidas dos campeonatos</p>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-xs rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          NOVA PARTIDA
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar partida..."
            className="w-full bg-[#12121a] border border-[#27272A] rounded-lg pl-10 pr-4 py-2 text-sm text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
          />
        </div>

        <select className="bg-[#12121a] border border-[#27272A] rounded-lg px-4 py-2 text-sm text-[#F5F5DC] focus:outline-none focus:border-[#A855F7]/50">
          <option value="">Todos os status</option>
          <option value="scheduled">Agendada</option>
          <option value="live">Ao Vivo</option>
          <option value="finished">Finalizada</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#12121a] border border-[#27272A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#27272A]">
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                PARTIDA
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                CAMPEONATO
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                FASE
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                STATUS
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                DATA/HORA
              </th>
              <th className="text-right px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                ACOES
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[#27272A]">
                  <td className="px-6 py-4" colSpan={6}>
                    <div className="h-6 bg-[#27272A] rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : matches.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#A855F7]/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <p className="text-[#A1A1AA] text-sm">Nenhuma partida agendada</p>
                    <p className="text-[10px] text-[#52525B]">
                      Crie um campeonato e times primeiro para agendar partidas.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              matches.map((match) => {
                const status = statusColors[match.status] || statusColors.scheduled;
                return (
                  <tr
                    key={match.id}
                    onClick={() => router.push(`/admin/partidas/${match.id}`)}
                    className="border-b border-[#27272A] hover:bg-[#1a1a2e] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center">
                            <span className="text-[8px] font-mono text-[#A1A1AA]">
                              {match.team1?.tag || "T1"}
                            </span>
                          </div>
                          <span className="text-sm text-[#F5F5DC]">
                            {match.team1?.name || "Time 1"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 px-3">
                          <span className="font-mono text-lg text-[#F5F5DC]">
                            {match.team1_score}
                          </span>
                          <span className="text-[#52525B]">:</span>
                          <span className="font-mono text-lg text-[#F5F5DC]">
                            {match.team2_score}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#F5F5DC]">
                            {match.team2?.name || "Time 2"}
                          </span>
                          <div className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center">
                            <span className="text-[8px] font-mono text-[#A1A1AA]">
                              {match.team2?.tag || "T2"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-[#A1A1AA]">
                        {match.tournament?.name || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-[#A1A1AA] capitalize">
                        {match.round?.replace("_", " ") || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-mono ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-[#A1A1AA]">
                        {formatDate(match.scheduled_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/partidas/${match.id}`); }}
                          className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <svg className="w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 hover:bg-[#ef4444]/20 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <svg className="w-4 h-4 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
