"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { resetPassword } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      addToast("Erro ao enviar email de recuperacao. Tente novamente.", "error");
      setLoading(false);
      return;
    }

    setEmailSent(true);
    addToast("Email de recuperacao enviado com sucesso!", "success");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#A855F7]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A855F7]/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(#A855F7 1px, transparent 1px), linear-gradient(90deg, #A855F7 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Header */}
      <header className="relative z-10 h-16 border-b border-[#A855F7]/10">
        <div className="h-full flex items-center justify-center px-6">
          <Link href="/campeonatos" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center group-hover:bg-[#A855F7]/30 transition-colors">
              <span className="font-display text-[#A855F7] text-lg">O</span>
            </div>
            <span className="font-display text-[#F5F5DC] text-lg tracking-wider">
              ORBITAL ROXA
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#A855F7]/20 via-[#7C3AED]/20 to-[#A855F7]/20 rounded-2xl blur-xl opacity-50" />

            <div className="relative bg-[#0f0f15]/90 backdrop-blur-xl border border-[#A855F7]/20 rounded-2xl p-8">
              {emailSent ? (
                /* Success State */
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 mb-4">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">
                    EMAIL ENVIADO!
                  </h1>
                  <p className="text-[#A1A1AA] text-sm mb-6">
                    Verifique sua caixa de entrada e siga as instrucoes para redefinir sua senha.
                  </p>
                  <p className="text-[#52525B] text-xs mb-8">
                    Nao recebeu? Verifique a pasta de spam ou tente novamente.
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => setEmailSent(false)}
                      className="w-full bg-[#1a1a2e]/50 border border-[#27272A] hover:border-[#A855F7]/50 text-[#A1A1AA] hover:text-[#F5F5DC] font-mono text-sm tracking-wider py-3 rounded-xl transition-all"
                    >
                      TENTAR NOVAMENTE
                    </button>
                    <Link
                      href="/campeonatos/login"
                      className="block w-full text-center text-[#A855F7] hover:text-[#C084FC] font-mono text-sm transition-colors"
                    >
                      Voltar para login
                    </Link>
                  </div>
                </div>
              ) : (
                /* Form State */
                <>
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#A855F7]/20 to-[#7C3AED]/20 border border-[#A855F7]/30 mb-4">
                      <svg className="w-8 h-8 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">
                      RECUPERAR SENHA
                    </h1>
                    <p className="text-[#A1A1AA] text-sm">
                      Digite seu email para receber um link de recuperacao
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                        EMAIL
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-[#52525B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-xl pl-12 pr-4 py-3.5 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 focus:bg-[#1a1a2e] transition-all"
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full group"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#A855F7] to-[#7C3AED] rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-gradient-to-r from-[#A855F7] to-[#9333EA] hover:from-[#9333EA] hover:to-[#7C3AED] disabled:from-[#A855F7]/50 disabled:to-[#9333EA]/50 text-white font-mono text-sm tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            ENVIANDO...
                          </>
                        ) : (
                          <>
                            ENVIAR LINK
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </div>
                    </button>
                  </form>

                  {/* Back to login */}
                  <div className="text-center mt-8">
                    <Link
                      href="/campeonatos/login"
                      className="inline-flex items-center gap-2 text-[#A1A1AA] hover:text-[#F5F5DC] text-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      Voltar para login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
