import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/upload — rasm yuklash (kitob muqovasi uchun).
 * public/uploads ichiga saqlanadi va /uploads/.. yo'li qaytariladi.
 */
export async function POST(req: NextRequest) {
  try {
    await getCurrentUserId();

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Faqat rasm (jpg, png, webp, gif)" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Rasm hajmi 5MB dan oshmasin" }, { status: 400 });
    }

    const bytes  = Buffer.from(await file.arrayBuffer());
    const ext    = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const name   = `${randomUUID()}.${ext}`;

    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);

    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json({ error: "Yuklashda xatolik" }, { status: 500 });
  }
}
