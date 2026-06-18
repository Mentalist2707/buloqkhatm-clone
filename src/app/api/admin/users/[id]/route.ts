import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/users/[id] — ban/unban/role/points
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const allowed = ["ADMIN", "SUPER_ADMIN"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    const body = await req.json();
    const { action, points, role, reason } = body;

    let updateData: any = {};

    switch (action) {
      case "ban":
        updateData = {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: reason ?? "Admin tomonidan ban qilindi",
        };
        break;
      case "unban":
        updateData = {
          isBanned: false,
          bannedAt: null,
          bannedReason: null,
        };
        break;
      case "set_role":
        if (session.user.role !== "SUPER_ADMIN") {
          return NextResponse.json({ error: "Faqat Super Admin rol o'zgartira oladi" }, { status: 403 });
        }
        if (!role) return NextResponse.json({ error: "Rol ko'rsating" }, { status: 400 });
        updateData = { role };
        break;
      case "add_coins":
        if (!points || typeof points !== "number") {
          return NextResponse.json({ error: "Coin miqdorini ko'rsating" }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: rp.id },
          data: { coins: { increment: points } },
        });
        await prisma.coinTransaction.create({
          data: {
            userId: rp.id,
            amount: points,
            reason: "ADMIN_BONUS",
            description: `Admin tomonidan ${points} BuloqCoin berildi`,
          },
        });
        const updatedUser = await prisma.user.findUnique({ where: { id: rp.id } });
        return NextResponse.json(updatedUser);
      default:
        return NextResponse.json({ error: "Noma'lum amal" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: rp.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/admin/users]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
