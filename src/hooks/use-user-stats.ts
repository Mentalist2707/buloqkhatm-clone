"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface UserStats {
  coins: number;
  streakDays: number;
}

// ─── Modul darajasidagi kesh ──────────────────────────────────────────────────
// Barcha komponentlar va sahifa o'tishlari (navigation) o'rtasida ulashiladi.
// Shu sababli har sahifaga o'tganda /api/users/me qayta chaqirilmaydi.
let statsCache: UserStats | null = null;
let cachedAt = 0;
let inflight: Promise<UserStats | null> | null = null;

const TTL = 60_000; // 1 daqiqa — shu oraliqda qayta so'rov yuborilmaydi

async function fetchStats(): Promise<UserStats | null> {
  // Allaqachon ketayotgan so'rov bo'lsa — uni qayta ishlatamiz (deduplikatsiya)
  if (inflight) return inflight;

  inflight = fetch("/api/users/me")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const u = data?.user ?? data;
      if (!u || u.coins === undefined) return statsCache;
      statsCache = { coins: u.coins ?? 0, streakDays: u.streakDays ?? 0 };
      cachedAt = Date.now();
      return statsCache;
    })
    .catch(() => statsCache)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * Foydalanuvchi coins/streak ma'lumotini keshlangan holda qaytaradi.
 * Sahifa o'tishlarda qayta fetch qilmaydi (TTL ichida kesh ishlatiladi).
 */
export function useUserStats(): UserStats {
  const { data: session } = useSession();
  const [stats, setStats] = useState<UserStats>(
    () =>
      statsCache ?? {
        coins: session?.user?.coins ?? 0,
        streakDays: (session?.user as { streakDays?: number } | undefined)?.streakDays ?? 0,
      }
  );

  useEffect(() => {
    if (!session?.user?.id) return;

    // Kesh hali yangi bo'lsa — tarmoqqa chiqmaymiz
    if (statsCache && Date.now() - cachedAt < TTL) {
      setStats(statsCache);
      return;
    }

    let active = true;
    fetchStats().then((s) => {
      if (active && s) setStats(s);
    });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  return stats;
}

/** Coin/streak o'zgargach keshni majburan yangilash uchun (masalan pora yakunlangach). */
export function invalidateUserStats() {
  statsCache = null;
  cachedAt = 0;
}
