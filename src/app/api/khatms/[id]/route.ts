import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/khatms/[id]
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;
    const khatm = await prisma.khatm.findUnique({
      where: { id: rp.id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
        juzList: {
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, photoUrl: true },
            },
          },
          orderBy: { juzNumber: "asc" },
        },
        participations: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
          },
        },
        _count: { select: { participations: true } },
      },
    });

    if (!khatm) {
      return NextResponse.json({ error: "Xatm topilmadi" }, { status: 404 });
    }

    return NextResponse.json(khatm);
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// PATCH /api/khatms/[id] — update status
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;

    const khatm = await prisma.khatm.findUnique({ where: { id: rp.id } });
    if (!khatm) {
      return NextResponse.json({ error: "Xatm topilmadi" }, { status: 404 });
    }

    const body = await req.json();
    const { status, title, description } = body;

    const updated = await prisma.khatm.update({
      where: { id: rp.id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// DELETE /api/khatms/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;
    await prisma.khatm.delete({ where: { id: rp.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
