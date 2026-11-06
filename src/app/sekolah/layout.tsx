"use client";

import React, { Suspense, useState } from "react";
import SidebarSekolah from "@/components/layout/sidebar_sekolah";
import HeaderSekolah from "@/components/layout/header_sekolah";

export default function SekolahLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-gray-500 bg-gray-50">
          Memuat halaman sekolah...
        </div>
      }
    >
      <div className="flex h-screen bg-[#F4F9F8] overflow-hidden">
        {/* SIDEBAR */}
        <SidebarSekolah
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* MAIN CONTENT AREA */}
        <div className="relative flex flex-col flex-1 overflow-hidden">
          {/* HEADER */}
          <header className="sticky top-0 z-30">
            <HeaderSekolah onOpenSidebar={() => setIsSidebarOpen(true)} />
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </Suspense>
  );
}
