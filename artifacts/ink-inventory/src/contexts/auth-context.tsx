import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser } from "@workspace/api-client-react";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      // main.tsx fetch wrapper handles credentials: "include"
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = () => fetchUser();
  
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
