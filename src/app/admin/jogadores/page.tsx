"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface Player {
  id: string;
  username: string;
  steam_id: string | null;
  level: number | null;
  xp: number | null;
  is_tournament_player: boolean | null;
  is_admin: boolean | null;
  created_at: string | null;
  team_name?: string;
}

export default function JogadoresAdmin() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: "", steam_id: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  const fetchPlayers = async () => {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        username,
        steam_id,
        level,
        xp,
        is_tournament_player,
        is_admin,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPlayers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createBrowserSupabaseClient();

    // Criar usuario no auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          steam_id: form.steam_id,
        },
      },
    });

    if (authError) {
      console.error("Erro ao criar usuario:", authError);
      setSaving(false);
      return;
    }

    // Criar perfil
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          username: form.username,
          steam_id: form.steam_id || null,
          is_tournament_player: true,
          level: 1,
          xp: 0,
        });

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError);
      }
    }

    setSaving(false);
    setShowModal(false);
    setForm({ username: "", steam_id: "", email: "", password: "" });
    fetchPlayers();
  };

  const toggleAdmin = async (playerId: string, currentStatus: boolean) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !currentStatus })
      .eq("id", playerId);

    if (error) {
      console.error("Erro ao atualizar admin:", error);
    } else {
      fetchPlayers();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#F5F5DC]">Jogadores</h2>
          <p className="text-[#A1A1AA] text-sm mt-1">Gerencie os jogadores cadastrados</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-xs rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          NOVO JOGADOR
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome ou Steam ID..."
            className="w-full bg-[#12121a] border border-[#27272A] rounded-lg pl-10 pr-4 py-2 text-sm text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#12121a] border border-[#27272A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#27272A]">
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                JOGADOR
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                STEAM ID
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                NIVEL
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                CADASTRO
              </th>
              <th className="text-left px-6 py-4 font-mono text-[10px] text-[#A1A1AA] tracking-wider">
                ADMIN
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
            ) : players.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#A855F7]/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-[#A1A1AA] text-sm">Nenhum jogador cadastrado</p>
                  </div>
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-[#27272A] hover:bg-[#1a1a2e] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center">
                        <span className="font-mono text-white text-sm font-bold">
                          {player.username?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <span className="font-body text-sm text-[#F5F5DC] block">
                          {player.username}
                        </span>
                        {player.team_name && (
                          <span className="font-mono text-[10px] text-[#A855F7]">
                            {player.team_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-[#A1A1AA]">
                      {player.steam_id || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#A855F7]">
                        Lv.{player.level}
                      </span>
                      <span className="font-mono text-[10px] text-[#52525B]">
                        ({player.xp} XP)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-[#A1A1AA]">
                      {player.created_at ? formatDate(player.created_at) : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleAdmin(player.id, player.is_admin ?? false)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        player.is_admin ? "bg-[#A855F7]" : "bg-[#27272A]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          player.is_admin ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
                        title="Ver perfil"
                      >
                        <svg className="w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] border border-[#27272A] rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-display text-xl text-[#F5F5DC] mb-6">Novo Jogador</h2>

            <form onSubmit={handleCreatePlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                  NOME DE USUARIO *
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Ex: KSCERATO"
                  required
                  className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                  EMAIL *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jogador@email.com"
                  required
                  className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                  SENHA *
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Senha inicial"
                  required
                  minLength={6}
                  className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
                />
                <p className="text-[10px] text-[#52525B] mt-1">
                  O jogador podera alterar depois
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                  STEAM ID
                </label>
                <input
                  type="text"
                  value={form.steam_id}
                  onChange={(e) => setForm({ ...form, steam_id: e.target.value })}
                  placeholder="76561198XXXXXXXXX"
                  className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.username || !form.email || !form.password}
                  className="flex-1 px-4 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  {saving ? "CRIANDO..." : "CRIAR JOGADOR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
