/**
 * BuloqCoin tizimi — server-side helper funksiyalar
 * Barcha coin operatsiyalari shu fayldan o'tadi
 */

import { prisma } from "@/lib/prisma";
import { COIN_RULES, getUserLevel, todayUTC, daysBetween } from "@/lib/utils";
import type { CoinReason } from "@prisma/client";

// ─── Low-level: coin qo'shish / ayirish ──────────────────────────────────────

export async function addCoins(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  amount: number,
  reason: CoinReason,
  description?: string,
  metadata?: object
) {
  if (amount === 0) return;

  // 1. Tranzaksiya yozuvi
  await tx.coinTransaction.create({
    data: {
      userId,
      amount,
      reason,
      description,
      metadata: metadata ?? {},
    },
  });

  // 2. User balansini yangilaش
  const updated = await tx.user.update({
    where: { id: userId },
    data: { coins: { increment: amount } },
    select: { coins: true },
  });

  // 3. Darajani yangilash
  const level = getUserLevel(updated.coins);
  await tx.user.update({
    where: { id: userId },
    data: { level: level.name },
  });

  return updated.coins;
}

// ─── Kunlik faollik (+5 BuloqCoin, kuniga 1 marta) ───────────────────────────

export async function checkAndAwardDailyActivity(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  coinsToAdd: number = 0
) {
  const today = todayUTC();

  // DailyActivity upsert
  const daily = await tx.dailyActivity.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, pagesRead: 0, juzRead: 0, coinsEarned: 0 },
    update: {},
  });

  // Bugun hali coin berilmaganmi?
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { lastDailyAt: true, streakDays: true, lastActiveAt: true },
  });

  let streakBonus = 0;
  let streakDays  = user?.streakDays ?? 0;

  const lastDaily = user?.lastDailyAt;
  const isNewDay  = !lastDaily || daysBetween(lastDaily, today) >= 1;

  if (isNewDay) {
    // Streak hisoblash
    const wasYesterday = lastDaily && daysBetween(lastDaily, today) === 1;
    streakDays = wasYesterday ? streakDays + 1 : 1;

    // Streak bonuslari
    if (streakDays === 7)  streakBonus = COIN_RULES.STREAK_7;
    if (streakDays === 30) streakBonus = COIN_RULES.STREAK_30;

    // +5 kunlik coin
    await addCoins(tx, userId, COIN_RULES.DAILY_ACTIVITY, "DAILY_ACTIVITY",
      "Kunlik faollik bonusi");

    // DailyActivity yangilaش
    await tx.dailyActivity.update({
      where: { userId_date: { userId, date: today } },
      data: { coinsEarned: { increment: COIN_RULES.DAILY_ACTIVITY } },
    });

    // User: lastDailyAt, streakDays
    await tx.user.update({
      where: { id: userId },
      data: { lastDailyAt: today, streakDays, lastActiveAt: new Date() },
    });

    // Streak bonusi
    if (streakBonus > 0) {
      const reason: CoinReason = streakDays === 7 ? "STREAK_7" : "STREAK_30";
      await addCoins(tx, userId, streakBonus, reason,
        `${streakDays} kunlik streak bonusi!`);
    }
  } else {
    // Faqat lastActiveAt yangilaش
    await tx.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
  }

  // Qo'shimcha coin (masalan, sahifa o'qilganda)
  if (coinsToAdd > 0) {
    await tx.dailyActivity.update({
      where: { userId_date: { userId, date: today } },
      data: { coinsEarned: { increment: coinsToAdd } },
    });
  }

  return { streakDays, streakBonus, isNewDay };
}

// ─── Pora to'liq o'qilganda (+25 BuloqCoin) ──────────────────────────────────

export async function awardJuzCompleted(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  juzNumber: number,
  khatmTitle: string
) {
  await addCoins(
    tx,
    userId,
    COIN_RULES.JUZ_COMPLETED,
    "JUZ_COMPLETED",
    `${juzNumber}-pora to'liq o'qildi (${khatmTitle})`,
    { juzNumber, khatmTitle }
  );

  // DailyActivity: juzRead++
  const today = todayUTC();
  await tx.dailyActivity.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, pagesRead: 0, juzRead: 1,
              coinsEarned: COIN_RULES.JUZ_COMPLETED },
    update: { juzRead: { increment: 1 },
              coinsEarned: { increment: COIN_RULES.JUZ_COMPLETED } },
  });

  // User: totalJuzRead++
  await tx.user.update({
    where: { id: userId },
    data: { totalJuzRead: { increment: 1 } },
  });
}

// ─── Xatm yakunlanganda (ishtirokchi +25, yaratuvchi +100) ───────────────────

export async function awardKhatmCompleted(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  participants: { userId: string }[],
  creatorId: string,
  khatmTitle: string,
  khatmId: string
) {
  for (const p of participants) {
    const isCreator = p.userId === creatorId;

    // Ishtirokchi bonusi
    await addCoins(
      tx,
      p.userId,
      COIN_RULES.KHATM_PARTICIPANT,
      "KHATM_PARTICIPANT",
      `"${khatmTitle}" xatmi yakunlandi`,
      { khatmId, khatmTitle }
    );

    // Yaratuvchi qo'shimcha bonusi
    if (isCreator) {
      await addCoins(
        tx,
        p.userId,
        COIN_RULES.KHATM_CREATOR,
        "KHATM_CREATOR",
        `"${khatmTitle}" xatmini yaratganlik uchun bonus`,
        { khatmId, khatmTitle }
      );
    }

    // User: totalKhatms++
    await tx.user.update({
      where: { id: p.userId },
      data: { totalKhatms: { increment: 1 } },
    });

    // Notification
    await tx.notification.create({
      data: {
        userId: p.userId,
        type: "KHATM_COMPLETED",
        title: "🎉 Xatm yakunlandi!",
        message: `"${khatmTitle}" xatmi muvaffaqiyatli yakunlandi! +${
          isCreator
            ? COIN_RULES.KHATM_PARTICIPANT + COIN_RULES.KHATM_CREATOR
            : COIN_RULES.KHATM_PARTICIPANT
        } BuloqCoin`,
        metadata: { khatmId },
      },
    });
  }
}

// ─── Badge tekshirish ─────────────────────────────────────────────────────────

export async function checkAndAwardBadges(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string
) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { totalKhatms: true, streakDays: true,
              badges: { select: { badge: { select: { type: true } } } } },
  });
  if (!user) return;

  const earned = new Set(user.badges.map((b) => b.badge.type));

  const checks: Array<{ type: string; condition: boolean }> = [
    { type: "KHATM_1",   condition: user.totalKhatms >= 1   && !earned.has("KHATM_1"   as any) },
    { type: "KHATM_10",  condition: user.totalKhatms >= 10  && !earned.has("KHATM_10"  as any) },
    { type: "KHATM_50",  condition: user.totalKhatms >= 50  && !earned.has("KHATM_50"  as any) },
    { type: "KHATM_100", condition: user.totalKhatms >= 100 && !earned.has("KHATM_100" as any) },
    { type: "STREAK_7",  condition: user.streakDays  >= 7   && !earned.has("STREAK_7"  as any) },
    { type: "STREAK_30", condition: user.streakDays  >= 30  && !earned.has("STREAK_30" as any) },
  ];

  for (const check of checks) {
    if (!check.condition) continue;
    const badge = await tx.badge.findUnique({
      where: { type: check.type as any },
    });
    if (badge) {
      await tx.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
    }
  }
}
