"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Globe,
  Shield,
  LogOut,
  Save,
  Loader2,
  Bell,
  Smartphone,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";
import { formatDate } from "@/lib/utils";

const COUNTRIES = [
  "O'zbekiston", "Rossiya", "Qozog'iston", "Turkiya", "UAE",
  "USA", "UK", "Germaniya", "Fransiya", "Saudiya Arabistoni",
  "Misr", "Malayziya", "Indoneziya", "Pokiston", "Hindiston", "Boshqa",
];

interface Props {
  user: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    email: string | null;
    photoUrl: string | null;
    image: string | null;
    country: string | null;
    telegramId: string | null;
    role: string;
    coins: number;
    level: string;
    createdAt: string;
  };
}

export function SettingsClient({ user }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState(user.country ?? "");
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const avatar = user.photoUrl ?? user.image ?? "";
  const initials = `${user.firstName?.[0] ?? user.name?.[0] ?? "?"}`.toUpperCase();
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.name ||
    "Foydalanuvchi";

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: country || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Xatolik");
      setSaved(true);
      toast({ title: "✅ Sozlamalar saqlandi!" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Xatolik");
      toast({ title: "Hisob o'chirildi" });
      // Sessiyani tugatib bosh sahifaga chiqaramiz
      await signOut({ callbackUrl: "/" });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold">Sozlamalar</h1>
          <p className="text-muted-foreground text-sm">Profil va hisob sozlamalari</p>
        </div>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            Profil ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-emerald-100">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-xl bg-emerald-100 text-emerald-700 font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{displayName}</p>
              {user.username && (
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              )}
              {user.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Read-only fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ism</Label>
              <Input
                value={user.firstName ?? ""}
                disabled
                className="bg-gray-50 text-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Familiya</Label>
              <Input
                value={user.lastName ?? ""}
                disabled
                className="bg-gray-50 text-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                value={user.email ?? "Telegram foydalanuvchi"}
                disabled
                className="bg-gray-50 text-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telegram</Label>
              <Input
                value={user.telegramId ? `ID: ${user.telegramId}` : "Ulanmagan"}
                disabled
                className="bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            * Ism va email Google/Telegram orqali avtomatik olinadi va o'zgartirib bo'lmaydi.
          </p>
        </CardContent>
      </Card>

      {/* Country */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-600" />
            Joylashuv
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Mamlakat</Label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">— Tanlang —</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Mamlakat statistikada ko'rsatiladi
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            variant="emerald"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saqlanmoqda...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Saqlandi!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Saqlash
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            Hisob ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-xs text-muted-foreground">Rol</p>
              <Badge
                className={`mt-1 ${
                  user.role === "SUPER_ADMIN"
                    ? "bg-purple-100 text-purple-700"
                    : user.role === "ADMIN"
                    ? "bg-blue-100 text-blue-700"
                    : user.role === "MODERATOR"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {user.role}
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-xs text-muted-foreground">Daraja</p>
              <p className="font-semibold mt-1 text-emerald-600">{user.level}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-xs text-muted-foreground">Ajr Ballar</p>
              <p className="font-bold text-lg mt-0.5">{user.coins}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-xs text-muted-foreground">A'zo bo'lgan</p>
              <p className="font-medium text-sm mt-1">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600" />
            Bildirishnomalar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Pora muddati eslatmasi", desc: "Muddat tugashidan 12 soat oldin", enabled: true },
            { label: "Xatm yakunlanganda", desc: "Ishtirok etgan xatm tugaganda", enabled: true },
            { label: "Yangi xatm ochilganda", desc: "Global yangi xatmlar haqida", enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Badge variant={item.enabled ? "success" : "secondary"} className="text-xs shrink-0">
                {item.enabled ? "Yoqiq" : "O'chiq"}
              </Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Bildirishnoma sozlamalari tez orada qo'shiladi.
          </p>
        </CardContent>
      </Card>

      {/* Telegram Mini App */}
      {!user.telegramId && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-blue-600 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-800">
                  Telegram Mini App
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Telegram botimiz orqali ham platforma bilan ishlang
                </p>
              </div>
              <Button variant="telegram" size="sm" asChild>
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "BuloqKhatmBot"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ochish
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign out */}
      <Card className="border-red-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Hisobdan chiqish</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Barcha qurilmalardan chiqish
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Chiqish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone — hisobni o'chirish */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            Xavfli zona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium text-sm">Hisobni o'chirish</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                Hisobingiz, ballaringiz, medallaringiz va siz yaratgan xatmlar butunlay o'chiriladi.
                Bu amalni ortga qaytarib bo'lmaydi.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Hisobni o'chirish
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        loading={deleting}
        variant="destructive"
        title="Hisobni o'chirishni tasdiqlaysizmi?"
        description="Bu amal qaytarib bo'lmaydi. Profilingiz, ballaringiz, medallaringiz va siz yaratgan barcha xatmlar butunlay o'chiriladi."
        confirmLabel="Ha, o'chirish"
        cancelLabel="Bekor qilish"
        icon={
          <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
        }
      />
    </div>
  );
}
