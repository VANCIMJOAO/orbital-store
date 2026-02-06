"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface Team {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
  created_at: string | null;
  player_count?: number;
}

export default function TimesAdmin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [form, setForm] = useState({ name: "", tag: "" });
  const [saving, setSaving] = useState(false);

  const fetchTeams = async () => {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("teams")
      .select(`
        *,
        team_players(count)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTeams(data.map(t => ({
        ...t,
        player_count: t.team_players?.[0]?.count || 0
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setForm({ name: team.name, tag: team.tag });
    } else {
      setEditingTeam(null);
      setForm({ name: "", tag: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createBrowserSupabaseClient();

    if (editingTeam) {
      const { error } = await supabase
        .from("teams")
        .update({ name: form.name, tag: form.tag.toUpperCase() })
        .eq("id", editingTeam.id);

      if (error) {
        console.error("Erro ao atualizar time:", error);
      }
    } else {
      const { error } = await supabase
        .from("teams")
        .insert({ name: form.name, tag: form.tag.toUpperCase() });

      if (error) {
        console.error("Erro ao criar time:", error);
      }
    }

    setSaving(false);
    setShowModal(false);
    fetchTeams();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este time?")) return;

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir time:", error);
    } else {
      fetchTeams();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#F5F5DC]">Times</h2>
          <p className="text-[#A1A1AA] text-sm mt-1">Gerencie os times cadastrados</p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-xs rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          NOVO TIME
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar time..."
          className="w-full bg-[#12121a] border border-[#27272A] rounded-lg pl-10 pr-4 py-2 text-sm text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#12121a] border border-[#27272A] rounded-xl p-6 animate-pulse">
              <div className="w-16 h-16 bg-[#27272A] rounded-lg mx-auto mb-4" />
              <div className="h-4 bg-[#27272A] rounded w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-[#27272A] rounded w-1/2 mx-auto" />
            </div>
          ))
        ) : teams.length === 0 ? (
          <div className="col-span-full bg-[#12121a] border border-dashed border-[#A855F7]/30 rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#A855F7]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-[#F5F5DC] mb-2">Nenhum time cadastrado</h3>
            <p className="text-[#A1A1AA] text-sm mb-6">
              Comece cadastrando os times que participarao dos campeonatos.
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-sm rounded-lg transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              Cadastrar Primeiro Time
            </button>
          </div>
        ) : (
          teams.map((team) => (
            <div
              key={team.id}
              className="bg-[#12121a] border border-[#27272A] hover:border-[#A855F7]/50 rounded-xl p-6 transition-all group"
            >
              {/* Logo */}
              <div className="w-16 h-16 rounded-lg bg-[#27272A] border border-[#A855F7]/20 flex items-center justify-center mx-auto mb-4 group-hover:border-[#A855F7]/50 transition-colors">
                <span className="font-mono text-lg text-[#A1A1AA] font-bold">
                  {team.tag}
                </span>
              </div>

              {/* Info */}
              <div className="text-center mb-4">
                <h3 className="font-body text-[#F5F5DC] font-medium">{team.name}</h3>
                <p className="text-[10px] font-mono text-[#A1A1AA] mt-1">
                  {team.player_count || 0} jogadores
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-2">
                <Link
                  href={`/admin/times/${team.id}`}
                  className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
                  title="Gerenciar jogadores"
                >
                  <svg className="w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </Link>
                <button
                  onClick={() => openModal(team)}
                  className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="p-2 hover:bg-[#ef4444]/20 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <svg className="w-4 h-4 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] border border-[#27272A] rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-display text-xl text-[#F5F5DC] mb-6">
              {editingTeam ? "Editar Time" : "Novo Time"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                  NOME DO TIME *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: FURIA Esports"
                  required
                  className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                  TAG/SIGLA * (3-5 caracteres)
                </label>
                <input
                  type="text"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value.toUpperCase().slice(0, 5) })}
                  placeholder="Ex: FUR"
                  required
                  maxLength={5}
                  className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 uppercase"
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
                  disabled={saving || !form.name || !form.tag}
                  className="flex-1 px-4 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  {saving ? "SALVANDO..." : editingTeam ? "SALVAR" : "CRIAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
