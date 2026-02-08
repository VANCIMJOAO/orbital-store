"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const navLinks = [
  { href: "/campeonatos/visao-geral", label: "VISÃO GERAL" },
  { href: "/campeonatos/partidas", label: "PARTIDAS" },
  { href: "/campeonatos/ao-vivo", label: "AO VIVO", pulse: true },
  { href: "/campeonatos/resultados", label: "RESULTADOS" },
  { href: "/campeonatos/estatisticas", label: "ESTATÍSTICAS" },
  { href: "/campeonatos/bracket", label: "BRACKET" },
];

interface TournamentHeaderProps {
  rightContent?: ReactNode;
}

export function TournamentHeader({ rightContent }: TournamentHeaderProps = {}) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0f0f15] border-b border-[#A855F7]/20">
      <div className="h-full flex items-center justify-between px-6">
        <Link href="/campeonatos" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center">
            <span className="font-display text-[#A855F7] text-lg">O</span>
          </div>
          <span className="font-display text-[#F5F5DC] text-lg tracking-wider hidden sm:block">
            ORBITAL ROXA
          </span>
        </Link>
        <nav className="flex items-center gap-4">
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
                } ${link.pulse ? "flex items-center gap-1" : ""}`}
              >
                {link.pulse && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>
        {rightContent || <div className="w-32" />}
      </div>
    </header>
  );
}
