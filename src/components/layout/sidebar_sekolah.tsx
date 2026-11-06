"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  User,
  AlertTriangle,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

/* ------------------ TYPES ------------------ */

interface MenuItem {
  name: string;
  href: string;
  icon?: React.ElementType;
  dropdown?: { name: string; href: string; icon?: React.ElementType }[];
}

interface MenuGroup {
  section: string | null;
  items: MenuItem[];
}

interface SidebarSekolahProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/* ------------------ MENU DATA ------------------ */

export const menuSekolah: MenuGroup[] = [
  {
    section: null,
    items: [
      { name: "Dashboard", href: "/sekolah/dashboard", icon: LayoutGrid },
    ],
  },
  {
    section: "MANAJEMEN DATA",
    items: [
      {
        name: "Laporan Asesmen",
        href: "/sekolah/laporan_asesmen",
        icon: FileText,
      },
    ],
  },
  {
    section: "KELOLA AKUN",
    items: [
      {
        name: "Pengaturan",
        href: "#",
        icon: Settings,
        dropdown: [
          {
            name: "Ubah Profile",
            href: "/sekolah/profil",
            icon: User,
          },
          {
            name: "Ubah Password",
            href: "/sekolah/ubah_password",
            icon: Lock,
          },
        ],
      },
      { name: "Log Out", href: "/auth/login", icon: LogOut },
    ],
  },
];

/* ------------------ SIDEBAR COMPONENT ------------------ */

export default function SidebarSekolah({
  isOpen = false,
  onClose = () => {},
}: SidebarSekolahProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

  if (!mounted) return null;

  const isMobile = windowWidth < 768;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <motion.aside
        animate={{
          width: isMobile ? 280 : isCollapsed ? 90 : 280,
          x: isMobile ? (isOpen ? 0 : -280) : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-teal-50 shadow-xl md:shadow-none h-screen ${
          isCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        {/* Header / Logo Section */}
        <div className="flex items-center justify-between p-6 border-b border-teal-50/50">
          <div className="sidebar-logo flex items-center gap-3">
            <Link
              href="/sekolah/dashboard"
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
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-7 sidebar-scroll overflow-y-auto px-4 py-8">
          {menuSekolah.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              {group.section && (
                <p className="sidebar-section-title text-[11px] font-bold tracking-wider uppercase mb-1 px-3 text-[#2B7A75]/60">
                  {group.section}
                </p>
              )}

              {group.items.map((item, i) => {
                const isParentActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                const isChildActive =
                  item.dropdown?.some(
                    (sub) =>
                      pathname === sub.href ||
                      pathname.startsWith(sub.href + "/"),
                  ) ?? false;

                if (item.dropdown) {
                  const isOpenDropdown =
                    openDropdown === item.name ||
                    isChildActive ||
                    isParentActive;

                  return (
                    <div key={i} className="flex flex-col relative group/menu">
                      <button
                        onClick={() => {
                          if (!isCollapsed) {
                            setOpenDropdown(
                              openDropdown === item.name ? null : item.name,
                            );
                          }
                        }}
                        className={`w-full flex justify-between items-center px-3.5 py-3 rounded-xl transition-all duration-300 group ${
                          isCollapsed
                            ? isChildActive
                              ? "bg-[#2B7A75] text-white shadow-md shadow-teal-500/20"
                              : "text-gray-600 hover:bg-[#F4F9F8] hover:text-[#2B7A75]"
                            : isOpenDropdown || isChildActive
                            ? "bg-[#F4F9F8] text-[#1E5C58]"
                            : "text-gray-600 hover:bg-[#F4F9F8] hover:text-[#2B7A75]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg transition-colors duration-300 ${
                              isCollapsed
                                ? isChildActive
                                  ? "text-white bg-transparent"
                                  : "text-gray-400 group-hover:text-[#2B7A75] bg-transparent"
                                : isOpenDropdown || isChildActive
                                ? "bg-[#2B7A75]/10 text-[#2B7A75]"
                                : "text-gray-400 group-hover:bg-[#2B7A75]/10 group-hover:text-[#2B7A75]"
                            }`}
                          >
                            {item.icon && (
                              <item.icon size={18} strokeWidth={2.5} />
                            )}
                          </div>
                          <span className="sidebar-text text-sm font-semibold">
                            {item.name}
                          </span>
                        </div>

                        <ChevronDown
                          size={16}
                          className={`sidebar-chevron transition-transform duration-300 text-gray-400 ${
                            isOpenDropdown ? "rotate-180 text-[#2B7A75]" : ""
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu Items */}
                      <AnimatePresence>
                        {isOpenDropdown && !isCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden pl-11 pr-2 space-y-1 mt-1"
                          >
                            {item.dropdown.map((sub, j) => {
                              const isSubActive = pathname === sub.href;
                              return (
                                <Link
                                  key={j}
                                  href={sub.href}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                    isSubActive
                                      ? "text-[#2B7A75] bg-teal-50/60 font-bold"
                                      : "text-gray-500 hover:text-[#2B7A75] hover:bg-gray-50"
                                  }`}
                                >
                                  {sub.icon && <sub.icon size={14} />}
                                  <span>{sub.name}</span>
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                // Normal Link or Logout
                const isLogout = item.name === "Log Out";

                if (isLogout) {
                  return (
                    <button
                      key={i}
                      onClick={() => setShowLogoutModal(true)}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 group text-red-500 hover:bg-red-50 hover:text-red-600 mt-2 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg transition-colors duration-300 text-red-400 group-hover:text-red-600">
                        {item.icon && <item.icon size={18} strokeWidth={2.5} />}
                      </div>
                      <span className="text-sm font-bold sidebar-text">
                        {item.name}
                      </span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setOpenDropdown(null)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 group ${
                      isParentActive
                        ? "bg-[#245D56] text-white shadow-md shadow-teal-700/20"
                        : "text-gray-600 hover:bg-[#F4F9F8] hover:text-[#2B7A75]"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg transition-colors duration-300 ${
                        isParentActive
                          ? "text-white bg-transparent"
                          : "text-gray-400 group-hover:bg-[#2B7A75]/10 group-hover:text-[#2B7A75]"
                      }`}
                    >
                      {item.icon && <item.icon size={18} strokeWidth={2.5} />}
                    </div>
                    <span className="text-sm font-bold sidebar-text">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1E5C58]"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            PUSPA SEKOLAH V1.0
          </p>
          <div className="w-1.5 h-1.5 rounded-full bg-[#1E5C58]"></div>
        </div>
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
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8 px-4">
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
                    className="cursor-pointer w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm transition-all border border-gray-100 active:scale-95"
                  >
                    Batal
                  </button>
                </div>
              </div>

              {/* Decorative line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-red-500/10 via-red-500 to-red-500/10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

