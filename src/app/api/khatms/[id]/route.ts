import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

// PATCH /api/khatms/[id] — update status (admin/creator)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const khatm = await prisma.khatm.findUnique({ where: { id: rp.id } });
    if (!khatm) {
      return NextResponse.json({ error: "Xatm topilmadi" }, { status: 404 });
    }

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    const isCreator = khatm.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
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
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    await prisma.khatm.delete({ where: { id: rp.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
