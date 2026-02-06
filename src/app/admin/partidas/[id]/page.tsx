"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface Team {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
}

interface Match {
  id: string;
  tournament_id: string;
  team1_id: string;
  team2_id: string;
  team1_score: number;
  team2_score: number;
  winner_id: string | null;
  status: string;
  match_phase: string | null;
  round: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  is_live: boolean | null;
  best_of: number;
  map_name: string | null;
  team1?: Team;
  team2?: Team;
  tournament?: Tournament;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "bg-[#3b82f6]/20", text: "text-[#3b82f6]", label: "AGENDADA" },
  pending: { bg: "bg-[#52525B]/20", text: "text-[#A1A1AA]", label: "A DEFINIR" },
  live: { bg: "bg-[#ef4444]/20", text: "text-[#ef4444]", label: "AO VIVO" },
  finished: { bg: "bg-[#22c55e]/20", text: "text-[#22c55e]", label: "FINALIZADA" },
};

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

export default function PartidaDetalhes() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingServer, setLoadingServer] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishScores, setFinishScores] = useState({ team1: 0, team2: 0 });

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, tag, logo_url),
        team2:teams!matches_team2_id_fkey(id, name, tag, logo_url),
        tournament:tournaments(id, name, slug)
      `)
      .eq("id", matchId)
      .single();

    if (!error && data) {
      setMatch(data);
    }
    setLoading(false);
  };

  const handleStartMatch = async () => {
    if (!match) return;
    setSaving(true);

    const supabase = createBrowserSupabaseClient();
    const now = new Date();

    // Atualizar partida para live
    const { error } = await supabase
      .from("matches")
      .update({
        status: "live",
        match_phase: "live",
        started_at: now.toISOString(),
        is_live: true,
      })
      .eq("id", matchId);

    if (error) {
      console.error("Erro ao iniciar partida:", error);
      alert(`Erro: ${error.message}`);
    } else {
      // Verificar se houve atraso e propagar
      if (match.scheduled_at) {
        const scheduledTime = new Date(match.scheduled_at);
        const delayMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);

        if (delayMinutes > 5) {
          await propagateDelay(supabase, match.tournament_id, matchId, Math.max(delayMinutes, 10));
        }
      }
      fetchMatch();
    }

    setSaving(false);
  };

  const propagateDelay = async (supabase: ReturnType<typeof createBrowserSupabaseClient>, tournamentId: string, currentMatchId: string, delayMinutes: number) => {
    const { data: futureMatches } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .neq("id", currentMatchId)
      .in("status", ["scheduled", "pending"])
      .order("scheduled_at", { ascending: true });

    if (!futureMatches) return;

    for (const m of futureMatches) {
      if (m.scheduled_at) {
        const currentTime = new Date(m.scheduled_at);
        const newTime = new Date(currentTime.getTime() + delayMinutes * 60000);

        await supabase
          .from("matches")
          .update({ scheduled_at: newTime.toISOString() })
          .eq("id", m.id);
      }
    }
  };

  const handleFinishMatch = async () => {
    if (!match) return;
    if (finishScores.team1 === finishScores.team2) {
      alert("A partida nao pode terminar empatada!");
      return;
    }

    setSaving(true);
    const supabase = createBrowserSupabaseClient();

    // Determinar vencedor e perdedor
    const winnerId = finishScores.team1 > finishScores.team2 ? match.team1_id : match.team2_id;
    const loserId = finishScores.team1 > finishScores.team2 ? match.team2_id : match.team1_id;

    // Atualizar partida
    const { error } = await supabase
      .from("matches")
      .update({
        team1_score: finishScores.team1,
        team2_score: finishScores.team2,
        status: "finished",
        match_phase: "finished",
        is_live: false,
        finished_at: new Date().toISOString(),
        winner_id: winnerId,
      })
      .eq("id", matchId);

    if (error) {
      console.error("Erro ao finalizar partida:", error);
      alert(`Erro: ${error.message}`);
    } else {
      // Avançar times no bracket
      await advanceTeamsInBracket(supabase, match.tournament_id, match.round || "", winnerId, loserId);
      setShowFinishModal(false);
      fetchMatch();
    }

    setSaving(false);
  };

  const advanceTeamsInBracket = async (
    supabase: ReturnType<typeof createBrowserSupabaseClient>,
    tournamentId: string,
    currentRound: string,
    winnerId: string,
    loserId: string
  ) => {
    const bracketAdvancement: Record<string, { winnerGoesTo: string; loserGoesTo?: string; winnerPosition: "team1" | "team2"; loserPosition?: "team1" | "team2" }> = {
      winner_quarter_1: { winnerGoesTo: "winner_semi_1", loserGoesTo: "loser_round1_1", winnerPosition: "team1", loserPosition: "team1" },
      winner_quarter_2: { winnerGoesTo: "winner_semi_1", loserGoesTo: "loser_round1_1", winnerPosition: "team2", loserPosition: "team2" },
      winner_quarter_3: { winnerGoesTo: "winner_semi_2", loserGoesTo: "loser_round1_2", winnerPosition: "team1", loserPosition: "team1" },
      winner_quarter_4: { winnerGoesTo: "winner_semi_2", loserGoesTo: "loser_round1_2", winnerPosition: "team2", loserPosition: "team2" },
      winner_semi_1: { winnerGoesTo: "winner_final", loserGoesTo: "loser_round2_1", winnerPosition: "team1", loserPosition: "team1" },
      winner_semi_2: { winnerGoesTo: "winner_final", loserGoesTo: "loser_round2_2", winnerPosition: "team2", loserPosition: "team1" },
      winner_final: { winnerGoesTo: "grand_final", loserGoesTo: "loser_final", winnerPosition: "team1", loserPosition: "team1" },
      loser_round1_1: { winnerGoesTo: "loser_round2_1", winnerPosition: "team2" },
      loser_round1_2: { winnerGoesTo: "loser_round2_2", winnerPosition: "team2" },
      loser_round2_1: { winnerGoesTo: "loser_semi", winnerPosition: "team1" },
      loser_round2_2: { winnerGoesTo: "loser_semi", winnerPosition: "team2" },
      loser_semi: { winnerGoesTo: "loser_final", winnerPosition: "team2" },
      loser_final: { winnerGoesTo: "grand_final", winnerPosition: "team2" },
    };

    const advancement = bracketAdvancement[currentRound];
    if (!advancement) return;

    // Avançar vencedor
    if (advancement.winnerGoesTo) {
      const winnerField = advancement.winnerPosition === "team1" ? "team1_id" : "team2_id";
      await supabase
        .from("matches")
        .update({ [winnerField]: winnerId })
        .eq("tournament_id", tournamentId)
        .eq("round", advancement.winnerGoesTo);

      // Verificar se partida pode ser ativada
      const { data: destMatch } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("round", advancement.winnerGoesTo)
        .single();

      if (destMatch && destMatch.status === "pending" && destMatch.team1_id !== destMatch.team2_id) {
        await supabase.from("matches").update({ status: "scheduled" }).eq("id", destMatch.id);
      }
    }

    // Enviar perdedor para loser bracket
    if (advancement.loserGoesTo && advancement.loserPosition) {
      const loserField = advancement.loserPosition === "team1" ? "team1_id" : "team2_id";
      await supabase
        .from("matches")
        .update({ [loserField]: loserId })
        .eq("tournament_id", tournamentId)
        .eq("round", advancement.loserGoesTo);

      // Verificar se partida pode ser ativada
      const { data: destMatch } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("round", advancement.loserGoesTo)
        .single();

      if (destMatch && destMatch.status === "pending" && destMatch.team1_id !== destMatch.team2_id) {
        await supabase.from("matches").update({ status: "scheduled" }).eq("id", destMatch.id);
      }
    }
  };

  const handleUpdateScore = async (team1Score: number, team2Score: number) => {
    const supabase = createBrowserSupabaseClient();
    await supabase
      .from("matches")
      .update({ team1_score: team1Score, team2_score: team2Score })
      .eq("id", matchId);
    fetchMatch();
  };

  const handleLoadServer = async () => {
    if (!match) return;
    setLoadingServer(true);

    try {
      const resp = await fetch(`/api/matches/${matchId}/load-server`, {
        method: "POST",
      });
      const data = await resp.json();

      if (!resp.ok) {
        alert(`Erro: ${data.error}`);
      } else {
        alert("Partida carregada no servidor! Aguardando jogadores...");
      }
    } catch {
      alert("Erro ao conectar com o servidor");
    }

    setLoadingServer(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-[#A1A1AA]">Partida nao encontrada</p>
      </div>
    );
  }

  const status = statusColors[match.status] || statusColors.scheduled;
  const isPending = match.status === "pending";
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/campeonatos/${match.tournament_id}`}
          className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-[#F5F5DC]">
              {roundNames[match.round || ""] || match.round}
            </h2>
            <span className={`px-2 py-1 rounded text-[10px] font-mono ${status.bg} ${status.text}`}>
              {status.label}
            </span>
            {isLive && (
              <span className="flex items-center gap-1 px-2 py-1 bg-[#ef4444] rounded text-[10px] font-mono text-white animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" />
                LIVE
              </span>
            )}
          </div>
          <p className="text-[#A1A1AA] text-sm mt-1">
            {match.tournament?.name} | {match.best_of > 1 ? `MD${match.best_of}` : "MD1"}
          </p>
        </div>
      </div>

      {/* Match Card */}
      <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-8">
        <div className="flex items-center justify-center gap-8">
          {/* Team 1 */}
          <div className="flex flex-col items-center gap-4 w-48">
            <div className="w-20 h-20 rounded-xl bg-[#27272A] flex items-center justify-center">
              <span className="text-2xl font-mono text-[#A1A1AA]">
                {isPending ? "?" : match.team1?.tag?.substring(0, 2) || "?"}
              </span>
            </div>
            <div className="text-center">
              <p className={`font-display text-lg ${isPending ? "text-[#52525B] italic" : "text-[#F5F5DC]"}`}>
                {isPending ? "A definir" : match.team1?.name}
              </p>
              {!isPending && (
                <p className="font-mono text-xs text-[#52525B]">{match.team1?.tag}</p>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className={`font-display text-6xl ${isFinished && match.winner_id === match.team1_id ? "text-[#22c55e]" : "text-[#F5F5DC]"}`}>
                {isPending ? "-" : match.team1_score}
              </span>
            </div>
            <span className="text-3xl text-[#52525B]">:</span>
            <div className="text-center">
              <span className={`font-display text-6xl ${isFinished && match.winner_id === match.team2_id ? "text-[#22c55e]" : "text-[#F5F5DC]"}`}>
                {isPending ? "-" : match.team2_score}
              </span>
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center gap-4 w-48">
            <div className="w-20 h-20 rounded-xl bg-[#27272A] flex items-center justify-center">
              <span className="text-2xl font-mono text-[#A1A1AA]">
                {isPending ? "?" : match.team2?.tag?.substring(0, 2) || "?"}
              </span>
            </div>
            <div className="text-center">
              <p className={`font-display text-lg ${isPending ? "text-[#52525B] italic" : "text-[#F5F5DC]"}`}>
                {isPending ? "A definir" : match.team2?.name}
              </p>
              {!isPending && (
                <p className="font-mono text-xs text-[#52525B]">{match.team2?.tag}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isPending && !isFinished && (
          <div className="flex justify-center gap-4 mt-8 pt-8 border-t border-[#27272A]">
            {!isLive && (
              <>
                <button
                  onClick={handleLoadServer}
                  disabled={loadingServer}
                  className="flex items-center gap-2 px-6 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-sm rounded-lg transition-colors"
                >
                  {loadingServer ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                  CARREGAR NO SERVIDOR
                </button>
                <button
                  onClick={handleStartMatch}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#22c55e]/50 text-white font-mono text-sm rounded-lg transition-colors"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  INICIAR PARTIDA
                </button>
              </>
            )}

            {isLive && (
              <>
                {/* Score controls */}
                <div className="flex items-center gap-4 px-4 py-2 bg-[#1a1a2e] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#A1A1AA]">{match.team1?.tag}</span>
                    <button
                      onClick={() => handleUpdateScore(Math.max(0, match.team1_score - 1), match.team2_score)}
                      className="w-8 h-8 bg-[#27272A] hover:bg-[#3f3f46] rounded text-[#F5F5DC] transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono text-xl text-[#F5F5DC] w-8 text-center">{match.team1_score}</span>
                    <button
                      onClick={() => handleUpdateScore(match.team1_score + 1, match.team2_score)}
                      className="w-8 h-8 bg-[#27272A] hover:bg-[#3f3f46] rounded text-[#F5F5DC] transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-[#52525B]">|</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateScore(match.team1_score, Math.max(0, match.team2_score - 1))}
                      className="w-8 h-8 bg-[#27272A] hover:bg-[#3f3f46] rounded text-[#F5F5DC] transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono text-xl text-[#F5F5DC] w-8 text-center">{match.team2_score}</span>
                    <button
                      onClick={() => handleUpdateScore(match.team1_score, match.team2_score + 1)}
                      className="w-8 h-8 bg-[#27272A] hover:bg-[#3f3f46] rounded text-[#F5F5DC] transition-colors"
                    >
                      +
                    </button>
                    <span className="text-xs text-[#A1A1AA]">{match.team2?.tag}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFinishScores({ team1: match.team1_score, team2: match.team2_score });
                    setShowFinishModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-[#ef4444] hover:bg-[#dc2626] text-white font-mono text-sm rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  FINALIZAR PARTIDA
                </button>
              </>
            )}
          </div>
        )}

        {/* Winner badge */}
        {isFinished && match.winner_id && (
          <div className="flex justify-center mt-8 pt-8 border-t border-[#27272A]">
            <div className="flex items-center gap-3 px-6 py-3 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg">
              <svg className="w-6 h-6 text-[#22c55e]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="font-mono text-sm text-[#22c55e]">
                VENCEDOR: {match.winner_id === match.team1_id ? match.team1?.name : match.team2?.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Match Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6">
          <h3 className="font-mono text-sm text-[#A855F7] tracking-wider mb-4">INFORMACOES</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[#A1A1AA]">Campeonato</span>
              <span className="text-sm text-[#F5F5DC]">{match.tournament?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#A1A1AA]">Rodada</span>
              <span className="text-sm text-[#F5F5DC]">{roundNames[match.round || ""] || match.round}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#A1A1AA]">Formato</span>
              <span className="text-sm text-[#F5F5DC]">MD{match.best_of}</span>
            </div>
            {match.map_name && (
              <div className="flex justify-between">
                <span className="text-sm text-[#A1A1AA]">Mapa</span>
                <span className="text-sm text-[#F5F5DC]">{match.map_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6">
          <h3 className="font-mono text-sm text-[#A855F7] tracking-wider mb-4">HORARIOS</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-[#A1A1AA]">Agendada</span>
              <span className="text-sm text-[#F5F5DC]">{formatDate(match.scheduled_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#A1A1AA]">Iniciada</span>
              <span className="text-sm text-[#F5F5DC]">{formatDate(match.started_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#A1A1AA]">Finalizada</span>
              <span className="text-sm text-[#F5F5DC]">{formatDate(match.finished_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Finish Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] border border-[#27272A] rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-display text-xl text-[#F5F5DC] mb-6">Finalizar Partida</h2>

            <div className="space-y-6">
              <p className="text-sm text-[#A1A1AA]">
                Confirme o placar final da partida:
              </p>

              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-[#A1A1AA] mb-2">{match.team1?.name}</p>
                  <input
                    type="number"
                    min="0"
                    value={finishScores.team1}
                    onChange={(e) => setFinishScores({ ...finishScores, team1: parseInt(e.target.value) || 0 })}
                    className="w-20 h-16 text-center font-display text-3xl bg-[#1a1a2e] border border-[#27272A] rounded-lg text-[#F5F5DC] focus:outline-none focus:border-[#A855F7]"
                  />
                </div>
                <span className="text-2xl text-[#52525B]">:</span>
                <div className="text-center">
                  <p className="text-xs text-[#A1A1AA] mb-2">{match.team2?.name}</p>
                  <input
                    type="number"
                    min="0"
                    value={finishScores.team2}
                    onChange={(e) => setFinishScores({ ...finishScores, team2: parseInt(e.target.value) || 0 })}
                    className="w-20 h-16 text-center font-display text-3xl bg-[#1a1a2e] border border-[#27272A] rounded-lg text-[#F5F5DC] focus:outline-none focus:border-[#A855F7]"
                  />
                </div>
              </div>

              {finishScores.team1 === finishScores.team2 && (
                <p className="text-[#ef4444] text-xs text-center">
                  A partida nao pode terminar empatada
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinishModal(false)}
                  className="flex-1 px-4 py-3 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleFinishMatch}
                  disabled={saving || finishScores.team1 === finishScores.team2}
                  className="flex-1 px-4 py-3 bg-[#ef4444] hover:bg-[#dc2626] disabled:bg-[#ef4444]/50 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  {saving ? "FINALIZANDO..." : "CONFIRMAR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
