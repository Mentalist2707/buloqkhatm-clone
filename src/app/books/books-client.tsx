"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Library, Plus, BookOpen, Target, Calendar,
  CheckCircle2, PauseCircle, Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { computeBookPlan } from "@/lib/books";
import { formatDate, cn } from "@/lib/utils";

type Filter = "ALL" | "READING" | "COMPLETED" | "PAUSED";

const STATUS: Record<string, { label: string; variant: any; icon: any }> = {
  READING:   { label: "O'qilmoqda",  variant: "active",    icon: BookOpen },
  COMPLETED: { label: "Yakunlangan", variant: "completed", icon: CheckCircle2 },
  PAUSED:    { label: "To'xtatilgan",variant: "draft",     icon: PauseCircle },
};

function BookCard({ book }: { book: any }) {
  const plan   = computeBookPlan(book);
  const status = STATUS[book.status] ?? STATUS.READING;
  const StatusIcon = status.icon;

  return (
    <Link href={`/books/${book.id}`}>
      <Card className="card-hover border-0 shadow-sm overflow-hidden h-full group">
        <div className="flex gap-3 p-3">
          {/* Cover */}
          <div className="h-28 w-20 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            {book.coverUrl
              ? <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
              : <BookOpen className="h-7 w-7 text-blue-400" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                {book.title}
              </h3>
              <Badge variant={status.variant} className="text-[10px] flex items-center gap-1 shrink-0">
                <StatusIcon className="h-2.5 w-2.5" />
                {status.label}
              </Badge>
            </div>
            {book.author && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{book.author}</p>
            )}

            {/* Progress */}
            <div className="mt-auto pt-2 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{plan.currentPage}/{plan.totalPages} bet</span>
                <span className={cn("font-bold", plan.isCompleted ? "text-blue-600" : "text-emerald-600")}>
                  {plan.percent}%
                </span>
              </div>
              <Progress value={plan.percent} className="h-2" />

              {!plan.isCompleted && book.status !== "PAUSED" && (
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {plan.todayTarget} bet/kun
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {plan.daysRemaining} kun qoldi
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function BooksClient({ books }: { books: any[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const filtered = books.filter((b) => filter === "ALL" || b.status === filter);
  const reading   = books.filter((b) => b.status === "READING").length;
  const completed = books.filter((b) => b.status === "COMPLETED").length;
  const paused    = books.filter((b) => b.status === "PAUSED").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Library className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kitoblar</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {books.length} ta kitob •{" "}
              <span className="text-emerald-600 font-medium">{reading} o'qilmoqda</span>
              {completed > 0 && <> • <span className="text-blue-600 font-medium">{completed} yakunlangan</span></>}
            </p>
          </div>
        </div>
        <Button variant="emerald" asChild className="shadow-sm shrink-0">
          <Link href="/books/create">
            <Plus className="h-4 w-4 mr-2" />
            Yangi Kitob
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          ["ALL", `Barchasi (${books.length})`],
          ["READING", `O'qilmoqda (${reading})`],
          ["COMPLETED", `Yakunlangan (${completed})`],
          ["PAUSED", `To'xtatilgan (${paused})`],
        ] as [Filter, string][]).map(([f, label]) => (
          <Button
            key={f}
            variant={filter === f ? "emerald" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="h-9 text-xs"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-gray-200 bg-white shadow-none">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
              <Library className="h-7 w-7 text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700">Hozircha kitob yo'q</p>
            <p className="text-sm text-muted-foreground mt-1">
              Kitob qo'shing va o'qish rejasini tuzing
            </p>
            <Button variant="emerald" size="sm" className="mt-4" asChild>
              <Link href="/books/create">
                <Plus className="h-4 w-4 mr-1.5" />
                Kitob qo'shish
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
