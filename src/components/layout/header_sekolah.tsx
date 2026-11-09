"use client";

import React, { useState, useEffect } from "react";
import { Search, Menu, GraduationCap } from "lucide-react";
import { usePathname } from "next/navigation";
import { menuSekolah } from "./sidebar_sekolah";
import NotificationPopover from "@/components/layout/NotificationPopover";

interface HeaderSekolahProps {
  onOpenSidebar: () => void;
}

export default function HeaderSekolah({ onOpenSidebar }: HeaderSekolahProps) {
  const pathname = usePathname();
  const [namaSekolah, setNamaSekolah] = useState("Sekolah");

  useEffect(() => {
    const updateNama = () => {
      if (typeof window !== "undefined") {
        const username = localStorage.getItem("username");
        if (username) {
          setNamaSekolah(username);
        }
      }
    };
    updateNama();

    window.addEventListener("sekolah_profile_updated", updateNama);
    return () => {
      window.removeEventListener("sekolah_profile_updated", updateNama);
    };
  }, []);

  const routeTitles: Record<string, string> = {
    "/sekolah/dashboard": "Dashboard",
    "/sekolah/laporan_asesmen": "Laporan Asesmen",
    "/sekolah/profil": "Profil",
    "/sekolah/ubah_password": "Ubah Password",
  };

  const title = routeTitles[pathname] || "Dashboard";

  return (
    <header className="w-full flex justify-between items-center px-4 md:px-10 py-4 bg-white/70 backdrop-blur-xl border-b border-teal-50 text-[#1E5C58]">
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-lg hover:bg-teal-50 text-[#2B7A75] md:hidden transition-colors cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight truncate max-w-[150px] sm:max-w-none">
              {title}
            </h2>
            <p className="hidden md:block text-xs font-semibold text-gray-400">
              Sekolah • Sistem Informasi Holistic Care
            </p>
          </div>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Search Bar */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-teal-50 shadow-[0_2px_10px_rgba(43,122,117,0.05)] text-gray-400 focus-within:border-[#2B7A75] focus-within:ring-2 focus-within:ring-[#2B7A75]/10 transition-all duration-300">
          <Search className="w-4 h-4 ml-0.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari..."
            className="w-32 xl:w-48 bg-transparent border-none outline-none text-sm text-gray-600 focus:w-48 xl:focus:w-56 transition-all duration-300"
          />
        </div>

        {/* Notifications */}
        <NotificationPopover />

        {/* User Greet & Info (Hanya Informasi Akun, Tidak Bisa Diklik) */}
        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-100/80 select-none">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-[#1E5C58] leading-tight">
              {namaSekolah}
            </span>
            <span className="text-xs font-semibold text-gray-400">
              Sekolah
            </span>
          </div>

          {/* Profile Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#E6F3F0] border-2 border-teal-100/80 flex items-center justify-center text-[#2B7A75] shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}

