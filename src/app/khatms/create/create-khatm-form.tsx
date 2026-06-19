"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Globe,
  Lock,
  Loader2,
  Calendar,
  FileText,
  Info,
  Clock,
  Save,
  RotateCcw,
  CheckSquare,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Local storage key ────────────────────────────────────────────────────────
const DRAFT_KEY = "buloqkhatm_create_draft";

interface FormState {
  title: string;
  description: string;
  type: "GLOBAL" | "PRIVATE";
  inviteCode: string;
  startDate: string;
  endDate: string;
  maxJuzPerUser: number;
  requireSequential: boolean;
}

const DEFAULT_FORM: FormState = {
  title: "",
  description: "",
  type: "GLOBAL",
  inviteCode: "",
  startDate: "",
  endDate: "",
  maxJuzPerUser: 2,
  requireSequential: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(start: string, end: string): number | null {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
}

function avgJuzPerDay(days: number | null, maxPerUser: number, participants = 30): string | null {
  if (!days) return null;
  const total = 30; // always 30 juz
  const perDay = (total / days).toFixed(1);
  return perDay;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateKhatmForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  // ── Auto-save draft to localStorage ──
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft: FormState = JSON.parse(saved);
        if (draft.title || draft.description) {
          setShowRestorePrompt(true);
        }
      } catch { /* ignore */ }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (form.title || form.description) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }
  }, [form]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        setForm(JSON.parse(saved));
        toast({ title: "📝 Qoralama tiklandi!" });
      }
    } catch { /* ignore */ }
    setShowRestorePrompt(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowRestorePrompt(false);
  };

  const clearForm = () => {
    setForm(DEFAULT_FORM);
    localStorage.removeItem(DRAFT_KEY);
    toast({ title: "Forma tozalandi" });
  };

  // ── Smart date calculation ──
  const days = daysBetween(form.startDate, form.endDate);
  const juzPerDay = days ? avgJuzPerDay(days, form.maxJuzPerUser) : null;

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Xato", description: "Xatm nomini kiriting", variant: "destructive" });
      return;
    }
    if (form.endDate && form.startDate && form.endDate <= form.startDate) {
      toast({ title: "Xato", description: "Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/khatms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          type: form.type,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          maxJuzPerUser: form.maxJuzPerUser,
          requireSequential: form.requireSequential,
          inviteCode: form.type === "PRIVATE" && form.inviteCode ? form.inviteCode : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Xatolik yuz berdi");
      }

      const data = await res.json();
      localStorage.removeItem(DRAFT_KEY);
      toast({ title: "✅ Xatm yaratildi!", description: "30 pora avtomatik taqsimlandi" });
      router.push(`/khatms/${data.id}`);
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">

      {/* ── Restore draft prompt ── */}
      {showRestorePrompt && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <Save className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              Saqlangan qoralama topildi
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Avval to'ldirilgan ma'lumotlarni tiklashni xohlaysizmi?
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button type="button" size="sm" variant="outline"
              className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={restoreDraft}>
              Tiklash
            </Button>
            <Button type="button" size="sm" variant="ghost"
              className="h-7 text-xs text-amber-500"
              onClick={discardDraft}>
              Yo'q
            </Button>
          </div>
        </div>
      )}

      {/* ── 1. Asosiy ma'lumotlar ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            Asosiy ma'lumotlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Xatm nomi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Masalan: Ramazon Xatmi 2025"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-white"
              maxLength={100}
              required
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {form.title.length}/100
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Xatm haqida qisqacha ma'lumot..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              className="flex w-full rounded-xl border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-shadow"
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {form.description.length}/500
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Xatm turi ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <Globe className="h-4 w-4 text-blue-600" />
            </div>
            Xatm turi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* GLOBAL */}
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "GLOBAL" })}
              className={cn(
                "p-4 rounded-2xl border-2 text-left transition-all duration-200 group",
                "hover:-translate-y-0.5 hover:shadow-md",
                form.type === "GLOBAL"
                  ? "border-emerald-500 bg-emerald-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-emerald-300"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center mb-2.5 transition-colors",
                form.type === "GLOBAL" ? "bg-emerald-500" : "bg-gray-100 group-hover:bg-emerald-100"
              )}>
                <Globe className={cn("h-5 w-5", form.type === "GLOBAL" ? "text-white" : "text-gray-400")} />
              </div>
              <p className={cn("font-bold text-sm", form.type === "GLOBAL" ? "text-emerald-700" : "text-gray-700")}>
                Guruhli
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Barcha uchun ochiq</p>
              {form.type === "GLOBAL" && (
                <Badge variant="success" className="mt-2 text-[10px]">✓ Tanlangan</Badge>
              )}
            </button>

            {/* PRIVATE */}
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "PRIVATE" })}
              className={cn(
                "p-4 rounded-2xl border-2 text-left transition-all duration-200 group",
                "hover:-translate-y-0.5 hover:shadow-md",
                form.type === "PRIVATE"
                  ? "border-purple-500 bg-purple-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-purple-300"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center mb-2.5 transition-colors",
                form.type === "PRIVATE" ? "bg-purple-500" : "bg-gray-100 group-hover:bg-purple-100"
              )}>
                <Lock className={cn("h-5 w-5", form.type === "PRIVATE" ? "text-white" : "text-gray-400")} />
              </div>
              <p className={cn("font-bold text-sm", form.type === "PRIVATE" ? "text-purple-700" : "text-gray-700")}>
                Shaxsiy
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Taklif kodi bilan</p>
              {form.type === "PRIVATE" && (
                <Badge className="mt-2 text-[10px] bg-purple-100 text-purple-700 border-0">✓ Tanlangan</Badge>
              )}
            </button>
          </div>

          {/* Private: invite code input — animated */}
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            form.type === "PRIVATE" ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 space-y-2">
              <Label htmlFor="inviteCode" className="text-purple-700 font-semibold flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                Maxsus taklif kodi (ixtiyoriy)
              </Label>
              <Input
                id="inviteCode"
                placeholder="RAMAZ25 — bo'sh qolsa avtomatik yaratiladi"
                value={form.inviteCode}
                onChange={(e) => setForm({ ...form, inviteCode: e.target.value.toUpperCase().slice(0, 10) })}
                className="bg-white border-purple-200 focus-visible:ring-purple-400 uppercase tracking-widest font-mono"
                maxLength={10}
              />
              <p className="text-xs text-purple-600">
                Faqat shu kodni bilganlar xatmga qo'shila oladi
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Sanalar ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
            Sanalar (ixtiyoriy)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Boshlanish sanasi</Label>
              <Input
                id="startDate"
                type="date"
                min={today()}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="bg-white w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">Tugash sanasi</Label>
              <Input
                id="endDate"
                type="date"
                min={form.startDate || today()}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="bg-white w-full"
              />
            </div>
          </div>

          {/* Smart date hint — animated */}
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            days ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
          )}>
            {days && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-semibold">Ushbu xatm {days} kun davom etadi.</span>
                  {juzPerDay && (
                    <> Kuniga o'rtacha{" "}
                      <span className="font-bold">{juzPerDay} ta</span>{" "}
                      pora o'qilishi kerak.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Sozlamalar ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
            Pora Sozlamalari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Max juz per user */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              Foydalanuvchi boshiga maksimal pora soni
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                {form.maxJuzPerUser === 0 ? "∞" : form.maxJuzPerUser}
              </span>
            </Label>
            <div className="flex items-center gap-2 flex-wrap">
              {[1, 2, 3, 5, 10, 0].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, maxJuzPerUser: n })}
                  className={cn(
                    "h-9 min-w-[44px] px-3 rounded-xl border-2 text-sm font-bold transition-all",
                    form.maxJuzPerUser === n
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-600"
                  )}
                >
                  {n === 0 ? "∞" : n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {form.maxJuzPerUser === 0
                ? "Cheksiz — foydalanuvchi xohlagancha pora olishi mumkin"
                : `Har bir foydalanuvchi bir vaqtda maksimal ${form.maxJuzPerUser} ta pora olishi mumkin`}
            </p>
          </div>

          {/* Sequential checkbox */}
          <label className={cn(
            "flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
            form.requireSequential
              ? "border-emerald-400 bg-emerald-50"
              : "border-gray-200 bg-white hover:border-emerald-200"
          )}>
            <div className={cn(
              "mt-0.5 h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
              form.requireSequential
                ? "border-emerald-500 bg-emerald-500"
                : "border-gray-300"
            )}>
              {form.requireSequential && (
                <CheckSquare className="h-3.5 w-3.5 text-white" />
              )}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={form.requireSequential}
              onChange={(e) => setForm({ ...form, requireSequential: e.target.checked })}
            />
            <div>
              <p className={cn(
                "text-sm font-semibold",
                form.requireSequential ? "text-emerald-700" : "text-gray-700"
              )}>
                Faqat ketma-ket poralarni olish
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Foydalanuvchilar faqat navbatdagi bo'sh poralarni olishi mumkin (1, 2, 3...)
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* ── Info box ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
          <Info className="h-4 w-4 text-white" />
        </div>
        <div className="text-sm">
          <p className="font-semibold text-emerald-800">Avtomatik taqsimlash</p>
          <p className="text-emerald-700 mt-0.5 leading-relaxed text-xs">
            Xatm yaratilgandan so'ng Qur'onning 30 porasi avtomatik tarzda{" "}
            <strong>bo'sh</strong> holda yaratiladi. Har bir ishtirokchi
            maksimal <strong>{form.maxJuzPerUser === 0 ? "cheksiz" : `${form.maxJuzPerUser} ta`}</strong>{" "}
            pora olishi mumkin.
          </p>
        </div>
      </div>

      {/* ── Buttons ── */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={clearForm}
          disabled={loading}
        >
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Tozalash
        </Button>
        <Button
          type="submit"
          variant="emerald"
          className="flex-1 shadow-sm"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Yaratilmoqda...
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4 mr-2" />
              Xatm Yaratish
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
