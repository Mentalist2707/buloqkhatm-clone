"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Ban,
  CheckCircle,
  ShieldCheck,
  Star,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { Role } from "@prisma/client";

const ROLE_COLORS: Record<Role, string> = {
  USER: "bg-gray-100 text-gray-600",
  MODERATOR: "bg-orange-100 text-orange-700",
  ADMIN: "bg-blue-100 text-blue-700",
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
};

interface Props {
  users: any[];
  isSuperAdmin: boolean;
}

export function AdminUsersClient({ users: initialUsers, isSuperAdmin }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const name = `${u.firstName ?? ""} ${u.lastName ?? ""} ${u.username ?? ""} ${u.email ?? ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleAction = async (
    userId: string,
    action: "ban" | "unban" | "add_coins" | "set_role",
    payload?: any
  ) => {
    setLoading(userId + action);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
      toast({ title: "✅ Muvaffaqiyatli!" });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
      setOpenMenu(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Foydalanuvchilar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Jami {users.length} ta foydalanuvchi
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Qidirish (ism, username, email)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-muted-foreground">
                  <th className="text-left p-4 font-medium">Foydalanuvchi</th>
                  <th className="text-left p-4 font-medium">Rol</th>
                  <th className="text-right p-4 font-medium">Ball</th>
                  <th className="text-right p-4 font-medium">Xatmlar</th>
                  <th className="text-left p-4 font-medium">Qo'shilgan</th>
                  <th className="text-left p-4 font-medium">Holat</th>
                  <th className="text-right p-4 font-medium">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((user) => {
                  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
                  const isLoading = loading?.startsWith(user.id);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={user.photoUrl ?? ""} />
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.username
                                ? `@${user.username}`
                                : user.email ?? user.telegramId ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`text-xs ${ROLE_COLORS[user.role as Role]}`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-bold text-emerald-600">
                        {user.coins}
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        {user._count.participations}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-4">
                        {user.isBanned ? (
                          <Badge variant="destructive" className="text-xs">Ban</Badge>
                        ) : (
                          <Badge variant="success" className="text-xs">Faol</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="relative inline-block">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setOpenMenu(openMenu === user.id ? null : user.id)
                            }
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>

                          {openMenu === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-white shadow-lg z-20 py-1">
                                {user.isBanned ? (
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-emerald-600"
                                    onClick={() => handleAction(user.id, "unban")}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Unban qilish
                                  </button>
                                ) : (
                                  <button
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                                    onClick={() => handleAction(user.id, "ban")}
                                  >
                                    <Ban className="h-4 w-4" />
                                    Ban qilish
                                  </button>
                                )}
                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-blue-600"
                                  onClick={() =>
                                    handleAction(user.id, "add_coins", { points: 10, coins: 10 })
                                  }
                                >
                                  <Star className="h-4 w-4" />
                                  +10 Ball qo'shish
                                </button>
                                {isSuperAdmin && (
                                  <>
                                    <div className="border-t my-1" />
                                    {(["USER", "MODERATOR", "ADMIN"] as Role[]).map((role) => (
                                      <button
                                        key={role}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                                        onClick={() =>
                                          handleAction(user.id, "set_role", { role })
                                        }
                                      >
                                        <ShieldCheck className="h-4 w-4" />
                                        {role} qilish
                                      </button>
                                    ))}
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: karta ko'rinishi — amallar har doim ko'rinadi (yo'qolmaydi) */}
          <div className="md:hidden divide-y">
            {filtered.map((user) => {
              const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
              const isLoading = loading?.startsWith(user.id);
              return (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={user.photoUrl ?? ""} />
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.username ? `@${user.username}` : user.email ?? user.telegramId ?? "—"}
                      </p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${ROLE_COLORS[user.role as Role]}`}>
                      {user.role}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-bold text-emerald-600">{user.coins} ball</span>
                    <span>{user._count.participations} xatm</span>
                    {user.isBanned
                      ? <Badge variant="destructive" className="text-[10px]">Ban</Badge>
                      : <Badge variant="success" className="text-[10px]">Faol</Badge>}
                  </div>

                  {/* Amallar — inline tugmalar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {user.isBanned ? (
                      <Button size="sm" variant="outline"
                        className="h-8 text-xs text-emerald-600 border-emerald-200"
                        disabled={isLoading}
                        onClick={() => handleAction(user.id, "unban")}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Unban
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline"
                        className="h-8 text-xs text-red-600 border-red-200"
                        disabled={isLoading}
                        onClick={() => handleAction(user.id, "ban")}>
                        <Ban className="h-3.5 w-3.5 mr-1" /> Ban
                      </Button>
                    )}
                    <Button size="sm" variant="outline"
                      className="h-8 text-xs text-blue-600 border-blue-200"
                      disabled={isLoading}
                      onClick={() => handleAction(user.id, "add_coins", { points: 10, coins: 10 })}>
                      <Star className="h-3.5 w-3.5 mr-1" /> +10 ball
                    </Button>
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {isSuperAdmin && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <span className="text-[10px] text-muted-foreground w-full">Rol o'zgartirish:</span>
                      {(["USER", "MODERATOR", "ADMIN"] as Role[]).map((role) => (
                        <Button key={role} size="sm" variant="ghost"
                          className="h-7 text-[11px] text-gray-600 bg-gray-50"
                          disabled={isLoading || user.role === role}
                          onClick={() => handleAction(user.id, "set_role", { role })}>
                          <ShieldCheck className="h-3 w-3 mr-1" /> {role}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Foydalanuvchi topilmadi
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
