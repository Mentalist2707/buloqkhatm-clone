import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, MeUser } from "./api";

interface UserContextValue {
  user: MeUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<{ user: MeUser }>("/api/users/me");
      const u = (data as any)?.user ?? data;
      if (u?.id) setUser(u as MeUser);
    } catch (e: any) {
      setError(e?.message ?? "Ulanib bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <UserContext.Provider value={{ user, loading, error, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
