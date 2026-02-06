"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireTournamentProfile } from "@/components/RequireTournamentProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

function PerfilContent() {
  const { profile, updateProfile, refreshProfile, signOut } = useAuth();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    discord_username: profile?.discord_username || "",
  });
  const [saving, setSaving] = useState(false);

  // Calcular XP necessário para o próximo nível (1000 XP por nível)
  const xpPerLevel = 1000;
  const currentLevel = profile?.level || 1;
  const currentXp = profile?.xp || 0;
  const xpForCurrentLevel = currentXp % xpPerLevel;
  const xpProgress = (xpForCurrentLevel / xpPerLevel) * 100;

  // Formatar data de criação
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Data desconhecida";
    const date = new Date(dateString);
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Função para copiar link do perfil
  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/campeonatos/jogador/${profile?.username}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      addToast("Link do perfil copiado!", "success");
    } catch {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      addToast("Link do perfil copiado!", "success");
    }
  };

  // Função para salvar edição
  const handleSaveEdit = async () => {
    setSaving(true);

    const { error } = await updateProfile({
      discord_username: editForm.discord_username || null,
    });

    if (error) {
      addToast("Erro ao salvar alterações", "error");
    } else {
      await refreshProfile();
      addToast("Perfil atualizado!", "success");
      setIsEditing(false);
    }

    setSaving(false);
  };

  // Estatísticas mock (futuro: buscar do banco)
  const estatisticas = {
    partidas: 0,
    vitorias: 0,
    derrotas: 0,
    winrate: "0%",
    kills: 0,
    deaths: 0,
    kd: "0.00",
    hs: "0%",
    adr: "0",
    rating: "0.00",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0f0f15] border-b border-[#A855F7]/20">
        <div className="h-full flex items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center">
              <span className="font-display text-[#A855F7] text-lg">O</span>
            </div>
            <span className="font-display text-[#F5F5DC] text-lg tracking-wider hidden sm:block">
              ORBITAL ROXA
            </span>
          </Link>

          {/* Navegação Central */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors tracking-wider">
              INÍCIO
            </Link>
            <Link href="/campeonatos" className="font-mono text-xs text-[#A855F7] tracking-wider">
              CAMPEONATOS
            </Link>
            <Link href="/store" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors tracking-wider">
              LOJA
            </Link>
            <Link href="/comunidade" className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors tracking-wider">
              COMUNIDADE
            </Link>
          </nav>

          {/* Área do Usuário */}
          <div className="flex items-center gap-4">
            {/* Notificações */}
            <button className="relative p-2 hover:bg-[#27272A] rounded-lg transition-colors">
              <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Divisor */}
            <div className="w-px h-8 bg-[#27272A]" />

            {/* Link Admin (se for admin) */}
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
                title="Painel Admin"
              >
                <svg className="w-5 h-5 text-[#eab308]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}

            {/* Avatar e Info do Usuário */}
            <Link
              href="/campeonatos/perfil"
              className="flex items-center gap-3 cursor-pointer hover:bg-[#27272A] rounded-lg p-2 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs font-body text-[#F5F5DC]">
                    {profile?.username || "Usuário"}
                  </span>
                  {profile?.is_admin && (
                    <span className="px-1.5 py-0.5 bg-[#eab308]/20 border border-[#eab308]/50 rounded text-[8px] font-mono text-[#eab308]">
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-[#A855F7]">
                  Nível {profile?.level || 1}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center border-2 border-[#A855F7]/50">
                <span className="font-mono text-white text-sm font-bold">
                  {(profile?.username?.[0] || "U").toUpperCase()}
                </span>
              </div>
            </Link>

            {/* Botão de Sair */}
            <button
              onClick={() => signOut()}
              className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
              title="Sair"
            >
              <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 pt-16">
        {/* Banner do Perfil */}
        <div className="relative h-48 bg-gradient-to-r from-[#A855F7]/20 via-[#1a1a2e] to-[#7C3AED]/20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        </div>

        {/* Info Principal do Usuário */}
        <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Avatar Grande */}
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center border-4 border-[#0A0A0A] shadow-lg shadow-[#A855F7]/20">
              <span className="font-display text-white text-5xl">
                {profile?.username?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl text-[#F5F5DC]">{profile?.username}</h1>
                <span className="px-2 py-1 bg-[#A855F7]/20 border border-[#A855F7]/50 rounded text-xs font-mono text-[#A855F7]">
                  BR
                </span>
                {profile?.is_admin && (
                  <span className="px-2 py-1 bg-[#eab308]/20 border border-[#eab308]/50 rounded text-xs font-mono text-[#eab308] flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-[#A1A1AA] text-sm font-body mb-4">
                Membro desde {formatDate(profile?.created_at)}
              </p>

              {/* Barra de XP */}
              <div className="max-w-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-[#A855F7]">NÍVEL {currentLevel}</span>
                  <span className="font-mono text-xs text-[#A1A1AA]">{xpForCurrentLevel}/{xpPerLevel} XP</span>
                </div>
                <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] rounded-full transition-all"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-[#eab308]/20 hover:bg-[#eab308]/30 border border-[#eab308]/50 text-[#eab308] font-mono text-xs rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  PAINEL ADMIN
                </Link>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
              >
                EDITAR PERFIL
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-xs rounded-lg transition-colors"
              >
                COMPARTILHAR
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Edição */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#12121a] border border-[#27272A] rounded-2xl p-6 w-full max-w-md">
              <h2 className="font-display text-xl text-[#F5F5DC] mb-6">EDITAR PERFIL</h2>

              <div className="space-y-4">
                {/* Username (readonly) */}
                <div>
                  <label className="block text-xs font-mono text-[#A1A1AA] mb-2">NOME DE USUÁRIO</label>
                  <div className="bg-[#1a1a2e]/50 border border-[#27272A] rounded-lg px-4 py-3 text-[#A1A1AA]">
                    {profile?.username}
                  </div>
                  <p className="text-[10px] text-[#52525B] mt-1">O nome de usuário não pode ser alterado</p>
                </div>

                {/* Steam ID (readonly) */}
                <div>
                  <label className="block text-xs font-mono text-[#A1A1AA] mb-2">STEAM ID</label>
                  <div className="bg-[#1a1a2e]/50 border border-[#27272A] rounded-lg px-4 py-3 text-[#A1A1AA]">
                    {profile?.steam_id}
                  </div>
                </div>

                {/* Discord */}
                <div>
                  <label className="block text-xs font-mono text-[#A1A1AA] mb-2">DISCORD</label>
                  <input
                    type="text"
                    value={editForm.discord_username}
                    onChange={(e) => setEditForm({ ...editForm, discord_username: e.target.value })}
                    placeholder="usuario#0000"
                    className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-3 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  {saving ? "SALVANDO..." : "SALVAR"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Conteúdo */}
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Estatísticas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cards de Stats Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">PARTIDAS</span>
                <span className="font-display text-2xl text-[#F5F5DC]">{estatisticas.partidas}</span>
              </div>
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">WINRATE</span>
                <span className="font-display text-2xl text-[#22c55e]">{estatisticas.winrate}</span>
              </div>
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">K/D</span>
                <span className="font-display text-2xl text-[#A855F7]">{estatisticas.kd}</span>
              </div>
              <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
                <span className="text-[10px] font-mono text-[#A1A1AA] block mb-1">RATING</span>
                <span className="font-display text-2xl text-[#F5F5DC]">{estatisticas.rating}</span>
              </div>
            </div>

            {/* Estatísticas Detalhadas */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
              <div className="p-4 border-b border-[#27272A]">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">ESTATÍSTICAS DETALHADAS</h3>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                  <span className="text-xs text-[#A1A1AA]">Vitórias</span>
                  <span className="font-mono text-sm text-[#22c55e]">{estatisticas.vitorias}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                  <span className="text-xs text-[#A1A1AA]">Derrotas</span>
                  <span className="font-mono text-sm text-[#eab308]">{estatisticas.derrotas}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                  <span className="text-xs text-[#A1A1AA]">Kills</span>
                  <span className="font-mono text-sm text-[#F5F5DC]">{estatisticas.kills}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                  <span className="text-xs text-[#A1A1AA]">Deaths</span>
                  <span className="font-mono text-sm text-[#F5F5DC]">{estatisticas.deaths}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                  <span className="text-xs text-[#A1A1AA]">HS%</span>
                  <span className="font-mono text-sm text-[#A855F7]">{estatisticas.hs}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#27272A]">
                  <span className="text-xs text-[#A1A1AA]">ADR</span>
                  <span className="font-mono text-sm text-[#F5F5DC]">{estatisticas.adr}</span>
                </div>
              </div>
            </div>

            {/* Histórico de Partidas */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
              <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">HISTÓRICO DE PARTIDAS</h3>
              </div>
              <div className="p-8 text-center">
                <p className="text-[#A1A1AA] text-sm">Nenhuma partida registrada ainda</p>
                <p className="text-[#52525B] text-xs mt-1">Participe de campeonatos para ver seu histórico aqui</p>
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Informações da Conta */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
              <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">INFORMAÇÕES</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-[#1a1a2e] rounded">
                  <svg className="w-5 h-5 text-[#A855F7]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  <div>
                    <span className="text-[10px] text-[#A1A1AA] block">Steam ID</span>
                    <span className="text-xs text-[#F5F5DC] font-mono">{profile?.steam_id}</span>
                  </div>
                </div>

                {profile?.discord_username && (
                  <div className="flex items-center gap-3 p-2 bg-[#1a1a2e] rounded">
                    <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <div>
                      <span className="text-[10px] text-[#A1A1AA] block">Discord</span>
                      <span className="text-xs text-[#F5F5DC]">{profile?.discord_username}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-2 bg-[#1a1a2e] rounded">
                  <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="text-[10px] text-[#A1A1AA] block">Membro desde</span>
                    <span className="text-xs text-[#F5F5DC]">{formatDate(profile?.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conquistas */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg">
              <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
                <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider">CONQUISTAS</h3>
                <span className="text-xs font-mono text-[#A855F7]">0/20</span>
              </div>
              <div className="p-8 text-center">
                <p className="text-[#A1A1AA] text-sm">Nenhuma conquista ainda</p>
                <p className="text-[#52525B] text-xs mt-1">Jogue para desbloquear conquistas</p>
              </div>
            </div>

            {/* Time Atual */}
            <div className="bg-[#12121a] border border-[#27272A] rounded-lg p-4">
              <h3 className="font-mono text-[#F5F5DC] text-sm tracking-wider mb-4">TIME ATUAL</h3>
              <div className="text-center py-4">
                <p className="text-[#A1A1AA] text-sm">Sem time</p>
                <p className="text-[#52525B] text-xs mt-1">Junte-se a um time para competir</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <RequireTournamentProfile>
      <PerfilContent />
    </RequireTournamentProfile>
  );
}
