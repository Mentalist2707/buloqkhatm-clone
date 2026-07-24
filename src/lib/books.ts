/**
 * Kitob o'qish rejasi — sof (pure) hisoblash funksiyalari.
 * Client va serverda ishlatsa bo'ladi (prisma import qilmaydi).
 */

export interface BookLike {
  totalPages:  number;
  currentPage: number;
  targetDays:  number;
  startDate:   string | Date;
  status?:     string;
  completedAt?: string | Date | null;
}

export interface BookPlan {
  totalPages:    number;
  currentPage:   number;
  pagesLeft:     number;
  percent:       number;      // 0–100
  pagesPerDay:   number;      // rejadagi kunlik norma
  todayTarget:   number;      // bugun reja bo'yicha o'qish kerak bo'lgan betlar
  daysElapsed:   number;      // boshlanganidan beri o'tgan kunlar
  daysRemaining: number;      // reja tugashiga qolgan kunlar
  expectedPage:  number;      // bugungi kunga rejadagi bet
  onTrack:       boolean;     // rejaga mos yoki oldinda
  behindPages:   number;      // orqada qolgan betlar (0 bo'lsa rejada)
  isCompleted:   boolean;
}

const DAY_MS = 86_400_000;

function daysBetween(a: Date, b: Date): number {
  const da = new Date(a); da.setHours(0, 0, 0, 0);
  const db = new Date(b); db.setHours(0, 0, 0, 0);
  return Math.floor((db.getTime() - da.getTime()) / DAY_MS);
}

export function computeBookPlan(book: BookLike, now: Date = new Date()): BookPlan {
  const totalPages  = Math.max(0, book.totalPages);
  const currentPage = Math.min(Math.max(0, book.currentPage), totalPages);
  const targetDays  = Math.max(1, book.targetDays);
  const start       = new Date(book.startDate);

  const pagesLeft = Math.max(0, totalPages - currentPage);
  const percent   = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  const pagesPerDay = Math.max(1, Math.ceil(totalPages / targetDays));

  // Boshlanganidan beri (bugunni ham qo'shib) o'tgan kunlar
  const daysElapsed   = Math.max(0, daysBetween(start, now));
  const daysRemaining = Math.max(0, targetDays - daysElapsed);

  // Bugungi kunga rejadagi bet (kamida 1-kun uchun pagesPerDay)
  const expectedPage = Math.min(totalPages, pagesPerDay * (daysElapsed + 1));

  const isCompleted = book.status === "COMPLETED" || currentPage >= totalPages;

  // Bugun reja bo'yicha o'qish kerak bo'lgan betlar
  const todayTarget = isCompleted
    ? 0
    : Math.max(1, Math.ceil(pagesLeft / Math.max(1, daysRemaining || 1)));

  const behindPages = Math.max(0, expectedPage - currentPage);
  const onTrack     = isCompleted || currentPage >= expectedPage;

  return {
    totalPages,
    currentPage,
    pagesLeft,
    percent,
    pagesPerDay,
    todayTarget,
    daysElapsed,
    daysRemaining,
    expectedPage,
    onTrack,
    behindPages,
    isCompleted,
  };
}
