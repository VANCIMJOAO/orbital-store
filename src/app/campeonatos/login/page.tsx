"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, user } = await signIn(email, password);

    if (error) {
      // Verificar se o erro é de email não confirmado
      if (error.message?.includes("Email not confirmed")) {
        addToast("Por favor, confirme seu email antes de fazer login", "warning");
      } else {
        addToast("Email ou senha incorretos", "error");
      }
      setLoading(false);
      return;
    }

    // Verificar se o email foi confirmado
    if (user && !user.email_confirmed_at) {
      addToast("Por favor, confirme seu email antes de fazer login", "warning");
      setLoading(false);
      return;
    }

    addToast("Login realizado com sucesso!", "success");
    router.push("/campeonatos");
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
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#A855F7]/20 to-[#7C3AED]/20 border border-[#A855F7]/30 mb-4">
                  <svg className="w-8 h-8 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">
                  BEM-VINDO DE VOLTA
                </h1>
                <p className="text-[#A1A1AA] text-sm">
                  Entre para acessar os campeonatos
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                      SENHA
                    </label>
                    <Link
                      href="/campeonatos/recuperar-senha"
                      className="text-xs text-[#A855F7] hover:text-[#C084FC] transition-colors"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
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
                        ENTRANDO...
                      </>
                    ) : (
                      <>
                        ENTRAR
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#27272A]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-[#0f0f15] text-[#52525B] font-mono">OU</span>
                </div>
              </div>

              {/* Sign up link */}
              <div className="text-center">
                <p className="text-[#A1A1AA] text-sm">
                  Ainda nao tem uma conta?{" "}
                  <Link
                    href="/campeonatos/cadastro"
                    className="text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors"
                  >
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[#52525B] text-xs text-center mt-8">
            Ao entrar, voce concorda com nossos{" "}
            <Link href="/termos" className="text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacidade" className="text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors">
              Politica de Privacidade
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
