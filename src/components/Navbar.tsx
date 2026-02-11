"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import AuthButton from "./AuthButton";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { items, isOpen: isCartOpen, toggleCart, closeCart, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      setIsCheckingOut(true);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          customerEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Checkout failed silently
    } finally {
      setIsCheckingOut(false);
    }
  };

  const navItems = [
    { name: "DROPS", href: "#drops" },
    { name: "LOJA", href: "#shop" },
    { name: "MANIFESTO", href: "#manifesto" },
    { name: "DISCORD", href: "#discord" },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price / 100);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="font-display text-3xl sm:text-4xl text-[#A855F7] tracking-tight">
                  OR
                </span>
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-[#A855F7] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="relative font-mono text-sm text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors duration-200 group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-[#A855F7] mr-1">0{index + 1}</span>
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-full h-px bg-[#A855F7] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                </motion.a>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Cart button */}
              <motion.button
                onClick={toggleCart}
                className="relative p-2 text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ShoppingBag size={22} />
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#A855F7] rounded-full text-xs font-bold flex items-center justify-center text-[#0A0A0A]"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.button>

              {/* Auth button */}
              <div className="hidden sm:block">
                <AuthButton />
              </div>

              {/* Mobile menu button */}
              <motion.button
                className="md:hidden p-2 text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileTap={{ scale: 0.9 }}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden absolute top-full left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#1A1A1A]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-6 space-y-4">
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="block font-mono text-lg text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-[#A855F7] mr-2">0{index + 1}</span>
                    {item.name}
                  </motion.a>
                ))}
                {/* Mobile auth button */}
                <div className="pt-4 border-t border-[#1A1A1A]">
                  <AuthButton />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0A0A0A] border-l border-[#A855F7]/30 z-50 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#1A1A1A]">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="text-[#A855F7]" size={20} />
                  <span className="font-display text-xl text-[#F5F5DC]">CARRINHO</span>
                  <span className="font-mono text-xs text-[#A1A1AA]">({totalItems})</span>
                </div>
                <motion.button
                  onClick={closeCart}
                  className="p-2 text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingBag className="text-[#A1A1AA]/30 mb-4" size={48} />
                    <p className="font-mono text-[#A1A1AA] mb-2">Carrinho vazio</p>
                    <p className="font-mono text-xs text-[#A1A1AA]/50">
                      Adicione itens para continuar
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex gap-3 p-3 bg-[#111111] border border-[#1A1A1A]"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 bg-[#1A1A1A] flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-display text-2xl text-[#A855F7]/30">
                              OR
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-mono text-sm text-[#F5F5DC] truncate">
                            {item.name}
                          </h4>
                          <p className="font-mono text-xs text-[#A1A1AA] mt-1">
                            Tamanho: {item.size}
                          </p>
                          <p className="font-mono text-sm text-[#A855F7] mt-1">
                            {formatPrice(item.price)}
                          </p>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <motion.button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 border border-[#A855F7]/30 text-[#A1A1AA] hover:text-[#A855F7] hover:border-[#A855F7] transition-colors"
                              whileTap={{ scale: 0.9 }}
                            >
                              <Minus size={14} />
                            </motion.button>
                            <span className="font-mono text-sm text-[#F5F5DC] w-8 text-center">
                              {item.quantity}
                            </span>
                            <motion.button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                              className="p-1 border border-[#A855F7]/30 text-[#A1A1AA] hover:text-[#A855F7] hover:border-[#A855F7] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              whileTap={{ scale: 0.9 }}
                            >
                              <Plus size={14} />
                            </motion.button>
                            <motion.button
                              onClick={() => removeItem(item.id)}
                              className="ml-auto p-1 text-[#A1A1AA] hover:text-[#EF4444] transition-colors"
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-4 border-t border-[#1A1A1A] space-y-4">
                  {/* Clear cart */}
                  <button
                    onClick={clearCart}
                    className="w-full font-mono text-xs text-[#A1A1AA] hover:text-[#EF4444] transition-colors"
                  >
                    LIMPAR CARRINHO
                  </button>

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-[#A1A1AA]">TOTAL</span>
                    <span className="font-display text-2xl text-[#F5F5DC]">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  {/* Checkout button */}
                  <motion.button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-4 bg-[#A855F7] text-[#0A0A0A] font-mono text-sm tracking-wider hover:bg-[#9333EA] transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                    whileHover={!isCheckingOut ? { scale: 1.02 } : {}}
                    whileTap={!isCheckingOut ? { scale: 0.98 } : {}}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        PROCESSANDO...
                      </>
                    ) : (
                      "FINALIZAR COMPRA"
                    )}
                  </motion.button>

                  {/* HUD info */}
                  <div className="flex items-center justify-center gap-2 font-mono text-xs text-[#A1A1AA]/50">
                    <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
                    <span>CHECKOUT SEGURO</span>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
