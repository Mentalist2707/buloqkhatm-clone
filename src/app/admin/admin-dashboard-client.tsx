"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  CheckCircle2,
  Star,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: StatCardProps) {
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            {trend && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface Props {
  stats: {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    totalKhatms: number;
    activeKhatms: number;
    completedKhatms: number;
    totalJuz: number;
    completedJuz: number;
    totalPoints: number;
    recentUsers: any[];
    recentKhatms: any[];
  };
  userRole: Role;
}

export function AdminDashboardClient({ stats, userRole }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "khatms">(
    "overview",
  );

  const completionRate =
    stats.totalJuz > 0
      ? Math.round((stats.completedJuz / stats.totalJuz) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Tizim boshqaruvi va statistikalar
          </p>
        </div>
        <Badge
          className={
            userRole === "SUPER_ADMIN"
              ? "bg-purple-100 text-purple-700"
              : userRole === "ADMIN"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
          }>
          {userRole}
        </Badge>
      </div>

      {/* Main stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Jami Foydalanuvchilar"
          value={stats.totalUsers}
          sub={`${stats.activeUsers} faol, ${stats.bannedUsers} ban`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Jami Xatmlar"
          value={stats.totalKhatms}
          sub={`${stats.activeKhatms} faol, ${stats.completedKhatms} yakunlangan`}
          icon={BookOpen}
          color="bg-emerald-500"
        />
        <StatCard
          title="O'qilgan Poralar"
          value={stats.completedJuz}
          sub={`${stats.totalJuz} jami poradan ${completionRate}%`}
          icon={CheckCircle2}
          color="bg-orange-500"
        />
        <StatCard
          title="Jami Ajr Ballar"
          value={stats.totalPoints}
          sub="Barcha foydalanuvchilar"
          icon={Star}
          color="bg-purple-500"
        />
      </div>

      {/* Activity overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">
              {stats.activeKhatms}
            </p>
            <p className="text-sm text-emerald-600">Faol xatmlar</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">
              {stats.activeUsers}
            </p>
            <p className="text-sm text-blue-600">Faol foydalanuvchilar</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700">
              {stats.bannedUsers}
            </p>
            <p className="text-sm text-orange-600">Ban qilinganlar</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Foydalanuvchilar",
            href: "/admin/users",
            icon: Users,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Xatmlar",
            href: "/admin/khatms",
            icon: BookOpen,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Statistika",
            href: "/admin/stats",
            icon: TrendingUp,
            color: "text-purple-600 bg-purple-50",
          },
          {
            label: "Bot sozlama",
            href: "/admin/bot",
            icon: Activity,
            color: "text-orange-600 bg-orange-50",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="block no-underline">
            <Card className="card-hover cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{action.label}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Yangi Foydalanuvchilar</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users">
                Barchasi <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentUsers.map((user: any) => {
              const initials =
                `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
                "?";
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoUrl ?? ""} />
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(user.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {user.isBanned && (
                      <Badge variant="destructive" className="text-xs">
                        Ban
                      </Badge>
                    )}
                    <Badge
                      className={`text-xs ${
                        user.role === "SUPER_ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "ADMIN"
                            ? "bg-blue-100 text-blue-700"
                            : user.role === "MODERATOR"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                      }`}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent khatms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">So'nggi Xatmlar</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/khatms">
                Barchasi <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentKhatms.map((khatm: any) => (
              <div
                key={khatm.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="h-9 w-9 rounded-lg gradient-emerald flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{khatm.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {khatm.createdBy.firstName} • {khatm._count.participations}{" "}
                    ishtirokchi
                  </p>
                </div>
                <Badge
                  variant={
                    khatm.status === "ACTIVE"
                      ? "active"
                      : khatm.status === "COMPLETED"
                        ? "completed"
                        : "draft"
                  }
                  className="text-xs shrink-0">
                  {khatm.status === "ACTIVE"
                    ? "Faol"
                    : khatm.status === "COMPLETED"
                      ? "Yakunlangan"
                      : khatm.status === "DRAFT"
                        ? "Qoralama"
                        : "Bekor"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
