"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/campeonatos/visao-geral", label: "VISÃO GERAL" },
  { href: "/campeonatos/partidas", label: "PARTIDAS" },
  { href: "/campeonatos/resultados", label: "RESULTADOS" },
  { href: "/campeonatos/estatisticas", label: "ESTATÍSTICAS" },
  { href: "/campeonatos/bracket", label: "BRACKET" },
];

interface TournamentHeaderProps {
  rightContent?: ReactNode;
}

export function TournamentHeader({ rightContent }: TournamentHeaderProps = {}) {
  const pathname = usePathname();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0f0f15] border-b border-[#A855F7]/20">
        <div className="h-full flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            {/* Hamburger menu button - mobile only */}
            <button
              className="md:hidden p-2 text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <Link href="/campeonatos" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center">
                <span className="font-display text-[#A855F7] text-lg">O</span>
              </div>
              <span className="font-display text-[#F5F5DC] text-lg tracking-wider hidden sm:block">
                ORBITAL ROXA
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-mono text-xs tracking-wider transition-colors ${
                    isActive
                      ? "text-[#A855F7]"
                      : "text-[#A1A1AA] hover:text-[#F5F5DC]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Área do Usuário */}
          <div className="flex items-center gap-2 md:gap-3">
            {rightContent}
            {user ? (
              <>
                {/* Link Admin */}
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
                  className="flex items-center gap-2 cursor-pointer hover:bg-[#27272A] rounded-lg p-1.5 transition-colors"
                >
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-xs font-body text-[#F5F5DC]">
                        {authLoading ? "..." : profile?.username || "Usuário"}
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center border-2 border-[#A855F7]/50">
                    <span className="font-mono text-white text-sm font-bold">
                      {authLoading ? "..." : (profile?.username?.[0] || "U").toUpperCase()}
                    </span>
                  </div>
                </Link>

                {/* Botão de Sair */}
                <button
                  onClick={() => signOut()}
                  className="p-2 hover:bg-[#27272A] rounded-lg transition-colors"
                  title="Sair"
                >
                  <svg className="w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 md:gap-3">
                <Link
                  href="/campeonatos/login"
                  className="font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors tracking-wider hidden sm:block"
                >
                  ENTRAR
                </Link>
                <Link
                  href="/campeonatos/cadastro"
                  className="font-mono text-xs bg-[#A855F7] hover:bg-[#9333EA] text-white px-3 md:px-4 py-2 rounded-lg transition-colors tracking-wider"
                >
                  CADASTRAR
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu */}
          <nav className="absolute top-16 left-0 right-0 bg-[#0f0f15] border-b border-[#A855F7]/20 py-4 px-6 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block font-mono text-sm tracking-wider py-3 px-4 rounded-lg transition-colors ${
                    isActive
                      ? "text-[#A855F7] bg-[#A855F7]/10"
                      : "text-[#A1A1AA] hover:text-[#F5F5DC] hover:bg-[#1a1a2e]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {!user && (
              <Link
                href="/campeonatos/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block font-mono text-sm tracking-wider py-3 px-4 rounded-lg text-[#A1A1AA] hover:text-[#F5F5DC] hover:bg-[#1a1a2e] transition-colors sm:hidden"
              >
                ENTRAR
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
