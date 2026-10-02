"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Search,
  Clock,
  History,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ResponsiveOrangtuaLayout from "@/components/layout/ResponsiveOrangtuaLayout";

// =====================
// Types
// =====================
type StatusTerapi = "Terjadwal" | "Reschedule" | "Selesai";
type ActiveTab = StatusTerapi | "Semua";
type QuickFilter = "hariIni" | "besok" | "mingguIni" | "bulanIni" | null;

interface JadwalTerapi {
  id: number;
  namaAnak: string;
  avatarEmoji: string;
  noRekam: string;
  jenisTerapi: string;
  terapis: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  status: StatusTerapi;
  namaOrangtua: string;
  nomorTelepon: string;
  jenisKelamin: string;
  usia: string;
  tempatTanggalLahir: string;
  asalSekolah: string;
  alamat: string;
}

// =====================
// Dummy Data
// =====================
const DUMMY_JADWAL: JadwalTerapi[] = [
  {
    id: 1,
    namaAnak: "Rayhan",
    avatarEmoji: "👶",
    noRekam: "RM-000124",
    jenisTerapi: "PLB (Paedagog)",
    terapis: "Alief Arifun",
    tanggal: "25/09/2026",
    jamMulai: "08.50",
    jamSelesai: "09.50",
    status: "Terjadwal",
    namaOrangtua: "devi ema (Ibu)",
    nomorTelepon: "0983842",
    jenisKelamin: "Laki-laki",
    usia: "4 Tahun 7 Bulan",
    tempatTanggalLahir: "Sukoharjo, 15 Februari 2022",
    asalSekolah: "tsu",
    alamat: "Sukoharjo",
  },
  {
    id: 2,
    namaAnak: "Rayhan",
    avatarEmoji: "👶",
    noRekam: "RM-000124",
    jenisTerapi: "Wicara",
    terapis: "Rina Wulandari",
    tanggal: "28/09/2026",
    jamMulai: "10.00",
    jamSelesai: "11.00",
    status: "Reschedule",
    namaOrangtua: "devi ema (Ibu)",
    nomorTelepon: "0983842",
    jenisKelamin: "Laki-laki",
    usia: "4 Tahun 7 Bulan",
    tempatTanggalLahir: "Sukoharjo, 15 Februari 2022",
    asalSekolah: "tsu",
    alamat: "Sukoharjo",
  },
  {
    id: 3,
    namaAnak: "Rayhan",
    avatarEmoji: "👶",
    noRekam: "RM-000124",
    jenisTerapi: "Fisioterapi",
    terapis: "Budi Setiawan",
    tanggal: "15/09/2026",
    jamMulai: "09.00",
    jamSelesai: "10.00",
    status: "Selesai",
    namaOrangtua: "devi ema (Ibu)",
    nomorTelepon: "0983842",
    jenisKelamin: "Laki-laki",
    usia: "4 Tahun 7 Bulan",
    tempatTanggalLahir: "Sukoharjo, 15 Februari 2022",
    asalSekolah: "tsu",
    alamat: "Sukoharjo",
  },
];

const TABS: { label: string; value: ActiveTab; icon: React.ReactNode }[] = [
  { label: "Semua", value: "Semua", icon: <LayoutGrid size={14} /> },
  { label: "Terjadwal", value: "Terjadwal", icon: <CalendarCheck size={14} /> },
  { label: "Reschedule", value: "Reschedule", icon: <RefreshCw size={14} /> },
  { label: "Selesai", value: "Selesai", icon: <CheckCircle2 size={14} /> },
];

const STATUS_CONFIG: Record<StatusTerapi, { label: string; color: string; bg: string }> = {
  Terjadwal: { label: "TERJADWAL", color: "text-[#2B7A75]", bg: "bg-[#EAF4F2]" },
  Reschedule: { label: "RESCHEDULE", color: "text-amber-700", bg: "bg-amber-100" },
  Selesai: { label: "SELESAI", color: "text-blue-700", bg: "bg-blue-100" },
};

const QUICK_FILTERS: { label: string; value: NonNullable<QuickFilter> }[] = [
  { label: "Hari Ini", value: "hariIni" },
  { label: "Besok", value: "besok" },
  { label: "Minggu Ini", value: "mingguIni" },
  { label: "Bulan Ini", value: "bulanIni" },
];

