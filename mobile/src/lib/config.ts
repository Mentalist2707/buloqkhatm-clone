import Constants from "expo-constants";

/**
 * Backend API manzili.
 *
 * Standalone (APK) build'da bu qiymat build paytida app.json -> expo.extra.apiBaseUrl
 * dan olinadi. Agar topilmasa, DEFAULT_API ishlatiladi.
 *
 * Wi-Fi'siz istalgan joyda ishlashi uchun bu Vercel (internet) manzili.
 */
const DEFAULT_API = "https://buloqkhatm-clone.vercel.app";

// Turli Expo runtime'lar uchun (expoConfig / manifest / manifest2) barcha joyni tekshiramiz
const anyC = Constants as any;
const fromExtra: unknown =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  anyC?.manifest?.extra?.apiBaseUrl ??
  anyC?.manifest2?.extra?.expoClient?.extra?.apiBaseUrl;

export const API_BASE_URL =
  (typeof fromExtra === "string" && fromExtra.trim()) ? fromExtra.trim() : DEFAULT_API;
