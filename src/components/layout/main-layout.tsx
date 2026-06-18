"use client";

import { useState } from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
      {/* ─── Navbar: fixed height, doimo tepada (scroll qilinmaydi) ─── */}
      <div className="shrink-0 z-40 w-full">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />
      </div>

      {/* ─── Content row: qolgan balandlikni to'ldiradi (magic number yo'q) ─── */}
      <div className="flex flex-1 min-h-0">
        {/* ─── Desktop sidebar: mustaqil scroll ─── */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 h-full overflow-y-auto border-r border-gray-100 bg-white">
          <Sidebar />
        </aside>

        {/* ─── Mobile sidebar overlay ─── */}
        <div className="md:hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* ─── Main content: faqat shu qism scroll bo'ladi ─── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="px-4 py-6 md:px-6 md:py-7 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