function fmtDateDDMMYYYY(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// =====================
// Main Page
// =====================
export default function TerapiOrangtuaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("Semua");
  const [filterDate, setFilterDate] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const [search, setSearch] = useState("");

  const quickDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const weekStart = new Date(today);
    // Monday of this week
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    weekStart.setDate(today.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { today, tomorrow, weekStart, weekEnd };
  }, []);

  const filtered = useMemo(() => {
    return DUMMY_JADWAL.filter((item) => {
      const matchTab = activeTab === "Semua" ? true : item.status === activeTab;
      const matchSearch = item.namaAnak.toLowerCase().includes(search.toLowerCase());

      let matchDate = true;

      if (filterDate && !quickFilter) {
        const [year, month, day] = filterDate.split("-");
        matchDate = item.tanggal === `${day}/${month}/${year}`;
      }

      if (quickFilter && activeTab === "Terjadwal") {
        const [d, m, y] = item.tanggal.split("/").map(Number);
        const itemDate = new Date(y, m - 1, d);
        itemDate.setHours(0, 0, 0, 0);
        if (quickFilter === "hariIni")
          matchDate = itemDate.getTime() === quickDates.today.getTime();
        else if (quickFilter === "besok")
          matchDate = itemDate.getTime() === quickDates.tomorrow.getTime();
        else if (quickFilter === "mingguIni")
          matchDate = itemDate >= quickDates.weekStart && itemDate <= quickDates.weekEnd;
        else if (quickFilter === "bulanIni")
          matchDate =
            itemDate.getMonth() === quickDates.today.getMonth() &&
            itemDate.getFullYear() === quickDates.today.getFullYear();
      }

      return matchTab && matchSearch && matchDate;
    });
  }, [activeTab, search, filterDate, quickFilter, quickDates]);

  const handleLihatDetail = (item: JadwalTerapi) => {
    const params = new URLSearchParams({
      id: String(item.id),
      namaAnak: item.namaAnak,
      noRekam: item.noRekam,
      jenisTerapi: item.jenisTerapi,
      terapis: item.terapis,
      tanggal: item.tanggal,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      status: item.status,
      namaOrangtua: item.namaOrangtua,
      nomorTelepon: item.nomorTelepon,
      jenisKelamin: item.jenisKelamin,
      usia: item.usia,
      tempatTanggalLahir: item.tempatTanggalLahir,
      asalSekolah: item.asalSekolah,
      alamat: item.alamat,
    });
    router.push(`/orangtua/terapi/detail?${params.toString()}`);
  };

  return (
    <ResponsiveOrangtuaLayout maxWidth="max-w-full">
      {/* =========== PAGE HEADER =========== */}
      <div className="mb-6 flex flex-col gap-3">

        {/* Row 1: Judul saja */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-[#2B7A75]" />
            Jadwal Terapi Anak
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau jadwal, perubahan jadwal, dan hasil terapi anak Anda
          </p>
        </div>

        {/* Row 2: SATU pill — container layout-animated, chips fade in/out di dalam */}
        <div className="flex justify-end">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 420, damping: 40, mass: 0.5 }}
            className="flex items-center px-2 py-2 bg-white border border-teal-100 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Chips — fade in/out, container expand/contract via layout */}
            <AnimatePresence mode="popLayout">
              {activeTab === "Terjadwal" && (
                <motion.div
                  key="chips"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="flex items-center gap-0.5 shrink-0"
                >
                  {QUICK_FILTERS.map((qf) => {
                    const isActive = quickFilter === qf.value;
                    return (
                      <button
                        key={qf.value}
                        onClick={() => {
                          setQuickFilter(isActive ? null : qf.value);
                          setFilterDate("");
                        }}
                        className={`cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          isActive
                            ? "bg-[#1E5C58] text-white shadow-sm"
                            : "text-gray-500 hover:text-[#2B7A75] hover:bg-teal-50/70"
                        }`}
                      >
                        {qf.label}
                      </button>
                    );
                  })}
                  {/* Divider antara chips dan kalender */}
                  <div className="w-px h-5 bg-teal-100 mx-2 shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Kalender — selalu ada di kanan, tidak bergerak relatif terhadap tepi kanan pill */}
            <div className="flex items-center gap-1.5 shrink-0 px-1">
              <CalendarDays className="w-4 h-4 text-teal-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setQuickFilter(null);
                }}
                className="bg-transparent text-sm text-gray-500 focus:outline-none cursor-pointer w-[120px]"
              />
            </div>
          </motion.div>
        </div>




        {/* Row 3: [Gambar 1] Tabs + Search + Riwayat — satu baris penuh */}
        <div className="flex items-center gap-3 overflow-x-auto">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 p-1 bg-gray-100/70 rounded-xl">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setActiveTab(tab.value);
                    if (tab.value !== "Terjadwal") setQuickFilter(null);
                  }}
                  className={`relative cursor-pointer flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    isActive ? "text-[#1E5C58]" : "text-gray-500 hover:text-[#2B7A75]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabTerapi"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama anak / pasien..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-teal-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-sm w-60 hover:border-teal-200 transition-colors"
            />
          </div>

          {/* Riwayat button */}
          <button
            onClick={() => router.push("/orangtua/terapi/riwayat")}
            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E5C58] hover:bg-[#163F3C] text-white text-sm font-bold rounded-xl shadow-md shadow-teal-900/20 transition-all active:scale-95"
          >
            <History size={16} />
            Riwayat
          </button>
        </div>
      </div>

      {/* =========== TABLE CARD =========== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}|${search}|${filterDate}|${quickFilter}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-teal-50 overflow-hidden"
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">NO</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">INFO ANAK</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">JENIS TERAPI</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">TERAPIS</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">TANGGAL &amp; JAM</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider">STATUS</th>
                  <th className="py-4 px-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <CalendarCheck className="w-12 h-12 text-gray-200" />
                        <p className="text-sm font-medium">
                          Tidak ada jadwal{activeTab !== "Semua" ? ` ${activeTab.toLowerCase()}` : ""}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => {
                    const sc = STATUS_CONFIG[item.status];
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-[#F4F9F8]/50 transition-colors group"
                      >
                        <td className="py-4 px-5 text-sm font-bold text-gray-400">{index + 1}</td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xl shrink-0">
                              {item.avatarEmoji}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm group-hover:text-[#2B7A75] transition-colors">
                                {item.namaAnak}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium">{item.noRekam}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-sm font-semibold text-gray-700">{item.jenisTerapi}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-sm font-semibold text-[#2B7A75]">{item.terapis}</span>
                        </td>
                        <td className="py-4 px-5">
                          <p className="text-sm font-bold text-gray-700">{item.tanggal}</p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">
                            Pukul {item.jamMulai} – {item.jamSelesai}
                          </p>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${sc.bg} ${sc.color}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => handleLihatDetail(item)}
                            className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E5C58] hover:bg-[#163F3C] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                          >
                            <ChevronRight size={13} strokeWidth={2.5} />
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                <CalendarCheck className="w-10 h-10 text-gray-200" />
                <p className="text-sm font-medium">
                  Tidak ada jadwal{activeTab !== "Semua" ? ` ${activeTab.toLowerCase()}` : ""}
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const sc = STATUS_CONFIG[item.status];
                return (
                  <div
                    key={item.id}
                    className="border border-teal-50 rounded-2xl p-4 bg-[#F4F9F8]/30"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xl shrink-0">
                        {item.avatarEmoji}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{item.namaAnak}</p>
                        <p className="text-[11px] text-gray-400">{item.noRekam}</p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <p className="text-xs text-gray-600 font-semibold">
                        <span className="text-gray-400 font-medium">Terapi: </span>{item.jenisTerapi}
                      </p>
                      <p className="text-xs text-[#2B7A75] font-semibold">
                        <span className="text-gray-400 font-medium">Terapis: </span>{item.terapis}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarDays size={12} className="text-[#2B7A75]" />
                          {item.tanggal}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-[#2B7A75]" />
                          {item.jamMulai} – {item.jamSelesai}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLihatDetail(item)}
                      className="cursor-pointer w-full flex items-center justify-center gap-1.5 py-2 bg-[#1E5C58] hover:bg-[#163F3C] text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <ChevronRight size={13} strokeWidth={2.5} />
                      Lihat Detail
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </AnimatePresence>

    </ResponsiveOrangtuaLayout>
  );
}
