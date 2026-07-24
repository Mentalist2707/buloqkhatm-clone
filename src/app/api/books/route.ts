import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBookSchema = z.object({
  title:       z.string().min(1, "Kitob nomi kerak").max(200),
  author:      z.string().max(150).optional().nullable(),
  coverUrl:    z.string().max(2000).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  totalPages:  z.number().int().min(1, "Betlar soni kamida 1").max(100000),
  targetDays:  z.number().int().min(1, "Kunlar soni kamida 1").max(3650),
  startDate:   z.string().optional(),
});

// GET /api/books — foydalanuvchi kitoblari
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // READING | COMPLETED | PAUSED | null

    const books = await prisma.book.findMany({
      where: {
        userId,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: { _count: { select: { logs: true } } },
    });

    return NextResponse.json(books);
  } catch (err) {
    console.error("[GET /api/books]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST /api/books — yangi kitob rejasi
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body   = await req.json();
    const parsed = createBookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, author, coverUrl, description, totalPages, targetDays, startDate } = parsed.data;

    const start = startDate ? new Date(startDate) : new Date();
    const target = new Date(start);
    target.setDate(target.getDate() + targetDays);

    const book = await prisma.book.create({
      data: {
        userId,
        title,
        author:      author || null,
        coverUrl:    coverUrl || null,
        description: description || null,
        totalPages,
        targetDays,
        startDate:   start,
        targetDate:  target,
        status:      "READING",
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    console.error("[POST /api/books]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
