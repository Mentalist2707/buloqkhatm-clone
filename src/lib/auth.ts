/**
 * Single-user auth — login/register yo'q.
 *
 * Ilova faqat bitta shaxsiy foydalanuvchi uchun ishlaydi. Bu yerda hech qanday
 * parol, sessiya yoki NextAuth yo'q — shunchaki bazadagi yagona foydalanuvchini
 * topamiz (yoki yaratamiz) va uni "joriy foydalanuvchi" deb qaytaramiz.
 */

import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/** Yagona shaxsiy foydalanuvchining barqaror kaliti */
export const PERSONAL_EMAIL = "me@buloqkhatm.local";

// Server jarayoni davomida id ni keshlaymiz — har chaqiruvda upsert qilinmasin
let personalUserId: string | null = null;

/** Joriy (yagona) foydalanuvchini topadi yoki yaratadi. Har doim User qaytaradi. */
export async function getCurrentUser(): Promise<User> {
  if (personalUserId) {
    const existing = await prisma.user.findUnique({ where: { id: personalUserId } });
    if (existing) return existing;
    personalUserId = null;
  }

  const user = await prisma.user.upsert({
    where: { email: PERSONAL_EMAIL },
    update: {},
    create: {
      email:     PERSONAL_EMAIL,
      name:      "Men",
      firstName: "Men",
      level:     "Beginner",
    },
  });

  personalUserId = user.id;
  return user;
}

/**
 * Eski `auth()` bilan moslik uchun shim — sessiyaga o'xshash obyekt qaytaradi.
 * Hech qachon null qaytarmaydi (login talab qilinmaydi).
 */
export async function auth() {
  const user = await getCurrentUser();
  return {
    user: {
      id:         user.id,
      name:       user.name ?? "Men",
      email:      user.email ?? PERSONAL_EMAIL,
      image:      user.image ?? user.photoUrl ?? null,
      coins:      user.coins,
      level:      user.level,
      streakDays: user.streakDays,
    },
  };
}

/** Joriy foydalanuvchi id sini qaytaradi (qulaylik uchun). */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user.id;
}
