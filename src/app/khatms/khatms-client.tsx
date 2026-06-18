"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Search,
  Plus,
  Clock,
  LayoutGrid,
  List,
  Globe,
  Lock,
  CheckCircle2,
  Flame,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { JuzDots, JuzDotsLegend } from "@/components/ui/juz-dots";
import { useDebounce } from "@/hooks/use-debounce";
import { getKhatmProgress, formatDate, cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = "ALL" | "ACTIVE" | "COMPLETED";
type ViewMode    = "grid" | "list";

interface Participant {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  };
}

interface Juz {
  juzNumber: number;
  status: "AVAILABLE" | "RESERVED" | "COMPLETED";
}

interface Khatm {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  type: "GLOBAL" | "PRIVATE";
  endDate: string | null;
  createdAt: string;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  };
  _count: { participations: number };
  juzList: Juz[];
  participations: Participant[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT:     { label: "Qoralama", variant: "draft"      as const, icon: null },
  ACTIVE:    { label: "Faol",     variant: "active"     as const, icon: Flame },
  COMPLETED: { label: "Yakunlangan", variant: "completed" as const, icon: CheckCircle2 },
  CANCELLED: { label: "Bekor",    variant: "cancelled"  as const, icon: null },
};

// ─── KhatmCard (Grid) ─────────────────────────────────────────────────────────

