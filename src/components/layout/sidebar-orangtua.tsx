"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Baby,
  UserSquare2,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  User,
  Lock,
  LogOut,
  Settings,
  AlertTriangle,
  CalendarCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/context/SidebarContext";

interface MenuItem {
  name: string;
  path?: string;
  icon: React.ElementType;
  dropdown?: MenuItem[];
}

interface MenuGroup {
  section: string | null;
  items: MenuItem[];
}

export const menuOrangtua: MenuGroup[] = [
  {
    section: null,
    items: [
      {
        name: "Dashboard",
        icon: LayoutGrid,
        path: "/orangtua/dashboard",
      },
    ],
  },
  {
    section: "Manajemen Data",
    items: [
      {
        name: "Anak",
        icon: Baby,
        path: "/orangtua/anak",
      },
      {
        name: "Assessment",
        icon: UserSquare2,
        path: "/orangtua/assessment",
      },
      {
        name: "Terapi",
        icon: CalendarCheck,
        path: "/orangtua/terapi",
      },
    ],
  },
  {
    section: "Bantuan",
    items: [
      {
        name: "Help",
        icon: HelpCircle,
        path: "/orangtua/help",
      },
    ],
  },
  {
    section: "Kelola Akun",
    items: [
      {
        name: "Pengaturan",
        icon: Settings,
        dropdown: [
          {
            name: "Ubah Profil",
            icon: User,
            path: "/orangtua/profil",
          },
          {
            name: "Ubah Password",
            icon: Lock,
            path: "/orangtua/ubahPassword",
          },
        ],
      },
      {
        name: "Logout",
        icon: LogOut,
        path: "/auth/login",
      },
    ],
  },
];

