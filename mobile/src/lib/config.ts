import Constants from "expo-constants";

/**
 * Backend API manzili.
 *
 * MUHIM: Telefon (Expo Go) kompyuteringizdagi Next.js serverga ulanishi kerak.
 * Shu sababli "localhost" ISHLAMAYDI — kompyuteringizning LAN IP manzilini yozing.
 *
 * IP ni bilish: kompyuterda `ipconfig` (Windows) -> IPv4 Address (masalan 192.168.1.5).
 * Keyin app.json -> expo.extra.apiBaseUrl ni yangilang yoki quyidagi DEFAULT ni.
 */
const DEFAULT_API = "https://buloqkhatm-clone.vercel.app";

const fromExtra =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;

export const API_BASE_URL = (fromExtra && fromExtra.trim()) || DEFAULT_API;
