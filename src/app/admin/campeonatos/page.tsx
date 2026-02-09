"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface Tournament {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  game: string | null;
  format: string | null;
  max_teams: number | null;
  prize_pool: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-[#52525B]/20", text: "text-[#A1A1AA]", label: "RASCUNHO" },
  registration: { bg: "bg-[#3b82f6]/20", text: "text-[#3b82f6]", label: "INSCRICOES" },
  ongoing: { bg: "bg-[#22c55e]/20", text: "text-[#22c55e]", label: "EM ANDAMENTO" },
  finished: { bg: "bg-[#A855F7]/20", text: "text-[#A855F7]", label: "FINALIZADO" },
  cancelled: { bg: "bg-[#ef4444]/20", text: "text-[#ef4444]", label: "CANCELADO" },
};

export default function CampeonatosAdmin() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchTournaments = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTournaments(data);

        // Fetch team counts for each tournament
        const { data: teamData } = await supabase
          .from("tournament_teams")
          .select("tournament_id");

        if (teamData) {
          const counts: Record<string, number> = {};
          teamData.forEach((tt: { tournament_id: string }) => {
            counts[tt.tournament_id] = (counts[tt.tournament_id] || 0) + 1;
          });
          setTeamCounts(counts);
        }
      }
      setLoading(false);
    };

    fetchTournaments();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrizePool = (value: number | null) => {
    if (!value) return "-";
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  const handleDelete = async (tournament: Tournament) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR "${tournament.name}"? Todas as partidas e inscricoes serao apagadas.`)) {
      return;
    }

    const supabase = createBrowserSupabaseClient();

    await supabase.from("matches").delete().eq("tournament_id", tournament.id);
    await supabase.from("tournament_teams").delete().eq("tournament_id", tournament.id);
    const { error } = await supabase.from("tournaments").delete().eq("id", tournament.id);

    if (error) {
      alert("Erro ao excluir campeonato: " + error.message);
      return;
    }

    setTournaments((prev) => prev.filter((t) => t.id !== tournament.id));
  };

  const filteredTournaments = useMemo(() => {
    let result = tournaments;
    if (statusFilter) {
      result = result.filter((t) => (t.status || "draft") === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.game?.toLowerCase().includes(q) ||
          t.slug?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tournaments, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#F5F5DC]">Campeonatos</h2>
          <p className="text-[#A1A1AA] text-sm mt-1">Gerencie todos os campeonatos</p>
        </div>

        <Link
          href="/admin/campeonatos/novo"
          className="flex items-center gap-2 px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-xs rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          NOVO CAMPEONATO
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar campeonato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#12121a] border border-[#27272A] rounded-lg pl-10 pr-4 py-2 text-sm text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#12121a] border border-[#27272A] rounded-lg px-4 py-2 text-sm text-[#F5F5DC] focus:outline-none focus:border-[#A855F7]/50"
        >
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="registration">Inscricoes</option>
          <option value="ongoing">Em Andamento</option>
          <option value="finished">Finalizado</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#12121a] border border-[#27272A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#27272A]">
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                CAMPEONATO
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                STATUS
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                FORMATO
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                TIMES
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                PREMIACAO
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                DATA
              </th>
              <th className="text-right px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                ACOES
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-[#27272A]">
                  <td className="px-6 py-4" colSpan={7}>
                    <div className="h-6 bg-[#27272A] rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filteredTournaments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#A855F7]/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-[#A1A1AA] text-sm">Nenhum campeonato cadastrado</p>
                    <Link
                      href="/admin/campeonatos/novo"
                      className="text-[#A855F7] hover:text-[#C084FC] text-sm font-mono"
                    >
                      + Criar primeiro campeonato
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTournaments.map((tournament) => {
                const status = statusColors[tournament.status || "draft"] || statusColors.draft;
                return (
                  <tr
                    key={tournament.id}
                    className="border-b border-[#27272A] hover:bg-[#1a1a2e] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-body text-sm text-[#F5F5DC] block">
                          {tournament.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#52525B]">
                          {tournament.game}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-mono ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-[#A1A1AA]">
                        {tournament.format}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-[#A1A1AA]">
                        {teamCounts[tournament.id] || 0}/{tournament.max_teams ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-[#22c55e]">
                        {formatPrizePool(tournament.prize_pool)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-[#A1A1AA]">
                        {formatDate(tournament.start_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/campeonatos/${tournament.id}`}
                          className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(tournament)}
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