function KhatmCardGrid({ khatm }: { khatm: Khatm }) {
  const completedJuz  = khatm.juzList.filter((j) => j.status === "COMPLETED").length;
  const reservedJuz   = khatm.juzList.filter((j) => j.status === "RESERVED").length;
  const availableJuz  = 30 - completedJuz - reservedJuz;
  const progress      = getKhatmProgress(completedJuz);
  const status        = STATUS_CONFIG[khatm.status];
  const StatusIcon    = status.icon;
  const isActive      = khatm.status === "ACTIVE";

  // Participants for AvatarGroup
  const participants  = khatm.participations.map((p) => ({
    id: p.user.id,
    firstName: p.user.firstName,
    lastName: p.user.lastName,
    photoUrl: p.user.photoUrl,
  }));

  const authorName = [khatm.createdBy.firstName, khatm.createdBy.lastName]
    .filter(Boolean).join(" ") || "Noma'lum";

  return (
    <Card className="card-hover border-0 shadow-sm group overflow-hidden flex flex-col">
      {/* Top color bar */}
      <div className={cn(
        "h-1.5 w-full shrink-0",
        khatm.status === "ACTIVE"    ? "gradient-emerald" :
        khatm.status === "COMPLETED" ? "bg-blue-400"      : "bg-gray-300"
      )} />

      <CardContent className="p-4 flex flex-col gap-3 flex-1">

        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-snug truncate group-hover:text-emerald-600 transition-colors">
              {khatm.title}
            </h3>
            {khatm.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {khatm.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant={status.variant} className="text-[10px] flex items-center gap-1">
              {StatusIcon && <StatusIcon className="h-2.5 w-2.5" />}
              {status.label}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] flex items-center gap-1 border-gray-200"
            >
              {khatm.type === "PRIVATE"
                ? <><Lock className="h-2.5 w-2.5" /> Shaxsiy</>
                : <><Globe className="h-2.5 w-2.5" /> Guruhli</>}
            </Badge>
          </div>
        </div>

        {/* ── Progress ── */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              {completedJuz}/30 pora o'qildi
            </span>
            <span className={cn(
              "font-bold",
              progress === 100 ? "text-blue-600" : "text-emerald-600"
            )}>
              {progress}%
            </span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-gray-100"
          />
        </div>

        {/* ── Juz dots ── */}
        <JuzDots juzList={khatm.juzList} />

        {/* ── Meta row ── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Participants */}
          <div className="flex items-center gap-1.5">
            {participants.length > 0 ? (
              <AvatarGroup users={participants} max={4} totalCount={khatm._count.participations} />
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
              </div>
            )}
            <span className="text-xs text-muted-foreground font-medium">
              {khatm._count.participations} kishi
            </span>
          </div>

          {/* Available juz */}
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            availableJuz > 0
              ? "bg-emerald-50 text-emerald-600"
              : "bg-gray-100 text-gray-400"
          )}>
            {availableJuz > 0 ? `${availableJuz} bo'sh pora` : "Pora yo'q"}
          </span>
        </div>

        {/* ── Author ── */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-gray-50 pt-2">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">
            Tashkilotchi: <span className="font-medium text-gray-600">{authorName}</span>
          </span>
          {khatm.endDate && (
            <>
              <span className="text-gray-300">•</span>
              <Clock className="h-3 w-3 shrink-0" />
              <span className="shrink-0">{formatDate(khatm.endDate)}</span>
            </>
          )}
        </div>

        {/* ── CTA Button ── */}
        <Button
          variant={isActive ? "emerald" : "outline"}
          size="sm"
          className="w-full h-8 text-xs font-semibold mt-auto"
          asChild
        >
          <Link href={`/khatms/${khatm.id}`}>
            {isActive ? "Qo'shilish / Ko'rish" : "Ko'rish"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── KhatmCard (List) ─────────────────────────────────────────────────────────

function KhatmCardList({ khatm }: { khatm: Khatm }) {
  const completedJuz = khatm.juzList.filter((j) => j.status === "COMPLETED").length;
  const reservedJuz  = khatm.juzList.filter((j) => j.status === "RESERVED").length;
  const availableJuz = 30 - completedJuz - reservedJuz;
  const progress     = getKhatmProgress(completedJuz);
  const status       = STATUS_CONFIG[khatm.status];
  const StatusIcon   = status.icon;
  const isActive     = khatm.status === "ACTIVE";

  const participants = khatm.participations.map((p) => ({
    id: p.user.id,
    firstName: p.user.firstName,
    lastName: p.user.lastName,
    photoUrl: p.user.photoUrl,
  }));

  const authorName = [khatm.createdBy.firstName, khatm.createdBy.lastName]
    .filter(Boolean).join(" ") || "Noma'lum";

  return (
    <Card className="card-hover border-0 shadow-sm group overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">

          {/* Left: info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm group-hover:text-emerald-600 transition-colors truncate">
                {khatm.title}
              </h3>
              <Badge variant={status.variant} className="text-[10px] flex items-center gap-1 shrink-0">
                {StatusIcon && <StatusIcon className="h-2.5 w-2.5" />}
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] flex items-center gap-1 border-gray-200 shrink-0">
                {khatm.type === "PRIVATE"
                  ? <><Lock className="h-2.5 w-2.5" /> Shaxsiy</>
                  : <><Globe className="h-2.5 w-2.5" /> Guruhli</>}
              </Badge>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-[200px]">
                <Progress value={progress} className="h-2 bg-gray-100" />
              </div>
              <span className="text-xs font-bold text-emerald-600 shrink-0">
                {completedJuz}/30 — {progress}%
              </span>
            </div>

            {/* Juz dots */}
            <JuzDots juzList={khatm.juzList} />

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {authorName}
              </span>
              <span className="flex items-center gap-1.5">
                {participants.length > 0 && (
                  <AvatarGroup users={participants} max={3} totalCount={khatm._count.participations} />
                )}
                {khatm._count.participations} ishtirokchi
              </span>
              <span className={cn(
                "font-semibold",
                availableJuz > 0 ? "text-emerald-600" : "text-gray-400"
              )}>
                {availableJuz > 0 ? `${availableJuz} bo'sh` : "To'lgan"}
              </span>
              {khatm.endDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(khatm.endDate)}
                </span>
              )}
            </div>
          </div>

          {/* Right: CTA */}
          <Button
            variant={isActive ? "emerald" : "outline"}
            size="sm"
            className="h-8 text-xs font-semibold shrink-0 min-w-[120px]"
            asChild
          >
            <Link href={`/khatms/${khatm.id}`}>
              {isActive ? "Qo'shilish / Ko'rish" : "Ko'rish"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  khatms: Khatm[];
  userId: string;
}

export function KhatmsClient({ khatms, userId }: Props) {
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<FilterStatus>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Debounced search — 300ms kechikish
  const debouncedSearch = useDebounce(search, 300);

  const filtered = khatms.filter((k) => {
    const matchSearch =
      k.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (k.description ?? "").toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchFilter = filter === "ALL" || k.status === filter;
    return matchSearch && matchFilter;
  });

  const activeCount    = khatms.filter((k) => k.status === "ACTIVE").length;
  const completedCount = khatms.filter((k) => k.status === "COMPLETED").length;

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Xatmlar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {khatms.length} ta xatm •{" "}
            <span className="text-emerald-600 font-medium">{activeCount} faol</span>
            {completedCount > 0 && (
              <> • <span className="text-blue-600 font-medium">{completedCount} yakunlangan</span></>
            )}
          </p>
        </div>
        <Button variant="emerald" asChild className="shadow-sm shrink-0">
          <Link href="/khatms/create">
            <Plus className="h-4 w-4 mr-2" />
            Yangi Xatm
          </Link>
        </Button>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Xatm qidirish... (debounced 300ms)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200"
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 shrink-0">
          {(["ALL", "ACTIVE", "COMPLETED"] as FilterStatus[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "emerald" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="h-9 text-xs"
            >
              {f === "ALL" ? `Barchasi (${khatms.length})` :
               f === "ACTIVE" ? `Faol (${activeCount})` :
               `Yakunlangan (${completedCount})`}
            </Button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0 bg-white">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex items-center justify-center h-9 w-9 transition-colors",
              viewMode === "grid"
                ? "bg-emerald-500 text-white"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            )}
            title="Grid ko'rinish"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center justify-center h-9 w-9 transition-colors",
              viewMode === "list"
                ? "bg-emerald-500 text-white"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            )}
            title="List ko'rinish"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      {filtered.length > 0 && (
        <JuzDotsLegend />
      )}

      {/* ── Content ── */}
      {filtered.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((khatm) => (
              <KhatmCardGrid key={khatm.id} khatm={khatm} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((khatm) => (
              <KhatmCardList key={khatm.id} khatm={khatm} />
            ))}
          </div>
        )
      ) : (
        <Card className="border-dashed border-2 border-gray-200 bg-white shadow-none">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
              <BookOpen className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="font-semibold text-gray-700">
              {debouncedSearch ? `"${debouncedSearch}" bo'yicha xatm topilmadi` : "Hozirda xatm yo'q"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {debouncedSearch ? "Boshqa kalit so'z kiriting" : "Birinchi xatmni yarating"}
            </p>
            {!debouncedSearch && (
              <Button variant="emerald" size="sm" className="mt-4" asChild>
                <Link href="/khatms/create">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Xatm yaratish
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
