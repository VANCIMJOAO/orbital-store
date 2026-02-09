"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/campeonatos/login");
      return;
    }

    if (!profile?.is_admin) {
      router.push("/campeonatos");
      return;
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
          <p className="text-[#A1A1AA] text-sm font-mono">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
          <p className="text-[#A1A1AA] text-sm font-mono">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
