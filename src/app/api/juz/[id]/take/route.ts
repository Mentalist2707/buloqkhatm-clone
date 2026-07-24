import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const JUZ_DEADLINE_DAYS = 3; // 3 days to read

// POST /api/juz/[id]/take
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;
    const userId = await getCurrentUserId();

    const juz = await prisma.juz.findUnique({
      where: { id: rp.id },
      include: { khatm: true },
    });

    if (!juz) {
      return NextResponse.json({ error: "Pora topilmadi" }, { status: 404 });
    }

    if (juz.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Bu pora allaqachon band" }, { status: 400 });
    }

    if (juz.khatm.status !== "ACTIVE") {
      return NextResponse.json({ error: "Xatm faol emas" }, { status: 400 });
    }

    // Xatmga a'zolikni ta'minlaymiz (yagona foydalanuvchi — avtomatik)
    await prisma.participation.upsert({
      where:  { userId_khatmId: { userId, khatmId: juz.khatmId } },
      create: { userId, khatmId: juz.khatmId },
      update: {},
    });

    // Assign juz
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + JUZ_DEADLINE_DAYS);

    const updated = await prisma.juz.update({
      where: { id: rp.id },
      data: {
        status: "RESERVED",
        assignedToId: userId,
        reservedAt: new Date(),
        deadline,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/juz/take]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
