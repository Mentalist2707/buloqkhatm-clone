// Kitob o'qish rejasi hisoblash (veb lib/books.ts bilan bir xil)

export interface BookLike {
  totalPages:  number;
  currentPage: number;
  targetDays:  number;
  startDate:   string | Date;
  status?:     string;
  completedAt?: string | Date | null;
  pausedAt?:    string | Date | null;
}

export interface BookPlan {
  totalPages:    number;
  currentPage:   number;
  pagesLeft:     number;
  percent:       number;
  pagesPerDay:   number;
  todayTarget:   number;
  daysElapsed:   number;
  daysRemaining: number;
  expectedPage:  number;
  onTrack:       boolean;
  behindPages:   number;
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

  const daysElapsed   = Math.max(0, daysBetween(start, now));
  const daysRemaining = Math.max(0, targetDays - daysElapsed);
  const expectedPage  = Math.min(totalPages, pagesPerDay * (daysElapsed + 1));

  const isCompleted = book.status === "COMPLETED" || currentPage >= totalPages;
  const todayTarget = isCompleted
    ? 0
    : Math.max(1, Math.ceil(pagesLeft / Math.max(1, daysRemaining || 1)));

  const behindPages = Math.max(0, expectedPage - currentPage);
  const onTrack = isCompleted || currentPage >= expectedPage;

  return {
    totalPages, currentPage, pagesLeft, percent, pagesPerDay,
    todayTarget, daysElapsed, daysRemaining, expectedPage,
    onTrack, behindPages, isCompleted,
  };
}
