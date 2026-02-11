"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import {
  validateUsername,
  validateSteamId,
  validatePassword,
  validateEmail,
  sanitizeUsername,
  sanitizeSteamId,
} from "@/lib/validation";

export default function CadastroPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [steamId, setSteamId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const { addToast } = useToast();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // Validação de senha em tempo real
  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      addToast(emailValidation.error!, "error");
      return;
    }

    // Validar username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      addToast(usernameValidation.error!, "error");
      return;
    }

    // Validar Steam ID
    const steamIdValidation = validateSteamId(steamId);
    if (!steamIdValidation.isValid) {
      addToast(steamIdValidation.error!, "error");
      return;
    }

    // Validar senha forte
    if (!passwordValidation.isValid) {
      addToast(passwordValidation.errors[0], "error");
      return;
    }

    if (password !== confirmPassword) {
      addToast("As senhas nao coincidem", "error");
      return;
    }

    setLoading(true);

    // Sanitizar inputs antes de enviar
    const sanitizedUsername = sanitizeUsername(username);

    // Verificar se username já existe
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", sanitizedUsername)
      .maybeSingle();

    if (existingUser) {
      addToast("Este nome de usuario ja esta em uso", "error");
      setLoading(false);
      return;
    }
    const sanitizedSteamId = sanitizeSteamId(steamId);

    const { error } = await signUp(email.trim().toLowerCase(), password, {
      username: sanitizedUsername,
      steamId: sanitizedSteamId,
      isTournamentPlayer: true,
    });

    if (error) {
      if (error.message.includes("already registered")) {
        addToast("Este email ja esta cadastrado", "error");
      } else if (error.message.includes("nome de usuário já está em uso")) {
        addToast("Este nome de usuario ja esta em uso", "error");
      } else {
        addToast("Erro ao criar conta. Tente novamente.", "error");
      }
      setLoading(false);
      return;
    }

    addToast("Conta criada com sucesso! Verifique seu email.", "success");
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#22c55e]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#16a34a]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#22c55e]/5 rounded-full blur-3xl" />
        </div>

        <header className="relative z-10 h-16 border-b border-[#22c55e]/10">
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

        <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#22c55e]/20 via-[#16a34a]/20 to-[#22c55e]/20 rounded-2xl blur-xl opacity-50" />

              <div className="relative bg-[#0f0f15]/90 backdrop-blur-xl border border-[#22c55e]/30 rounded-2xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#22c55e]/20 to-[#16a34a]/20 border border-[#22c55e]/30 mb-6">
                  <svg className="w-10 h-10 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl text-[#F5F5DC] mb-3">
                  CONTA CRIADA!
                </h1>
                <p className="text-[#A1A1AA] text-sm mb-6 leading-relaxed">
                  Enviamos um email de confirmacao para{" "}
                  <span className="text-[#F5F5DC] font-medium">{email}</span>.
                  <br />
                  Verifique sua caixa de entrada para ativar sua conta.
                </p>
                <Link
                  href="/campeonatos/login"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-mono text-sm tracking-wider px-8 py-3.5 rounded-xl transition-all"
                >
                  IR PARA LOGIN
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl text-[#F5F5DC] mb-2">
                  CRIAR CONTA
                </h1>
                <p className="text-[#A1A1AA] text-sm">
                  Cadastre-se para participar dos campeonatos
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                    NOME DE USUARIO <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[#52525B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-xl pl-12 pr-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 focus:bg-[#1a1a2e] transition-all"
                      placeholder="seu_nickname"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                    EMAIL <span className="text-red-500">*</span>
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
                      className={`w-full bg-[#1a1a2e]/50 border rounded-xl pl-12 pr-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:bg-[#1a1a2e] transition-all ${
                        email && !validateEmail(email).isValid
                          ? "border-[#ef4444]/50 focus:border-[#ef4444]/70"
                          : email && validateEmail(email).isValid
                          ? "border-[#22c55e]/50 focus:border-[#22c55e]/70"
                          : "border-[#27272A] focus:border-[#A855F7]/50"
                      }`}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  {email && !validateEmail(email).isValid && (
                    <p className="text-[10px] text-[#ef4444] font-mono">
                      {validateEmail(email).error}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="steamId" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                    STEAM ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[#52525B]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="steamId"
                      value={steamId}
                      onChange={(e) => setSteamId(e.target.value)}
                      className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-xl pl-12 pr-4 py-3 text-[#F5F5DC] placeholder-[#52525B] focus:outline-none focus:border-[#A855F7]/50 focus:bg-[#1a1a2e] transition-all"
                      placeholder="76561198xxxxxxxxx"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-[#52525B]">
                    Encontre seu Steam ID em{" "}
                    <a
                      href="https://steamid.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#A855F7] hover:text-[#C084FC]"
                    >
                      steamid.io
                    </a>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                      SENHA <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-[#52525B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-xl pl-10 pr-3 py-3 text-[#F5F5DC] placeholder-[#52525B] text-sm focus:outline-none focus:border-[#A855F7]/50 focus:bg-[#1a1a2e] transition-all"
                        placeholder="Min. 8 char"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-xs font-mono text-[#A1A1AA] tracking-wider">
                      CONFIRMAR <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-[#52525B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#1a1a2e]/50 border border-[#27272A] rounded-xl pl-10 pr-3 py-3 text-[#F5F5DC] placeholder-[#52525B] text-sm focus:outline-none focus:border-[#A855F7]/50 focus:bg-[#1a1a2e] transition-all"
                        placeholder="Repita"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordValidation.score
                              ? passwordValidation.score >= 4
                                ? "bg-[#22c55e]"
                                : passwordValidation.score >= 3
                                ? "bg-[#eab308]"
                                : "bg-[#ef4444]"
                              : "bg-[#27272A]"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className={`text-[10px] font-mono ${
                        passwordValidation.score >= 4 ? "text-[#22c55e]" :
                        passwordValidation.score >= 3 ? "text-[#eab308]" :
                        "text-[#ef4444]"
                      }`}>
                        {passwordValidation.strength === 'muito_fraca' && "Muito fraca"}
                        {passwordValidation.strength === 'fraca' && "Fraca"}
                        {passwordValidation.strength === 'media' && "Media"}
                        {passwordValidation.strength === 'forte' && "Forte"}
                        {passwordValidation.strength === 'muito_forte' && "Muito forte"}
                      </p>
                      {passwordValidation.errors.length > 0 && (
                        <p className="text-[10px] text-[#A1A1AA]">
                          {passwordValidation.errors[0]}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full group mt-2"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#A855F7] to-[#7C3AED] rounded-xl blur opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-r from-[#A855F7] to-[#9333EA] hover:from-[#9333EA] hover:to-[#7C3AED] disabled:from-[#A855F7]/50 disabled:to-[#9333EA]/50 text-white font-mono text-sm tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        CRIANDO CONTA...
                      </>
                    ) : (
                      <>
                        CRIAR CONTA
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#27272A]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-[#0f0f15] text-[#52525B] font-mono">OU</span>
                </div>
              </div>

              {/* Login link */}
              <div className="text-center">
                <p className="text-[#A1A1AA] text-sm">
                  Ja tem uma conta?{" "}
                  <Link
                    href="/campeonatos/login"
                    className="text-[#A855F7] hover:text-[#C084FC] font-medium transition-colors"
                  >
                    Entrar
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[#52525B] text-xs text-center mt-6">
            Ao criar uma conta, voce concorda com nossos{" "}
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
