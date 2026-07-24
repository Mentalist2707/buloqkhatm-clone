import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/khatms/[id]/requests — pending so'rovlar ro'yxati
 * PATCH /api/khatms/[id]/requests — so'rovni tasdiqlash / rad etish
 */

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;

    const khatm = await prisma.khatm.findUnique({
      where:  { id: rp.id },
      select: { createdById: true },
    });

    if (!khatm) {
      return NextResponse.json({ error: "Xatm topilmadi" }, { status: 404 });
    }

    const requests = await prisma.joinRequest.findMany({
      where:   { khatmId: rp.id, status: "PENDING" },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true,
            username: true, photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(requests);
  } catch (err) {
    console.error("[GET /api/khatms/requests]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;

    const { requestId, action } = await req.json();
    // action: "approve" | "reject"

    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "requestId va action kerak" }, { status: 400 });
    }

    const khatm = await prisma.khatm.findUnique({
      where:  { id: rp.id },
      select: { createdById: true, title: true },
    });

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    });

    if (!joinRequest || joinRequest.khatmId !== rp.id) {
      return NextResponse.json({ error: "So'rov topilmadi" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.$transaction(async (tx) => {
        // So'rovni tasdiqlash
        await tx.joinRequest.update({
          where: { id: requestId },
          data:  { status: "APPROVED" },
        });

        // Participation yaratish
        await tx.participation.upsert({
          where:  { userId_khatmId: { userId: joinRequest.userId, khatmId: rp.id } },
          create: { userId: joinRequest.userId, khatmId: rp.id },
          update: {},
        });

        // Foydalanuvchiga xabar
        await tx.notification.create({
          data: {
            userId:  joinRequest.userId,
            type:    "NEW_KHATM",
            title:   "✅ So'rovingiz tasdiqlandi!",
            message: `"${khatm?.title}" xatmiga qo'shildingiz. Pora olishingiz mumkin!`,
            metadata: { khatmId: rp.id },
          },
        });
      });

      return NextResponse.json({ approved: true });
    }

    // reject
    await prisma.$transaction(async (tx) => {
      await tx.joinRequest.update({
        where: { id: requestId },
        data:  { status: "REJECTED" },
      });

      await tx.notification.create({
        data: {
          userId:  joinRequest.userId,
          type:    "SYSTEM",
          title:   "So'rovingiz rad etildi",
          message: `"${khatm?.title}" xatmiga qo'shilish so'rovi qabul qilinmadi`,
          metadata: { khatmId: rp.id },
        },
      });
    });

    return NextResponse.json({ rejected: true });
  } catch (err) {
    console.error("[PATCH /api/khatms/requests]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
