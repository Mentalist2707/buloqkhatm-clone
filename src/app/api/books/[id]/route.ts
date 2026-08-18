import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/books/[id] — bitta kitob + o'qish tarixi
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();

    const book = await prisma.book.findFirst({
      where:   { id, userId },
      include: {
        logs: { orderBy: { date: "desc" }, take: 100 },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Kitob topilmadi" }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

const updateSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  author:      z.string().max(150).optional().nullable(),
  coverUrl:    z.string().max(2000).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  totalPages:  z.number().int().min(1).max(100000).optional(),
  targetDays:  z.number().int().min(1).max(3650).optional(),
  status:      z.enum(["READING", "COMPLETED", "PAUSED"]).optional(),
});

// PATCH /api/books/[id] — tahrirlash
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();

    const existing = await prisma.book.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Kitob topilmadi" }, { status: 404 });
    }

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data: any = { ...parsed.data };

    // targetDays yoki startDate o'zgarsa targetDate qayta hisoblanadi
    if (parsed.data.targetDays !== undefined) {
      const target = new Date(existing.startDate);
      target.setDate(target.getDate() + parsed.data.targetDays);
      data.targetDate = target;
    }

    // PAUSED → pauza boshlangan vaqtni yozamiz (progress saqlanadi)
    if (parsed.data.status === "PAUSED" && existing.status !== "PAUSED") {
      data.pausedAt = new Date();
    }

    // PAUSED → READING (davom etish): pauza davomiyligi rejaga qo'shiladi,
    // shu tariqa reja "soati" to'xtagan vaqtni hisoblamaydi.
    if (
      parsed.data.status === "READING" &&
      existing.status === "PAUSED" &&
      existing.pausedAt
    ) {
      const pausedAt   = new Date(existing.pausedAt);
      const resumeAt   = new Date();
      const pausedDays = Math.max(
        0,
        Math.round((resumeAt.getTime() - pausedAt.getTime()) / 86_400_000)
      );

      const shift = (d: Date) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + pausedDays);
        return nd;
      };

      data.startDate  = shift(existing.startDate);
      if (existing.targetDate) data.targetDate = shift(existing.targetDate);
      data.pausedAt = null;
    }

    // COMPLETED holatiga qo'lda o'tkazilsa
    if (parsed.data.status === "COMPLETED") {
      data.completedAt = new Date();
      data.currentPage = existing.totalPages;
      data.pausedAt = null;
    }

    const book = await prisma.book.update({ where: { id }, data });
    return NextResponse.json(book);
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// DELETE /api/books/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();

    const existing = await prisma.book.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Kitob topilmadi" }, { status: 404 });
    }

    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
