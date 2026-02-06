"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function NovaSenhaPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { updatePassword, session } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  // Verificar se o usuario tem uma sessao valida (veio do link do email)
  useEffect(() => {
    if (!session) {
      // Aguardar um pouco para a sessao ser carregada do hash da URL
      const timer = setTimeout(() => {
        if (!session) {
          addToast("Link invalido ou expirado. Solicite um novo.", "error");
          router.push("/campeonatos/recuperar-senha");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session, router, addToast]);

  const getPasswordStrength = () => {
    if (password.length === 0) return { level: 0, text: "", color: "" };
    if (password.length < 6) return { level: 1, text: "Muito fraca", color: "bg-red-500" };
    if (password.length < 8) return { level: 2, text: "Fraca", color: "bg-orange-500" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { level: 3, text: "Media", color: "bg-yellow-500" };
    }
    if (password.length >= 10 && /[!@#$%^&*]/.test(password)) {
      return { level: 5, text: "Muito forte", color: "bg-emerald-500" };
    }
    return { level: 4, text: "Forte", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast("As senhas nao coincidem", "error");
      return;
    }

    if (password.length < 6) {
      addToast("A senha deve ter no minimo 6 caracteres", "error");
      return;
    }

    setLoading(true);

    const { error } = await updatePassword(password);

    if (error) {
      addToast("Erro ao atualizar senha. Tente novamente.", "error");
      setLoading(false);
      return;
    }

    setSuccess(true);
    addToast("Senha atualizada com sucesso!", "success");
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
              {success ? (
                /* Success State */
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 mb-4">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">
                    SENHA ATUALIZADA!
                  </h1>
                  <p className="text-[#A1A1AA] text-sm mb-8">
                    Sua senha foi alterada com sucesso. Voce ja pode fazer login.
                  </p>

                  <Link
                    href="/campeonatos/login"
                    className="relative w-full group inline-block"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#A855F7] to-[#7C3AED] rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-gradient-to-r from-[#A855F7] to-[#9333EA] hover:from-[#9333EA] hover:to-[#7C3AED] text-white font-mono text-sm tracking-wider py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                      IR PARA LOGIN
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </Link>
                </div>
              ) : (
                /* Form State */
                <>
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#A855F7]/20 to-[#7C3AED]/20 border border-[#A855F7]/30 mb-4">
                      <svg className="w-8 h-8 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                      </svg>
                    </div>
                    <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">
                      NOVA SENHA
                    </h1>
                    <p className="text-[#A1A1AA] text-sm">
                      Digite sua nova senha abaixo
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                        NOVA SENHA <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-[#52525B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-xl pl-12 pr-4 py-3.5 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 focus:bg-[#1a1a2e] transition-all"
                          placeholder="********"
                          required
                        />
                      </div>

                      {/* Password strength indicator */}
                      {password.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                  level <= passwordStrength.level
                                    ? passwordStrength.color
                                    : "bg-[#27272A]"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-[#A1A1AA]">
                            Forca: <span className={passwordStrength.level >= 4 ? "text-emerald-400" : passwordStrength.level >= 3 ? "text-yellow-400" : "text-red-400"}>{passwordStrength.text}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                        CONFIRMAR SENHA <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-[#52525B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full bg-[#1a1a2e]/50 border rounded-xl pl-12 pr-4 py-3.5 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:bg-[#1a1a2e] transition-all ${
                            confirmPassword && confirmPassword !== password
                              ? "border-red-500/50 focus:border-red-500"
                              : "border-[#27272A] focus:border-[#A855F7]/50"
                          }`}
                          placeholder="********"
                          required
                        />
                      </div>
                      {confirmPassword && confirmPassword !== password && (
                        <p className="text-xs text-red-400">As senhas nao coincidem</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || password !== confirmPassword || password.length < 6}
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
                            ATUALIZANDO...
                          </>
                        ) : (
                          <>
                            ATUALIZAR SENHA
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </>
                        )}
                      </div>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
