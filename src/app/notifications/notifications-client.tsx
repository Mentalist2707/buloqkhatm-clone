"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Info,
  Settings,
  Check,
  Trash2,
  Loader2,
  Filter,
  ChevronRight,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { NotificationType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

type TabFilter = "ALL" | "UNREAD" | "SYSTEM" | "KHATM";

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    leftBorder: string;
    bgUnread: string;
    label: string;
    deepLink?: (meta: any) => string | null;
  }
> = {
  KHATM_COMPLETED: {
    icon:        CheckCircle2,
    iconColor:   "text-emerald-600",
    iconBg:      "bg-emerald-100",
    leftBorder:  "border-l-emerald-500",
    bgUnread:    "bg-emerald-50/60",
    label:       "Xatm",
    deepLink:    (meta) => meta?.khatmId ? `/khatms/${meta.khatmId}` : null,
  },
  JUZ_DEADLINE: {
    icon:        AlertCircle,
    iconColor:   "text-amber-600",
    iconBg:      "bg-amber-100",
    leftBorder:  "border-l-amber-500",
    bgUnread:    "bg-amber-50/60",
    label:       "Eslatma",
    deepLink:    (meta) => meta?.khatmId ? `/khatms/${meta.khatmId}` : null,
  },
  MODERATOR_MESSAGE: {
    icon:        MessageSquare,
    iconColor:   "text-blue-600",
    iconBg:      "bg-blue-100",
    leftBorder:  "border-l-blue-500",
    bgUnread:    "bg-blue-50/60",
    label:       "Moderator",
    deepLink:    () => null,
  },
  NEW_KHATM: {
    icon:        BookOpen,
    iconColor:   "text-purple-600",
    iconBg:      "bg-purple-100",
    leftBorder:  "border-l-purple-500",
    bgUnread:    "bg-purple-50/60",
    label:       "Yangi Xatm",
    deepLink:    (meta) => meta?.khatmId ? `/khatms/${meta.khatmId}` : null,
  },
  SYSTEM: {
    icon:        Bell,
    iconColor:   "text-gray-600",
    iconBg:      "bg-gray-100",
    leftBorder:  "border-l-gray-400",
    bgUnread:    "bg-gray-50/60",
    label:       "Tizim",
    deepLink:    () => null,
  },
};

// ─── Single Notification Card ─────────────────────────────────────────────────

