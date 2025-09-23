"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, getToken, getUser, isAuthenticated } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = getToken();
      const storedUser = getUser();

      setToken(storedToken);
      setUser(storedUser);
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const contextValue = {
    user,
    token,
    isAuthenticated: isAuthenticated(),
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}