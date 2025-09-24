"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export const useAuth = () => {
  return useAuthStore();
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}