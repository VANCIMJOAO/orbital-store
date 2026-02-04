"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Instagram, MessageCircle, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0A0A0A] border-t border-[#1A1A1A]">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <motion.span
                className="font-display text-5xl text-[#A855F7]"
                whileHover={{ scale: 1.05 }}
              >
                ORBITAL ROXA
              </motion.span>
            </Link>
            <p className="font-body text-[#A1A1AA] max-w-sm mb-6">
              Streetwear com alma gamer. Criamos peças oversized pra quem vive entre o
              digital e a rua, mistura estilo com atitude e transforma roupa em
              identidade.
            </p>

            {/* Social links */}
            <div className="flex gap-4">
              <motion.a
                href="https://instagram.com/orbitalroxa"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-[#111111] border border-[#1A1A1A] text-[#A1A1AA] hover:text-[#A855F7] hover:border-[#A855F7]/50 transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Instagram size={20} />
              </motion.a>
              <motion.a
                href="https://discord.gg/orbitalroxa"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-[#111111] border border-[#1A1A1A] text-[#A1A1AA] hover:text-[#5865F2] hover:border-[#5865F2]/50 transition-colors"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
              >
                <MessageCircle size={20} />
              </motion.a>
              <motion.a
                href="mailto:contato@orbitalroxa.com"
                className="p-3 bg-[#111111] border border-[#1A1A1A] text-[#A1A1AA] hover:text-[#A855F7] hover:border-[#A855F7]/50 transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Mail size={20} />
              </motion.a>
            </div>
          </div>

          {/* Links column */}
          <div>
            <h4 className="font-mono text-sm text-[#F5F5DC] tracking-wider mb-6">
              NAVEGAÇÃO
            </h4>
            <ul className="space-y-3">
              {["Drops", "Loja", "Manifesto", "Discord"].map((item) => (
                <li key={item}>
                  <Link
                    href={`#${item.toLowerCase()}`}
                    className="font-body text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info column */}
          <div>
            <h4 className="font-mono text-sm text-[#F5F5DC] tracking-wider mb-6">
              INFORMAÇÕES
            </h4>
            <ul className="space-y-3">
              {[
                "Política de Privacidade",
                "Termos de Uso",
                "Trocas e Devoluções",
                "FAQ",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="font-body text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-16 pt-8 border-t border-[#1A1A1A]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h4 className="font-mono text-sm text-[#F5F5DC] tracking-wider mb-2">
                FIQUE POR DENTRO
              </h4>
              <p className="font-body text-sm text-[#A1A1AA]">
                Receba notificações dos próximos drops direto no seu email.
              </p>
            </div>

            <form className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="seu@email.com"
                className="flex-1 sm:w-64 px-4 py-3 bg-[#111111] border border-[#1A1A1A] text-[#F5F5DC] font-mono text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#A855F7]/50 transition-colors"
              />
              <motion.button
                type="submit"
                className="px-6 py-3 bg-[#A855F7] text-[#0A0A0A] font-mono text-sm font-bold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ASSINAR
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-mono text-xs text-[#A1A1AA]">
              © {currentYear} ORBITAL ROXA. TODOS OS DIREITOS RESERVADOS.
            </p>

            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[#A1A1AA]">
                UNDERGROUND FREQUENCY
              </span>
              <span className="text-[#A855F7]">•</span>
              <span className="font-mono text-xs text-[#A855F7]">
                STAY IN THE GAME
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient line */}
      <div className="h-1 bg-gradient-to-r from-[#6B21A8] via-[#A855F7] to-[#6B21A8]" />
    </footer>
  );
}
