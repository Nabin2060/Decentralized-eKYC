"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react";
import { login as apiLogin, register as apiRegister } from "../api";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") setUser(JSON.parse(stored));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    const userObj = data.user || data;
    // id लाई _id मा map गर्नुहोस्
    if (userObj.id && !userObj._id) userObj._id = userObj.id;
    setUser(userObj);
    localStorage.setItem("user", JSON.stringify(userObj));
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    await apiRegister(username, email, password);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
