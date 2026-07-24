import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { BookDetailClient } from "./book-detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id }, select: { title: true } });
  return { title: book?.title ?? "Kitob" };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentUser();
  const { id } = await params;

  const book = await prisma.book.findFirst({
    where:   { id, userId: current.id },
    include: { logs: { orderBy: { date: "desc" }, take: 100 } },
  });

  if (!book) notFound();

  return (
    <MainLayout>
      <BookDetailClient book={JSON.parse(JSON.stringify(book))} />
    </MainLayout>
  );
}
