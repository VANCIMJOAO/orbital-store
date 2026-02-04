"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Background grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#A855F7]/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#6B21A8]/30 rounded-full blur-[100px] animate-pulse delay-1000" />

      {/* HUD Corner elements */}
      <div className="absolute top-24 left-8 hidden lg:block">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="font-mono text-xs text-[#A1A1AA] space-y-1"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
          <div>FREQ: 777.7 MHz</div>
          <div>LAT: -23.5505</div>
          <div>LON: -46.6333</div>
        </motion.div>
      </div>

      <div className="absolute top-24 right-8 hidden lg:block">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
          className="font-mono text-xs text-[#A1A1AA] text-right space-y-1"
        >
          <div>DROP: 001</div>
          <div>STATUS: ACTIVE</div>
          <div className="text-[#A855F7]">UNITS: 100</div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span className="inline-block font-mono text-sm tracking-[0.3em] text-[#A855F7] px-4 py-2 border border-[#A855F7]/30 bg-[#A855F7]/5">
            UNDERGROUND FREQUENCY
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <span className="font-display text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] leading-none tracking-tight text-[#F5F5DC]">
            ORBITAL
          </span>
          <br />
          <span className="font-display text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] leading-none tracking-tight text-glow-intense text-[#A855F7]">
            ROXA
          </span>

          {/* Drip effect */}
          <motion.div
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <svg width="200" height="40" viewBox="0 0 200 40" className="overflow-visible">
              {[20, 60, 100, 140, 180].map((x, i) => (
                <motion.ellipse
                  key={i}
                  cx={x}
                  cy="5"
                  rx="8"
                  ry="15"
                  fill="#A855F7"
                  initial={{ cy: 5, opacity: 0.8 }}
                  animate={{
                    cy: [5, 25, 35],
                    opacity: [0.8, 0.5, 0],
                    ry: [15, 10, 5],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2 + 1.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                />
              ))}
            </svg>
          </motion.div>
        </motion.h1>

        {/* Manifesto */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 font-body text-lg sm:text-xl text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed"
        >
          Streetwear com alma gamer.
          <br />
          <span className="text-[#F5F5DC]">Criado entre a rua e o digital.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.a
            href="#drops"
            className="group relative px-8 py-4 bg-[#A855F7] text-[#0A0A0A] font-mono font-bold text-sm tracking-wider overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10">VER DROPS</span>
            <motion.div
              className="absolute inset-0 bg-[#C084FC]"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.a>

          <motion.a
            href="#manifesto"
            className="group px-8 py-4 border border-[#A855F7]/50 text-[#A855F7] font-mono text-sm tracking-wider hover:bg-[#A855F7]/10 transition-colors duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            NOSSO MANIFESTO
          </motion.a>
        </motion.div>

        {/* Slogan */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 font-mono text-sm text-[#A1A1AA] tracking-widest"
        >
          — STAY IN THE GAME —
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[#A1A1AA]"
        >
          <ChevronDown size={32} />
        </motion.div>
      </motion.div>

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none scanline opacity-20" />
    </section>
  );
}
