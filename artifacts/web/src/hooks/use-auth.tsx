import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getAuthToken, setAuthToken as setLocalToken, clearAuthToken as clearLocalToken } from "@/lib/auth";

type User = {
  id: number;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If we have a token but no user, we might want to fetch the user profile here.
    // For this simple app, we can just treat the presence of a token as authenticated
    // and rely on API responses to clear it if it's invalid.
    if (token) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setLocalToken(newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearLocalToken();
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
