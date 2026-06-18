"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarGroupUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  photoUrl?: string | null;
  image?: string | null;
}

interface AvatarGroupProps {
  users: AvatarGroupUser[];
  max?: number;           // ko'rsatiladigan maksimal avatar soni
  size?: "sm" | "md";     // avatar o'lchami
  totalCount?: number;    // haqiqiy jami son (+N uchun)
  className?: string;
}

export function AvatarGroup({
  users,
  max = 4,
  size = "sm",
  totalCount,
  className,
}: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const extra = (totalCount ?? users.length) - visible.length;

  const sizeClass = size === "sm"
    ? "h-6 w-6 text-[9px] border-[1.5px]"
    : "h-8 w-8 text-[10px] border-2";

  return (
    <div className={cn("flex items-center", className)}>
      {/* Avatarlar — keyingisi avvalgisining ustiga minadi */}
      <div className="flex -space-x-1.5">
        {visible.map((user, i) => {
          const src = user.photoUrl ?? user.image ?? "";
          const fallback =
            `${user.firstName?.[0] ?? user.name?.[0] ?? "?"}`.toUpperCase();

          return (
            <Avatar
              key={user.id}
              className={cn(
                sizeClass,
                "border-white ring-0 shrink-0",
                // Z-index: birinchi avatar eng ustida
                `z-[${max - i}]`
              )}
              title={
                [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                user.name ||
                "Foydalanuvchi"
              }
            >
              <AvatarImage src={src} />
              <AvatarFallback
                className={cn(
                  "bg-emerald-100 text-emerald-700 font-semibold",
                  size === "sm" ? "text-[9px]" : "text-[10px]"
                )}
              >
                {fallback}
              </AvatarFallback>
            </Avatar>
          );
        })}

        {/* +N qolgan foydalanuvchilar */}
        {extra > 0 && (
          <div
            className={cn(
              sizeClass,
              "rounded-full bg-gray-100 border-white flex items-center justify-center",
              "text-gray-500 font-semibold shrink-0 z-0"
            )}
          >
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}
