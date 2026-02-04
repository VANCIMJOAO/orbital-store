"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNextDrop } from "@/hooks/useDrops";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownDrop() {
  const { drop, loading } = useNextDrop();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!drop) return;

    const dropDate = new Date(drop.release_date);

    const calculateTimeLeft = () => {
      const difference = dropDate.getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsLive(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [drop]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* HUD frame */}
        <div className="absolute -inset-1 border border-[#A855F7]/30" />
        <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-[#A855F7]" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-[#A855F7]" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-[#A855F7]" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-[#A855F7]" />

        <motion.div
          className="w-20 h-24 sm:w-28 sm:h-32 bg-[#111111] flex items-center justify-center"
          key={value}
          initial={{ scale: 1.1, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <span className="font-display text-5xl sm:text-7xl text-[#F5F5DC]">
            {value.toString().padStart(2, "0")}
          </span>
        </motion.div>
      </div>
      <span className="mt-2 font-mono text-xs text-[#A1A1AA] tracking-wider">{label}</span>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <section id="drops" className="relative py-20 sm:py-32 bg-[#0A0A0A]">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="flex justify-center items-center">
          <motion.div
            className="w-12 h-12 border-2 border-[#A855F7] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </section>
    );
  }

  // No upcoming drop
  if (!drop) {
    return (
      <section id="drops" className="relative py-20 sm:py-32 bg-[#0A0A0A]">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#A855F7]" />
            <span className="font-mono text-sm text-[#A855F7] tracking-widest">DROPS</span>
            <div className="w-8 h-px bg-[#A855F7]" />
          </div>
          <h2 className="font-display text-4xl sm:text-6xl text-[#F5F5DC] mb-4">
            EM BREVE
          </h2>
          <p className="font-mono text-[#A1A1AA]">
            Novos drops sendo preparados. Fique ligado no Discord.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="drops" className="relative py-20 sm:py-32 bg-[#0A0A0A]">
      {/* Background elements */}
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A855F7]/50 to-transparent" />

      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#A855F7]" />
            <span className="font-mono text-sm text-[#A855F7] tracking-widest">PROXIMO DROP</span>
            <div className="w-8 h-px bg-[#A855F7]" />
          </div>

          <h2 className="font-display text-4xl sm:text-6xl text-[#F5F5DC] mb-2">{drop.name}</h2>

          {isLive ? (
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E]/20 border border-[#22C55E]/50"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
              <span className="font-mono text-sm text-[#22C55E] tracking-wider">DROP LIVE</span>
            </motion.div>
          ) : (
            <p className="font-mono text-sm text-[#A1A1AA]">Lancamento em:</p>
          )}
        </motion.div>

        {/* Countdown */}
        {!isLive && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center gap-3 sm:gap-6"
          >
            <TimeBlock value={timeLeft.days} label="DIAS" />
            <div className="flex items-center text-[#A855F7] font-display text-4xl sm:text-6xl">:</div>
            <TimeBlock value={timeLeft.hours} label="HORAS" />
            <div className="flex items-center text-[#A855F7] font-display text-4xl sm:text-6xl">:</div>
            <TimeBlock value={timeLeft.minutes} label="MIN" />
            <div className="flex items-center text-[#A855F7] font-display text-4xl sm:text-6xl">:</div>
            <TimeBlock value={timeLeft.seconds} label="SEG" />
          </motion.div>
        )}

        {/* HUD Status bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-between font-mono text-xs text-[#A1A1AA] mb-2">
            <span>ESTOQUE INICIAL</span>
            <span className="text-[#A855F7]">100 UNITS</span>
          </div>
          <div className="h-2 bg-[#1A1A1A] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6B21A8] to-[#A855F7]"
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <div className="flex justify-between font-mono text-xs text-[#A1A1AA] mt-1">
            <span>LIMITED EDITION</span>
            <span>NUNCA REPOE</span>
          </div>
        </motion.div>

        {/* Description */}
        {drop.description && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center font-body text-[#A1A1AA] max-w-xl mx-auto"
          >
            {drop.description}
          </motion.p>
        )}

        {/* Notification signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <motion.button
            className="group relative px-8 py-4 border border-[#A855F7] text-[#A855F7] font-mono text-sm tracking-wider overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 group-hover:text-[#0A0A0A] transition-colors duration-300">
              ATIVAR NOTIFICACAO
            </span>
            <motion.div
              className="absolute inset-0 bg-[#A855F7]"
              initial={{ y: "100%" }}
              whileHover={{ y: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
