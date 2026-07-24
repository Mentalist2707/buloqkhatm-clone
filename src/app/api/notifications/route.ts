import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/notifications — list + unread count
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark all as read or single
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    const body = await req.json().catch(() => ({}));
    const { id } = body; // optional: single notification id

    if (id) {
      await prisma.notification.update({
        where: { id, userId },
        data: { isRead: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// DELETE /api/notifications — delete all or single
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (id) {
      await prisma.notification.delete({
        where: { id, userId },
      });
    } else {
      await prisma.notification.deleteMany({
        where: { userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
