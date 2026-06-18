import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const JUZ_LIMIT = 2; // max juz per user per khatm type
const JUZ_DEADLINE_DAYS = 3; // 3 days to read

// POST /api/juz/[id]/take
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

    // Check participation
    const participation = await prisma.participation.findUnique({
      where: {
        userId_khatmId: { userId: session.user.id, khatmId: juz.khatmId },
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Avval xatmga qo'shiling" },
        { status: 400 }
      );
    }

    // Check limit: max 2 active juz per khatm type
    const activeJuzCount = await prisma.juz.count({
      where: {
        assignedToId: session.user.id,
        status: "RESERVED",
        khatm: { type: juz.khatm.type },
      },
    });

    if (activeJuzCount >= JUZ_LIMIT) {
      return NextResponse.json(
        { error: `Bir vaqtda maksimal ${JUZ_LIMIT} ta pora olish mumkin` },
        { status: 400 }
      );
    }

    // Assign juz
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + JUZ_DEADLINE_DAYS);

    const updated = await prisma.juz.update({
      where: { id: rp.id },
      data: {
        status: "RESERVED",
        assignedToId: session.user.id,
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
