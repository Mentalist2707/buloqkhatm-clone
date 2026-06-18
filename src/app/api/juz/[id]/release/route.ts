import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/juz/[id]/release — porani bo'shatish (voz kechish)
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
      include: { khatm: { select: { title: true } } },
    });

    if (!juz) {
      return NextResponse.json({ error: "Pora topilmadi" }, { status: 404 });
    }

    // Faqat egasi yoki admin bo'shatishi mumkin
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    if (juz.assignedToId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Bu sizning porangiz emas" }, { status: 403 });
    }

    if (juz.status !== "RESERVED") {
      return NextResponse.json(
        { error: "Faqat band poralarni bo'shatish mumkin" },
        { status: 400 }
      );
    }

    const released = await prisma.juz.update({
      where: { id: rp.id },
      data: {
        status: "AVAILABLE",
        assignedToId: null,
        reservedAt: null,
        deadline: null,
      },
    });

    return NextResponse.json(released);
  } catch (err) {
    console.error("[POST /api/juz/release]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
