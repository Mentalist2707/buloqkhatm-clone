"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Globe,
  Shield,
  Save,
  Loader2,
  Bell,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/components/providers/user-provider";
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
    coins: number;
    level: string;
    createdAt: string;
  };
}

export function SettingsClient({ user }: Props) {
  const router = useRouter();
  const { refresh } = useUser();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [country, setCountry] = useState(user.country ?? "");
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const avatar = user.photoUrl ?? user.image ?? "";
  const displayName =
    user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Men";
  const initials = displayName[0]?.toUpperCase() ?? "M";

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || null, country: country || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Xatolik");
      setSaved(true);
      toast({ title: "✅ Sozlamalar saqlandi!" });
      await refresh();
      router.refresh();
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Xatolik");
      toast({ title: "Barcha ma'lumotlar tozalandi" });
      await refresh();
      router.push("/dashboard");
      router.refresh();
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
              <p className="text-sm text-muted-foreground">Shaxsiy hisob</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="name">Ismingiz</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ismingizni kiriting"
            />
            <p className="text-xs text-muted-foreground">
              Bosh sahifada va profilda ko'rsatiladi.
            </p>
          </div>
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
              <p className="text-xs text-muted-foreground">Daraja</p>
              <p className="font-semibold mt-1 text-emerald-600">{user.level}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-xs text-muted-foreground">Ajr Ballar</p>
              <p className="font-bold text-lg mt-0.5">{user.coins}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-xs text-muted-foreground">Boshlangan</p>
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
          <p className="text-xs text-muted-foreground">
            Pora va kitob muddatlari haqidagi eslatmalar bildirishnomalar bo'limida ko'rsatiladi.
          </p>
        </CardContent>
      </Card>

      {/* Danger zone — barcha ma'lumotni tozalash */}
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
              <p className="font-medium text-sm">Barcha ma'lumotlarni tozalash</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                Ballaringiz, medallaringiz, xatmlaringiz va kitoblaringiz butunlay o'chiriladi va
                hisob noldan boshlanadi. Bu amalni ortga qaytarib bo'lmaydi.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Tozalash
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={handleReset}
        loading={deleting}
        variant="destructive"
        title="Barcha ma'lumotlarni tozalaysizmi?"
        description="Bu amal qaytarib bo'lmaydi. Ballaringiz, medallaringiz, xatmlaringiz va kitoblaringiz butunlay o'chiriladi."
        confirmLabel="Ha, tozalash"
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
