"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Eye,
  XCircle,
  CheckCircle2,
  Trash2,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { formatDate, getKhatmProgress } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface Props {
  khatms: any[];
  userRole: Role;
}

const STATUS_CONFIG = {
  DRAFT: { label: "Qoralama", variant: "draft" as const },
  ACTIVE: { label: "Faol", variant: "active" as const },
  COMPLETED: { label: "Yakunlangan", variant: "completed" as const },
  CANCELLED: { label: "Bekor", variant: "cancelled" as const },
};

export function AdminKhatmsClient({ khatms: initialKhatms, userRole }: Props) {
  const [khatms, setKhatms] = useState(initialKhatms);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const canDelete = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const filtered = khatms.filter((k) =>
    k.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (
    khatmId: string,
    status: "ACTIVE" | "CANCELLED" | "COMPLETED"
  ) => {
    setLoading(khatmId + status);
    try {
      const res = await fetch(`/api/khatms/${khatmId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setKhatms((prev) =>
        prev.map((k) => (k.id === khatmId ? { ...k, status } : k))
      );
      toast({ title: "✅ Status yangilandi" });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (khatmId: string) => {
    if (!confirm("Bu xatmni o'chirishni tasdiqlaysizmi?")) return;
    setLoading(khatmId + "delete");
    try {
      const res = await fetch(`/api/khatms/${khatmId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setKhatms((prev) => prev.filter((k) => k.id !== khatmId));
      toast({ title: "✅ Xatm o'chirildi" });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            Xatmlar Boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Jami {khatms.length} ta xatm
          </p>
        </div>
        <Button variant="emerald" asChild size="sm">
          <Link href="/khatms/create">Yangi Xatm</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Xatm qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((khatm: any) => {
          const completedJuz = khatm.juzList.filter(
            (j: any) => j.status === "COMPLETED"
          ).length;
          const progress = getKhatmProgress(completedJuz);
          const statusConfig = STATUS_CONFIG[khatm.status as keyof typeof STATUS_CONFIG];
          const isLoading = loading?.startsWith(khatm.id);

          return (
            <Card key={khatm.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{khatm.title}</h3>
                      <Badge variant={statusConfig.variant} className="text-xs shrink-0">
                        {statusConfig.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {khatm.type === "PRIVATE" ? "🔒 Shaxsiy" : "🌍 Global"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {khatm.createdBy.firstName} {khatm.createdBy.lastName} •{" "}
                      {khatm._count.participations} ishtirokchi •{" "}
                      {formatDate(khatm.createdAt)}
                    </p>
                    <div className="mt-2 max-w-xs">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{completedJuz}/30 pora</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button variant="outline" size="sm" asChild className="h-8">
                      <Link href={`/khatms/${khatm.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Ko'rish
                      </Link>
                    </Button>

                    {khatm.status === "ACTIVE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(khatm.id, "CANCELLED")}
                      >
                        {isLoading && loading === khatm.id + "CANCELLED" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        Yopish
                      </Button>
                    )}

                    {khatm.status === "CANCELLED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        disabled={isLoading}
                        onClick={() => handleStatusChange(khatm.id, "ACTIVE")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Faollashtirish
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={isLoading}
                        onClick={() => handleDelete(khatm.id)}
                      >
                        {isLoading && loading === khatm.id + "delete" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="text-center py-10 text-muted-foreground text-sm">
              Xatm topilmadi
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
