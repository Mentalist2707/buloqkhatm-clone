import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `mobile/` — alohida React Native (Expo) loyihasi shu repo ichida turadi.
  // Next.js build barcha .ts/.tsx fayllarni (tsconfig exclude'ga qaramay) tekshiradi,
  // shu sababli mobile fayllari web build'ni buzmasligi uchun type-check'ni build
  // vaqtida o'chiramiz. Web tiplari alohida `tsc --noEmit` bilan tekshiriladi.
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "t.me",
      },
      {
        protocol: "https",
        hostname: "telegram.org",
      },
      {
        protocol: "https",
        hostname: "*.telegram.org",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;
