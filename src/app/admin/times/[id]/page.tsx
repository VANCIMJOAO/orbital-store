"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface Team {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
}

interface Player {
  id: string;
  username: string;
  steam_id: string | null;
  level: number | null;
}

interface TeamPlayer {
  id: string;
  team_id: string;
  profile_id: string;
  role: string | null;
  steam_id: string | null;
  nickname: string | null;
  profile: Player;
}

export default function TeamPlayersPage() {
  const params = useParams();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerRole, setPlayerRole] = useState("player");
  const [playerNickname, setPlayerNickname] = useState("");

  useEffect(() => {
    fetchData();
  }, [teamId]);

  const fetchData = async () => {
    const supabase = createBrowserSupabaseClient();

    // Buscar time
    const { data: teamData } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();

    if (teamData) {
      setTeam(teamData);
    }

    // Buscar jogadores do time
    const { data: playersData } = await supabase
      .from("team_players")
      .select(`
        *,
        profile:profiles(id, username, steam_id, level)
      `)
      .eq("team_id", teamId);

    if (playersData) {
      setTeamPlayers(playersData as TeamPlayer[]);
    }

    // Buscar jogadores disponiveis (nao no time)
    const { data: allPlayers } = await supabase
      .from("profiles")
      .select("id, username, steam_id, level")
      .eq("is_tournament_player", true)
      .order("username");

    if (allPlayers && playersData) {
      const registeredIds = playersData.map((p: TeamPlayer) => p.profile_id);
      setAvailablePlayers(allPlayers.filter((p: Player) => !registeredIds.includes(p.id)));
    }

    setLoading(false);
  };

  const handleAddPlayer = async () => {
    if (!selectedPlayerId) return;

    const supabase = createBrowserSupabaseClient();

    // Buscar steam_id do jogador selecionado
    const selectedPlayer = availablePlayers.find(p => p.id === selectedPlayerId);

    const { error } = await supabase.from("team_players").insert({
      team_id: teamId,
      profile_id: selectedPlayerId,
      role: playerRole,
      nickname: playerNickname || selectedPlayer?.username || null,
      steam_id: selectedPlayer?.steam_id || null,
    });

    if (!error) {
      setShowAddModal(false);
      setSelectedPlayerId("");
      setPlayerRole("player");
      setPlayerNickname("");
      fetchData();
    } else {
      console.error("Erro ao adicionar jogador:", error);
    }
  };

  const handleRemovePlayer = async (teamPlayerId: string) => {
    if (!confirm("Deseja remover este jogador do time?")) return;

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("team_players")
      .delete()
      .eq("id", teamPlayerId);

    if (!error) {
      fetchData();
    }
  };

  const handleUpdateSteamId = async (teamPlayerId: string, steamId: string) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("team_players")
      .update({ steam_id: steamId })
      .eq("id", teamPlayerId);

    if (!error) {
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#A855F7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-[#A1A1AA]">Time nao encontrado</p>
        <Link href="/admin/times" className="text-[#A855F7] text-sm mt-2 inline-block">
          Voltar para times
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/times"
          className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-[#27272A] flex items-center justify-center">
              <span className="text-sm font-mono text-[#A1A1AA]">{team.tag}</span>
            </div>
            <div>
              <h2 className="font-display text-2xl text-[#F5F5DC]">{team.name}</h2>
              <p className="text-[#A1A1AA] text-sm">{teamPlayers.length}/5 jogadores</p>
            </div>
          </div>
        </div>

        {teamPlayers.length < 5 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-xs rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ADICIONAR JOGADOR
          </button>
        )}
      </div>

      {/* Lista de Jogadores */}
      <div className="bg-[#12121a] border border-[#27272A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#27272A]">
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                JOGADOR
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                NICKNAME IN-GAME
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                STEAM ID
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                FUNCAO
              </th>
              <th className="text-right px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                ACOES
              </th>
            </tr>
          </thead>
          <tbody>
            {teamPlayers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#A855F7]/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-[#A1A1AA] text-sm">Nenhum jogador no time</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="text-[#A855F7] hover:text-[#C084FC] text-sm font-mono"
                    >
                      + Adicionar primeiro jogador
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              teamPlayers.map((tp) => (
                <tr
                  key={tp.id}
                  className="border-b border-[#27272A] hover:bg-[#1a1a2e] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center">
                        <span className="font-mono text-white text-sm font-bold">
                          {tp.profile.username?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <span className="font-body text-sm text-[#F5F5DC] block">
                          {tp.profile.username}
                        </span>
                        <span className="font-mono text-[10px] text-[#52525B]">
                          Lv.{tp.profile.level || 1}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-[#F5F5DC]">
                      {tp.nickname || tp.profile.username}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={tp.steam_id || tp.profile.steam_id || ""}
                      onChange={(e) => handleUpdateSteamId(tp.id, e.target.value)}
                      placeholder="76561198XXXXXXXXX"
                      className="bg-[#1a1a2e] border border-[#27272A] rounded px-2 py-1 text-xs font-mono text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 w-44"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-mono ${
                      tp.role === "captain"
                        ? "bg-[#eab308]/20 text-[#eab308]"
                        : "bg-[#27272A] text-[#A1A1AA]"
                    }`}>
                      {tp.role === "captain" ? "CAPITAO" : "JOGADOR"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRemovePlayer(tp.id)}
                        className="p-2 hover:bg-[#ef4444]/20 rounded-lg transition-colors"
                        title="Remover do time"
                      >
                        <svg className="w-4 h-4 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Aviso Steam ID */}
      <div className="bg-[#eab308]/10 border border-[#eab308]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#eab308] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-[#eab308] text-sm font-medium">Importante: Steam ID</p>
            <p className="text-[#A1A1AA] text-xs mt-1">
              Certifique-se de que todos os jogadores tenham o Steam ID correto configurado.
              O sistema usa o Steam ID para identificar os jogadores durante as partidas e vincular as estatisticas.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Jogador */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] border border-[#27272A] rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-display text-xl text-[#F5F5DC] mb-6">Adicionar Jogador ao Time</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                  JOGADOR *
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => {
                    setSelectedPlayerId(e.target.value);
                    const player = availablePlayers.find(p => p.id === e.target.value);
                    if (player) {
                      setPlayerNickname(player.username);
                    }
                  }}
                  className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] focus:outline-none focus:border-[#A855F7]/50"
                >
                  <option value="">Selecione um jogador...</option>
                  {availablePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.username} {player.steam_id ? `(${player.steam_id.slice(-8)})` : "(sem Steam ID)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                  NICKNAME IN-GAME
                </label>
                <input
                  type="text"
                  value={playerNickname}
                  onChange={(e) => setPlayerNickname(e.target.value)}
                  placeholder="Nome que aparece no jogo"
                  className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                  FUNCAO
                </label>
                <select
                  value={playerRole}
                  onChange={(e) => setPlayerRole(e.target.value)}
                  className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] focus:outline-none focus:border-[#A855F7]/50"
                >
                  <option value="player">Jogador</option>
                  <option value="captain">Capitao</option>
                </select>
              </div>

              {availablePlayers.length === 0 && (
                <p className="text-[#eab308] text-xs">
                  Nao ha jogadores disponiveis. Cadastre novos jogadores primeiro.
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedPlayerId("");
                    setPlayerRole("player");
                    setPlayerNickname("");
                  }}
                  className="flex-1 px-4 py-3 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleAddPlayer}
                  disabled={!selectedPlayerId}
                  className="flex-1 px-4 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  ADICIONAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
