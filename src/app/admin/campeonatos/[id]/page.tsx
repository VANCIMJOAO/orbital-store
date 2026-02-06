"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import TournamentBracket from "@/components/TournamentBracket";

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  game: string | null;
  format: string | null;
  max_teams: number | null;
  prize_pool: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  rules: string | null;
  banner_url: string | null;
}

interface Team {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
  seed?: number;
  players_count?: number;
}

interface TournamentTeam {
  id: string;
  tournament_id: string;
  team_id: string;
  seed: number | null;
  status: string;
  team: Team;
}

interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number;
  team2_score: number;
  winner_id: string | null;
  status: string;
  round: string | null;
  scheduled_at: string | null;
  best_of: number;
  team1?: { name: string; tag: string };
  team2?: { name: string; tag: string };
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-[#52525B]/20", text: "text-[#A1A1AA]", label: "RASCUNHO" },
  registration: { bg: "bg-[#3b82f6]/20", text: "text-[#3b82f6]", label: "INSCRICOES" },
  ongoing: { bg: "bg-[#22c55e]/20", text: "text-[#22c55e]", label: "EM ANDAMENTO" },
  finished: { bg: "bg-[#A855F7]/20", text: "text-[#A855F7]", label: "FINALIZADO" },
};

const matchStatusColors: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "bg-[#3b82f6]/20", text: "text-[#3b82f6]", label: "AGENDADA" },
  pending: { bg: "bg-[#52525B]/20", text: "text-[#A1A1AA]", label: "A DEFINIR" },
  live: { bg: "bg-[#ef4444]/20", text: "text-[#ef4444]", label: "AO VIVO" },
  finished: { bg: "bg-[#22c55e]/20", text: "text-[#22c55e]", label: "FINALIZADA" },
};

