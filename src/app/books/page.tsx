import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { BooksClient } from "./books-client";

export const metadata = { title: "Kitoblar" };
export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const current = await getCurrentUser();

  const books = await prisma.book.findMany({
    where:   { userId: current.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { logs: true } } },
  });

  return (
    <MainLayout>
      <BooksClient books={JSON.parse(JSON.stringify(books))} />
    </MainLayout>
  );
}
