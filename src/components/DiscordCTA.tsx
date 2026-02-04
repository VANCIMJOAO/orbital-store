"use client";

import { motion } from "framer-motion";
import { MessageCircle, Users, Zap, Gift } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "ACESSO ANTECIPADO",
    description: "Compre antes de todo mundo",
  },
  {
    icon: Gift,
    title: "DESCONTOS EXCLUSIVOS",
    description: "Ofertas só pra membros",
  },
  {
    icon: Users,
    title: "VOTE NOS DROPS",
    description: "Ajude a criar as próximas peças",
  },
  {
    icon: MessageCircle,
    title: "COMUNIDADE",
    description: "Conecte com outros gamers",
  },
];

export default function DiscordCTA() {
  return (
    <section id="discord" className="relative py-20 sm:py-32 bg-[#111111]">
      {/* Background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-5" />

      {/* Gradient accents */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#5865F2]/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#A855F7]/20 rounded-full blur-[100px]" />

      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5865F2]/50 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-8 h-px bg-[#5865F2]" />
              <span className="font-mono text-sm text-[#5865F2] tracking-widest">
                COMUNIDADE
              </span>
            </div>

            <h2 className="font-display text-4xl sm:text-6xl text-[#F5F5DC] mb-4">
              NÃO É <span className="text-[#A855F7]">LOJA</span>.
            </h2>
            <h2 className="font-display text-4xl sm:text-6xl text-[#F5F5DC] mb-8">
              É <span className="text-[#5865F2]">CLÃ</span>.
            </h2>

            <p className="font-body text-lg text-[#A1A1AA] mb-8 max-w-md">
              Entre no Discord da Orbital Roxa e faça parte da construção da marca.
              Aqui a comunidade vem antes de tudo.
            </p>

            {/* Discord button */}
            <motion.a
              href="https://discord.gg/orbitalroxa"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#5865F2] text-white font-mono font-bold tracking-wider"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="group-hover:animate-bounce"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              ENTRAR NO DISCORD
            </motion.a>

            {/* Member count */}
            <div className="mt-6 flex items-center gap-2 font-mono text-sm text-[#A1A1AA]">
              <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
              <span>247 membros online</span>
            </div>
          </motion.div>

          {/* Right side - Benefits grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="group relative p-6 bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#5865F2]/50 transition-colors duration-300"
              >
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#5865F2] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#5865F2] opacity-0 group-hover:opacity-100 transition-opacity" />

                <benefit.icon
                  size={24}
                  className="text-[#5865F2] mb-4 group-hover:scale-110 transition-transform"
                />
                <h3 className="font-mono text-sm text-[#F5F5DC] mb-2">
                  {benefit.title}
                </h3>
                <p className="font-body text-sm text-[#A1A1AA]">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
