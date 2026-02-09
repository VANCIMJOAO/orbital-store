"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface OrderItem {
  id: string;
  product_name: string;
  product_size: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  created_at: string | null;
  status: string | null;
  total: number;
  tracking_code: string | null;
  order_items: OrderItem[];
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "PENDENTE", color: "text-[#f59e0b]" },
  paid: { label: "PAGO", color: "text-[#22c55e]" },
  processing: { label: "PREPARANDO", color: "text-[#3b82f6]" },
  shipped: { label: "ENVIADO", color: "text-[#A855F7]" },
  delivered: { label: "ENTREGUE", color: "text-[#22c55e]" },
  cancelled: { label: "CANCELADO", color: "text-[#ef4444]" },
};

export default function PedidosPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const email = user.email;
    const fetchOrders = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          total,
          tracking_code,
          order_items(id, product_name, product_size, quantity, unit_price)
        `)
        .eq("customer_email", email!)
        .order("created_at", { ascending: false });

      if (data) {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user, authLoading]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-16">
        <h1 className="font-display text-3xl text-[#F5F5DC] mb-2">MEUS PEDIDOS</h1>
        <p className="text-[#A1A1AA] text-sm mb-8">
          Acompanhe o status dos seus pedidos
        </p>

        {authLoading || loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#12121a] border border-[#27272A] rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-[#27272A] rounded w-1/3 mb-4" />
                <div className="h-4 bg-[#27272A] rounded w-1/2 mb-2" />
                <div className="h-4 bg-[#27272A] rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : !user ? (
          <div className="bg-[#12121a] border border-dashed border-[#A855F7]/30 rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#A855F7]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-[#F5F5DC] mb-2">Faca login para ver seus pedidos</h3>
            <p className="text-[#A1A1AA] text-sm">
              Entre com sua conta Discord para acessar o historico de compras.
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-[#12121a] border border-dashed border-[#A855F7]/30 rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#A855F7]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#A855F7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="font-display text-xl text-[#F5F5DC] mb-2">Nenhum pedido ainda</h3>
            <p className="text-[#A1A1AA] text-sm mb-6">
              Voce ainda nao fez nenhuma compra na loja.
            </p>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#A855F7] hover:bg-[#9333EA] text-white font-mono text-sm rounded-lg transition-colors"
            >
              VER PRODUTOS
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusMap[order.status || "pending"] || statusMap.pending;
              return (
                <div
                  key={order.id}
                  className="bg-[#12121a] border border-[#27272A] hover:border-[#A855F7]/30 rounded-xl p-6 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-mono text-[10px] text-[#52525B]">
                        PEDIDO #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-[#A1A1AA] mt-1">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-xs font-bold ${status.color}`}>
                        {status.label}
                      </span>
                      {order.tracking_code && (
                        <p className="font-mono text-[10px] text-[#A1A1AA] mt-1">
                          Rastreio: {order.tracking_code}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 border-b border-[#27272A] last:border-0"
                      >
                        <div>
                          <p className="text-sm text-[#F5F5DC]">{item.product_name}</p>
                          <p className="text-[10px] text-[#A1A1AA]">
                            Tam: {item.product_size} | Qtd: {item.quantity}
                          </p>
                        </div>
                        <span className="font-mono text-sm text-[#A1A1AA]">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#27272A]">
                    <span className="font-mono text-xs text-[#A1A1AA]">TOTAL</span>
                    <span className="font-mono text-lg text-[#F5F5DC] font-bold">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
