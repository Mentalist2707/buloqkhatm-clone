"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Users,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  Loader2,
  Lock,
  Globe,
  AlertCircle,
  XCircle,
  Copy,
  UserCheck,
  BarChart2,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { JuzProgressModal } from "@/components/juz/juz-progress-modal";
import { toast } from "@/hooks/use-toast";
import {
  JUZ_NAMES,
  getKhatmProgress,
  getJuzPageProgress,
  formatDate,
  JUZ_TOTAL_PAGES,
  cn,
} from "@/lib/utils";
import type { Role } from "@prisma/client";

// ─── Juz status config ────────────────────────────────────────────────────────

const JUZ_STATUS_CONFIG = {
  AVAILABLE: {
    label:   "Bo'sh",
    bg:      "bg-gray-50 border-gray-200",
    bgHover: "hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-sm",
    numColor:"text-gray-700",
    dot:     "bg-gray-300",
  },
  RESERVED: {
    label:   "Band",
    bg:      "bg-amber-50 border-amber-200",
    bgHover: "",
    numColor:"text-amber-700",
    dot:     "bg-amber-400",
  },
  COMPLETED: {
    label:   "O'qildi",
    bg:      "bg-emerald-50 border-emerald-200",
    bgHover: "",
    numColor:"text-emerald-700",
    dot:     "bg-emerald-500",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface JuzItem {
  id: string;
  juzNumber: number;
  status: "AVAILABLE" | "RESERVED" | "COMPLETED";
  assignedToId: string | null;
  deadline: string | null;
  totalPages: number;
  progress?: {
    pagesRead:  number;
    totalPages: number;
  } | null;
  assignedTo: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
    username: string | null;
  } | null;
}

interface Props {
  khatm: any;
  isParticipant: boolean;
  isCreator: boolean;
  myJuz: JuzItem[];
  userActiveJuzCount: number;
  userId: string;
  userRole: Role;
  joinRequests?: any[]; // creator uchun pending so'rovlar
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function KhatmDetailClient({
  khatm,
  isParticipant,
  isCreator,
  myJuz,
  userActiveJuzCount,
  userId,
  userRole,
  joinRequests: initialRequests = [],
}: Props) {
  const router = useRouter();

  // ── State ──
  const [juzList, setJuzList]               = useState<JuzItem[]>(khatm.juzList);
  const [joining, setJoining]               = useState(false);
  const [loading, setLoading]               = useState<string | null>(null);
  const [onlyMine, setOnlyMine]             = useState(false);
  const [confirmTake, setConfirmTake]       = useState<JuzItem | null>(null);
  const [confirmRelease, setConfirmRelease] = useState<JuzItem | null>(null);
  const [progressJuz, setProgressJuz]       = useState<JuzItem | null>(null);
  const [joinRequests, setJoinRequests]     = useState<any[]>(initialRequests);
  const [requestSent, setRequestSent]       = useState(false);

  // ── Derived ──
  const completedCount = juzList.filter((j) => j.status === "COMPLETED").length;
  const reservedCount  = juzList.filter((j) => j.status === "RESERVED").length;
  const availableCount = juzList.filter((j) => j.status === "AVAILABLE").length;
  const progress       = getKhatmProgress(completedCount);

  const canTakeJuz  = userActiveJuzCount < 2 && khatm.status === "ACTIVE" && isParticipant;
  const isAdmin     = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(userRole);

  const myActiveJuz = useMemo(
    () => juzList.filter((j) => j.assignedToId === userId && j.status === "RESERVED"),
    [juzList, userId]
  );

  const displayJuz = useMemo(
    () => (onlyMine ? juzList.filter((j) => j.assignedToId === userId) : juzList),
    [juzList, onlyMine, userId]
  );

  // ── Helpers ──
  const assigneeName = (juz: JuzItem) => {
    if (!juz.assignedTo) return null;
    return (
      [juz.assignedTo.firstName, juz.assignedTo.lastName].filter(Boolean).join(" ") ||
      juz.assignedTo.username ||
      "Foydalanuvchi"
    );
  };

  // ── Actions ──
  const handleJoin = async () => {
    setJoining(true);
    try {
      // Shared havola orqali kelingan bo'lsa — URL dagi ?code= ni ishlatamiz
      const codeFromUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("code")
          : null;
      const res = await fetch(`/api/khatms/${khatm.id}/join`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(codeFromUrl ? { inviteCode: codeFromUrl } : {}),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "✅ Qo'shildingiz!", description: "Endi pora olishingiz mumkin" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  // Pora olish (modal tasdiqlanganidan keyin)
  const handleTakeConfirmed = async () => {
    if (!confirmTake) return;
    const juz = confirmTake;
    setLoading(juz.id + "_take");
    try {
      const res = await fetch(`/api/juz/${juz.id}/take`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      setJuzList((prev) =>
        prev.map((j) =>
          j.id === juz.id
            ? { ...j, status: "RESERVED", assignedToId: userId,
                assignedTo: { id: userId, firstName: null, lastName: null,
                               photoUrl: null, username: null } }
            : j
        )
      );
      toast({ title: `📖 ${juz.juzNumber}-pora olindi!`, description: "3 kun ichida o'qing" });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
      setConfirmTake(null);
    }
  };

  // Pora tasdiqlash (O'qib bo'ldim)
  const handleComplete = async (juz: JuzItem) => {
    setLoading(juz.id + "_complete");
    try {
      const res = await fetch(`/api/juz/${juz.id}/complete`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      setJuzList((prev) =>
        prev.map((j) => (j.id === juz.id ? { ...j, status: "COMPLETED" } : j))
      );
      toast({
        title: `🎉 ${juz.juzNumber}-pora tasdiqlandi!`,
        description: "+10 Ajr Ball qo'shildi",
      });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Porani qaytarish (voz kechish)
  const handleReleaseConfirmed = async () => {
    if (!confirmRelease) return;
    const juz = confirmRelease;
    setLoading(juz.id + "_release");
    try {
      const res = await fetch(`/api/juz/${juz.id}/release`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      setJuzList((prev) =>
        prev.map((j) =>
          j.id === juz.id
            ? { ...j, status: "AVAILABLE", assignedToId: null,
                assignedTo: null, deadline: null }
            : j
        )
      );
      toast({ title: `↩️ ${juz.juzNumber}-pora qaytarildi`, description: "Pora bo'sh holatga o'tdi" });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
      setConfirmRelease(null);
    }
  };

  // Join request tasdiqlash / rad etish (creator uchun)
  const handleRequest = async (requestId: string, action: "approve" | "reject") => {
    setLoading(requestId + action);
    try {
      const res = await fetch(`/api/khatms/${khatm.id}/requests`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ requestId, action }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast({
        title: action === "approve" ? "✅ So'rov tasdiqlandi" : "❌ So'rov rad etildi",
      });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Ulashish — toza, ochiladigan havola (taklif kodi URL ichida query param sifatida)
  const handleShare = async () => {
    const base = `${window.location.origin}/khatms/${khatm.id}`;
    const shareUrl = khatm.inviteCode ? `${base}?code=${khatm.inviteCode}` : base;
    try {
      // Mobil/Telegram: native ulashish oynasi (mavjud bo'lsa)
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: khatm.title, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "📋 Havola nusxalandi!",
        description: khatm.inviteCode ? `Taklif kodi: ${khatm.inviteCode}` : shareUrl,
      });
    } catch {
      // navigator.share bekor qilinsa yoki clipboard ishlamasa
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "📋 Havola nusxalandi!", description: shareUrl });
      } catch {
        toast({ title: "Havolani nusxalab bo'lmadi", description: shareUrl, variant: "destructive" });
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Back ── */}
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
        <Link href="/khatms">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Xatmlarga qaytish
        </Link>
      </Button>

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl gradient-emerald-dark p-6 text-white shadow-lg">
        {/* bg decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/5" />
          <div className="absolute right-20 bottom-0 h-28 w-28 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-2">
            {khatm.type === "PRIVATE"
              ? <><Lock className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-emerald-200 text-xs font-medium">Shaxsiy xatm</span></>
              : <><Globe className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-emerald-200 text-xs font-medium">Guruhli xatm</span></>
            }
          </div>

          <h1 className="text-2xl font-bold tracking-tight">{khatm.title}</h1>
          {khatm.description && (
            <p className="text-emerald-100 mt-1.5 text-sm leading-relaxed max-w-lg">
              {khatm.description}
            </p>
          )}

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2.5 mt-5">
            {[
              { label: "Yakunlandi", value: `${progress}%` },
              { label: "Ishtirokchi", value: khatm._count?.participations ?? khatm.participations.length },
              { label: "Bo'sh pora", value: availableCount },
              { label: "O'qildi", value: completedCount },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl px-4 py-2 text-center min-w-[80px]">
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[11px] text-white/75 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              {completedCount}/30 pora o'qildi
            </p>
          </div>
        </div>

        {/* Share button */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
            onClick={handleShare}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Ulashish
          </Button>
          {khatm.inviteCode && (
            <div className="bg-white/15 rounded-lg px-2.5 py-1 text-center">
              <p className="text-[10px] text-white/70">Taklif kodi</p>
              <p className="text-white font-bold text-sm tracking-widest">{khatm.inviteCode}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Join banner ── */}
      {!isParticipant && khatm.status === "ACTIVE" && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Bu xatmga qo'shilmadingiz</p>
              <p className="text-xs text-emerald-600">Pora olish uchun avval qo'shiling</p>
            </div>
          </div>
          <Button variant="emerald" size="sm" onClick={handleJoin} disabled={joining}>
            {joining ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Users className="h-4 w-4 mr-1" />}
            Qo'shilish
          </Button>
        </div>
      )}

      {/* ── My active juz ── */}
      {myActiveJuz.length > 0 && (
        <Card className="border-l-4 border-l-amber-400 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Mening faol poralarim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {myActiveJuz.map((juz) => (
              <div
                key={juz.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-white font-bold text-sm">{juz.juzNumber}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{juz.juzNumber}-pora — {JUZ_NAMES[juz.juzNumber]}</p>
                    {juz.deadline && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        ⏰ Muddat: {formatDate(juz.deadline)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Voz kechish */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-red-200 text-red-500 hover:bg-red-50"
                    disabled={loading === juz.id + "_release"}
                    onClick={() => setConfirmRelease(juz)}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Voz kechish
                  </Button>
                  {/* Progress modal tugma */}
                  <Button
                    variant="emerald"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setProgressJuz(juz)}
                  >
                    <BarChart2 className="h-3.5 w-3.5 mr-1" />
                    Progress
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── 30 Juz grid ── */}
      <div className="space-y-4">
        {/* Header + filter */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">30 Pora</h2>
            {/* Mening poralarim filter */}
            <button
              onClick={() => setOnlyMine((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                onlyMine
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
              )}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Mening poralarim
              {onlyMine && myActiveJuz.length > 0 && (
                <span className="ml-1 bg-white/30 rounded-full px-1.5">{myActiveJuz.length}</span>
              )}
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {[
              { color: "bg-gray-300",    label: "Bo'sh" },
              { color: "bg-amber-400",   label: "Band" },
              { color: "bg-emerald-500", label: "O'qildi" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 font-medium">
                <span className={`h-2.5 w-2.5 rounded-sm ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {displayJuz.map((juz) => {
            const cfg     = JUZ_STATUS_CONFIG[juz.status];
            const isMyJuz = juz.assignedToId === userId;
            const isAvailable = juz.status === "AVAILABLE";
            const isReserved  = juz.status === "RESERVED";
            const isCompleted = juz.status === "COMPLETED";
            const takingThis  = loading === juz.id + "_take";
            const canClick    = isAvailable && canTakeJuz && !takingThis;

            return (
              <div
                key={juz.id}
                onClick={() => canClick && setConfirmTake(juz)}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-150 select-none",
                  cfg.bg,
                  canClick ? cn(cfg.bgHover, "cursor-pointer") : "cursor-default",
                  isMyJuz && isReserved && "ring-2 ring-amber-400 ring-offset-1",
                  isMyJuz && isCompleted && "ring-2 ring-emerald-400 ring-offset-1"
                )}
              >
                {/* Juz number */}
                <div className="flex items-start justify-between mb-1.5">
                  <span className={cn("text-xl font-extrabold leading-none", cfg.numColor)}>
                    {juz.juzNumber}
                  </span>
                  {/* Status icon */}
                  {isCompleted && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  {isReserved && !isMyJuz && (
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  {isReserved && isMyJuz && (
                    <span className="text-[10px] bg-amber-400 text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">
                      Men
                    </span>
                  )}
                  {takingThis && (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500 shrink-0" />
                  )}
                </div>

                {/* Juz name */}
                <p className={cn("text-[10px] font-medium leading-tight", cfg.numColor, "opacity-80")}>
                  {JUZ_NAMES[juz.juzNumber]}
                </p>

                {/* Status label */}
                {isAvailable && canClick && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1.5">
                    Bosing → olish
                  </p>
                )}
                {isAvailable && !canTakeJuz && isParticipant && (
                  <p className="text-[10px] text-gray-400 mt-1.5">Bo'sh</p>
                )}

                {/* Reserved: progress bar */}
                {isReserved && isMyJuz && (() => {
                  const pg = juz.progress;
                  const pagesRead = pg?.pagesRead ?? 0;
                  const total     = pg?.totalPages ?? JUZ_TOTAL_PAGES;
                  const pct       = getJuzPageProgress(pagesRead, total);
                  return (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-amber-600">
                        <span>{pagesRead}/{total} bet</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <button
                        className="text-[10px] text-amber-700 font-semibold hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProgressJuz(juz);
                        }}
                      >
                        📖 Yangilash
                      </button>
                    </div>
                  );
                })()}

                {/* Reserved: assignee */}
                {isReserved && juz.assignedTo && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={juz.assignedTo.photoUrl ?? ""} />
                      <AvatarFallback className="text-[8px] bg-amber-100 text-amber-700">
                        {juz.assignedTo.firstName?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-[10px] text-amber-700 font-medium truncate">
                      {isMyJuz ? "Sizda" : assigneeName(juz)}
                    </p>
                  </div>
                )}

                {/* Completed */}
                {isCompleted && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1.5">
                    ✓ O'qildi
                  </p>
                )}

                {/* Voz kechish — my reserved juz */}
                {isMyJuz && isReserved && (
                  <button
                    className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-colors"
                    title="Voz kechish"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmRelease(juz);
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state for "only mine" filter */}
        {onlyMine && displayJuz.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Siz hali birorta pora olmadingiz
          </div>
        )}
      </div>

      {/* ── Join Requests (creator uchun) ── */}
      {isCreator && joinRequests.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-purple-600" />
              Qo'shilish so'rovlari
              <span className="ml-auto bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {joinRequests.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {joinRequests.map((req: any) => {
              const name = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ") || "Foydalanuvchi";
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-700 font-bold">
                      {name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{name}</p>
                    {req.user?.username && (
                      <p className="text-xs text-muted-foreground">@{req.user.username}</p>
                    )}
                    {req.message && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">"{req.message}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="emerald"
                      className="h-8 text-xs"
                      disabled={!!loading}
                      onClick={() => handleRequest(req.id, "approve")}
                    >
                      {loading === req.id + "approve"
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <><Check className="h-3.5 w-3.5 mr-1" /> Qabul</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-red-200 text-red-500 hover:bg-red-50"
                      disabled={!!loading}
                      onClick={() => handleRequest(req.id, "reject")}
                    >
                      {loading === req.id + "reject"
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <><X className="h-3.5 w-3.5 mr-1" /> Rad</>}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Participants ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            Ishtirokchilar ({khatm.participations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {khatm.participations.map((p: any) => {
              const name = [p.user.firstName, p.user.lastName].filter(Boolean).join(" ")
                        || p.user.name || "Foydalanuvchi";
              const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

              // User's juz in this khatm
              const userJuz = juzList.filter((j) => j.assignedToId === p.userId);
              const completedUserJuz = userJuz.filter((j) => j.status === "COMPLETED");
              const reservedUserJuz  = userJuz.filter((j) => j.status === "RESERVED");

              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={p.user.photoUrl ?? p.user.image ?? ""} />
                    <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate">{name}</p>
                      {p.userId === khatm.createdById && (
                        <Badge variant="success" className="text-[10px] py-0">Tashkilotchi</Badge>
                      )}
                    </div>
                    {/* Juz info */}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {completedUserJuz.length > 0 && (
                        <span className="text-emerald-600 font-medium">
                          ✓ {completedUserJuz.map((j) => `${j.juzNumber}-pora`).join(", ")} o'qildi
                        </span>
                      )}
                      {reservedUserJuz.length > 0 && (
                        <span className="text-amber-600 font-medium">
                          ⏳ {reservedUserJuz.map((j) => `${j.juzNumber}-pora`).join(", ")} o'qilmoqda
                        </span>
                      )}
                      {completedUserJuz.length === 0 && reservedUserJuz.length === 0 && (
                        <span className="text-gray-400">Hali pora olmagan</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Progress Modal ── */}      {progressJuz && (
        <JuzProgressModal
          open={!!progressJuz}
          onClose={() => setProgressJuz(null)}
          juz={{
            id:         progressJuz.id,
            juzNumber:  progressJuz.juzNumber,
            totalPages: progressJuz.totalPages ?? JUZ_TOTAL_PAGES,
            status:     progressJuz.status,
            khatmTitle: khatm.title,
          }}
          initialPages={progressJuz.progress?.pagesRead ?? 0}
          onCompleted={(result) => {
            // Update local juz status if completed
            if (result.juzCompleted) {
              setJuzList((prev) =>
                prev.map((j) =>
                  j.id === progressJuz.id
                    ? {
                        ...j,
                        status: "COMPLETED",
                        progress: {
                          pagesRead:  progressJuz.totalPages ?? JUZ_TOTAL_PAGES,
                          totalPages: progressJuz.totalPages ?? JUZ_TOTAL_PAGES,
                        },
                      }
                    : j
                )
              );
            }
          }}
        />
      )}

      {/* ── Take juz confirmation ── */}
      <ConfirmModal
        open={!!confirmTake}
        onClose={() => setConfirmTake(null)}
        onConfirm={handleTakeConfirmed}
        loading={loading === (confirmTake?.id ?? "") + "_take"}
        title={`${confirmTake?.juzNumber}-porani olmoqchimisiz?`}
        description={`"${JUZ_NAMES[confirmTake?.juzNumber ?? 1]}" — bu porani o'qib, 3 kun ichida tasdiqlashingiz kerak. Tasdiqlaysizmi?`}
        confirmLabel="Ha, olaman"
        cancelLabel="Bekor"
        icon={
          <div className="h-12 w-12 rounded-2xl gradient-emerald flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
        }
      />

      {/* Release juz confirmation */}
      <ConfirmModal
        open={!!confirmRelease}
        onClose={() => setConfirmRelease(null)}
        onConfirm={handleReleaseConfirmed}
        loading={loading === (confirmRelease?.id ?? "") + "_release"}
        title={`${confirmRelease?.juzNumber}-poradan voz kechasizmi?`}
        description="Bu pora bo'sh holatga o'tadi va boshqa foydalanuvchi olishi mumkin bo'ladi."
        confirmLabel="Ha, voz kechaman"
        cancelLabel="Bekor"
        variant="destructive"
        icon={
          <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
        }
      />
    </div>
  );
}
