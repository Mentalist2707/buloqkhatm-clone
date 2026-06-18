"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Lock, Users, CheckCircle2, Loader2, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface Props {
  initialCode:  string;
  khatmByCode:  any | null;
  userId:       string;
}

export function JoinByCodeClient({ initialCode, khatmByCode, userId }: Props) {
  const router = useRouter();
  const [code,    setCode]    = useState(initialCode.toUpperCase());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [found,   setFound]   = useState<any>(khatmByCode);
  const [sent,    setSent]    = useState(false);

  // ── Kodni qidirish ──
  const handleSearch = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/khatms?inviteCode=${code.trim().toUpperCase()}`);
      const data = await res.json();
      // Bizning API inviteCode filter qilmaydi, shuning uchun GET khatm by code
      const res2 = await fetch(`/api/khatms/by-code/${code.trim().toUpperCase()}`);
      const khatm = await res2.json();
      if (!res2.ok || khatm.error) {
        toast({ title: "Xatm topilmadi", description: "Kod noto'g'ri", variant: "destructive" });
        setFound(null);
      } else {
        setFound(khatm);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── So'rov yuborish ──
  const handleJoinRequest = async (withCode = false) => {
    if (!found) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/khatms/${found.id}/join`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          inviteCode: withCode ? code : undefined,
          message:    message || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      if (data.joined) {
        toast({ title: "✅ Qo'shildingiz!" });
        router.push(`/khatms/${found.id}`);
      } else if (data.requested) {
        setSent(true);
        toast({ title: "📨 So'rov yuborildi!", description: "Creator tasdiqlashini kuting" });
      }
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="h-6 w-6 text-purple-600" />
          Shaxsiy Xatmga Qo'shilish
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Taklif kodi orqali yoki so'rov yuborib qo'shiling
        </p>
      </div>

      {/* Kod kiritish */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Taklif kodi</Label>
            <div className="flex gap-2">
              <Input
                placeholder="RAMAZON25"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 10))}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="font-mono tracking-widest text-base uppercase"
                maxLength={10}
              />
              <Button variant="outline" onClick={handleSearch} disabled={loading || !code.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Xatm tashkilotchisidan kodni so'rang
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Topilgan xatm */}
      {found && !sent && (
        <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-base">{found.title}</h3>
                {found.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {found.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {found._count?.participations ?? 0} ishtirokchi
                  </span>
                  <span>Tashkilotchi: {found.createdBy?.firstName} {found.createdBy?.lastName}</span>
                </div>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-0 shrink-0">
                🔒 Shaxsiy
              </Badge>
            </div>

            {/* Xabar (ixtiyoriy) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Xabar (ixtiyoriy)
              </Label>
              <textarea
                rows={2}
                placeholder="O'zingiz haqida qisqacha yozing..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-2">
              {/* Kod bilan to'g'ri qo'shilish */}
              {code && found.status === "ACTIVE" && (
                <Button
                  variant="emerald"
                  className="flex-1"
                  onClick={() => handleJoinRequest(true)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  ✓ Kod bilan kirish
                </Button>
              )}

              {/* So'rov yuborish */}
              <Button
                variant="outline"
                className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                onClick={() => handleJoinRequest(false)}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                So'rov yuborish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* So'rov yuborildi */}
      {sent && (
        <Card className="border-0 shadow-sm bg-emerald-50 border border-emerald-200">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-emerald-800">So'rov yuborildi!</p>
            <p className="text-sm text-emerald-600 mt-1">
              Tashkilotchi tasdiqlashini kuting. Tasdiqlanganida bildirishnoma olasiz.
            </p>
            <Button variant="emerald" className="mt-4" onClick={() => router.push("/khatms")}>
              Xatmlarga qaytish
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
