"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function AuthButton() {
  const { user, loading, signInWithDiscord, signOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithDiscord();
    } catch {
      // Silenced
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      setIsMenuOpen(false);
    } catch {
      // Silenced
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-10 h-10 flex items-center justify-center">
        <motion.div
          className="w-5 h-5 border-2 border-[#A855F7] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <motion.button
        onClick={handleSignIn}
        disabled={isLoading}
        className="group relative flex items-center gap-2 px-4 py-2 border border-[#5865F2] text-[#5865F2] font-mono text-sm tracking-wider overflow-hidden disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Discord icon */}
        <svg
          className="w-5 h-5 relative z-10 group-hover:text-white transition-colors"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
        <span className="relative z-10 group-hover:text-white transition-colors">
          {isLoading ? "..." : "ENTRAR"}
        </span>
        <motion.div
          className="absolute inset-0 bg-[#5865F2]"
          initial={{ y: "100%" }}
          whileHover={{ y: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    );
  }

  // Logged in - show avatar with dropdown
  const avatarUrl = user.user_metadata?.avatar_url;
  const username = user.user_metadata?.full_name || user.email?.split("@")[0];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 p-1 border border-[#A855F7]/30 hover:border-[#A855F7] transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="w-8 h-8 rounded-sm"
          />
        ) : (
          <div className="w-8 h-8 bg-[#A855F7] flex items-center justify-center font-mono text-sm text-[#0A0A0A]">
            {username?.charAt(0).toUpperCase()}
          </div>
        )}
        <svg
          className={`w-4 h-4 text-[#A1A1AA] transition-transform ${
            isMenuOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-[#111111] border border-[#A855F7]/30 overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-[#A855F7]/20">
              <p className="font-mono text-sm text-[#F5F5DC] truncate">
                {username}
              </p>
              <p className="font-mono text-xs text-[#A1A1AA] truncate">
                {user.email}
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push("/pedidos");
                }}
                className="w-full px-4 py-2 text-left font-mono text-sm text-[#A1A1AA] hover:bg-[#A855F7]/10 hover:text-[#F5F5DC] transition-colors"
              >
                MEUS PEDIDOS
              </button>
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left font-mono text-sm text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors disabled:opacity-50"
              >
                {isLoading ? "SAINDO..." : "SAIR"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
