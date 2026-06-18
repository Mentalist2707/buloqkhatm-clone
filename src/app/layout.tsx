import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "BuloqKhatm — Global Qur'on Xatmi",
    template: "%s | BuloqKhatm",
  },
  description:
    "Dunyo bo'ylab musulmonlarni birlashtirib, Qur'onni jamoaviy xatm qilish platformasi",
  keywords: ["quran", "xatm", "khatm", "muslim", "qurон", "buloq"],
  authors: [{ name: "BuloqKhatm" }],
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "BuloqKhatm — Global Qur'on Xatmi",
    description: "Dunyo bo'ylab Qur'on xatmiga qo'shiling",
    siteName: "BuloqKhatm",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script
          src="https://telegram.org/js/telegram-web-app.js"
          async
        />
      </head>
      <body className="font-sans antialiased">
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
