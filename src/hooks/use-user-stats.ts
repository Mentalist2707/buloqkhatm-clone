"use client";

import { useEffect, useState } from "react";

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
 */
export function useUserStats(): UserStats {
  const [stats, setStats] = useState<UserStats>(
    () => statsCache ?? { coins: 0, streakDays: 0 }
  );

  useEffect(() => {
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
  }, []);

  return stats;
}

/** Coin/streak o'zgargach keshni majburan yangilash uchun. */
export function invalidateUserStats() {
  statsCache = null;
  cachedAt = 0;
}
