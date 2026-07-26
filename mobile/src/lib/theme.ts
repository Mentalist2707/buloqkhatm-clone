import { Platform } from "react-native";

// ─── Premium "diniy" ranglar — to'q yashil + oltin, iliq krem fon ───────────
export const colors = {
  // Iliq krem fon, oq kartalar
  bg:          "#f5f2ea",
  bgElevated:  "#ffffff",
  card:        "#ffffff",
  border:      "#eae3d4",
  borderSoft:  "#f0ebe0",

  text:        "#1a2620",
  textMuted:   "#6f6a5f",
  textLight:   "#a8a094",

  // Yashil (asosiy) — eski "emerald*" kalitlar premium yashilga bog'landi
  emerald:     "#0f6f52",
  emeraldDark: "#0a5240",
  emeraldDeep: "#063d30",
  emeraldBg:   "#e9f4ef",
  emeraldBorder:"#c3e2d5",

  // Oltin (urg'u)
  gold:        "#bf9b30",
  goldLight:   "#d9be6a",
  goldDeep:    "#8a6d1a",
  goldBg:      "#faf3df",
  goldBorder:  "#e8d9a8",

  // Yordamchi (kitob/statistika urg'ulari — mos ohangda)
  blue:        "#2f6f6a",
  blueDark:    "#1f4f4b",
  blueBg:      "#e8f2f0",
  amber:       "#bf9b30",
  amberBg:     "#faf3df",
  yellow:      "#bf9b30",
  yellowBg:    "#faf3df",
  purple:      "#6b5b95",
  purpleBg:    "#efedf5",
  orange:      "#c1743a",
  red:         "#b3453b",
  redBg:       "#f8ecea",
  white:       "#ffffff",
} as const;

// ─── Gradientlar ─────────────────────────────────────────────────────────────
export const gradients = {
  emerald: ["#0f6f52", "#0a5240", "#063d30"] as const,   // asosiy yashil
  emeraldBright: ["#12876a", "#0f6f52"] as const,
  gold:    ["#d9be6a", "#bf9b30"] as const,               // oltin
  goldSoft:["#e8d9a8", "#d9be6a"] as const,
  blue:    ["#2f6f6a", "#1f4f4b"] as const,
  purple:  ["#8a7bb0", "#6b5b95"] as const,
  amber:   ["#d9be6a", "#bf9b30"] as const,
  night:   ["#0a5240", "#063d30", "#04231c"] as const,
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, xxl: 30, full: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// ─── Soyalar ─────────────────────────────────────────────────────────────────
export const shadow = {
  sm: Platform.select({
    ios: { shadowColor: "#1a2620", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    android: { elevation: 1 },
    default: {},
  }) as object,
  md: Platform.select({
    ios: { shadowColor: "#1a2620", shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
    android: { elevation: 3 },
    default: {},
  }) as object,
  glow: Platform.select({
    ios: { shadowColor: "#063d30", shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 6 },
    default: {},
  }) as object,
};

// ─── Daraja tizimi ───────────────────────────────────────────────────────────
export const LEVELS = [
  { name: "Beginner",         minPoints: 0,     color: "#8a8274" },
  { name: "Reader",           minPoints: 100,   color: "#2f6f6a" },
  { name: "Hafiz Candidate",  minPoints: 500,   color: "#6b5b95" },
  { name: "Dedicated Reader", minPoints: 1000,  color: "#c1743a" },
  { name: "Khatm Master",     minPoints: 5000,  color: "#0f6f52" },
  { name: "Buloq Legend",     minPoints: 10000, color: "#bf9b30" },
] as const;

export function getUserLevel(coins: number) {
  let level: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (coins >= l.minPoints) level = l;
  return level;
}

export function getNextLevel(coins: number) {
  const idx = LEVELS.findIndex((l) => l.name === getUserLevel(coins).name);
  return LEVELS[idx + 1] ?? null;
}

export function getLevelProgress(coins: number): number {
  const current = getUserLevel(coins);
  const next = getNextLevel(coins);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  return Math.min(100, Math.floor(((coins - current.minPoints) / range) * 100));
}
