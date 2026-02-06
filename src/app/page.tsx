"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#A855F7]/20 rounded-full blur-[150px]"
        animate={{
          x: [0, 100, 0, -100, 0],
          y: [0, -50, 100, -50, 0],
          scale: [1, 1.2, 1, 0.8, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#6B21A8]/30 rounded-full blur-[120px]"
        animate={{
          x: [0, -80, 0, 80, 0],
          y: [0, 80, -50, 80, 0],
          scale: [1, 0.9, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-[#7C3AED]/20 rounded-full blur-[100px]"
        animate={{
          x: [0, 50, -50, 0],
          y: [0, -100, 50, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating particles - posições fixas para evitar hydration mismatch */}
      {[
        { left: 5, top: 10, duration: 3.2, delay: 0.1 },
        { left: 15, top: 80, duration: 4.1, delay: 1.2 },
        { left: 25, top: 30, duration: 3.8, delay: 0.5 },
        { left: 35, top: 60, duration: 4.5, delay: 1.8 },
        { left: 45, top: 20, duration: 3.5, delay: 0.3 },
        { left: 55, top: 90, duration: 4.2, delay: 1.5 },
        { left: 65, top: 45, duration: 3.9, delay: 0.8 },
        { left: 75, top: 70, duration: 4.0, delay: 1.1 },
        { left: 85, top: 15, duration: 3.3, delay: 0.6 },
        { left: 95, top: 55, duration: 4.3, delay: 1.9 },
        { left: 10, top: 40, duration: 3.6, delay: 0.2 },
        { left: 20, top: 85, duration: 4.4, delay: 1.4 },
        { left: 30, top: 25, duration: 3.7, delay: 0.9 },
        { left: 40, top: 75, duration: 4.1, delay: 1.6 },
        { left: 50, top: 5, duration: 3.4, delay: 0.4 },
        { left: 60, top: 65, duration: 4.0, delay: 1.3 },
        { left: 70, top: 35, duration: 3.8, delay: 0.7 },
        { left: 80, top: 95, duration: 4.2, delay: 1.7 },
        { left: 90, top: 50, duration: 3.5, delay: 1.0 },
        { left: 2, top: 72, duration: 4.4, delay: 0.0 },
      ].map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#A855F7] rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <h1 className="font-display text-4xl md:text-6xl text-[#A855F7] tracking-wider text-glow-intense">
          ORBITAL ROXA
        </h1>
        <p className="mt-2 font-mono text-xs text-[#A1A1AA] tracking-[0.3em]">
          STAY IN THE GAME
        </p>
      </motion.div>

      {/* Cards Container */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-0">
        {/* STORE Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/home" className="group block relative">
            {/* Card with clipped corners */}
            <div className="relative w-[300px] h-[400px] md:w-[350px] md:h-[450px]">
              {/* SVG clip path for chamfered corners */}
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <clipPath id="clip-store">
                    <polygon points="20,0 100%,0 100%,calc(100%-20) calc(100%-20),100% 0,100% 0,20" />
                  </clipPath>
                </defs>
              </svg>

              {/* Main container with clip */}
              <div
                className="relative w-full h-full overflow-hidden"
                style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
              >
                <Image
                  src="/landing/store.jpg"
                  alt="Store"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                  <h2 className="font-display text-4xl md:text-5xl text-[#F5F5DC] tracking-tight group-hover:text-[#A855F7] transition-colors duration-300">
                    STORE
                  </h2>
                  <p className="mt-2 font-mono text-xs text-[#A1A1AA] tracking-widest">
                    STREETWEAR GAMER
                  </p>
                  <motion.span
                    className="mt-4 font-mono text-xs text-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    [ ENTRAR ]
                  </motion.span>
                </div>
              </div>

              {/* Border with same clip */}
              <div
                className="absolute inset-0 border border-[#27272A] group-hover:border-[#A855F7]/50 transition-colors duration-300 pointer-events-none"
                style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
              />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-[2px] bg-[#A855F7] group-hover:bg-[#C084FC] transition-colors" style={{ transform: "rotate(-45deg) translate(-4px, 8px)" }} />
              <div className="absolute bottom-0 right-0 w-6 h-[2px] bg-[#A855F7] group-hover:bg-[#C084FC] transition-colors" style={{ transform: "rotate(-45deg) translate(4px, -8px)" }} />
            </div>
          </Link>
        </motion.div>

        {/* Separator */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-row md:flex-col items-center py-6 md:py-0 md:px-8"
        >
          {/* Line */}
          <div className="w-16 h-[2px] md:w-[2px] md:h-24 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-[#A855F7] to-transparent" />

          {/* Divider text */}
          <div className="px-4 md:py-4 font-display text-xl text-[#A855F7]">
            |
          </div>

          {/* Line */}
          <div className="w-16 h-[2px] md:w-[2px] md:h-24 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-[#A855F7] to-transparent" />
        </motion.div>

        {/* CAMPEONATOS Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/campeonatos" className="group block relative">
            {/* Card with clipped corners */}
            <div className="relative w-[300px] h-[400px] md:w-[350px] md:h-[450px]">
              {/* Main container with clip */}
              <div
                className="relative w-full h-full overflow-hidden"
                style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
              >
                <Image
                  src="/landing/campeonatos.png"
                  alt="Campeonatos"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                  <h2 className="font-display text-4xl md:text-5xl text-[#F5F5DC] tracking-tight group-hover:text-[#A855F7] transition-colors duration-300">
                    CAMPEONATOS
                  </h2>
                  <p className="mt-2 font-mono text-xs text-[#A1A1AA] tracking-widest">
                    TORNEIOS & LIGAS
                  </p>
                  <motion.span
                    className="mt-4 font-mono text-xs text-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    [ ENTRAR ]
                  </motion.span>
                </div>
              </div>

              {/* Border with same clip */}
              <div
                className="absolute inset-0 border border-[#27272A] group-hover:border-[#A855F7]/50 transition-colors duration-300 pointer-events-none"
                style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}
              />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-[2px] bg-[#A855F7] group-hover:bg-[#C084FC] transition-colors" style={{ transform: "rotate(-45deg) translate(-4px, 8px)" }} />
              <div className="absolute bottom-0 right-0 w-6 h-[2px] bg-[#A855F7] group-hover:bg-[#C084FC] transition-colors" style={{ transform: "rotate(-45deg) translate(4px, -8px)" }} />
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Bottom text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-12"
      >
        <p className="font-mono text-xs text-[#A1A1AA]/50 tracking-[0.2em]">
          © 2026 ORBITAL ROXA
        </p>
      </motion.div>

      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none scanline opacity-10" />
    </div>
  );
}
