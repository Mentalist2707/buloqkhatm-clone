import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/notifications/unread — unread count for navbar badge
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
