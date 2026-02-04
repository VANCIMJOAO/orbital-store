import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Types para facilitar o uso
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type Drop = Database["public"]["Tables"]["drops"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];

// Produto com variantes agregadas
export interface ProductWithStock extends Product {
  variants: ProductVariant[];
  totalStock: number;
  maxStock: number;
}