function NotifCard({
  notif,
  onRead,
  onDelete,
  onJoin,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onJoin?: (khatmId: string) => void;
}) {
  const cfg     = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.SYSTEM;
  const Icon    = cfg.icon;
  const deepUrl = cfg.deepLink?.(notif.metadata) ?? null;
  const isInvite = notif.type === "NEW_KHATM" && notif.metadata?.khatmId && notif.metadata?.isInvite;

  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id);
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-3.5 rounded-xl border-l-4 border border-gray-100 transition-all duration-200 group",
        cfg.leftBorder,
        !notif.isRead ? cn(cfg.bgUnread, "shadow-sm") : "bg-white hover:bg-gray-50"
      )}
      onClick={handleClick}
    >
      {/* Unread dot */}
      {!notif.isRead && (
        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-blue-500" />
      )}

      {/* Icon */}
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
        cfg.iconBg
      )}>
        <Icon className={cn("h-5 w-5", cfg.iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 border-0 font-semibold",
                cfg.iconBg, cfg.iconColor
              )}
            >
              {cfg.label}
            </Badge>
            {!notif.isRead && (
              <Badge variant="info" className="text-[10px] px-1.5 py-0 h-4">
                Yangi
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatRelativeTime(notif.createdAt)}
          </span>
        </div>

        <p className="font-semibold text-sm mt-0.5 leading-tight">{notif.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {notif.message}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {/* Deep link */}
          {deepUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={deepUrl}>
                Ko'rish
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </Button>
          )}

          {/* Invite: Join / Decline */}
          {isInvite && (
            <>
              <Button
                variant="emerald"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin?.(notif.metadata.khatmId);
                }}
              >
                ✓ Qo'shilish
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-red-200 text-red-500 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notif.id);
                }}
              >
                Rad etish
              </Button>
            </>
          )}

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notif.id);
            }}
            title="O'chirish"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [tab,           setTab]           = useState<TabFilter>("ALL");
  const [loading,       setLoading]       = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // Mark all as read on mount (syncs navbar badge)
  useEffect(() => {
    if (unreadCount > 0) {
      fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered list
  const filtered = useMemo(() => {
    switch (tab) {
      case "UNREAD": return notifications.filter((n) => !n.isRead);
      case "SYSTEM": return notifications.filter((n) => n.type === "SYSTEM" || n.type === "MODERATOR_MESSAGE");
      case "KHATM":  return notifications.filter((n) => ["KHATM_COMPLETED", "JUZ_DEADLINE", "NEW_KHATM"].includes(n.type));
      default:       return notifications;
    }
  }, [notifications, tab]);

  // ── Actions ──

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  const markAllRead = async () => {
    setLoading("mark_all");
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast({ title: "✅ Barchasi o'qilgan deb belgilandi" });
    } catch {
      toast({ title: "Xato", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const deleteOne = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  const clearAll = async () => {
    if (!confirm("Barcha bildirishnomalarni o'chirishni tasdiqlaysizmi?")) return;
    setLoading("clear");
    try {
      await fetch("/api/notifications", { method: "DELETE" });
      setNotifications([]);
      toast({ title: "🗑️ Barcha bildirishnomalar o'chirildi" });
    } catch {
      toast({ title: "Xato", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleJoin = async (khatmId: string) => {
    try {
      const res = await fetch(`/api/khatms/${khatmId}/join`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "✅ Xatmga qo'shildingiz!" });
      router.push(`/khatms/${khatmId}`);
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    }
  };

  const tabs: { key: TabFilter; label: string; count?: number }[] = [
    { key: "ALL",    label: "Barchasi",   count: notifications.length },
    { key: "UNREAD", label: "O'qilmagan", count: notifications.filter((n) => !n.isRead).length },
    { key: "KHATM",  label: "Xatm",       count: notifications.filter((n) => ["KHATM_COMPLETED","JUZ_DEADLINE","NEW_KHATM"].includes(n.type)).length },
    { key: "SYSTEM", label: "Tizim",      count: notifications.filter((n) => ["SYSTEM","MODERATOR_MESSAGE"].includes(n.type)).length },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <Bell className="h-6 w-6 text-emerald-600" />
            Bildirishnomalar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notifications.length} ta bildirishnoma
            {unreadCount > 0 && (
              <> • <span className="text-blue-600 font-semibold">{unreadCount} ta yangi</span></>
            )}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={markAllRead}
              disabled={loading === "mark_all"}
            >
              {loading === "mark_all"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                : <Check className="h-3.5 w-3.5 mr-1" />}
              Barchasini o'qildi
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-red-200 text-red-500 hover:bg-red-50"
              onClick={clearAll}
              disabled={loading === "clear"}
            >
              {loading === "clear"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              Tozalash
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-500"
            asChild
          >
            <Link href="/settings">
              <Settings className="h-3.5 w-3.5 mr-1" />
              Sozlash
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
            {(t.count ?? 0) > 0 && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                tab === t.key
                  ? t.key === "UNREAD" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                  : "bg-gray-200 text-gray-500"
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification settings hint ── */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
        <Info className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700 flex-1">
          Qaysi bildirishnomalar kelishini{" "}
          <Link href="/settings" className="font-semibold underline underline-offset-2">
            Sozlamalar
          </Link>{" "}
          sahifasidan boshqaring.
        </p>
      </div>

      {/* ── List ── */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <NotifCard
              key={notif.id}
              notif={notif}
              onRead={markRead}
              onDelete={deleteOne}
              onJoin={handleJoin}
            />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
              <Bell className="h-7 w-7 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-600">
              {tab === "UNREAD" ? "O'qilmagan xabar yo'q" :
               tab === "KHATM"  ? "Xatm bildirishnomalari yo'q" :
               tab === "SYSTEM" ? "Tizim xabarlari yo'q" :
               "Hozircha bildirishnoma yo'q"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Yangi xabarlar bu yerda paydo bo'ladi
            </p>
            {tab !== "ALL" && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => setTab("ALL")}
              >
                Barchasini ko'rish
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Legend ── */}
      {notifications.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center pt-1">
          {[
            { color: "bg-emerald-500", label: "Xatm" },
            { color: "bg-amber-500",   label: "Eslatma" },
            { color: "bg-blue-500",    label: "Moderator" },
            { color: "bg-purple-500",  label: "Yangi Xatm" },
            { color: "bg-gray-400",    label: "Tizim" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full shrink-0", l.color)} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
