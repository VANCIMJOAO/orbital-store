"use client";

import { motion } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CheckoutCancelledPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      <div className="pt-32 pb-20 min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          {/* Cancel icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mx-auto w-20 h-20 bg-[#EF4444]/20 border-2 border-[#EF4444] rounded-full flex items-center justify-center mb-8"
          >
            <X size={40} className="text-[#EF4444]" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-4xl sm:text-5xl text-[#F5F5DC] mb-4"
          >
            PEDIDO <span className="text-[#EF4444]">CANCELADO</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-mono text-[#A1A1AA] mb-8"
          >
            Seu pedido foi cancelado. Nenhuma cobrança foi realizada. Seus itens ainda estão no carrinho.
          </motion.p>

          {/* Info box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#111111] border border-[#1A1A1A] p-6 mb-8"
          >
            <p className="font-mono text-sm text-[#A1A1AA] mb-2">
              Problemas com o pagamento?
            </p>
            <p className="font-mono text-xs text-[#A1A1AA]/70">
              Tente novamente ou entre em contato pelo nosso Discord para suporte.
            </p>
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
              <ArrowLeft size={16} />
              VOLTAR A LOJA
            </Link>
            <a
              href="https://discord.gg/orbitalroxa"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-[#A855F7] text-[#A855F7] font-mono text-sm tracking-wider hover:bg-[#A855F7]/10 transition-colors"
            >
              SUPORTE
            </a>
          </motion.div>

          {/* HUD decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 font-mono text-xs text-[#A1A1AA]/50"
          >
            <span className="text-[#EF4444]">STATUS:</span> CHECKOUT_CANCELLED
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
