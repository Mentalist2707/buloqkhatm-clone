import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/utils";
import { z } from "zod";

const createKhatmSchema = z.object({
  title:             z.string().min(1, "Nom talab qilinadi").max(100),
  description:       z.string().max(500).optional(),
  type:              z.enum(["GLOBAL", "PRIVATE"]).default("GLOBAL"),
  startDate:         z.string().optional(),
  endDate:           z.string().optional(),
  maxJuzPerUser:     z.number().int().min(0).max(30).default(2),
  requireSequential: z.boolean().default(false),
  inviteCode:        z.string().max(10).optional(),
});

// ─── GET /api/khatms ──────────────────────────────────────────────────────────
// GLOBAL: hammaga ko'rinadi
// PRIVATE: faqat a'zo yoki creator ga ko'rinadi

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId  = session?.user?.id ?? null;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "ACTIVE";

    const where: any = {};
    if (status !== "ALL") where.status = status;

    // ── Private xatmlarni filtrlaymiz ──
    // Foydalanuvchi:
    //   - GLOBAL xatmlarni hammasi ko'radi
    //   - PRIVATE: faqat createdById === userId YOKI participations da bor bo'lsa
    if (userId) {
      where.OR = [
        { type: "GLOBAL" },
        { type: "PRIVATE", createdById: userId },
        { type: "PRIVATE", participations: { some: { userId } } },
      ];
    } else {
      // Login qilmagan — faqat GLOBAL
      where.type = "GLOBAL";
    }

    const khatms = await prisma.khatm.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
        _count: { select: { participations: true } },
        juzList: {
          select: { juzNumber: true, status: true },
          orderBy: { juzNumber: "asc" },
        },
        participations: {
          take: 6,
          orderBy: { joinedAt: "desc" },
          select: {
            user: {
              select: { id: true, firstName: true, lastName: true, photoUrl: true },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json(khatms);
  } catch (err) {
    console.error("[GET /api/khatms]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// ─── POST /api/khatms — yangi xatm yaratish ───────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = createKhatmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      title, description, type,
      startDate, endDate,
      maxJuzPerUser, requireSequential,
      inviteCode: customCode,
    } = parsed.data;

    const isPrivate = type === "PRIVATE";

    // Private xatm uchun invite code yaratish
    const code = isPrivate
      ? (customCode?.toUpperCase() || generateInviteCode())
      : null;

    const khatm = await prisma.$transaction(async (tx) => {
      const newKhatm = await tx.khatm.create({
        data: {
          title,
          description,
          type,
          status:            "ACTIVE",
          isPrivate,
          inviteCode:        code,
          startDate:         startDate ? new Date(startDate) : null,
          endDate:           endDate   ? new Date(endDate)   : null,
          createdById:       session.user.id,
          maxJuzPerUser:     maxJuzPerUser === 0 ? 999 : maxJuzPerUser,
          requireSequential,
        },
      });

      // 30 juz yaratish
      await tx.juz.createMany({
        data: Array.from({ length: 30 }, (_, i) => ({
          khatmId:   newKhatm.id,
          juzNumber: i + 1,
          status:    "AVAILABLE",
        })),
      });

      // Creator avtomatik a'zo bo'ladi
      await tx.participation.create({
        data: { userId: session.user.id, khatmId: newKhatm.id },
      });

      return newKhatm;
    });

    return NextResponse.json(khatm, { status: 201 });
  } catch (err) {
    console.error("[POST /api/khatms]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
