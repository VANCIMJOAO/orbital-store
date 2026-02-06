"use client";

import { useState } from "react";

interface Team {
  name: string;
  tag: string;
  logo_url?: string | null;
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
  team1?: Team;
  team2?: Team;
}

interface TournamentBracketProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}

const statusColors: Record<string, { bg: string; border: string; pulse?: boolean }> = {
  scheduled: { bg: "bg-[#3b82f6]/10", border: "border-[#3b82f6]/30" },
  pending: { bg: "bg-[#27272A]/50", border: "border-[#27272A]" },
  live: { bg: "bg-[#ef4444]/10", border: "border-[#ef4444]", pulse: true },
  finished: { bg: "bg-[#22c55e]/10", border: "border-[#22c55e]/30" },
};

function MatchCard({ match, onClick }: { match: Match; onClick?: () => void }) {
  const isPending = match.status === "pending";
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const style = statusColors[match.status] || statusColors.scheduled;

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTeamStyle = (teamId: string) => {
    if (!isFinished || !match.winner_id) return "";
    return teamId === match.winner_id ? "text-[#22c55e]" : "text-[#52525B]";
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative w-52 rounded-lg border ${style.bg} ${style.border}
        ${onClick ? "cursor-pointer hover:border-[#A855F7]/50" : ""}
        ${isLive ? "animate-pulse" : ""}
        transition-all
      `}
    >
      {/* Status indicator */}
      {isLive && (
        <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#ef4444] rounded text-[8px] font-mono text-white">
          LIVE
        </div>
      )}

      {/* Time */}
      <div className="px-2 py-1 border-b border-[#27272A]/50 flex items-center justify-between">
        <span className="text-[9px] font-mono text-[#52525B]">
          {formatTime(match.scheduled_at)}
        </span>
        {match.best_of > 1 && (
          <span className="text-[9px] font-mono text-[#A855F7]">MD{match.best_of}</span>
        )}
      </div>

      {/* Team 1 */}
      <div className={`flex items-center gap-2 px-2 py-1.5 ${isPending ? "opacity-40" : ""}`}>
        <div className="w-5 h-5 rounded bg-[#27272A] flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-mono text-[#A1A1AA]">
            {isPending ? "?" : match.team1?.tag?.substring(0, 2) || "?"}
          </span>
        </div>
        <span className={`text-xs truncate flex-1 ${getTeamStyle(match.team1_id)} ${isPending ? "italic text-[#52525B]" : "text-[#F5F5DC]"}`}>
          {isPending ? "TBD" : match.team1?.name || "TBD"}
        </span>
        <span className={`font-mono text-sm font-bold ${getTeamStyle(match.team1_id)}`}>
          {isPending ? "-" : match.team1_score}
        </span>
      </div>

      {/* Team 2 */}
      <div className={`flex items-center gap-2 px-2 py-1.5 border-t border-[#27272A]/30 ${isPending ? "opacity-40" : ""}`}>
        <div className="w-5 h-5 rounded bg-[#27272A] flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-mono text-[#A1A1AA]">
            {isPending ? "?" : match.team2?.tag?.substring(0, 2) || "?"}
          </span>
        </div>
        <span className={`text-xs truncate flex-1 ${getTeamStyle(match.team2_id)} ${isPending ? "italic text-[#52525B]" : "text-[#F5F5DC]"}`}>
          {isPending ? "TBD" : match.team2?.name || "TBD"}
        </span>
        <span className={`font-mono text-sm font-bold ${getTeamStyle(match.team2_id)}`}>
          {isPending ? "-" : match.team2_score}
        </span>
      </div>
    </div>
  );
}

function BracketConnector({ direction = "right", height = 60 }: { direction?: "right" | "left"; height?: number }) {
  return (
    <div className={`relative w-8 ${direction === "left" ? "mr-auto" : "ml-auto"}`} style={{ height }}>
      <svg width="32" height={height} className="absolute inset-0">
        {direction === "right" ? (
          <>
            <line x1="0" y1={height / 4} x2="16" y2={height / 4} stroke="#27272A" strokeWidth="2" />
            <line x1="16" y1={height / 4} x2="16" y2={height * 3 / 4} stroke="#27272A" strokeWidth="2" />
            <line x1="0" y1={height * 3 / 4} x2="16" y2={height * 3 / 4} stroke="#27272A" strokeWidth="2" />
            <line x1="16" y1={height / 2} x2="32" y2={height / 2} stroke="#27272A" strokeWidth="2" />
          </>
        ) : (
          <>
            <line x1="32" y1={height / 4} x2="16" y2={height / 4} stroke="#27272A" strokeWidth="2" />
            <line x1="16" y1={height / 4} x2="16" y2={height * 3 / 4} stroke="#27272A" strokeWidth="2" />
            <line x1="32" y1={height * 3 / 4} x2="16" y2={height * 3 / 4} stroke="#27272A" strokeWidth="2" />
            <line x1="16" y1={height / 2} x2="0" y2={height / 2} stroke="#27272A" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function TournamentBracket({ matches, onMatchClick }: TournamentBracketProps) {
  const [view, setView] = useState<"winner" | "loser" | "all">("all");

  // Organizar partidas por round
  const getMatchesByRound = (roundPrefix: string) => {
    return matches
      .filter((m) => m.round?.startsWith(roundPrefix))
      .sort((a, b) => (a.round || "").localeCompare(b.round || ""));
  };

  const winnerQuarters = getMatchesByRound("winner_quarter");
  const winnerSemis = getMatchesByRound("winner_semi");
  const winnerFinal = matches.find((m) => m.round === "winner_final");

  const loserR1 = getMatchesByRound("loser_round1");
  const loserR2 = getMatchesByRound("loser_round2");
  const loserSemi = matches.find((m) => m.round === "loser_semi");
  const loserFinal = matches.find((m) => m.round === "loser_final");

  const grandFinal = matches.find((m) => m.round === "grand_final");

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("all")}
          className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
            view === "all"
              ? "bg-[#A855F7] text-white"
              : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
          }`}
        >
          TODOS
        </button>
        <button
          onClick={() => setView("winner")}
          className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
            view === "winner"
              ? "bg-[#22c55e] text-white"
              : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
          }`}
        >
          WINNER
        </button>
        <button
          onClick={() => setView("loser")}
          className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
            view === "loser"
              ? "bg-[#ef4444] text-white"
              : "bg-[#27272A] text-[#A1A1AA] hover:bg-[#3f3f46]"
          }`}
        >
          LOSER
        </button>
      </div>

      {/* Winner Bracket */}
      {(view === "all" || view === "winner") && (
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6">
          <h3 className="font-mono text-sm text-[#22c55e] tracking-wider mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
            WINNER BRACKET
          </h3>

          <div className="flex items-start gap-4 overflow-x-auto pb-4">
            {/* Quartas */}
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-mono text-[#52525B] text-center">QUARTAS</span>
              {winnerQuarters.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => onMatchClick?.(match)}
                />
              ))}
            </div>

            {/* Connector */}
            <div className="flex flex-col justify-around h-full pt-6">
              <BracketConnector height={120} />
              <BracketConnector height={120} />
            </div>

            {/* Semis */}
            <div className="flex flex-col gap-6 justify-center" style={{ marginTop: "3.5rem" }}>
              <span className="text-[10px] font-mono text-[#52525B] text-center">SEMIFINAIS</span>
              {winnerSemis.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => onMatchClick?.(match)}
                />
              ))}
            </div>

            {/* Connector */}
            <div className="flex items-center pt-6" style={{ marginTop: "6rem" }}>
              <BracketConnector height={180} />
            </div>

            {/* Winner Final */}
            <div className="flex flex-col justify-center" style={{ marginTop: "9rem" }}>
              <span className="text-[10px] font-mono text-[#52525B] text-center mb-2">FINAL WINNER</span>
              {winnerFinal && (
                <MatchCard
                  match={winnerFinal}
                  onClick={() => onMatchClick?.(winnerFinal)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loser Bracket */}
      {(view === "all" || view === "loser") && (
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6">
          <h3 className="font-mono text-sm text-[#ef4444] tracking-wider mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            LOSER BRACKET
          </h3>

          <div className="flex items-start gap-4 overflow-x-auto pb-4">
            {/* Loser R1 */}
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-mono text-[#52525B] text-center">ROUND 1</span>
              {loserR1.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => onMatchClick?.(match)}
                />
              ))}
            </div>

            {/* Connector */}
            <div className="flex flex-col justify-around h-full pt-6">
              <BracketConnector height={120} />
            </div>

            {/* Loser R2 */}
            <div className="flex flex-col gap-6" style={{ marginTop: "2rem" }}>
              <span className="text-[10px] font-mono text-[#52525B] text-center">ROUND 2</span>
              {loserR2.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => onMatchClick?.(match)}
                />
              ))}
            </div>

            {/* Connector */}
            <div className="flex items-center pt-6" style={{ marginTop: "4rem" }}>
              <BracketConnector height={120} />
            </div>

            {/* Loser Semi */}
            <div className="flex flex-col justify-center" style={{ marginTop: "5rem" }}>
              <span className="text-[10px] font-mono text-[#52525B] text-center mb-2">SEMIFINAL</span>
              {loserSemi && (
                <MatchCard
                  match={loserSemi}
                  onClick={() => onMatchClick?.(loserSemi)}
                />
              )}
            </div>

            {/* Connector */}
            <div className="flex items-center" style={{ marginTop: "6rem" }}>
              <BracketConnector height={60} />
            </div>

            {/* Loser Final */}
            <div className="flex flex-col justify-center" style={{ marginTop: "5.5rem" }}>
              <span className="text-[10px] font-mono text-[#52525B] text-center mb-2">FINAL LOSER</span>
              {loserFinal && (
                <MatchCard
                  match={loserFinal}
                  onClick={() => onMatchClick?.(loserFinal)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grand Final */}
      {grandFinal && (
        <div className="bg-gradient-to-r from-[#A855F7]/10 via-[#12121a] to-[#A855F7]/10 border border-[#A855F7]/30 rounded-xl p-6">
          <h3 className="font-mono text-sm text-[#A855F7] tracking-wider mb-6 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            GRAND FINAL
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </h3>

          <div className="flex justify-center">
            <div className="transform scale-110">
              <MatchCard
                match={grandFinal}
                onClick={() => onMatchClick?.(grandFinal)}
              />
            </div>
          </div>

          <p className="text-center text-[10px] text-[#52525B] mt-4">
            Vencedor da Winner Final vs Vencedor da Loser Final
          </p>
        </div>
      )}
    </div>
  );
}
