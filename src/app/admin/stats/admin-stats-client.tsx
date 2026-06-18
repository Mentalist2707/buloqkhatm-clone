"use client";

import {
  Users,
  BookOpen,
  CheckCircle2,
  Star,
  Globe,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getUserLevel } from "@/lib/utils";

interface Props {
  stats: {
    totalUsers: number;
    totalKhatms: number;
    activeKhatms: number;
    completedKhatms: number;
    totalJuz: number;
    completedJuz: number;
    totalPoints: number;
  };
  topCountries: any[];
  topUsers: any[];
}

export function AdminStatsClient({ stats, topCountries, topUsers }: Props) {
  const juzCompletionRate =
    stats.totalJuz > 0
      ? Math.round((stats.completedJuz / stats.totalJuz) * 100)
      : 0;

  const khatmCompletionRate =
    stats.totalKhatms > 0
      ? Math.round((stats.completedKhatms / stats.totalKhatms) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-purple-600" />
          Statistika & Tahlil
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tizim umumiy ko'rsatkichlari
        </p>
      </div>

      {/* Main metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Foydalanuvchilar", value: stats.totalUsers, icon: Users, color: "bg-blue-500" },
          { label: "Jami Xatmlar", value: stats.totalKhatms, icon: BookOpen, color: "bg-emerald-500" },
          { label: "O'qilgan Poralar", value: stats.completedJuz, icon: CheckCircle2, color: "bg-orange-500" },
          { label: "Jami Ballar", value: stats.totalPoints.toLocaleString(), icon: Star, color: "bg-purple-500" },
        ].map((m) => (
          <Card key={m.label} className="card-hover">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}>
                <m.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress metrics */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pora Yakunlanish Darajasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-3">
              <p className="text-4xl font-bold text-emerald-600">{juzCompletionRate}%</p>
              <p className="text-muted-foreground text-sm mb-1">
                {stats.completedJuz}/{stats.totalJuz} pora
              </p>
            </div>
            <Progress value={juzCompletionRate} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Xatm Yakunlanish Darajasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-3">
              <p className="text-4xl font-bold text-blue-600">{khatmCompletionRate}%</p>
              <p className="text-muted-foreground text-sm mb-1">
                {stats.completedKhatms}/{stats.totalKhatms} xatm
              </p>
            </div>
            <Progress value={khatmCompletionRate} className="h-3" />
            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
              <div className="p-2 rounded bg-emerald-50">
                <p className="font-bold text-emerald-700">{stats.activeKhatms}</p>
                <p className="text-muted-foreground">Faol</p>
              </div>
              <div className="p-2 rounded bg-blue-50">
                <p className="font-bold text-blue-700">{stats.completedKhatms}</p>
                <p className="text-muted-foreground">Yakunlangan</p>
              </div>
              <div className="p-2 rounded bg-gray-50">
                <p className="font-bold text-gray-700">
                  {stats.totalKhatms - stats.activeKhatms - stats.completedKhatms}
                </p>
                <p className="text-muted-foreground">Boshqa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              Mamlakatlar bo'yicha
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCountries.length > 0 ? (
              <div className="space-y-3">
                {topCountries.map((c: any) => {
                  const maxCount = topCountries[0]._count;
                  const pct = Math.round((c._count / maxCount) * 100);
                  return (
                    <div key={c.country}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{c.country}</span>
                        <span className="text-muted-foreground">{c._count} kishi</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-6">
                Ma'lumot yo'q
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Eng Faol Foydalanuvchilar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topUsers.map((user, idx) => {
                const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
                const level = getUserLevel(user.coins);
                return (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoUrl ?? ""} />
                      <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className={`text-xs ${level.color}`}>{level.name}</p>
                    </div>
                    <p className="font-bold text-sm text-emerald-600">
                      {user.coins}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
