import { Platform } from "react-native";

// ─── 2026 ranglar tizimi ────────────────────────────────────────────────────
export const colors = {
  // Fon — iliqroq, yumshoqroq
  bg:          "#f6f7f9",
  bgElevated:  "#ffffff",
  card:        "#ffffff",
  border:      "#eef1f4",
  borderSoft:  "#f1f5f9",

  text:        "#0b1220",
  textMuted:   "#667085",
  textLight:   "#98a2b3",

  emerald:     "#10b981",
  emeraldDark: "#047857",
  emeraldDeep: "#065f46",
  emeraldBg:   "#ecfdf5",
  emeraldBorder:"#a7f3d0",

  blue:        "#3b82f6",
  blueDark:    "#1d4ed8",
  blueBg:      "#eff6ff",
  amber:       "#f59e0b",
  amberBg:     "#fffbeb",
  yellow:      "#eab308",
  yellowBg:    "#fefce8",
  purple:      "#8b5cf6",
  purpleBg:    "#f5f3ff",
  orange:      "#f97316",
  red:         "#ef4444",
  redBg:       "#fef2f2",
  white:       "#ffffff",
} as const;

// ─── Gradientlar (expo-linear-gradient uchun) ────────────────────────────────
export const gradients = {
  emerald: ["#059669", "#047857", "#065f46"] as const,
  emeraldBright: ["#34d399", "#10b981"] as const,
  blue:    ["#3b82f6", "#2563eb"] as const,
  purple:  ["#a78bfa", "#7c3aed"] as const,
  amber:   ["#fbbf24", "#f59e0b"] as const,
  sunset:  ["#fb7185", "#f59e0b"] as const,
  night:   ["#0f766e", "#065f46", "#022c22"] as const,
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, xxl: 30, full: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// ─── Soyalar (yumshoq, zamonaviy) ────────────────────────────────────────────
export const shadow = {
  sm: Platform.select({
    ios: { shadowColor: "#0b1220", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 1 },
    default: {},
  }) as object,
  md: Platform.select({
    ios: { shadowColor: "#0b1220", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 3 },
    default: {},
  }) as object,
  glow: Platform.select({
    ios: { shadowColor: "#10b981", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
    android: { elevation: 6 },
    default: {},
  }) as object,
};

// ─── Daraja tizimi (veb bilan bir xil) ─────────────────────────────────────
export const LEVELS = [
  { name: "Beginner",         minPoints: 0,     color: "#6b7280" },
  { name: "Reader",           minPoints: 100,   color: "#3b82f6" },
  { name: "Hafiz Candidate",  minPoints: 500,   color: "#8b5cf6" },
  { name: "Dedicated Reader", minPoints: 1000,  color: "#f97316" },
  { name: "Khatm Master",     minPoints: 5000,  color: "#10b981" },
  { name: "Buloq Legend",     minPoints: 10000, color: "#eab308" },
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
