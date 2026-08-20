// Badgelarni bazaga qo'shadi (medallar ishlashi uchun).
// Ishga tushirish:  node --env-file=.env prisma/seed.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BADGES = [
  { type: "KHATM_1",        name: "Birinchi Xatm",      icon: "🌱", description: "1 ta xatmni yakunladi",        requirement: 1   },
  { type: "KHATM_10",       name: "10 Xatm",            icon: "📖", description: "10 ta xatmni yakunladi",       requirement: 10  },
  { type: "KHATM_50",       name: "50 Xatm",            icon: "🌟", description: "50 ta xatmni yakunladi",       requirement: 50  },
  { type: "KHATM_100",      name: "100 Xatm",           icon: "👑", description: "100 ta xatmni yakunladi",      requirement: 100 },
  { type: "STREAK_7",       name: "7 Kun Streak",       icon: "🔥", description: "7 kun ketma-ket faol",         requirement: 7   },
  { type: "STREAK_30",      name: "30 Kun Streak",      icon: "💎", description: "30 kun ketma-ket faol",        requirement: 30  },
  { type: "STREAK_100",     name: "100 Kun Streak",     icon: "🏅", description: "100 kun ketma-ket faol",       requirement: 100 },
  { type: "BOOK_1",         name: "Birinchi Kitob",     icon: "📚", description: "1 ta kitobni o'qib tugatdi",    requirement: 1   },
  { type: "BOOK_10",        name: "10 Kitob",           icon: "🏆", description: "10 ta kitobni o'qib tugatdi",   requirement: 10  },
  { type: "BOOK_25",        name: "25 Kitob",           icon: "📚", description: "25 ta kitobni o'qib tugatdi",   requirement: 25  },
  { type: "JUZ_5",          name: "5 Pora",             icon: "🎯", description: "5 ta porani to'liq o'qidi",     requirement: 5   },
  { type: "JUZ_30",         name: "30 Pora",            icon: "📗", description: "30 ta porani to'liq o'qidi",    requirement: 30  },
  { type: "PAGES_500",      name: "500 Sahifa",         icon: "📄", description: "500 sahifa Qur'on o'qidi",      requirement: 500 },
  { type: "PAGES_5000",     name: "5000 Sahifa",        icon: "🗂️", description: "5000 sahifa Qur'on o'qidi",     requirement: 5000 },
  { type: "KHATM_CREATOR_1", name: "Xatm Yaratuvchi",   icon: "✨", description: "1 ta xatm yaratdi",             requirement: 1   },
  { type: "KHATM_CREATOR_5", name: "5 Xatm Yaratuvchi", icon: "🚀", description: "5 ta xatm yaratdi",            requirement: 5   },
];

async function main() {
  for (const b of BADGES) {
    await prisma.badge.upsert({
      where:  { type: b.type },
      update: { name: b.name, icon: b.icon, description: b.description, requirement: b.requirement },
      create: b,
    });
  }
  console.log(`✅ ${BADGES.length} ta badge qo'shildi/yangilandi`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
