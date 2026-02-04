"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Product, ProductVariant, ProductWithStock } from "@/lib/supabase";

export function useProducts() {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();

    // Subscrever para updates em tempo real do estoque
    const channel = supabase
      .channel("product_variants_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "product_variants",
        },
        (payload) => {
          // Atualizar estoque em tempo real
          const updatedVariant = payload.new as ProductVariant;
          setProducts((prev) =>
            prev.map((product) => {
              const variantIndex = product.variants.findIndex(
                (v) => v.id === updatedVariant.id
              );
              if (variantIndex === -1) return product;

              const newVariants = [...product.variants];
              newVariants[variantIndex] = updatedVariant;

              const totalStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
              const maxStock = newVariants.reduce((sum, v) => sum + v.max_stock, 0);

              return { ...product, variants: newVariants, totalStock, maxStock };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);

      // Buscar produtos com variantes
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Buscar todas as variantes
      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("*");

      if (variantsError) throw variantsError;

      // Combinar produtos com suas variantes
      const productsWithStock: ProductWithStock[] = (productsData || []).map(
        (product) => {
          const variants = (variantsData || []).filter(
            (v) => v.product_id === product.id
          );
          const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
          const maxStock = variants.reduce((sum, v) => sum + v.max_stock, 0);

          return { ...product, variants, totalStock, maxStock };
        }
      );

      setProducts(productsWithStock);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  return { products, loading, error, refetch: fetchProducts };
}

export function useProduct(idOrSlug: string) {
  const [product, setProduct] = useState<ProductWithStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;

    fetchProduct();

    // Subscrever para updates em tempo real
    const channel = supabase
      .channel(`product_${idOrSlug}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "product_variants",
        },
        (payload) => {
          const updatedVariant = payload.new as ProductVariant;
          setProduct((prev) => {
            if (!prev) return prev;
            const variantIndex = prev.variants.findIndex(
              (v) => v.id === updatedVariant.id
            );
            if (variantIndex === -1) return prev;

            const newVariants = [...prev.variants];
            newVariants[variantIndex] = updatedVariant;

            const totalStock = newVariants.reduce((sum, v) => sum + v.stock, 0);
            const maxStock = newVariants.reduce((sum, v) => sum + v.max_stock, 0);

            return { ...prev, variants: newVariants, totalStock, maxStock };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idOrSlug]);

  async function fetchProduct() {
    try {
      setLoading(true);

      // Tenta buscar por ID primeiro (UUID), depois por slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq(isUUID ? "id" : "slug", idOrSlug)
        .single();

      if (productError) throw productError;

      const { data: variantsData, error: variantsError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productData.id);

      if (variantsError) throw variantsError;

      const variants = variantsData || [];
      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
      const maxStock = variants.reduce((sum, v) => sum + v.max_stock, 0);

      setProduct({ ...productData, variants, totalStock, maxStock });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produto");
    } finally {
      setLoading(false);
    }
  }

  return { product, loading, error, refetch: fetchProduct };
}
