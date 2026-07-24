import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/components/providers/user-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "BuloqKhatm — Shaxsiy Qur'on va Kitob O'qish",
    template: "%s | BuloqKhatm",
  },
  description:
    "Shaxsiy Qur'on xatmi va kitob o'qish rejasini kuzatib boruvchi platforma",
  keywords: ["quran", "xatm", "khatm", "kitob", "reja", "buloq"],
  authors: [{ name: "BuloqKhatm" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <UserProvider>
          {children}
          <Toaster />
        </UserProvider>
      </body>
    </html>
  );
}
