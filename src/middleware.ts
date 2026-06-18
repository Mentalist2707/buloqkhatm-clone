import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Himoyalangan routelar ────────────────────────────────────────────────────

const PROTECTED = [
  "/dashboard",
  "/khatms",
  "/profile",
  "/settings",
  "/leaderboard",
  "/notifications",
  "/admin",
];

// ─── Faqat auth bo'lmagan foydalanuvchilar uchun ─────────────────────────────

const AUTH_ONLY = [
  "/auth/signin",
  "/auth/error",
];

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session      = req.auth;
  const isLoggedIn   = !!session?.user?.id;

  // ── Himoyalangan sahifaga login bo'lmasdan kirmoqchi ──
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !isLoggedIn) {
    const signinUrl = new URL("/auth/signin", req.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  // ── Login sahifasiga kirgan holda login bo'lmagan ──
  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p));
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ── Admin sahifasiga oddiy user kirmoqchi ──
  if (pathname.startsWith("/admin") && isLoggedIn) {
    const role = session?.user?.role;
    const allowed = ["ADMIN", "SUPER_ADMIN", "MODERATOR"];
    if (!allowed.includes(role ?? "")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // ── Ban qilingan foydalanuvchi ──
  // (Ban holati DB da saqlanadi, JWT da yo'q — shuning uchun bu check API darajasida)

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Quyidagilarni o'tkazib yuborish:
     * - _next/static — statik fayllar
     * - _next/image  — rasm optimizatsiya
     * - favicon.ico  — favicon
     * - api/auth     — NextAuth API
     * - public       — public papka
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff|woff2)).*)",
  ],
};
