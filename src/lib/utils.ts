import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── BuloqCoin Level System ───────────────────────────────────────────────────

export const LEVELS = [
  { name: "Beginner",        minPoints: 0,     color: "text-gray-500",   bg: "bg-gray-100"   },
  { name: "Reader",          minPoints: 100,   color: "text-blue-500",   bg: "bg-blue-100"   },
  { name: "Hafiz Candidate", minPoints: 500,   color: "text-purple-500", bg: "bg-purple-100" },
  { name: "Dedicated Reader",minPoints: 1000,  color: "text-orange-500", bg: "bg-orange-100" },
  { name: "Khatm Master",    minPoints: 5000,  color: "text-emerald-500",bg: "bg-emerald-100"},
  { name: "Buloq Legend",    minPoints: 10000, color: "text-yellow-500", bg: "bg-yellow-100" },
] as const;

export function getUserLevel(coins: number) {
  let level: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) {
    if (coins >= l.minPoints) level = l;
  }
  return level;
}

export function getNextLevel(coins: number) {
  const idx = LEVELS.findIndex((l) => l.name === getUserLevel(coins).name);
  return LEVELS[idx + 1] ?? null;
}

export function getLevelProgress(coins: number): number {
  const current = getUserLevel(coins);
  const next    = getNextLevel(coins);
  if (!next) return 100;
  const range    = next.minPoints - current.minPoints;
  const progress = coins - current.minPoints;
  return Math.min(100, Math.floor((progress / range) * 100));
}

// ─── BuloqCoin Rules ──────────────────────────────────────────────────────────

/**
 * BuloqCoin berilish qoidalari:
 *
 * DAILY_ACTIVITY    +5   — Kuniga 1 marta (kamida 1 bet o'qilsa)
 * JUZ_COMPLETED     +25  — Pora barcha sahifalari o'qilganda
 * KHATM_PARTICIPANT +25  — Xatm yakunlanganda (ishtirokchi)
 * KHATM_CREATOR     +100 — Xatm yakunlanganda (yaratuvchi)
 * STREAK_7          +20  — 7 kunlik streak
 * STREAK_30         +50  — 30 kunlik streak
 * REFERRAL          +15  — Do'st taklif
 */
export const COIN_RULES = {
  DAILY_ACTIVITY:    5,
  JUZ_COMPLETED:     25,
  KHATM_PARTICIPANT: 25,
  KHATM_CREATOR:     100,
  STREAK_7:          20,
  STREAK_30:         50,
  REFERRAL:          15,
  ADMIN_BONUS:       0,   // miqdor admin tomonidan belgilanadi
} as const;

/** Eski kod bilan moslik uchun alias */
export const POINT_RULES = {
  JUZ_COMPLETED:    COIN_RULES.JUZ_COMPLETED,
  KHATM_COMPLETED:  COIN_RULES.KHATM_PARTICIPANT,
  STREAK_7_DAYS:    COIN_RULES.STREAK_7,
  REFERRAL:         COIN_RULES.REFERRAL,
} as const;

// ─── Juz (Pora) config ────────────────────────────────────────────────────────

/** Har bir pora standart sahifalar soni */
export const JUZ_TOTAL_PAGES = 20;

/** Sahifalar o'qilish foizini hisoblash */
export function getJuzPageProgress(pagesRead: number, total = JUZ_TOTAL_PAGES): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((pagesRead / total) * 100));
}

// ─── Juz Names ────────────────────────────────────────────────────────────────

export const JUZ_NAMES: Record<number, string> = {
  1:  "Alif, Lam, Mim",
  2:  "Sayaqul",
  3:  "Tilkar-Rusul",
  4:  "Lan Tanalu",
  5:  "Val-Muhsonatu",
  6:  "La Yuhibbulloh",
  7:  "Va Iza Sami'u",
  8:  "Va Lav Annana",
  9:  "Qolal-Mala'u",
  10: "Va'lamu",
  11: "Ya'tazirun",
  12: "Va Ma Min Dabbah",
  13: "Va Ma Ubarri'u",
  14: "Rubama / Alif, Lam, Ro",
  15: "Subhanallazi",
  16: "Qola Alam",
  17: "Iqtaraba Lin-Nas",
  18: "Qod Aflaha",
  19: "Va Qolallazina",
  20: "Amman Xalaqo",
  21: "Utlu Ma Uhiya",
  22: "Va May Yaqnut",
  23: "Va Maliya",
  24: "Faman Azlamu",
  25: "Ilayhi Yuraddu",
  26: "Ha, Mim",
  27: "Qola Fama Xatbukum",
  28: "Qod Sami'allohu",
  29: "Tabarokallazi",
  30: "Amma Yatasa'alun (Juz Amma)",
};

// ─── Maxfiylik / Inkognito ────────────────────────────────────────────────────

