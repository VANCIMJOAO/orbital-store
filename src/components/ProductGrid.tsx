"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { useProducts } from "@/hooks/useProducts";

export default function ProductGrid() {
  const { products, loading, error } = useProducts();
  const [activeFilter, setActiveFilter] = useState("TODOS");

  // Filtrar produtos pela collection
  const filteredProducts = products.filter((product) => {
    if (activeFilter === "TODOS") return true;
    return product.collection === activeFilter;
  });

  // Extrair collections únicas para os filtros
  const collections = ["TODOS", ...new Set(products.map((p) => p.collection).filter(Boolean))];

  // Converter para o formato esperado pelo ProductCard
  const productCards = filteredProducts.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.images?.[0] || "",
    stock: product.totalStock,
    maxStock: product.maxStock,
    collection: product.collection || "ORBITAL ROXA",
    sizes: product.variants.map((v) => v.size),
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
    })),
  }));

  return (
    <section id="shop" className="relative py-20 sm:py-32 bg-[#0A0A0A]">
      {/* Section divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A855F7]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#A855F7]" />
              <span className="font-mono text-sm text-[#A855F7] tracking-widest">LOJA</span>
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-[#F5F5DC]">
              PECAS <span className="text-[#A855F7]">DISPONIVEIS</span>
            </h2>
          </div>

          {/* Filter tabs */}
          <div className="mt-6 sm:mt-0 flex gap-4">
            {collections.map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setActiveFilter(filter as string)}
                className={`font-mono text-sm tracking-wider transition-colors ${
                  activeFilter === filter
                    ? "text-[#A855F7] border-b border-[#A855F7]"
                    : "text-[#A1A1AA] hover:text-[#F5F5DC]"
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                {filter}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <motion.div
              className="w-12 h-12 border-2 border-[#A855F7] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20">
            <p className="font-mono text-[#EF4444]">Erro ao carregar produtos</p>
            <p className="font-mono text-sm text-[#A1A1AA] mt-2">{error}</p>
          </div>
        )}

        {/* Products grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productCards.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && productCards.length === 0 && (
          <div className="text-center py-20">
            <p className="font-mono text-[#A1A1AA]">Nenhum produto encontrado</p>
          </div>
        )}

        {/* Real-time indicator */}
        {!loading && !error && productCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 flex justify-center items-center gap-2"
          >
            <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
            <span className="font-mono text-xs text-[#A1A1AA]">
              ESTOQUE EM TEMPO REAL
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
