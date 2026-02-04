"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const phrases = [
  { text: "STAY IN THE GAME", highlight: true },
  { text: "NO PAUSE", highlight: false },
  { text: "YOUR LIFE, YOUR SKIN", highlight: false },
  { text: "STREET MODE ON", highlight: false },
  { text: "ONLINE & OFFLINE", highlight: true },
  { text: "CREATE YOUR OWN META", highlight: false },
  { text: "ORBITAL STATE OF MIND", highlight: true },
];

export default function Manifesto() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100]);

  return (
    <section
      id="manifesto"
      ref={containerRef}
      className="relative py-32 sm:py-48 bg-[#0A0A0A] overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A855F7]/10 rounded-full blur-[200px]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-pattern opacity-5" />

      {/* Section divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A855F7]/30 to-transparent" />

      <motion.div style={{ opacity, y }} className="relative z-10 max-w-5xl mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#A855F7]" />
            <span className="font-mono text-sm text-[#A855F7] tracking-widest">MANIFESTO</span>
            <div className="w-8 h-px bg-[#A855F7]" />
          </div>
        </motion.div>

        {/* Main manifesto text */}
        <div className="text-center space-y-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-5xl md:text-6xl text-[#F5F5DC] leading-tight"
          >
            A vida não tem{" "}
            <span className="text-[#A855F7] text-glow">pause</span>.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl sm:text-5xl md:text-6xl text-[#F5F5DC] leading-tight"
          >
            Mas dá pra escolher a{" "}
            <span className="text-[#A855F7] text-glow">skin</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="w-24 h-px bg-[#A855F7] mx-auto my-12"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="font-body text-lg sm:text-xl text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed"
          >
            A gente não segue tendência.
            <br />
            A gente mistura tudo e cria algo novo.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="font-body text-lg sm:text-xl text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed"
          >
            <span className="text-[#F5F5DC]">Oversized</span> é espaço.
            <br />
            É conforto.
            <br />
            É atitude.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="font-display text-2xl sm:text-4xl text-[#F5F5DC] mt-12"
          >
            Seja no <span className="text-[#A855F7]">lobby</span> ou na{" "}
            <span className="text-[#A855F7]">rua</span>,
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="font-display text-2xl sm:text-4xl text-[#A1A1AA]"
          >
            o importante é estar no jogo.
          </motion.p>
        </div>

        {/* Phrases marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="mt-24 overflow-hidden"
        >
          <div className="flex gap-8 animate-marquee">
            {[...phrases, ...phrases].map((phrase, index) => (
              <span
                key={index}
                className={`font-display text-4xl sm:text-6xl whitespace-nowrap ${
                  phrase.highlight ? "text-[#A855F7] text-glow" : "text-[#1A1A1A]"
                }`}
                style={{
                  WebkitTextStroke: phrase.highlight ? "none" : "1px #A855F7",
                }}
              >
                {phrase.text}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2 }}
          className="mt-20 text-center"
        >
          <p className="font-mono text-lg text-[#A855F7] tracking-widest mb-8">
            — ORBITAL ROXA —
          </p>
          <p className="font-display text-5xl sm:text-7xl text-[#F5F5DC] text-glow-intense">
            STAY IN THE GAME
          </p>
        </motion.div>
      </motion.div>

      {/* Add marquee animation to globals.css via style tag */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </section>
  );
}
