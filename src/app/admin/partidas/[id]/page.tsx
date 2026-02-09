"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import {
  CS2_MAP_POOL,
  MAP_DISPLAY_NAMES,
  MAP_COLORS,
  VETO_SEQUENCE_BO1,
  VETO_SEQUENCE_BO3,
  type VetoStep,
  type VetoData,
  type VetoSequenceStep,
} from "@/lib/constants";

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
  team1_id: string | null;
  team2_id: string | null;
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
  veto_data: VetoData | null;
  stream_url: string | null;
  team1?: Team | null;
  team2?: Team | null;
  tournament?: Tournament;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "bg-[#3b82f6]/20", text: "text-[#3b82f6]", label: "AGENDADA" },
  pending: { bg: "bg-[#52525B]/20", text: "text-[#A1A1AA]", label: "A DEFINIR" },
  live: { bg: "bg-[#ef4444]/20", text: "text-[#ef4444]", label: "AO VIVO" },
  finished: { bg: "bg-[#22c55e]/20", text: "text-[#22c55e]", label: "FINALIZADA" },
  cancelled: { bg: "bg-[#f59e0b]/20", text: "text-[#f59e0b]", label: "CANCELADA" },
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

// Icone SVG simples por mapa (silhouette style)
const mapIcons: Record<string, string> = {
  de_mirage: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  de_ancient: "M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z",
  de_inferno: "M12 2C8 2 4.5 5.5 4.5 9.5c0 5.5 7.5 12.5 7.5 12.5s7.5-7 7.5-12.5C19.5 5.5 16 2 12 2z",
  de_nuke: "M12 2l-2 4-4 1 3 3-1 4 4-2 4 2-1-4 3-3-4-1z",
  de_overpass: "M3 12h4l3-9 4 18 3-9h4",
  de_anubis: "M12 2l-8 4v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z",
  de_dust2: "M17.5 2H6.5L2 7v10l4.5 5h11l4.5-5V7L17.5 2z",
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

  // Veto state
  const [vetoFirstTeam, setVetoFirstTeam] = useState<"team1" | "team2">("team1");
  const [vetoStarted, setVetoStarted] = useState(false);
  const [vetoSteps, setVetoSteps] = useState<VetoStep[]>([]);
  const [vetoCurrentStep, setVetoCurrentStep] = useState(0);
  const [vetoCompleted, setVetoCompleted] = useState(false);
  const [vetoSaving, setVetoSaving] = useState(false);

  // Stream URL state
  const [streamUrl, setStreamUrl] = useState("");
  const [savingStream, setSavingStream] = useState(false);

  const fetchMatch = useCallback(async () => {
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
      setMatch(data as unknown as Match);
      if (data.stream_url) setStreamUrl(data.stream_url as string);
      if (data.veto_data) {
        const vd = data.veto_data as unknown as VetoData;
        setVetoSteps(vd.steps);
        setVetoFirstTeam(vd.first_team);
        setVetoStarted(true);
        setVetoCompleted(vd.completed);
        setVetoCurrentStep(vd.steps.length);
      }
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  // Determinar sequencia de veto baseado no best_of
  const getVetoSequence = (): VetoSequenceStep[] => {
    if (!match) return VETO_SEQUENCE_BO1;
    return match.best_of >= 3 ? VETO_SEQUENCE_BO3 : VETO_SEQUENCE_BO1;
  };

  // Mapas ainda disponiveis no veto
  const getAvailableMaps = (): string[] => {
    const usedMaps = vetoSteps.map((s) => s.map);
    return CS2_MAP_POOL.filter((m) => !usedMaps.includes(m));
  };

  // Determinar quem faz a ação atual
  const getCurrentActor = (): "team1" | "team2" => {
    const sequence = getVetoSequence();
    if (vetoCurrentStep >= sequence.length) return "team1";
    const step = sequence[vetoCurrentStep];
    if (step.actor === "first") return vetoFirstTeam;
    return vetoFirstTeam === "team1" ? "team2" : "team1";
  };

  // Ação atual (ban ou pick)
  const getCurrentAction = (): "ban" | "pick" => {
    const sequence = getVetoSequence();
    if (vetoCurrentStep >= sequence.length) return "ban";
    return sequence[vetoCurrentStep].action as "ban" | "pick";
  };

  // Clicar em um mapa durante o veto
  const handleMapClick = (map: string) => {
    if (vetoCompleted) return;
    const sequence = getVetoSequence();
    if (vetoCurrentStep >= sequence.length) return;

    const actor = getCurrentActor();
    const action = getCurrentAction();

    const newStep: VetoStep = {
      team: actor,
      action: action,
      map: map,
      order: vetoCurrentStep + 1,
    };

    const updatedSteps = [...vetoSteps, newStep];
    setVetoSteps(updatedSteps);
    const nextStep = vetoCurrentStep + 1;
    setVetoCurrentStep(nextStep);

    // Verificar se acabou a sequência e precisa definir o leftover
    if (nextStep >= sequence.length) {
      const usedMaps = updatedSteps.map((s) => s.map);
      const remaining = CS2_MAP_POOL.filter((m) => !usedMaps.includes(m));

      if (remaining.length === 1) {
        const leftoverStep: VetoStep = {
          team: "-",
          action: "leftover",
          map: remaining[0],
          order: nextStep + 1,
        };
        const finalSteps = [...updatedSteps, leftoverStep];
        setVetoSteps(finalSteps);
        setVetoCurrentStep(nextStep + 1);
        setVetoCompleted(true);

        // Definir mapas da partida
        const pickedMaps = finalSteps
          .filter((s) => s.action === "pick")
          .map((s) => s.map);
        const leftoverMap = remaining[0];

        // BO1: só o leftover; BO3: picks + leftover (decider)
        const matchMaps =
          match && match.best_of >= 3
            ? [...pickedMaps, leftoverMap]
            : [leftoverMap];

        // Salvar automaticamente
        saveVetoData(finalSteps, matchMaps);
      }
    }
  };

  // Desfazer último passo do veto
  const handleVetoUndo = () => {
    if (vetoSteps.length === 0) return;

    // Se completou, desfazer leftover + último step
    if (vetoCompleted) {
      const stepsWithoutLeftover = vetoSteps.filter((s) => s.action !== "leftover");
      const undoneSteps = stepsWithoutLeftover.slice(0, -1);
      setVetoSteps(undoneSteps);
      setVetoCurrentStep(undoneSteps.length);
      setVetoCompleted(false);
      return;
    }

    const undoneSteps = vetoSteps.slice(0, -1);
    setVetoSteps(undoneSteps);
    setVetoCurrentStep(undoneSteps.length);
  };

  // Resetar veto completamente (local + banco)
  const handleVetoReset = async () => {
    if (!confirm("Tem certeza que deseja resetar o veto?")) return;

    // Limpar no banco tambem
    const supabase = createBrowserSupabaseClient();
    await supabase
      .from("matches")
      .update({ veto_data: null, map_name: null })
      .eq("id", matchId);

    setVetoSteps([]);
    setVetoCurrentStep(0);
    setVetoCompleted(false);
    setVetoStarted(false);
    fetchMatch();
  };

  // Salvar veto no banco e carregar no servidor
  const saveVetoData = async (steps: VetoStep[], maps: string[]) => {
    if (!match) return;
    setVetoSaving(true);

    const supabase = createBrowserSupabaseClient();
    const vetoData: VetoData = {
      first_team: vetoFirstTeam,
      steps,
      maps,
      completed: true,
    };

    const { error } = await supabase
      .from("matches")
      .update({
        veto_data: vetoData as any,
        map_name: maps[0],
      })
      .eq("id", matchId);

    if (error) {
      alert(`Erro ao salvar veto: ${error.message}`);
      setVetoSaving(false);
      return;
    }

    // Carregar partida no servidor automaticamente
    try {
      const resp = await fetch(`/api/matches/${matchId}/load-server`, {
        method: "POST",
      });
      const data = await resp.json();

      if (!resp.ok) {
        alert(`Veto salvo! Erro ao carregar no servidor: ${data.error}`);
      } else {
        alert("Veto completo! Partida carregada no servidor. Aguardando jogadores...");
      }
    } catch {
      alert("Veto salvo! Erro de conexao com o servidor.");
    }

    setVetoSaving(false);
    fetchMatch();
  };

  // Recarregar partida no servidor (manual)
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

  const handleStartMatch = async () => {
    if (!match) return;
    setSaving(true);

    const supabase = createBrowserSupabaseClient();
    const now = new Date();

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
      alert(`Erro: ${error.message}`);
    } else {
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
    if (!match.team1_id || !match.team2_id) {
      alert("Partida sem times definidos!");
      return;
    }

    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    const winnerId = finishScores.team1 > finishScores.team2 ? match.team1_id : match.team2_id;
    const loserId = finishScores.team1 > finishScores.team2 ? match.team2_id : match.team1_id;

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
      alert(`Erro: ${error.message}`);
    } else {
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

    if (advancement.winnerGoesTo) {
      const winnerField = advancement.winnerPosition === "team1" ? "team1_id" : "team2_id";
      await supabase
        .from("matches")
        .update({ [winnerField]: winnerId })
        .eq("tournament_id", tournamentId)
        .eq("round", advancement.winnerGoesTo);

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

    if (advancement.loserGoesTo && advancement.loserPosition) {
      const loserField = advancement.loserPosition === "team1" ? "team1_id" : "team2_id";
      await supabase
        .from("matches")
        .update({ [loserField]: loserId })
        .eq("tournament_id", tournamentId)
        .eq("round", advancement.loserGoesTo);

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

  const handleCancelMatch = async () => {
    if (!match) return;
    if (!confirm("Tem certeza que deseja cancelar esta partida? Essa acao nao pode ser desfeita.")) return;

    setSaving(true);
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from("matches")
      .update({
        status: "cancelled",
        match_phase: "cancelled",
        is_live: false,
      })
      .eq("id", matchId);

    if (error) {
      alert(`Erro: ${error.message}`);
    } else {
      fetchMatch();
    }
    setSaving(false);
  };

  const handleSaveStream = async () => {
    setSavingStream(true);
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from("matches")
      .update({ stream_url: streamUrl || null })
      .eq("id", matchId);

    if (error) {
      alert(`Erro: ${error.message}`);
    }
    setSavingStream(false);
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
  const isScheduled = match.status === "scheduled";
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isCancelled = match.status === "cancelled";

  // Condições para mostrar seção de veto
  const hasVetoData = match.veto_data && (match.veto_data as VetoData).completed;
  const showVetoSection = isScheduled && !isLive && !isFinished && !isCancelled && match.team1_id && match.team2_id;

  const team1Name = match.team1?.name || "Time 1";
  const team2Name = match.team2?.name || "Time 2";
  const team1Tag = match.team1?.tag || "T1";
  const team2Tag = match.team2?.tag || "T2";

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
                {isPending ? "?" : team1Tag.substring(0, 2)}
              </span>
            </div>
            <div className="text-center">
              <p className={`font-display text-lg ${isPending ? "text-[#52525B] italic" : "text-[#F5F5DC]"}`}>
                {isPending ? "A definir" : team1Name}
              </p>
              {!isPending && (
                <p className="font-mono text-xs text-[#52525B]">{team1Tag}</p>
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
                {isPending ? "?" : team2Tag.substring(0, 2)}
              </span>
            </div>
            <div className="text-center">
              <p className={`font-display text-lg ${isPending ? "text-[#52525B] italic" : "text-[#F5F5DC]"}`}>
                {isPending ? "A definir" : team2Name}
              </p>
              {!isPending && (
                <p className="font-mono text-xs text-[#52525B]">{team2Tag}</p>
              )}
            </div>
          </div>
        </div>

        {/* Cancel button */}
        {!isFinished && !isCancelled && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleCancelMatch}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 text-[#f59e0b] font-mono text-xs rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              CANCELAR PARTIDA
            </button>
          </div>
        )}

        {/* Cancelled badge */}
        {isCancelled && (
          <div className="flex justify-center mt-8 pt-8 border-t border-[#27272A]">
            <div className="flex items-center gap-3 px-6 py-3 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
              <svg className="w-6 h-6 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span className="font-mono text-sm text-[#f59e0b]">PARTIDA CANCELADA</span>
            </div>
          </div>
        )}

        {/* Actions - Live controls */}
        {isLive && (
          <div className="flex justify-center gap-4 mt-8 pt-8 border-t border-[#27272A]">
            {/* Score controls */}
            <div className="flex items-center gap-4 px-4 py-2 bg-[#1a1a2e] rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A1A1AA]">{team1Tag}</span>
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
                <span className="text-xs text-[#A1A1AA]">{team2Tag}</span>
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
          </div>
        )}

        {/* Post-veto actions (scheduled, veto done, not live) */}
        {isScheduled && !isLive && hasVetoData && (
          <div className="flex justify-center gap-4 mt-8 pt-8 border-t border-[#27272A]">
            <button
              onClick={handleLoadServer}
              disabled={loadingServer}
              className="flex items-center gap-2 px-6 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-sm rounded-lg transition-colors"
            >
              {loadingServer ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              RECARREGAR NO SERVIDOR
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
                VENCEDOR: {match.winner_id === match.team1_id ? team1Name : team2Name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Veto Section */}
      {showVetoSection && (
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A]">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#A855F7] rounded-full" />
              <h3 className="font-mono text-sm text-[#F5F5DC] tracking-wider">
                MAP VETO
              </h3>
              <span className="text-xs text-[#52525B] font-mono">
                {match.best_of >= 3 ? "BO3" : "BO1"}
              </span>
            </div>
            {vetoCompleted && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-full">
                <svg className="w-3.5 h-3.5 text-[#22c55e]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                <span className="text-[#22c55e] text-xs font-mono">COMPLETO</span>
              </div>
            )}
          </div>

          {/* Escolha de quem começa */}
          {!vetoStarted && (
            <div className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <p className="text-sm text-[#F5F5DC]">Quem começa vetando?</p>
                <p className="text-xs text-[#52525B]">Definido por par/impar com os capitaes</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setVetoFirstTeam("team1")}
                  className={`flex-1 px-4 py-4 rounded-xl font-mono text-sm transition-all border-2 ${
                    vetoFirstTeam === "team1"
                      ? "bg-[#3b82f6]/10 border-[#3b82f6] text-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                      : "bg-[#0f0f15] border-[#27272A] text-[#A1A1AA] hover:border-[#3f3f46]"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">{team1Tag}</span>
                    <span className="text-[10px] opacity-60">{team1Name}</span>
                  </div>
                </button>
                <button
                  onClick={() => setVetoFirstTeam("team2")}
                  className={`flex-1 px-4 py-4 rounded-xl font-mono text-sm transition-all border-2 ${
                    vetoFirstTeam === "team2"
                      ? "bg-[#f59e0b]/10 border-[#f59e0b] text-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                      : "bg-[#0f0f15] border-[#27272A] text-[#A1A1AA] hover:border-[#3f3f46]"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">{team2Tag}</span>
                    <span className="text-[10px] opacity-60">{team2Name}</span>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setVetoStarted(true)}
                className="w-full px-4 py-3.5 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-sm rounded-xl transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                INICIAR VETO
              </button>
            </div>
          )}

          {/* Veto em andamento */}
          {vetoStarted && (
            <div className="space-y-0">
              {/* Indicador de turno */}
              {!vetoCompleted && (
                <div className="px-6 py-3 bg-[#0f0f15] border-b border-[#27272A]">
                  <div className="flex items-center justify-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${getCurrentActor() === "team1" ? "bg-[#3b82f6]" : "bg-[#f59e0b]"}`} />
                    <span className={`font-mono text-sm font-bold ${getCurrentActor() === "team1" ? "text-[#3b82f6]" : "text-[#f59e0b]"}`}>
                      {getCurrentActor() === "team1" ? team1Name : team2Name}
                    </span>
                    <span className="text-[#52525B]">deve</span>
                    <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider ${
                      getCurrentAction() === "ban"
                        ? "bg-[#ef4444] text-white"
                        : "bg-[#22c55e] text-white"
                    }`}>
                      {getCurrentAction() === "ban" ? "BANIR" : "ESCOLHER"}
                    </span>
                  </div>
                </div>
              )}

              {/* Grid de mapas estilo ESL - horizontal */}
              <div className="p-4">
                <div className="grid grid-cols-7 gap-2">
                  {CS2_MAP_POOL.map((map) => {
                    const step = vetoSteps.find((s) => s.map === map);
                    const isUsed = !!step;
                    const isBanned = step?.action === "ban";
                    const isPicked = step?.action === "pick";
                    const isLeftover = step?.action === "leftover";
                    const stepTeamName = step?.team === "team1" ? team1Tag : step?.team === "team2" ? team2Tag : "";
                    const colors = MAP_COLORS[map] || MAP_COLORS.de_dust2;

                    return (
                      <button
                        key={map}
                        onClick={() => !isUsed && !vetoCompleted && handleMapClick(map)}
                        disabled={isUsed || vetoCompleted}
                        className={`relative group rounded-lg overflow-hidden transition-all duration-200 ${
                          isUsed || vetoCompleted ? "cursor-default" : "cursor-pointer hover:scale-[1.03] hover:z-10"
                        } ${isBanned ? "opacity-50 grayscale" : ""}`}
                      >
                        {/* Action label no topo */}
                        {step && (
                          <div className={`text-[10px] font-mono font-bold tracking-wider text-center py-1.5 ${
                            isBanned
                              ? "bg-[#ef4444] text-white"
                              : isPicked
                              ? "bg-[#22c55e] text-white"
                              : "bg-[#3b82f6] text-white"
                          }`}>
                            {isBanned ? "BAN" : isPicked ? "PICK" : "DECIDER"}
                          </div>
                        )}
                        {!step && !vetoCompleted && (
                          <div className="text-[10px] font-mono tracking-wider text-center py-1.5 bg-[#27272A]/80 text-[#52525B] group-hover:bg-[#A855F7] group-hover:text-white transition-colors">
                            {getCurrentAction() === "ban" ? "BAN" : "PICK"}
                          </div>
                        )}
                        {!step && vetoCompleted && (
                          <div className="text-[10px] font-mono tracking-wider text-center py-1.5 bg-[#27272A]/80 text-[#52525B]">
                            -
                          </div>
                        )}

                        {/* Map card body */}
                        <div
                          className="aspect-[3/4] flex flex-col items-center justify-center relative"
                          style={{
                            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                          }}
                        >
                          {/* Map icon */}
                          <svg
                            className="w-8 h-8 mb-2"
                            style={{ color: isBanned ? '#52525B' : colors.accent }}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d={mapIcons[map] || mapIcons.de_dust2} />
                          </svg>

                          {/* Map name */}
                          <span className={`font-display text-sm tracking-wide ${isBanned ? "text-[#52525B]" : "text-[#F5F5DC]"}`}>
                            {MAP_DISPLAY_NAMES[map]}
                          </span>

                          {/* Team tag quem baniu/picou */}
                          {stepTeamName && (
                            <span className={`text-[9px] font-mono mt-1 ${
                              isBanned ? "text-[#ef4444]/60" : "text-[#22c55e]/80"
                            }`}>
                              {stepTeamName}
                            </span>
                          )}

                          {/* Ban X overlay */}
                          {isBanned && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <svg className="w-14 h-14 text-[#ef4444]/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          )}

                          {/* Hover glow para mapas disponíveis */}
                          {!isUsed && !vetoCompleted && (
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                              style={{
                                background: `radial-gradient(circle at center, ${colors.accent}20, transparent 70%)`,
                              }}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Historico do veto - timeline style */}
              {vetoSteps.length > 0 && (
                <div className="px-6 py-4 bg-[#0a0a12] border-t border-[#27272A]">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {vetoSteps.map((step, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono shrink-0 ${
                          step.action === "ban"
                            ? "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20"
                            : step.action === "pick"
                            ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20"
                            : "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20"
                        }`}
                      >
                        <span className="opacity-50">{step.order}.</span>
                        <span className="font-bold">
                          {step.team === "team1" ? team1Tag : step.team === "team2" ? team2Tag : "-"}
                        </span>
                        <span className="uppercase text-[10px]">{step.action === "leftover" ? "DEC" : step.action}</span>
                        <span className="text-[#F5F5DC]/80">{MAP_DISPLAY_NAMES[step.map]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controles do veto */}
              <div className="px-6 py-3 border-t border-[#27272A] flex items-center gap-3">
                {!vetoCompleted && vetoSteps.length > 0 && (
                  <button
                    onClick={handleVetoUndo}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] text-[#A1A1AA] font-mono text-xs rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    DESFAZER
                  </button>
                )}
                <button
                  onClick={handleVetoReset}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] text-[#A1A1AA] font-mono text-xs rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  RESETAR
                </button>
                {vetoSaving && (
                  <div className="flex items-center gap-2 ml-auto text-[#A855F7] text-xs font-mono">
                    <div className="w-4 h-4 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
                    Salvando e carregando no servidor...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resumo do veto (se ja foi feito e carregado do banco) */}
          {hasVetoData && !vetoStarted && (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {(match.veto_data as VetoData).steps.map((step, i) => {
                  const colors = MAP_COLORS[step.map] || MAP_COLORS.de_dust2;
                  const isBanned = step.action === "ban";
                  const isPicked = step.action === "pick";

                  return (
                    <div key={i} className={`rounded-lg overflow-hidden ${isBanned ? "opacity-50 grayscale" : ""}`}>
                      <div className={`text-[10px] font-mono font-bold tracking-wider text-center py-1.5 ${
                        isBanned ? "bg-[#ef4444] text-white" : isPicked ? "bg-[#22c55e] text-white" : "bg-[#3b82f6] text-white"
                      }`}>
                        {isBanned ? "BAN" : isPicked ? "PICK" : "DECIDER"}
                      </div>
                      <div
                        className="aspect-[3/4] flex flex-col items-center justify-center relative"
                        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                      >
                        <svg className="w-7 h-7 mb-1.5" style={{ color: isBanned ? '#52525B' : colors.accent }} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d={mapIcons[step.map] || mapIcons.de_dust2} />
                        </svg>
                        <span className={`font-display text-xs ${isBanned ? "text-[#52525B]" : "text-[#F5F5DC]"}`}>
                          {MAP_DISPLAY_NAMES[step.map]}
                        </span>
                        <span className="text-[9px] font-mono mt-0.5 text-[#A1A1AA]/60">
                          {step.team === "team1" ? team1Tag : step.team === "team2" ? team2Tag : ""}
                        </span>
                        {isBanned && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg className="w-12 h-12 text-[#ef4444]/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[#A1A1AA] mt-3 text-center">
                Mapas: {(match.veto_data as VetoData).maps.map(m => MAP_DISPLAY_NAMES[m] || m).join(" / ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Match Info + Stream */}
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
                <span className="text-sm text-[#F5F5DC]">{MAP_DISPLAY_NAMES[match.map_name] || match.map_name}</span>
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

      {/* Stream URL */}
      {!isCancelled && (
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6">
          <h3 className="font-mono text-sm text-[#A855F7] tracking-wider mb-4">STREAM</h3>
          <div className="flex gap-3">
            <input
              type="url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://twitch.tv/canal ou https://youtube.com/..."
              className="flex-1 px-4 py-2.5 bg-[#1a1a2e] border border-[#27272A] rounded-lg text-sm text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]"
            />
            <button
              onClick={handleSaveStream}
              disabled={savingStream}
              className="px-6 py-2.5 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-xs rounded-lg transition-colors"
            >
              {savingStream ? "SALVANDO..." : "SALVAR"}
            </button>
          </div>
          {match.stream_url && (
            <p className="mt-2 text-xs text-[#A1A1AA]">
              Atual: <a href={match.stream_url} target="_blank" rel="noopener noreferrer" className="text-[#A855F7] hover:underline">{match.stream_url}</a>
            </p>
          )}
        </div>
      )}

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
                  <p className="text-xs text-[#A1A1AA] mb-2">{team1Name}</p>
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
                  <p className="text-xs text-[#A1A1AA] mb-2">{team2Name}</p>
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
