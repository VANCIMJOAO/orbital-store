"use client";

import { useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Check, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart on successful checkout
    clearCart();
  }, [clearCart]);

  return (
    <div className="pt-32 pb-20 min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mx-auto w-20 h-20 bg-[#22C55E] rounded-full flex items-center justify-center mb-8"
        >
          <Check size={40} className="text-[#0A0A0A]" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-4xl sm:text-5xl text-[#F5F5DC] mb-4"
        >
          PEDIDO <span className="text-[#22C55E]">CONFIRMADO</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-mono text-[#A1A1AA] mb-8"
        >
          Obrigado por comprar na ORBITAL ROXA. Você receberá um email de confirmação em breve.
        </motion.p>

        {/* Order info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#111111] border border-[#1A1A1A] p-6 mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="text-[#A855F7]" size={24} />
            <span className="font-mono text-sm text-[#A1A1AA]">
              STATUS DO PEDIDO
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#22C55E] rounded-full" />
              <span className="font-mono text-sm text-[#F5F5DC]">
                Pagamento confirmado
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#A855F7] rounded-full animate-pulse" />
              <span className="font-mono text-sm text-[#A1A1AA]">
                Preparando envio
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#1A1A1A] border border-[#A1A1AA] rounded-full" />
              <span className="font-mono text-sm text-[#A1A1AA]/50">
                Enviado
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#1A1A1A] border border-[#A1A1AA] rounded-full" />
              <span className="font-mono text-sm text-[#A1A1AA]/50">
                Entregue
              </span>
            </div>
          </div>

          {sessionId && (
            <p className="mt-4 font-mono text-xs text-[#A1A1AA]/50">
              ID: {sessionId.slice(0, 20)}...
            </p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/#shop"
            className="px-8 py-4 bg-[#A855F7] text-[#0A0A0A] font-mono text-sm tracking-wider flex items-center justify-center gap-2 hover:bg-[#9333EA] transition-colors"
          >
            CONTINUAR COMPRANDO
            <ArrowRight size={16} />
          </Link>
          <a
            href="https://discord.gg/orbitalroxa"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 border border-[#A855F7] text-[#A855F7] font-mono text-sm tracking-wider hover:bg-[#A855F7]/10 transition-colors"
          >
            ENTRAR NO DISCORD
          </a>
        </motion.div>

        {/* HUD decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex justify-center items-center gap-2 font-mono text-xs text-[#A1A1AA]/50"
        >
          <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
          <span>STAY IN THE GAME</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <Suspense
        fallback={
          <div className="pt-32 pb-20 min-h-[70vh] flex items-center justify-center">
            <motion.div
              className="w-12 h-12 border-2 border-[#A855F7] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
      <Footer />
    </main>
  );
}
