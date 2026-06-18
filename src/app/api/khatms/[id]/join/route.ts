import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/khatms/[id]/join
 *
 * GLOBAL: to'g'ridan-to'g'ri qo'shiladi
 * PRIVATE: inviteCode bo'lsa → to'g'ri qo'shiladi
 *          inviteCode yo'q   → JoinRequest yaratiladi (creator tasdiqlashi kerak)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const userId = session.user.id;
    const body   = await req.json().catch(() => ({}));
    const { inviteCode, message } = body;

    const khatm = await prisma.khatm.findUnique({
      where: { id: rp.id },
      select: {
        id:          true,
        title:       true,
        status:      true,
        type:        true,
        isPrivate:   true,
        inviteCode:  true,
        createdById: true,
      },
    });

    if (!khatm) {
      return NextResponse.json({ error: "Xatm topilmadi" }, { status: 404 });
    }
    if (khatm.status !== "ACTIVE") {
      return NextResponse.json({ error: "Xatm faol emas" }, { status: 400 });
    }

    // Allaqachon a'zo?
    const existing = await prisma.participation.findUnique({
      where: { userId_khatmId: { userId, khatmId: rp.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Allaqachon a'zo" }, { status: 400 });
    }

    // ── GLOBAL xatm ──────────────────────────────────────────────
    if (!khatm.isPrivate) {
      const participation = await prisma.participation.create({
        data: { userId, khatmId: rp.id },
      });
      return NextResponse.json({ joined: true, participation });
    }

    // ── PRIVATE xatm ─────────────────────────────────────────────

    // 1. Invite code bilan kirish
    if (inviteCode) {
      const normalizedCode = String(inviteCode).toUpperCase().trim();
      if (khatm.inviteCode && khatm.inviteCode === normalizedCode) {
        // To'g'ri kod — to'g'ridan qo'shiladi
        const participation = await prisma.participation.create({
          data: { userId, khatmId: rp.id },
        });

        // Agar pending so'rov bo'lsa — tasdiqlangan deb belgilash
        await prisma.joinRequest.updateMany({
          where: { userId, khatmId: rp.id, status: "PENDING" },
          data:  { status: "APPROVED" },
        });

        return NextResponse.json({ joined: true, participation });
      } else {
        return NextResponse.json(
          { error: "Invite kod noto'g'ri" },
          { status: 400 }
        );
      }
    }

    // 2. Kod yo'q — so'rov yuborish
    // Allaqachon so'rov bormi?
    const pendingRequest = await prisma.joinRequest.findUnique({
      where: { userId_khatmId: { userId, khatmId: rp.id } },
    });

    if (pendingRequest) {
      if (pendingRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "So'rovingiz allaqachon yuborilgan, kutilmoqda" },
          { status: 400 }
        );
      }
      if (pendingRequest.status === "REJECTED") {
        return NextResponse.json(
          { error: "So'rovingiz rad etilgan" },
          { status: 403 }
        );
      }
    }

    // Yangi so'rov yaratish
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId,
        khatmId: rp.id,
        status:  "PENDING",
        message: message ?? null,
      },
    });

    // Creator ga bildirishnoma
    await prisma.notification.create({
      data: {
        userId:  khatm.createdById,
        type:    "SYSTEM",
        title:   "Yangi a'zo so'rovi",
        message: `"${khatm.title}" xatmiga qo'shilish so'rovi yuborildi`,
        metadata: {
          khatmId:      rp.id,
          joinRequestId: joinRequest.id,
          userId,
          isJoinRequest: true,
        },
      },
    });

    return NextResponse.json({ requested: true, joinRequest });
  } catch (err) {
    console.error("[POST /api/khatms/join]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