/** Faqat ADMIN va SUPER_ADMIN inkognito foydalanuvchilarning real ma'lumotini ko'radi */
export function isAdminRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

interface MaskableUser {
  id?: string;
  firstName?: string | null;
  lastName?:  string | null;
  name?:      string | null;
  username?:  string | null;
  photoUrl?:  string | null;
  image?:     string | null;
  isIncognito?: boolean | null;
}

/** Inkognito foydalanuvchini (admin bo'lmagan ko'ruvchi uchun) "Inkognito N" ga aylantiradi */
export function maskIncognitoUser<T extends MaskableUser>(
  user: T,
  isAdminViewer: boolean,
  index: number
): T {
  if (!user || !user.isIncognito || isAdminViewer) return user;
  const label = `Inkognito ${index}`;
  return {
    ...user,
    firstName: label,
    lastName:  null,
    name:      label,
    username:  null,
    photoUrl:  null,
    image:     null,
  } as T;
}

/** Ro'yxatdagi inkognito foydalanuvchilarni ketma-ket raqamlab anonimlashtiradi */
export function maskIncognitoList<T extends MaskableUser>(
  list: T[],
  isAdminViewer: boolean
): T[] {
  let n = 0;
  return list.map((u) => {
    if (u && u.isIncognito && !isAdminViewer) {
      n += 1;
      return maskIncognitoUser(u, false, n);
    }
    return u;
  });
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  // locale o'rniga fixed format — server/client mismatch bo'lmasin
  const day   = d.getDate().toString().padStart(2, "0");
  const month = d.getMonth() + 1;
  const year  = d.getFullYear();
  const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun",
                  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
  return `${day} ${MONTHS[month - 1]}, ${year}`;
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("uz-UZ", {
    month: "short", day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now  = new Date();
  const d    = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);

  if (mins  <  1) return "Hozir";
  if (mins  < 60) return `${mins} daqiqa oldin`;
  if (hours < 24) return `${hours} soat oldin`;
  if (days  <  7) return `${days} kun oldin`;
  return formatDate(d);
}

/** UTC bo'yicha bugungi kun boshi (00:00:00) */
export function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Ikki sana orasidagi kunlar */
export function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
}

// ─── Khatm Progress ───────────────────────────────────────────────────────────

export function getKhatmProgress(completed: number, total = 30): number {
  return Math.floor((completed / total) * 100);
}

// ─── Badge Config ─────────────────────────────────────────────────────────────

export const BADGE_CONFIG = {
  KHATM_1:   { name: "Birinchi Xatm",  icon: "🌱", description: "1 ta xatmni yakunladi"      },
  KHATM_10:  { name: "10 Xatm",        icon: "📖", description: "10 ta xatmni yakunladi"     },
  KHATM_50:  { name: "50 Xatm",        icon: "🌟", description: "50 ta xatmni yakunladi"     },
  KHATM_100: { name: "100 Xatm",       icon: "👑", description: "100 ta xatmni yakunladi"    },
  STREAK_7:  { name: "7 Kun Streak",   icon: "🔥", description: "7 kun ketma-ket faol"       },
  STREAK_30: { name: "30 Kun Streak",  icon: "💎", description: "30 kun ketma-ket faol"      },
  REFERRAL:  { name: "Do'st Taklif",   icon: "🤝", description: "Do'stini platformaga taklif qildi" },
} as const;

// ─── Coin display ─────────────────────────────────────────────────────────────

/** CoinReason uchun chiroyli label va icon */
export const COIN_REASON_DISPLAY: Record<string, { icon: string; label: string; color: string }> = {
  DAILY_ACTIVITY:    { icon: "☀️",  label: "Kunlik faollik",     color: "text-yellow-600" },
  JUZ_COMPLETED:     { icon: "📖",  label: "Pora yakunlandi",    color: "text-emerald-600"},
  KHATM_PARTICIPANT: { icon: "🎉",  label: "Xatm yakunlandi",    color: "text-blue-600"  },
  KHATM_CREATOR:     { icon: "👑",  label: "Xatm muallifi bonus",color: "text-purple-600"},
  STREAK_7:          { icon: "🔥",  label: "7 kun streak",       color: "text-orange-600"},
  STREAK_30:         { icon: "💎",  label: "30 kun streak",      color: "text-indigo-600"},
  REFERRAL:          { icon: "🤝",  label: "Do'st taklif",       color: "text-pink-600"  },
  ADMIN_BONUS:       { icon: "⭐",  label: "Admin bonus",        color: "text-amber-600" },
  ADMIN_DEDUCT:      { icon: "⬇️",  label: "Admin ayirdi",       color: "text-red-600"   },
  PAGE_READ:         { icon: "📄",  label: "Sahifa o'qildi",     color: "text-gray-600"  },
};

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
