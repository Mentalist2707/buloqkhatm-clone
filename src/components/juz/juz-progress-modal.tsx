"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  Coins,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sun,
} from "lucide-react";
import { JUZ_NAMES, JUZ_TOTAL_PAGES, getJuzPageProgress, cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JuzProgressModalProps {
  open:        boolean;
  onClose:     () => void;
  juz: {
    id:          string;
    juzNumber:   number;
    totalPages?: number;
    status:      "AVAILABLE" | "RESERVED" | "COMPLETED";
    khatmTitle:  string;
  };
  initialPages?: number;   // JuzProgress.pagesRead from DB
  onCompleted?: (result: CompleteResult) => void;
}

interface CompleteResult {
  juzCompleted:   boolean;
  khatmCompleted: boolean;
  coinsEarned:    number;
  streakDays:     number;
  isNewDay:       boolean;
}

// ─── Page selector ────────────────────────────────────────────────────────────

function PageSelector({
  total,
  selected,
  onChange,
}: {
  total:    number;
  selected: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">
          Bugun o'qigan sahifangizni belgilang:
        </span>
        <span className="font-bold text-emerald-600">
          {selected}/{total} bet
        </span>
      </div>

      {/* Page grid — 4 columns */}
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((page) => {
          const isSelected = page <= selected;
          const isCurrent  = page === selected;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onChange(page === selected ? selected - 1 : page)}
              className={cn(
                "h-9 rounded-xl text-sm font-bold transition-all duration-150 border-2",
                isSelected
                  ? isCurrent
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm scale-105"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-400 border-gray-100 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50"
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-2 flex-wrap">
        {[5, 10, 15, total].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
              selected === n
                ? "bg-emerald-500 text-white border-emerald-500"
                : "border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 bg-white"
            )}
          >
            {n === total ? "Hammasi ✓" : `${n} bet`}
          </button>
        ))}
        {selected > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 bg-white"
          >
            Tozalash
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Result Banner ────────────────────────────────────────────────────────────

function ResultBanner({ result }: { result: CompleteResult }) {
  return (
    <div className="space-y-3 text-center py-2">
      {/* Main icon */}
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-2xl gradient-emerald flex items-center justify-center shadow-lg animate-bounce-slow">
          {result.khatmCompleted ? (
            <span className="text-3xl">🎉</span>
          ) : (
            <CheckCircle2 className="h-9 w-9 text-white" />
          )}
        </div>
      </div>

      {result.khatmCompleted ? (
        <div>
          <p className="text-xl font-bold text-emerald-700">Xatm yakunlandi! 🎊</p>
          <p className="text-sm text-muted-foreground mt-1">
            Barcha 30 pora o'qildi. Alloh qabul qilsin! 🤲
          </p>
        </div>
      ) : (
        <div>
          <p className="text-lg font-bold text-emerald-700">Pora o'qildi! ✓</p>
          <p className="text-sm text-muted-foreground mt-1">
            Barakalla! Davom eting.
          </p>
        </div>
      )}

      {/* Coins earned */}
      <div className="flex justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
          <span className="text-xl">🪙</span>
          <div className="text-left">
            <p className="text-lg font-black text-yellow-700">
              +{result.coinsEarned}
            </p>
            <p className="text-xs text-yellow-600">BuloqCoin</p>
          </div>
        </div>

        {result.isNewDay && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <Sun className="h-5 w-5 text-blue-500" />
            <div className="text-left">
              <p className="text-sm font-bold text-blue-700">+5</p>
              <p className="text-xs text-blue-600">Kunlik bonus</p>
            </div>
          </div>
        )}

        {result.streakDays > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="text-left">
              <p className="text-sm font-bold text-orange-700">
                {result.streakDays} kun
              </p>
              <p className="text-xs text-orange-600">Streak!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function JuzProgressModal({
  open,
  onClose,
  juz,
  initialPages = 0,
  onCompleted,
}: JuzProgressModalProps) {
  const totalPages   = juz.totalPages ?? JUZ_TOTAL_PAGES;
  const [pagesRead, setPagesRead]   = useState(initialPages);
  const [loading,   setLoading]     = useState(false);
  const [result,    setResult]      = useState<CompleteResult | null>(null);
  const [mode,      setMode]        = useState<"progress" | "complete" | "done">("progress");

  // Sync initialPages when juz changes
  useEffect(() => {
    if (open) {
      setPagesRead(initialPages);
      setResult(null);
      setMode(initialPages >= totalPages ? "complete" : "progress");
    }
  }, [open, initialPages, totalPages]);

  const percent   = getJuzPageProgress(pagesRead, totalPages);
  const isAllRead = pagesRead >= totalPages;

  // ── Save progress (partial) ──
  const handleSaveProgress = async () => {
    if (pagesRead === 0) {
      toast({ title: "Kamida 1 sahifa belgilang", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/juz/${juz.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagesRead }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.juzCompleted) {
        setResult(data);
        setMode("done");
        onCompleted?.(data);
        toast({
          title: `📖 ${juz.juzNumber}-pora yakunlandi! +25 BuloqCoin`,
        });
      } else {
        toast({
          title: `✅ ${pagesRead} sahifa saqlandi!`,
          description: data.isNewDay ? "+5 BuloqCoin (kunlik bonus)" : undefined,
        });
        if (data.isNewDay) {
          // small coins notification
        }
        onClose();
      }
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Mark fully complete ──
  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/juz/${juz.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setMode("done");
      onCompleted?.(data);
      setPagesRead(totalPages);
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-emerald flex items-center justify-center shadow-sm">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {juz.juzNumber}-pora — {JUZ_NAMES[juz.juzNumber]}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {juz.khatmTitle}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* ── Done state ── */}
        {mode === "done" && result ? (
          <div className="space-y-4">
            <ResultBanner result={result} />
            <Button
              className="w-full"
              variant="emerald"
              onClick={onClose}
            >
              Yopish
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">O'qilgan sahifalar</span>
                <span className={cn(
                  "font-bold",
                  percent === 100 ? "text-emerald-600" : "text-gray-700"
                )}>
                  {percent}%
                </span>
              </div>
              <Progress
                value={percent}
                className="h-3 bg-gray-100"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{pagesRead} bet o'qildi</span>
                <span>{totalPages - pagesRead} bet qoldi</span>
              </div>
            </div>

            {/* Coins preview */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-yellow-50 rounded-xl p-2.5 border border-yellow-100">
                <span className="text-lg">🪙</span>
                <div>
                  <p className="text-xs text-yellow-600">To'liq o'qisangiz</p>
                  <p className="text-sm font-bold text-yellow-700">+25 BuloqCoin</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-blue-50 rounded-xl p-2.5 border border-blue-100">
                <Sun className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-blue-600">Kunlik bonus</p>
                  <p className="text-sm font-bold text-blue-700">+5 BuloqCoin</p>
                </div>
              </div>
            </div>

            {/* Page selector */}
            <PageSelector
              total={totalPages}
              selected={pagesRead}
              onChange={setPagesRead}
            />

            {/* Buttons */}
            <div className="flex gap-2.5 pt-1">
              {/* Save partial progress */}
              {!isAllRead && (
                <Button
                  variant="outline"
                  className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={handleSaveProgress}
                  disabled={loading || pagesRead === 0}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  {pagesRead > 0 ? `${pagesRead} bet saqlash` : "Sahifa tanlang"}
                </Button>
              )}

              {/* Complete button */}
              <Button
                variant="emerald"
                className={cn("flex-1", isAllRead && "flex-none w-full")}
                onClick={isAllRead ? handleComplete : handleSaveProgress}
                disabled={loading || (isAllRead ? false : pagesRead === 0)}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : isAllRead ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    O'qib bo'ldim ✓
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Hammasi o'qildi
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Qisman saqlash ham hisobga olinadi — har kuni davom eting 📖
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
