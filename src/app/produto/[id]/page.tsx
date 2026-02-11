"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronLeft, Check, Minus, Plus } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: PageProps) {
  const { id } = use(params);
  const { product, loading, error } = useProduct(id);
  const { addItem, openCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleAddToCart = () => {
    if (!selectedSize || !product) return;

    const variant = product.variants?.find((v) => v.size === selectedSize);

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: `${product.id}-${selectedSize}`,
        productId: product.id,
        variantId: variant?.id || product.id,
        name: product.name,
        size: selectedSize,
        price: product.price,
        image: product.images?.[0] || "",
        maxStock: variant?.stock || product.totalStock,
      });
    }

    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);

    openCart();
  };

  const selectedVariant = product?.variants?.find((v) => v.size === selectedSize);
  const maxQuantity = selectedVariant?.stock || 1;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price / 100);
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0A0A]">
        <Navbar />
        <div className="pt-32 flex items-center justify-center min-h-[60vh]">
          <motion.div
            className="w-16 h-16 border-2 border-[#A855F7] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <Footer />
      </main>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#0A0A0A]">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center min-h-[60vh] px-4">
          <h1 className="font-display text-4xl text-[#F5F5DC] mb-4">
            PRODUTO NAO ENCONTRADO
          </h1>
          <p className="font-mono text-[#A1A1AA] mb-8">
            {error || "Este produto não existe ou foi removido."}
          </p>
          <Link
            href="/#shop"
            className="px-8 py-4 bg-[#A855F7] text-[#0A0A0A] font-mono text-sm tracking-wider"
          >
            VOLTAR A LOJA
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const stockPercentage = (product.totalStock / product.maxStock) * 100;
  const getStockColor = () => {
    if (stockPercentage > 50) return "#22C55E";
    if (stockPercentage > 20) return "#EAB308";
    return "#EF4444";
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href="/#shop"
              className="inline-flex items-center gap-2 font-mono text-sm text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
            >
              <ChevronLeft size={16} />
              VOLTAR A LOJA
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Main image */}
              <div className="relative aspect-square bg-[#111111] border border-[#1A1A1A] overflow-hidden">
                {/* HUD corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[#A855F7] z-10" />
                <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#A855F7] z-10" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#A855F7] z-10" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#A855F7] z-10" />

                {/* Collection tag */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 bg-[#0A0A0A]/80 backdrop-blur-sm font-mono text-xs text-[#A855F7] border border-[#A855F7]/30">
                    {product.collection || "ORBITAL ROXA"}
                  </span>
                </div>

                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-8xl text-[#A855F7]/20">OR</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 bg-[#111111] border transition-colors ${
                        currentImageIndex === index
                          ? "border-[#A855F7]"
                          : "border-[#1A1A1A] hover:border-[#A855F7]/50"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Title */}
              <div>
                <h1 className="font-display text-4xl sm:text-5xl text-[#F5F5DC] mb-2">
                  {product.name}
                </h1>
                <p className="font-display text-3xl text-[#A855F7]">
                  {formatPrice(product.price)}
                </p>
              </div>

              {/* Stock indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-sm">
                  <span className="text-[#A1A1AA]">ESTOQUE DISPONIVEL</span>
                  <span style={{ color: getStockColor() }}>
                    {product.totalStock}/{product.maxStock} UNIDADES
                  </span>
                </div>
                <div className="h-2 bg-[#1A1A1A] overflow-hidden">
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: getStockColor() }}
                    initial={{ width: 0 }}
                    animate={{ width: `${stockPercentage}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <p className="font-mono text-xs text-[#A1A1AA]">
                  EDICAO LIMITADA • NUNCA REPOE
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <p className="font-body text-[#A1A1AA] leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Size selector */}
              <div className="space-y-3">
                <p className="font-mono text-sm text-[#F5F5DC]">TAMANHO</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants?.map((variant) => {
                    const isAvailable = variant.stock > 0;
                    return (
                      <motion.button
                        key={variant.id}
                        onClick={() => isAvailable && setSelectedSize(variant.size)}
                        disabled={!isAvailable}
                        className={`relative px-6 py-3 font-mono text-sm border transition-all ${
                          selectedSize === variant.size
                            ? "bg-[#A855F7] text-[#0A0A0A] border-[#A855F7]"
                            : isAvailable
                            ? "bg-[#111111] text-[#F5F5DC] border-[#A855F7]/30 hover:border-[#A855F7]"
                            : "bg-[#111111] text-[#A1A1AA]/30 border-[#1A1A1A] cursor-not-allowed"
                        }`}
                        whileHover={isAvailable ? { scale: 1.05 } : {}}
                        whileTap={isAvailable ? { scale: 0.95 } : {}}
                      >
                        {variant.size}
                        {!isAvailable && (
                          <span className="absolute inset-0 flex items-center justify-center bg-[#111111]/80">
                            <span className="w-full h-px bg-[#EF4444] rotate-45 absolute" />
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                {selectedSize && selectedVariant && (
                  <p className="font-mono text-xs text-[#A1A1AA]">
                    {selectedVariant.stock} unidades disponíveis neste tamanho
                  </p>
                )}
              </div>

              {/* Quantity selector */}
              {selectedSize && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <p className="font-mono text-sm text-[#F5F5DC]">QUANTIDADE</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-[#A855F7]/30">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-mono text-[#F5F5DC]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        className="p-3 text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="font-mono text-sm text-[#A1A1AA]">
                      Máx: {maxQuantity}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Add to cart button */}
              <motion.button
                onClick={handleAddToCart}
                disabled={!selectedSize || addedToCart}
                className={`w-full py-4 font-mono text-sm tracking-wider flex items-center justify-center gap-3 transition-all ${
                  !selectedSize
                    ? "bg-[#1A1A1A] text-[#A1A1AA] cursor-not-allowed"
                    : addedToCart
                    ? "bg-[#22C55E] text-[#0A0A0A]"
                    : "bg-[#A855F7] text-[#0A0A0A] hover:bg-[#9333EA]"
                }`}
                whileHover={selectedSize && !addedToCart ? { scale: 1.02 } : {}}
                whileTap={selectedSize && !addedToCart ? { scale: 0.98 } : {}}
              >
                {addedToCart ? (
                  <>
                    <Check size={18} />
                    ADICIONADO AO CARRINHO!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    {selectedSize ? "ADICIONAR AO CARRINHO" : "SELECIONE UM TAMANHO"}
                  </>
                )}
              </motion.button>

              {/* Total price */}
              {selectedSize && quantity > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between font-mono text-sm border-t border-[#1A1A1A] pt-4"
                >
                  <span className="text-[#A1A1AA]">TOTAL ({quantity} itens)</span>
                  <span className="text-xl text-[#F5F5DC]">
                    {formatPrice(product.price * quantity)}
                  </span>
                </motion.div>
              )}

              {/* Additional info */}
              <div className="border-t border-[#1A1A1A] pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
                  <span className="font-mono text-xs text-[#A1A1AA]">
                    ESTOQUE EM TEMPO REAL
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-3 bg-[#111111] border border-[#1A1A1A]">
                    <p className="text-[#A1A1AA] mb-1">MATERIAL</p>
                    <p className="text-[#F5F5DC]">100% Algodão</p>
                  </div>
                  <div className="p-3 bg-[#111111] border border-[#1A1A1A]">
                    <p className="text-[#A1A1AA] mb-1">FIT</p>
                    <p className="text-[#F5F5DC]">Oversized</p>
                  </div>
                  <div className="p-3 bg-[#111111] border border-[#1A1A1A]">
                    <p className="text-[#A1A1AA] mb-1">ESTAMPA</p>
                    <p className="text-[#F5F5DC]">Silk Premium</p>
                  </div>
                  <div className="p-3 bg-[#111111] border border-[#1A1A1A]">
                    <p className="text-[#A1A1AA] mb-1">ENVIO</p>
                    <p className="text-[#F5F5DC]">3-7 dias</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