interface SidebarOrangtuaProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SidebarOrangtua({ isOpen = false, onClose = () => {} }: SidebarOrangtuaProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const { isCollapsed, toggleSidebar } = useSidebar();

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth/login");
    setShowLogoutModal(false);
  };

  useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar on path change (mobile)
  useEffect(() => {
    if (windowWidth < 768) {
      onClose();
    }
  }, [pathname, windowWidth]);

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1E5C58]/30 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: mounted && windowWidth < 768 ? (isOpen ? 0 : -300) : 0,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed md:sticky top-0 left-0 h-screen w-64 shrink-0 bg-white/95 backdrop-blur-xl flex flex-col font-medium border-r border-teal-50 shadow-[2px_0_24px_rgba(0,0,0,0.02)] z-50 md:z-40 overflow-y-auto"
      >
        {/* Scrollable Handle Customization */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .sidebar-scroll::-webkit-scrollbar { width: 4px; }
              .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
              .sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
              .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `,
          }}
        />

        {/* Header / Logo */}
        <div className="flex justify-between items-center h-24 shrink-0 px-6 border-b border-gray-100 relative">
          <div className="sidebar-logo-wide">
            <Link
              href="/orangtua/dashboard"
              className="hover:scale-105 transition-transform duration-300"
            >
              <Image
                src="/logo.png"
                alt="Logo Puspa"
                width={120}
                height={32}
                priority
                className="object-contain"
              />
            </Link>
          </div>
          <div className="sidebar-logo-mini hidden w-full justify-center">
            <Image
              src="/favicon.ico"
              alt="Logo"
              width={28}
              height={28}
              priority
              className="object-contain"
            />
          </div>
          <button
            onClick={toggleSidebar}
            className={`text-[#2B7A75] hover:bg-[#2B7A75]/10 p-1.5 rounded-lg transition-colors cursor-pointer ${
              isCollapsed ? "mx-auto" : ""
            }`}
            title={isCollapsed ? "Tampilkan Menu" : "Sembunyikan Menu"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronRight size={18} className="rotate-180" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-7 sidebar-scroll overflow-y-auto px-4 py-8">
          {menuOrangtua.map((group, groupIndex) => (
            <div key={groupIndex} className="flex flex-col gap-1.5">
              {group.section && (
                <p className="sidebar-section-title text-[11px] font-bold tracking-wider uppercase mb-1 px-3 text-[#2B7A75]/60">
                  {group.section}
                </p>
              )}

              {group.items.map((item, itemIndex) => {
                const active = item.path
                  ? pathname === item.path || pathname.startsWith(item.path + "/")
                  : false;
                const Icon = item.icon;
                const isLogout = item.name === "Logout";
                const isChildActive = item.dropdown?.some(
                  (sub) => sub.path && (pathname === sub.path || pathname.startsWith(sub.path + "/")),
                ) ?? false;

                if (item.dropdown) {
                  const isOpen = openDropdown === item.name || isChildActive;

                  return (
                    <div key={itemIndex} className="relative flex flex-col group/menu">
                      <button
                        onClick={() => {
                          if (!isCollapsed) {
                            setOpenDropdown(isOpen && openDropdown === item.name ? null : item.name);
                          }
                        }}
                        className={`w-full flex justify-between items-center px-3.5 py-3 rounded-xl transition-all duration-300 group
                        ${isCollapsed
                            ? (isChildActive
                              ? "bg-[#2B7A75] text-white shadow-md shadow-teal-500/20"
                              : "text-gray-600 hover:bg-[#F4F9F8] hover:text-[#2B7A75]")
                            : ((isOpen || isChildActive)
                              ? "bg-[#F4F9F8] text-[#1E5C58]"
                              : "text-gray-600 hover:bg-[#F4F9F8] hover:text-[#2B7A75]")
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg transition-colors duration-300 ${
                            isCollapsed
                              ? (isChildActive ? "text-white bg-transparent" : "text-gray-400 group-hover:text-[#2B7A75]")
                              : ((isOpen || isChildActive) ? "bg-[#2B7A75]/10 text-[#2B7A75]" : "text-gray-400 group-hover:bg-[#2B7A75]/10 group-hover:text-[#2B7A75]")
                          }`}>
                            <Icon size={18} strokeWidth={2.5} />
                          </div>
                          <span className="sidebar-text text-sm font-semibold">{item.name}</span>
                        </div>
                        <ChevronDown
                          size={16}
                          strokeWidth={3}
                          className={`sidebar-chevron transition-transform duration-300 text-gray-400 group-hover:text-[#2B7A75] ${isOpen ? "rotate-180 text-[#2B7A75]" : ""}`}
                        />
                      </button>

                      <AnimatePresence>
                        {isOpen && !isCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden sidebar-text"
                          >
                            <div className="ml-10 mt-1 space-y-1 relative before:absolute before:inset-y-0 before:left-[-14px] before:w-px before:bg-gray-200">
                              {item.dropdown.map((sub, subIndex) => {
                                const SubIcon = sub.icon;
                                const subActive = sub.path === pathname || (sub.path ? pathname.startsWith(sub.path + "/") : false);
                                return (
                                  <Link
                                    key={subIndex}
                                    href={sub.path || "#"}
                                    className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-300 ${
                                      subActive
                                        ? "text-[#1E5C58] bg-[#F4F9F8] font-bold before:absolute before:left-[-15px] before:w-[3px] before:h-5 before:bg-[#2B7A75] before:rounded-r-full"
                                        : "text-gray-500 hover:text-[#2B7A75] hover:bg-gray-50 font-medium"
                                    }`}
                                  >
                                    <SubIcon size={15} strokeWidth={2.5} className={subActive ? "text-[#2B7A75]" : "opacity-60"} />
                                    <span>{sub.name}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                if (isLogout) {
                  return (
                    <button
                      key={itemIndex}
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 group text-red-500 hover:bg-red-50 hover:text-red-600 mt-2 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg text-gray-400 group-hover:bg-red-100/50 group-hover:text-red-500 transition-colors duration-300">
                        <Icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className="sidebar-text text-sm font-semibold">{item.name}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={itemIndex}
                    href={item.path || "#"}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 group
                    ${
                      active
                        ? "bg-[#2B7A75] text-white shadow-md shadow-teal-500/20"
                        : "text-gray-600 hover:bg-[#F4F9F8] hover:text-[#2B7A75]"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg transition-colors duration-300
                      ${
                        active
                          ? (isCollapsed ? "text-white bg-transparent" : "bg-white/20 text-white")
                          : `text-gray-400 ${isCollapsed ? "group-hover:text-[#2B7A75]" : "group-hover:bg-[#2B7A75]/10 group-hover:text-[#2B7A75]"}`
                      }`}
                    >
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="sidebar-text text-sm font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

      </motion.aside>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/20 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl shadow-teal-900/10 w-full max-w-sm overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-red-100/50 rounded-full scale-125 opacity-20"
                  />
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>

                <h3 className="text-xl font-extrabold text-[#1E5C58] mb-2 tracking-tight">
                  Konfirmasi Logout
                </h3>
                <p className="text-sm text-gray-505 font-medium leading-relaxed mb-8 px-4">
                  Apakah Anda yakin ingin keluar dari sistem? Anda harus login
                  kembali untuk mengakses data.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleLogout}
                    className="cursor-pointer w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-red-500/20 active:scale-95"
                  >
                    Ya, Keluar Sekarang
                  </button>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="cursor-pointer w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-750 rounded-2xl font-bold text-sm transition-all border border-gray-100 active:scale-95"
                  >
                    Batal
                  </button>
                </div>
              </div>

              {/* Decorative line */}
              <div className="h-1.5 w-full bg-linear-to-r from-red-500/10 via-red-500 to-red-500/10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
