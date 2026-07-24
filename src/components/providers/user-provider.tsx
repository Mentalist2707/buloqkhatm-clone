"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AppUser {
  id:         string;
  name?:      string | null;
  firstName?: string | null;
  lastName?:  string | null;
  email?:     string | null;
  image?:     string | null;
  photoUrl?:  string | null;
  coins:      number;
  level:      string;
  streakDays: number;
}

interface UserContextValue {
  user:    AppUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user:    null,
  loading: true,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        const u = data?.user ?? data;
        if (u?.id) {
          setUser({
            id:         u.id,
            name:       u.name,
            firstName:  u.firstName,
            lastName:   u.lastName,
            email:      u.email,
            image:      u.image ?? u.photoUrl ?? null,
            photoUrl:   u.photoUrl,
            coins:      u.coins ?? 0,
            level:      u.level ?? "Beginner",
            streakDays: u.streakDays ?? 0,
          });
        }
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <UserContext.Provider value={{ user, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
