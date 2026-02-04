"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function AuthError() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Error icon with glitch effect */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <div className="relative inline-block">
            <motion.span
              className="font-display text-8xl text-[#EF4444]"
              animate={{ x: [-2, 2, -2] }}
              transition={{ duration: 0.1, repeat: Infinity }}
            >
              !
            </motion.span>
            <div className="absolute inset-0 font-display text-8xl text-[#A855F7] opacity-50 translate-x-1">
              !
            </div>
          </div>
        </motion.div>

        {/* Error message */}
        <motion.h1
          className="font-display text-4xl sm:text-6xl text-[#F5F5DC] mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          ERRO DE <span className="text-[#EF4444]">AUTH</span>
        </motion.h1>

        <motion.p
          className="font-mono text-[#A1A1AA] mb-8 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Houve um problema ao conectar com o Discord. Tente novamente ou entre
          em contato pelo nosso servidor.
        </motion.p>

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/"
            className="px-8 py-4 bg-[#A855F7] text-[#0A0A0A] font-mono text-sm tracking-wider hover:bg-[#9333EA] transition-colors"
          >
            VOLTAR AO INICIO
          </Link>
          <a
            href="https://discord.gg/orbitalroxa"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 border border-[#A855F7] text-[#A855F7] font-mono text-sm tracking-wider hover:bg-[#A855F7]/10 transition-colors"
          >
            DISCORD
          </a>
        </motion.div>

        {/* HUD decoration */}
        <motion.div
          className="mt-12 font-mono text-xs text-[#A1A1AA]/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="text-[#EF4444]">ERROR_CODE:</span> AUTH_CALLBACK_FAILED
        </motion.div>
      </div>
    </main>
  );
}
