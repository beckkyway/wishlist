"use client";
import { useCallback, useEffect, useState } from "react";
import api, { User } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("jwt_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback((token: string) => {
    localStorage.setItem("jwt_token", token);
    fetchMe();
  }, [fetchMe]);

  const logout = useCallback(() => {
    localStorage.removeItem("jwt_token");
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
