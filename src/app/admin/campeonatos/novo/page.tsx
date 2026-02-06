"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function NovoCampeonato() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    prize_pool: 0,
    prize_1st: 0,
    prize_2nd: 0,
    prize_3rd: 0,
    start_date: "",
    end_date: "",
    rules: "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: generateSlug(name),
    });
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Auto-calcular distribuição quando o total mudar
  const handlePrizePoolChange = (value: number) => {
    setForm({
      ...form,
      prize_pool: value,
      prize_1st: Math.round(value * 0.5),
      prize_2nd: Math.round(value * 0.3),
      prize_3rd: Math.round(value * 0.2),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();

    // Upload do banner se houver
    let bannerUrl: string | null = null;
    if (bannerFile) {
      try {
        const formData = new FormData();
        formData.append("file", bannerFile);
        formData.append("slug", form.slug || "banner");

        const uploadRes = await fetch("/api/upload/banner", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadRes.json();

        if (!uploadRes.ok) {
          setError(`Erro no upload do banner: ${uploadResult.error || "Falha desconhecida"}`);
          setLoading(false);
          return;
        }

        bannerUrl = uploadResult.url;
      } catch (err) {
        setError("Erro ao conectar com o servidor de upload");
        setLoading(false);
        return;
      }
    }

    const prizeDistribution = form.prize_pool > 0 ? {
      "1": form.prize_1st,
      "2": form.prize_2nd,
      "3": form.prize_3rd,
    } : null;

    const { error: dbError } = await supabase.from("tournaments").insert({
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      game: "CS2",
      format: "Double Elimination",
      max_teams: 8,
      prize_pool: form.prize_pool || 0,
      prize_distribution: prizeDistribution,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      rules: form.rules || null,
      banner_url: bannerUrl,
      status: "draft",
    });

    if (dbError) {
      setError(`Erro ao criar campeonato: ${dbError.message}`);
      setLoading(false);
      return;
    }

    router.push("/admin/campeonatos");
  };

  const totalDistribuido = form.prize_1st + form.prize_2nd + form.prize_3rd;
  const distribuicaoValida = form.prize_pool === 0 || totalDistribuido === form.prize_pool;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/campeonatos"
          className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h2 className="font-display text-2xl text-[#F5F5DC]">Novo Campeonato</h2>
          <p className="text-[#A1A1AA] text-sm mt-1">Configure os dados do campeonato LAN</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Banner */}
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#27272A]">
            <h3 className="font-mono text-sm text-[#A855F7] tracking-wider">BANNER DO CAMPEONATO</h3>
            <p className="text-[10px] text-[#52525B] mt-1">Imagem que aparece na pagina inicial de campeonatos (1200x400 recomendado)</p>
          </div>

          <div
            onClick={() => bannerInputRef.current?.click()}
            className="relative w-full h-[200px] cursor-pointer group"
          >
            {bannerPreview ? (
              <>
                <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-mono text-xs">TROCAR IMAGEM</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-[#1a1a2e] border-2 border-dashed border-[#27272A] flex flex-col items-center justify-center gap-3 hover:border-[#A855F7]/50 transition-colors">
                <svg className="w-10 h-10 text-[#52525B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-mono text-xs text-[#52525B]">CLIQUE PARA ADICIONAR BANNER</span>
              </div>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Info Basica */}
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6 space-y-6">
          <h3 className="font-mono text-sm text-[#A855F7] tracking-wider">INFORMACOES DO CAMPEONATO</h3>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                NOME DO CAMPEONATO *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Orbital Cup Season 1"
                required
                className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                SLUG (URL)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="orbital-cup-s1"
                className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
              />
              <p className="text-[10px] text-[#52525B] mt-1">
                /campeonatos/{form.slug || "slug"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
              DESCRICAO
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descricao do campeonato que aparece na pagina inicial..."
              rows={3}
              className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                DATA DE INICIO
              </label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] focus:outline-none focus:border-[#A855F7]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
                DATA DE TERMINO
              </label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] focus:outline-none focus:border-[#A855F7]/50"
              />
            </div>
          </div>
        </div>

        {/* Formato - Somente leitura */}
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm text-[#A855F7] tracking-wider">FORMATO DO TORNEIO</h3>
            <span className="text-[10px] font-mono text-[#52525B] bg-[#27272A] px-2 py-1 rounded">CONFIGURACAO FIXA</span>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#A855F7]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg font-display text-[#F5F5DC]">CS2</span>
              <span className="text-[10px] font-mono text-[#52525B] block mt-1">JOGO</span>
            </div>

            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#22c55e]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-lg font-display text-[#F5F5DC]">8</span>
              <span className="text-[10px] font-mono text-[#52525B] block mt-1">TIMES</span>
            </div>

            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#3b82f6]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-sm font-display text-[#F5F5DC]">Double Elim</span>
              <span className="text-[10px] font-mono text-[#52525B] block mt-1">BRACKET</span>
            </div>

            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#f59e0b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span className="text-sm font-display text-[#F5F5DC]">MD1 / MD3</span>
              <span className="text-[10px] font-mono text-[#52525B] block mt-1">FINAL</span>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-[#A855F7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-[#A1A1AA] space-y-1">
                <p>Todas as partidas do bracket sao <span className="text-[#F5F5DC] font-semibold">MD1</span> (melhor de 1 mapa).</p>
                <p>A <span className="text-[#f59e0b] font-semibold">Grand Final</span> e <span className="text-[#F5F5DC] font-semibold">MD3</span> (melhor de 3 mapas).</p>
                <p>Bracket <span className="text-[#22c55e] font-semibold">Winner</span> e <span className="text-[#ef4444] font-semibold">Lower</span> com double elimination para 8 times.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premiacao */}
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6 space-y-6">
          <h3 className="font-mono text-sm text-[#A855F7] tracking-wider">PREMIACAO</h3>

          {/* Total */}
          <div>
            <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
              PREMIACAO TOTAL (R$)
            </label>
            <input
              type="number"
              value={form.prize_pool || ""}
              onChange={(e) => handlePrizePoolChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 text-lg font-mono"
            />
          </div>

          {/* Distribuicao */}
          {form.prize_pool > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#A1A1AA]">DISTRIBUICAO DA PREMIACAO</span>
                {!distribuicaoValida && (
                  <span className="text-[10px] font-mono text-red-500 bg-red-500/10 px-2 py-1 rounded">
                    Soma ({totalDistribuido.toFixed(2)}) diferente do total ({form.prize_pool.toFixed(2)})
                  </span>
                )}
                {distribuicaoValida && form.prize_pool > 0 && (
                  <span className="text-[10px] font-mono text-[#22c55e] bg-[#22c55e]/10 px-2 py-1 rounded">
                    100% distribuido
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* 1o Lugar */}
                <div className="bg-[#0A0A0A] border border-[#FFD700]/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🥇</span>
                    <div>
                      <span className="text-sm font-display text-[#FFD700]">1° LUGAR</span>
                      <span className="text-[10px] font-mono text-[#52525B] block">
                        {form.prize_pool > 0 ? `${Math.round((form.prize_1st / form.prize_pool) * 100)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] font-mono text-sm">R$</span>
                    <input
                      type="number"
                      value={form.prize_1st || ""}
                      onChange={(e) => setForm({ ...form, prize_1st: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg pl-10 pr-4 py-2.5 text-[#FFD700] font-mono focus:outline-none focus:border-[#FFD700]/50"
                    />
                  </div>
                </div>

                {/* 2o Lugar */}
                <div className="bg-[#0A0A0A] border border-[#C0C0C0]/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🥈</span>
                    <div>
                      <span className="text-sm font-display text-[#C0C0C0]">2° LUGAR</span>
                      <span className="text-[10px] font-mono text-[#52525B] block">
                        {form.prize_pool > 0 ? `${Math.round((form.prize_2nd / form.prize_pool) * 100)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] font-mono text-sm">R$</span>
                    <input
                      type="number"
                      value={form.prize_2nd || ""}
                      onChange={(e) => setForm({ ...form, prize_2nd: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg pl-10 pr-4 py-2.5 text-[#C0C0C0] font-mono focus:outline-none focus:border-[#C0C0C0]/50"
                    />
                  </div>
                </div>

                {/* 3o Lugar */}
                <div className="bg-[#0A0A0A] border border-[#CD7F32]/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🥉</span>
                    <div>
                      <span className="text-sm font-display text-[#CD7F32]">3° LUGAR</span>
                      <span className="text-[10px] font-mono text-[#52525B] block">
                        {form.prize_pool > 0 ? `${Math.round((form.prize_3rd / form.prize_pool) * 100)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] font-mono text-sm">R$</span>
                    <input
                      type="number"
                      value={form.prize_3rd || ""}
                      onChange={(e) => setForm({ ...form, prize_3rd: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg pl-10 pr-4 py-2.5 text-[#CD7F32] font-mono focus:outline-none focus:border-[#CD7F32]/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Regras */}
        <div className="bg-[#12121a] border border-[#27272A] rounded-xl p-6 space-y-4">
          <h3 className="font-mono text-sm text-[#A855F7] tracking-wider">REGRAS E REGULAMENTO</h3>

          <div>
            <label className="block text-xs font-mono text-[#A1A1AA] mb-2">
              URL DO REGULAMENTO
            </label>
            <input
              type="url"
              value={form.rules}
              onChange={(e) => setForm({ ...form, rules: e.target.value })}
              placeholder="https://docs.google.com/..."
              className="w-full bg-[#1a1a2e] border border-[#27272A] rounded-lg px-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50"
            />
            <p className="text-[10px] text-[#52525B] mt-1">
              Link para o Google Docs, Notion ou pagina com as regras do campeonato
            </p>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/50 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-[#ef4444] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-[#ef4444]">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-[#52525B] font-mono">
            O campeonato sera criado como <span className="text-[#eab308]">RASCUNHO</span>. Adicione os times e gere o bracket depois.
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/campeonatos"
              className="px-6 py-3 bg-[#27272A] hover:bg-[#3f3f46] text-[#F5F5DC] font-mono text-xs rounded-lg transition-colors"
            >
              CANCELAR
            </Link>
            <button
              type="submit"
              disabled={loading || !form.name || (form.prize_pool > 0 && !distribuicaoValida)}
              className="px-6 py-3 bg-[#A855F7] hover:bg-[#9333EA] disabled:bg-[#A855F7]/50 disabled:cursor-not-allowed text-white font-mono text-xs rounded-lg transition-colors"
            >
              {loading ? "CRIANDO..." : "CRIAR CAMPEONATO"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