export default function CampeonatoDetalhes() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentTeams, setTournamentTeams] = useState<TournamentTeam[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "bracket">("bracket");
  const [deleting, setDeleting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    const supabase = createBrowserSupabaseClient();

    // Buscar campeonato
    const { data: tournamentData } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (tournamentData) {
      setTournament(tournamentData);
    }

    // Buscar times do campeonato
    const { data: teamsData } = await supabase
      .from("tournament_teams")
      .select(`
        *,
        team:teams(id, name, tag, logo_url)
      `)
      .eq("tournament_id", tournamentId)
      .order("seed", { ascending: true });

    if (teamsData) {
      setTournamentTeams(teamsData as TournamentTeam[]);
    }

    // Buscar times disponiveis (nao no campeonato)
    const { data: allTeams } = await supabase
      .from("teams")
      .select("*")
      .order("name");

    if (allTeams && teamsData) {
      const registeredIds = teamsData.map((t: TournamentTeam) => t.team_id);
      setAvailableTeams(allTeams.filter((t: Team) => !registeredIds.includes(t.id)));
    }

    // Buscar partidas do campeonato
    const { data: matchesData } = await supabase
      .from("matches")
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(name, tag),
        team2:teams!matches_team2_id_fkey(name, tag)
      `)
      .eq("tournament_id", tournamentId)
      .order("scheduled_at", { ascending: true });

    if (matchesData) {
      setMatches(matchesData);
    }

    setLoading(false);
  };

  const handleAddTeam = async () => {
    if (selectedTeamIds.length === 0) return;

    const supabase = createBrowserSupabaseClient();
    const baseSeed = tournamentTeams.length + 1;

    const rows = selectedTeamIds.map((teamId, idx) => ({
      tournament_id: tournamentId,
      team_id: teamId,
      seed: baseSeed + idx,
      status: "registered",
    }));

    const { error } = await supabase.from("tournament_teams").insert(rows);

    if (!error) {
      setShowAddTeamModal(false);
      setSelectedTeamIds([]);
      fetchData();
    }
  };

  const handleRemoveTeam = async (tournamentTeamId: string) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("tournament_teams")
      .delete()
      .eq("id", tournamentTeamId);

    if (!error) {
      fetchData();
    }
  };

  const handleGenerateBracket = async () => {
    if (!tournament || tournamentTeams.length < 2) return;
    if (matches.length > 0) {
      if (!confirm("Ja existem partidas criadas. Deseja apagar e gerar novamente?")) {
        return;
      }
    }

    setGenerating(true);
    const supabase = createBrowserSupabaseClient();

    // Apagar partidas existentes
    if (matches.length > 0) {
      await supabase.from("matches").delete().eq("tournament_id", tournamentId);
    }

    // Ordenar times por seed
    const teams = [...tournamentTeams].sort((a, b) => (a.seed || 99) - (b.seed || 99));
    const numTeams = teams.length;

    // Calcular horario base
    const startDate = tournament.start_date ? new Date(tournament.start_date) : new Date();
    let matchTime = new Date(startDate);
    const matchDuration = 60; // 60 minutos por partida MD1

    // Gerar partidas do Winner Bracket
    const matchesToCreate: any[] = [];

    if (numTeams === 8) {
      // Winner Bracket - Quartas (4 jogos)
      const quarterMatches = [
        { team1: teams[0], team2: teams[7], round: "winner_quarter_1" },
        { team1: teams[1], team2: teams[6], round: "winner_quarter_2" },
        { team1: teams[2], team2: teams[5], round: "winner_quarter_3" },
        { team1: teams[3], team2: teams[4], round: "winner_quarter_4" },
      ];

      quarterMatches.forEach((match, idx) => {
        matchesToCreate.push({
          tournament_id: tournamentId,
          team1_id: match.team1.team_id,
          team2_id: match.team2.team_id,
          round: match.round,
          status: "scheduled",
          scheduled_at: new Date(matchTime.getTime() + idx * matchDuration * 60 * 1000).toISOString(),
          best_of: 1,
          team1_score: 0,
          team2_score: 0,
        });
      });

      // Winner Bracket - Semis (2 jogos) - horario estimado apos quartas
      const semiBaseTime = matchTime.getTime() + 4 * matchDuration * 60 * 1000;
      ["winner_semi_1", "winner_semi_2"].forEach((round, idx) => {
        matchesToCreate.push({
          tournament_id: tournamentId,
          team1_id: teams[0].team_id, // Placeholder - sera atualizado
          team2_id: teams[1].team_id, // Placeholder - sera atualizado
          round,
          status: "pending", // Aguardando times
          scheduled_at: new Date(semiBaseTime + idx * matchDuration * 60 * 1000).toISOString(),
          best_of: 1,
          team1_score: 0,
          team2_score: 0,
        });
      });

      // Winner Final (1 jogo)
      matchesToCreate.push({
        tournament_id: tournamentId,
        team1_id: teams[0].team_id,
        team2_id: teams[1].team_id,
        round: "winner_final",
        status: "pending",
        scheduled_at: new Date(semiBaseTime + 2 * matchDuration * 60 * 1000).toISOString(),
        best_of: 1,
        team1_score: 0,
        team2_score: 0,
      });

      // Loser Bracket - Round 1 (2 jogos) - perdedores das quartas
      const loserR1Time = semiBaseTime + 3 * matchDuration * 60 * 1000;
      ["loser_round1_1", "loser_round1_2"].forEach((round, idx) => {
        matchesToCreate.push({
          tournament_id: tournamentId,
          team1_id: teams[0].team_id,
          team2_id: teams[1].team_id,
          round,
          status: "pending",
          scheduled_at: new Date(loserR1Time + idx * matchDuration * 60 * 1000).toISOString(),
          best_of: 1,
          team1_score: 0,
          team2_score: 0,
        });
      });

      // Loser Bracket - Round 2 (2 jogos) - perdedores das semis vs vencedores loser R1
      const loserR2Time = loserR1Time + 2 * matchDuration * 60 * 1000;
      ["loser_round2_1", "loser_round2_2"].forEach((round, idx) => {
        matchesToCreate.push({
          tournament_id: tournamentId,
          team1_id: teams[0].team_id,
          team2_id: teams[1].team_id,
          round,
          status: "pending",
          scheduled_at: new Date(loserR2Time + idx * matchDuration * 60 * 1000).toISOString(),
          best_of: 1,
          team1_score: 0,
          team2_score: 0,
        });
      });

      // Loser Semi (1 jogo)
      matchesToCreate.push({
        tournament_id: tournamentId,
        team1_id: teams[0].team_id,
        team2_id: teams[1].team_id,
        round: "loser_semi",
        status: "pending",
        scheduled_at: new Date(loserR2Time + 2 * matchDuration * 60 * 1000).toISOString(),
        best_of: 1,
        team1_score: 0,
        team2_score: 0,
      });

      // Loser Final (1 jogo)
      matchesToCreate.push({
        tournament_id: tournamentId,
        team1_id: teams[0].team_id,
        team2_id: teams[1].team_id,
        round: "loser_final",
        status: "pending",
        scheduled_at: new Date(loserR2Time + 3 * matchDuration * 60 * 1000).toISOString(),
        best_of: 1,
        team1_score: 0,
        team2_score: 0,
      });

      // Grand Final (MD3)
      matchesToCreate.push({
        tournament_id: tournamentId,
        team1_id: teams[0].team_id,
        team2_id: teams[1].team_id,
        round: "grand_final",
        status: "pending",
        scheduled_at: new Date(loserR2Time + 4 * matchDuration * 60 * 1000).toISOString(),
        best_of: 3, // MD3 na final
        team1_score: 0,
        team2_score: 0,
      });
    }

    // Inserir todas as partidas
    const { error } = await supabase.from("matches").insert(matchesToCreate);

    if (error) {
      console.error("Erro ao gerar bracket:", error);
    } else {
      // Atualizar status do campeonato
      await supabase
        .from("tournaments")
        .update({ status: "ongoing" })
        .eq("id", tournamentId);
    }

    setGenerating(false);
    fetchData();
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tournament) return;

    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("slug", tournament.slug || "banner");

    try {
      const res = await fetch("/api/upload/banner", { method: "POST", body: formData });
      const result = await res.json();

      if (res.ok && result.url) {
        const supabase = createBrowserSupabaseClient();
        await supabase.from("tournaments").update({ banner_url: result.url }).eq("id", tournamentId);
        setTournament({ ...tournament, banner_url: result.url });
      } else {
        alert(`Erro no upload: ${result.error || "Falha desconhecida"}`);
      }
    } catch {
      alert("Erro ao conectar com o servidor de upload");
    }
    setUploadingBanner(false);
  };

  const handleDeleteTournament = async () => {
    if (!confirm("Tem certeza que deseja EXCLUIR este campeonato? Todas as partidas e inscricoes serao apagadas. Esta acao nao pode ser desfeita.")) {
      return;
    }

    setDeleting(true);
    const supabase = createBrowserSupabaseClient();

    // Deletar partidas do campeonato
    await supabase.from("matches").delete().eq("tournament_id", tournamentId);

    // Deletar times inscritos
    await supabase.from("tournament_teams").delete().eq("tournament_id", tournamentId);

    // Deletar o campeonato
    const { error } = await supabase.from("tournaments").delete().eq("id", tournamentId);

    if (error) {
      console.error("Erro ao excluir campeonato:", error);
      setDeleting(false);
      return;
    }

    router.push("/admin/campeonatos");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRound = (round: string | null) => {
    if (!round) return "-";
    const roundNames: Record<string, string> = {
      winner_quarter_1: "Winner Quartas 1",
      winner_quarter_2: "Winner Quartas 2",
      winner_quarter_3: "Winner Quartas 3",
      winner_quarter_4: "Winner Quartas 4",
      winner_semi_1: "Winner Semi 1",
      winner_semi_2: "Winner Semi 2",
      winner_final: "Winner Final",
      loser_round1_1: "Loser R1-1",
      loser_round1_2: "Loser R1-2",
      loser_round2_1: "Loser R2-1",
      loser_round2_2: "Loser R2-2",
      loser_semi: "Loser Semi",
      loser_final: "Loser Final",
      grand_final: "GRAND FINAL",
    };
    return roundNames[round] || round;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-[#A1A1AA]">Campeonato nao encontrado</p>
      </div>
    );
  }

  const status = statusColors[tournament.status || "draft"];
  const canGenerateBracket = tournamentTeams.length === (tournament.max_teams || 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/campeonatos"
          className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-[#F5F5DC]">{tournament.name}</h2>
            <span className={`px-2 py-1 rounded text-[10px] font-mono ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <p className="text-[#A1A1AA] text-sm mt-1">
            {tournament.game} | {tournament.format} | {tournament.max_teams} times
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canGenerateBracket && (
            <button
              onClick={handleGenerateBracket}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#22c55e]/50 text-white font-mono text-xs rounded-lg transition-colors"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  GERANDO...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  GERAR BRACKET
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDeleteTournament}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/50 hover:border-[#ef4444] disabled:opacity-50 text-[#ef4444] font-mono text-xs rounded-lg transition-colors"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#ef4444] border-t-transparent rounded-full animate-spin" />
                EXCLUINDO...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                EXCLUIR
              </>
            )}
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-[#12121a] border border-[#27272A] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
          <div>
            <h3 className="font-mono text-sm text-[#A855F7] tracking-wider">BANNER</h3>
            <p className="text-[10px] text-[#52525B] mt-1">Imagem que aparece na pagina inicial (1200x400 recomendado)</p>
          </div>
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-[10px] rounded transition-colors"
          >
            {uploadingBanner ? "ENVIANDO..." : tournament.banner_url ? "TROCAR" : "UPLOAD"}
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />
        </div>
        {tournament.banner_url ? (
          <img src={tournament.banner_url} alt="Banner" className="w-full h-[160px] object-cover" />
        ) : (
          <div className="w-full h-[100px] bg-[#1a1a2e] flex items-center justify-center">
            <span className="text-xs font-mono text-[#52525B]">Nenhum banner definido</span>
          </div>
        )}
      </div>

      {/* Times */}
      <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-mono text-sm text-[#A855F7] tracking-wider">TIMES INSCRITOS</h3>
            <p className="text-[10px] text-[#52525B] mt-1">
              {tournamentTeams.length}/{tournament.max_teams} times
            </p>
          </div>
          {tournamentTeams.length < (tournament.max_teams || 8) && (
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-[10px] rounded transition-colors"
            >
              + ADICIONAR TIME
            </button>
          )}
        </div>

        {tournamentTeams.length === 0 ? (
          <p className="text-[#52525B] text-sm text-center py-8">
            Nenhum time inscrito ainda
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {tournamentTeams.map((tt) => (
              <div
                key={tt.id}
                className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-lg border border-[#27272A]"
              >
                <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center">
                  <span className="text-xs font-mono text-[#A1A1AA]">
                    {tt.team.tag}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F5F5DC] truncate">{tt.team.name}</p>
                  <p className="text-[10px] text-[#52525B]">Seed #{tt.seed}</p>
                </div>
                <button
                  onClick={() => handleRemoveTeam(tt.id)}
                  className="p-1 hover:bg-[#ef4444]/20 rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {!canGenerateBracket && tournamentTeams.length > 0 && (
          <p className="text-[#eab308] text-xs mt-4 text-center">
            Adicione mais {(tournament.max_teams || 8) - tournamentTeams.length} time(s) para gerar o bracket
          </p>
        )}
      </div>

      {/* Partidas */}
      {matches.length > 0 && (
        <div className="space-y-4">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm text-[#A855F7] tracking-wider">PARTIDAS</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("bracket")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  viewMode === "bracket"
                    ? "bg-[#A855F7] text-white"
                    : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
                BRACKET
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  viewMode === "list"
                    ? "bg-[#A855F7] text-white"
                    : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                LISTA
              </button>
            </div>
          </div>

          {/* Bracket View */}
          {viewMode === "bracket" && (
            <TournamentBracket
              matches={matches}
              onMatchClick={(match) => {
                router.push(`/admin/partidas/${match.id}`);
              }}
            />
          )}

          {/* List View */}
          {viewMode === "list" && (
          <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6">
          <div className="space-y-2">
            {matches.map((match) => {
              const mStatus = matchStatusColors[match.status] || matchStatusColors.scheduled;
              const isPending = match.status === "pending";
              return (
                <div
                  key={match.id}
                  onClick={() => router.push(`/admin/partidas/${match.id}`)}
                  className={`flex items-center gap-4 p-3 bg-[#1a1a2e] rounded-lg border border-[#27272A] cursor-pointer hover:border-[#A855F7]/50 transition-colors ${isPending ? "opacity-60" : ""}`}
                >
                  <div className="w-32">
                    <span className={`px-2 py-1 rounded text-[10px] font-mono ${mStatus.bg} ${mStatus.text}`}>
                      {mStatus.label}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex items-center gap-2 w-40">
                      {isPending ? (
                        <span className="text-sm text-[#52525B] italic">A definir</span>
                      ) : (
                        <>
                          <span className="text-sm text-[#F5F5DC]">{match.team1?.name || "TBD"}</span>
                          <span className="text-xs font-mono text-[#52525B]">{match.team1?.tag}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg text-[#F5F5DC] w-6 text-center">
                        {isPending ? "-" : match.team1_score}
                      </span>
                      <span className="text-[#52525B]">:</span>
                      <span className="font-mono text-lg text-[#F5F5DC] w-6 text-center">
                        {isPending ? "-" : match.team2_score}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-40">
                      {isPending ? (
                        <span className="text-sm text-[#52525B] italic">A definir</span>
                      ) : (
                        <>
                          <span className="text-xs font-mono text-[#52525B]">{match.team2?.tag}</span>
                          <span className="text-sm text-[#F5F5DC]">{match.team2?.name || "TBD"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="w-32 text-right">
                    <p className="text-xs text-[#A1A1AA]">{formatRound(match.round)}</p>
                    <p className="text-[10px] text-[#52525B]">
                      {match.best_of > 1 ? `MD${match.best_of}` : "MD1"} | {formatDate(match.scheduled_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
          )}
        </div>
      )}

      {/* Modal Adicionar Times */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] border border-[#27272A] rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-display text-xl text-[#F5F5DC] mb-2">Adicionar Times</h2>
            <p className="text-[10px] text-[#52525B] mb-4">
              Selecione os times que deseja adicionar ({selectedTeamIds.length} selecionado{selectedTeamIds.length !== 1 ? "s" : ""})
            </p>

            <div className="space-y-4">
              {availableTeams.length === 0 ? (
                <p className="text-[#eab308] text-xs py-4 text-center">
                  Nao ha times disponiveis. Crie novos times primeiro.
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {availableTeams.map((team) => {
                    const isSelected = selectedTeamIds.includes(team.id);
                    return (
                      <label
                        key={team.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#A855F7]/10 border-[#A855F7]/50"
                            : "bg-[#1a1a2e] border-[#27272A] hover:border-[#3f3f46]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedTeamIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== team.id)
                                : [...prev, team.id]
                            );
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[#A855F7] border-[#A855F7]"
                            : "border-[#52525B] bg-transparent"
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded bg-[#27272A] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-mono text-[#A1A1AA]">{team.tag}</span>
                        </div>
                        <span className="text-sm text-[#F5F5DC] truncate">{team.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddTeamModal(false);
                    setSelectedTeamIds([]);
                  }}
                  className="flex-1 px-4 py-3 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleAddTeam}
                  disabled={selectedTeamIds.length === 0}
                  className="flex-1 px-4 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  ADICIONAR {selectedTeamIds.length > 0 ? `(${selectedTeamIds.length})` : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
