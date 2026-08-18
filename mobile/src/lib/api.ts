import { API_BASE_URL } from "./config";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  if (!res.ok) {
    throw new Error(data?.error ?? `Xatolik (${res.status})`);
  }
  return data as T;
}

export const api = {
  get:  <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: any) =>
    request<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(p: string, body?: any) =>
    request<T>(p, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(p: string, body?: any) =>
    request<T>(p, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};

// ─── Turlar ───────────────────────────────────────────────────────────────

export interface MeUser {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  coins: number;
  level: string;
  streakDays: number;
  totalPagesRead?: number;
  totalJuzRead?: number;
  totalKhatms?: number;
  totalBooksRead?: number;
  badges?: any[];
}

export interface Book {
  id: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  totalPages: number;
  currentPage: number;
  targetDays: number;
  startDate: string;
  targetDate?: string | null;
  completedAt?: string | null;
  pausedAt?: string | null;
  status: "READING" | "COMPLETED" | "PAUSED";
  createdAt: string;
  updatedAt: string;
  _count?: { logs: number };
  logs?: BookLog[];
}

export interface BookLog {
  id: string;
  bookId: string;
  fromPage: number;
  toPage: number;
  pagesRead: number;
  date: string;
  note?: string | null;
}

export interface Khatm {
  id: string;
  title: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  type: "GLOBAL" | "PRIVATE";
  _count?: { participations: number };
  juzList?: { juzNumber: number; status: string }[];
}
