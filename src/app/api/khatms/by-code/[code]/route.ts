import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/khatms/by-code/[code] — invite code bo'yicha xatm topish
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const rp = await context.params;
    const userId = await getCurrentUserId();

    const khatm = await prisma.khatm.findUnique({
      where: { inviteCode: rp.code.toUpperCase() },
      select: {
        id:          true,
        title:       true,
        description: true,
        status:      true,
        type:        true,
        inviteCode:  true,
        createdById: true,
        _count:      { select: { participations: true } },
        createdBy:   {
          select: { firstName: true, lastName: true, photoUrl: true },
        },
        juzList: {
          select: { status: true },
        },
      },
    });

    if (!khatm) {
      return NextResponse.json({ error: "Xatm topilmadi" }, { status: 404 });
    }

    // Qo'shilish holati
    const isParticipant = await prisma.participation.findUnique({
      where: { userId_khatmId: { userId, khatmId: khatm.id } },
    });

    const pendingRequest = await prisma.joinRequest.findUnique({
      where: { userId_khatmId: { userId, khatmId: khatm.id } },
    });

    const completedJuz = khatm.juzList.filter((j) => j.status === "COMPLETED").length;

    return NextResponse.json({
      ...khatm,
      isParticipant:   !!isParticipant,
      pendingRequest:  pendingRequest ?? null,
      completedJuz,
    });
  } catch (err) {
    console.error("[GET /api/khatms/by-code]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
