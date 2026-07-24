"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Target, Calendar, Clock, Loader2,
  CheckCircle2, Trash2, TrendingUp, TrendingDown, Flame, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/hooks/use-toast";
import { computeBookPlan } from "@/lib/books";
import { invalidateUserStats } from "@/hooks/use-user-stats";
import { useUser } from "@/components/providers/user-provider";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";

export function BookDetailClient({ book: initialBook }: { book: any }) {
  const router = useRouter();
  const { refresh } = useUser();

  const [book, setBook]         = useState(initialBook);
  const [logs, setLogs]         = useState<any[]>(initialBook.logs ?? []);
  const [toPage, setToPage]     = useState<string>(String(initialBook.currentPage || ""));
  const [saving, setSaving]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const plan = computeBookPlan(book);

  const author = book.author;

  const handleLog = async () => {
    const val = parseInt(toPage);
    if (isNaN(val) || val <= book.currentPage) {
      toast({
        title: "Xato",
        description: `Betni ${book.currentPage} dan katta kiriting`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/books/${book.id}/log`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ toPage: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik");

      // Local update
      const newBook = {
        ...book,
        currentPage: data.newPage,
        status: data.willComplete ? "COMPLETED" : book.status,
        completedAt: data.willComplete ? new Date().toISOString() : book.completedAt,
      };
      setBook(newBook);
      setLogs((prev) => [
        {
          id: `tmp-${Date.now()}`,
          fromPage: book.currentPage + 1,
          toPage: data.newPage,
          pagesRead: data.pagesRead,
          date: new Date().toISOString(),
          note: null,
        },
        ...prev,
      ]);

      invalidateUserStats();
      await refresh();

      if (data.willComplete) {
        toast({ title: "🎉 Tabriklaymiz!", description: `Kitobni o'qib tugatdingiz! +${data.coinsEarned} coin` });
      } else {
        toast({ title: `✅ ${data.pagesRead} bet belgilandi`, description: data.coinsEarned > 0 ? `+${data.coinsEarned} coin` : undefined });
      }
      router.refresh();
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Xatolik");
      toast({ title: "Kitob o'chirildi" });
      router.push("/books");
      router.refresh();
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
        <Link href="/books">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kitoblarga qaytish
        </Link>
      </Button>

      {/* Header */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-5">
          <div className="flex gap-4">
            <div className="h-40 w-28 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-sm">
              {book.coverUrl
                ? <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                : <BookOpen className="h-10 w-10 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold leading-tight">{book.title}</h1>
                  {author && <p className="text-sm text-muted-foreground mt-0.5">{author}</p>}
                </div>
                {plan.isCompleted ? (
                  <Badge variant="completed" className="shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" />Yakunlangan</Badge>
                ) : (
                  <Badge variant="active" className="shrink-0"><BookOpen className="h-3 w-3 mr-1" />O'qilmoqda</Badge>
                )}
              </div>

              {book.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{book.description}</p>
              )}

              {/* Progress */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{plan.currentPage} / {plan.totalPages} bet</span>
                  <span className={cn("font-bold", plan.isCompleted ? "text-blue-600" : "text-emerald-600")}>
                    {plan.percent}%
                  </span>
                </div>
                <Progress value={plan.percent} className="h-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan + today */}
      {!plan.isCompleted && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Plan stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                Reja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-emerald-50 text-center">
                  <p className="text-2xl font-black text-emerald-700">{plan.todayTarget}</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Bugun o'qish (bet)</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-center">
                  <p className="text-2xl font-black text-blue-700">{plan.daysRemaining}</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">Qolgan kun</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 text-center">
                  <p className="text-2xl font-black text-gray-700">{plan.pagesPerDay}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Rejadagi norma/kun</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 text-center">
                  <p className="text-2xl font-black text-gray-700">{plan.pagesLeft}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Qolgan betlar</p>
                </div>
              </div>

              {/* On-track indicator */}
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-xl text-sm font-medium",
                plan.onTrack ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
              )}>
                {plan.onTrack ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {plan.onTrack
                  ? "Rejaga muvofiq ketyapsiz 👍"
                  : `Rejadan ${plan.behindPages} bet orqadasiz`}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Boshlangan: {formatDate(book.startDate)}</span>
                {book.targetDate && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Reja: {formatDate(book.targetDate)}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Log reading */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                O'qishni belgilash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Hozir qaysi betgacha o'qidingiz? Bet raqamini kiriting.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={book.currentPage + 1}
                  max={book.totalPages}
                  value={toPage}
                  onChange={(e) => setToPage(e.target.value)}
                  placeholder={`${book.currentPage + 1}–${book.totalPages}`}
                />
                <Button variant="emerald" onClick={handleLog} disabled={saving} className="shrink-0">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Belgilash</>}
                </Button>
              </div>
              {/* Quick add today target */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                disabled={saving}
                onClick={() => setToPage(String(Math.min(book.totalPages, book.currentPage + plan.todayTarget)))}
              >
                <Target className="h-3.5 w-3.5 mr-1.5" />
                Bugungi normani belgilash (+{plan.todayTarget} bet)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {plan.isCompleted && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-blue-800">Kitob o'qib tugatildi! 🎉</p>
              {book.completedAt && (
                <p className="text-xs text-blue-600 mt-0.5">{formatDate(book.completedAt)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History / Tarix */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            O'qish tarixi
            <span className="ml-auto text-xs text-muted-foreground font-normal">{logs.length} yozuv</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-300 to-transparent" />
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 pl-1">
                    <div className="relative z-10 h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-sm">
                      📖
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none">
                          {log.fromPage}–{log.toPage} bet o'qildi
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(log.date)}
                        </p>
                        {log.note && <p className="text-[11px] text-gray-500 mt-0.5 italic">"{log.note}"</p>}
                      </div>
                      <span className="text-sm font-extrabold text-emerald-600 shrink-0">+{log.pagesRead}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground py-8">
              Hali o'qish tarixi yo'q. Birinchi betlarni belgilang!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 text-red-600 hover:bg-red-50"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Kitobni o'chirish
        </Button>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        variant="destructive"
        title="Kitobni o'chirasizmi?"
        description="Kitob va uning barcha o'qish tarixi o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi."
        confirmLabel="Ha, o'chirish"
        cancelLabel="Bekor"
        icon={
          <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
        }
      />
    </div>
  );
}
