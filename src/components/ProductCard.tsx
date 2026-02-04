"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Eye, Check } from "lucide-react";
import PlaceholderImage from "./PlaceholderImage";
import { useCart } from "@/hooks/useCart";
import Link from "next/link";
import Image from "next/image";

interface ProductVariant {
  id: string;
  size: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  maxStock: number;
  collection: string;
  sizes: string[];
  variants?: ProductVariant[];
}

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem, openCart } = useCart();
  const stockPercentage = (product.stock / product.maxStock) * 100;

  // Determine stock bar color based on percentage
  const getStockColor = () => {
    if (stockPercentage > 50) return { bar: "#22C55E", glow: "rgba(34, 197, 94, 0.5)" };
    if (stockPercentage > 20) return { bar: "#EAB308", glow: "rgba(234, 179, 8, 0.5)" };
    return { bar: "#EF4444", glow: "rgba(239, 68, 68, 0.5)" };
  };

  const stockColor = getStockColor();

  const handleAddToCart = () => {
    if (!selectedSize) {
      setShowSizeSelector(true);
      return;
    }

    const variant = product.variants?.find((v) => v.size === selectedSize);

    addItem({
      id: `${product.id}-${selectedSize}`,
      productId: product.id,
      variantId: variant?.id || product.id,
      name: product.name,
      size: selectedSize,
      price: product.price,
      image: product.image,
      maxStock: variant?.stock || product.stock,
    });

    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      setSelectedSize(null);
      setShowSizeSelector(false);
    }, 1500);

    openCart();
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!showSizeSelector) setSelectedSize(null);
      }}
    >
      {/* HUD Frame */}
      <div className="absolute -inset-px bg-gradient-to-b from-[#A855F7]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative bg-[#111111] border border-[#1A1A1A] group-hover:border-[#A855F7]/50 transition-colors duration-300 overflow-hidden">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity z-10" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity z-10" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity z-10" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity z-10" />

        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-[#0A0A0A]">
          {/* Product image or placeholder */}
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <PlaceholderImage text={product.name} />
          )}

          {/* Overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Size selector overlay */}
          <AnimatePresence>
            {showSizeSelector && (
              <motion.div
                className="absolute inset-0 bg-[#0A0A0A]/95 flex flex-col items-center justify-center p-4 z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-mono text-sm text-[#A1A1AA] mb-4">SELECIONE O TAMANHO</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {product.sizes.map((size) => {
                    const variant = product.variants?.find((v) => v.size === size);
                    const isAvailable = variant ? variant.stock > 0 : true;

                    return (
                      <motion.button
                        key={size}
                        onClick={() => isAvailable && handleSizeSelect(size)}
                        disabled={!isAvailable}
                        className={`px-4 py-2 font-mono text-sm border transition-colors ${
                          selectedSize === size
                            ? "bg-[#A855F7] text-[#0A0A0A] border-[#A855F7]"
                            : isAvailable
                            ? "bg-[#111111] text-[#F5F5DC] border-[#A855F7]/30 hover:border-[#A855F7]"
                            : "bg-[#111111] text-[#A1A1AA]/30 border-[#1A1A1A] cursor-not-allowed line-through"
                        }`}
                        whileHover={isAvailable ? { scale: 1.05 } : {}}
                        whileTap={isAvailable ? { scale: 0.95 } : {}}
                      >
                        {size}
                      </motion.button>
                    );
                  })}
                </div>

                {selectedSize && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleAddToCart}
                    className="mt-4 px-6 py-3 bg-[#A855F7] text-[#0A0A0A] font-mono text-sm font-bold flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {addedToCart ? (
                      <>
                        <Check size={16} />
                        ADICIONADO!
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        ADICIONAR
                      </>
                    )}
                  </motion.button>
                )}

                <button
                  onClick={() => {
                    setShowSizeSelector(false);
                    setSelectedSize(null);
                  }}
                  className="mt-4 font-mono text-xs text-[#A1A1AA] hover:text-[#F5F5DC] transition-colors"
                >
                  CANCELAR
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick actions */}
          <motion.div
            className="absolute bottom-4 left-4 right-4 flex gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered && !showSizeSelector ? 1 : 0, y: isHovered && !showSizeSelector ? 0 : 20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={() => setShowSizeSelector(true)}
              className="flex-1 py-3 bg-[#A855F7] text-[#0A0A0A] font-mono text-sm font-bold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingBag size={16} />
              COMPRAR
            </motion.button>
            <Link href={`/produto/${product.id}`}>
              <motion.button
                className="p-3 bg-[#111111] border border-[#A855F7] text-[#A855F7]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye size={16} />
              </motion.button>
            </Link>
          </motion.div>

          {/* Collection tag */}
          <div className="absolute top-4 left-4 z-10">
            <span className="px-2 py-1 bg-[#0A0A0A]/80 backdrop-blur-sm font-mono text-xs text-[#A855F7] border border-[#A855F7]/30">
              {product.collection}
            </span>
          </div>
        </div>

        {/* Product info */}
        <div className="p-4">
          <h3 className="font-display text-xl text-[#F5F5DC] mb-1">{product.name}</h3>

          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-lg text-[#A855F7]">
              R$ {product.price.toFixed(2).replace(".", ",")}
            </span>
            <div className="flex gap-1">
              {product.sizes.map((size) => (
                <span
                  key={size}
                  className="px-2 py-0.5 bg-[#1A1A1A] font-mono text-xs text-[#A1A1AA]"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>

          {/* Stock HP Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#A1A1AA]">ESTOQUE</span>
              <span style={{ color: stockColor.bar }}>
                {product.stock}/{product.maxStock}
              </span>
            </div>

            <div className="relative h-3 bg-[#1A1A1A] overflow-hidden">
              {/* Background segments for HP bar effect */}
              <div className="absolute inset-0 flex gap-px">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-[#0A0A0A]/50" />
                ))}
              </div>

              {/* Actual stock bar */}
              <motion.div
                className="absolute inset-y-0 left-0"
                style={{
                  backgroundColor: stockColor.bar,
                  boxShadow: `0 0 10px ${stockColor.glow}`,
                }}
                initial={{ width: 0 }}
                whileInView={{ width: `${stockPercentage}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
              />

              {/* Glitch effect on low stock */}
              {stockPercentage <= 20 && (
                <motion.div
                  className="absolute inset-0 bg-[#EF4444]/20"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </div>

            {/* Stock status message */}
            <div className="font-mono text-xs">
              {stockPercentage <= 10 ? (
                <motion.span
                  className="text-[#EF4444]"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  ULTIMAS UNIDADES
                </motion.span>
              ) : stockPercentage <= 30 ? (
                <span className="text-[#EAB308]">ESTOQUE BAIXO</span>
              ) : (
                <span className="text-[#A1A1AA]">DISPONIVEL</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
