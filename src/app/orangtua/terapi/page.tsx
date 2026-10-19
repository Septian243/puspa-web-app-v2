"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  UserRound,
  Eye,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ResponsiveOrangtuaLayout from "@/components/layout/ResponsiveOrangtuaLayout";
import { useProfile } from "@/context/ProfileContext";
import { getChildren } from "@/lib/api/childrenAsesment";
import { getSchedules } from "@/lib/api/jadwal_terapi";

// =====================
// Types
// =====================
type StatusTerapi = "Terjadwal" | "Reschedule" | "Selesai";
type ActiveTab = StatusTerapi | "Semua";
type QuickFilter = "hariIni" | "besok" | "mingguIni" | "bulanIni" | null;
type StatusKeaktifan = "Aktif" | "Non Aktif" | "Selesai";

interface JadwalTetapItem {
  id: number | string;
  namaAnak: string;
  namaWali: string;
  noRekam: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  jenisTerapi: string;
  terapis: string;
  status: StatusKeaktifan;
  periodeAwal: string;
  periodeAkhir: string;
  totalPertemuan: number;
}

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
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<ActiveTab>("Semua");
  const [filterDate, setFilterDate] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const [search, setSearch] = useState("");

  // =====================
  // State Jadwal Tetap (Tabel Atas)
  // =====================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [apiSchedules, setApiSchedules] = useState<JadwalTetapItem[] | null>(null);
  const [selectedJadwalTetap, setSelectedJadwalTetap] = useState<JadwalTetapItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [tetapPage, setTetapPage] = useState(1);
  const TETAP_PER_PAGE = 8;

  const guardianName = useMemo(() => {
    if (profile?.guardian_name) {
      const rel = profile.relationship_with_child ? ` (${profile.relationship_with_child})` : "";
      return `${profile.guardian_name}${rel}`;
    }
    return "devi ema (Ibu)";
  }, [profile]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await getChildren();
        if (isMounted && res && res.data && res.data.length > 0) {
          setChildrenData(res.data);
        }
      } catch (e) {
        console.warn("Could not fetch children:", e);
      }

      try {
        const schedRes = await getSchedules();
        if (isMounted && schedRes && schedRes.items && schedRes.items.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: JadwalTetapItem[] = schedRes.items.map((item: any) => {
            const rawType = String(item.therapy_type || "").toUpperCase();
            let jenis = "PLB (PAEDAGOG)";
            if (rawType.includes("OKUPASI")) jenis = "TERAPI OKUPASI";
            else if (rawType.includes("WICARA")) jenis = "TERAPI WICARA";
            else if (rawType.includes("FISIO")) jenis = "FISIOTERAPI";
            else if (rawType.includes("PAEDAGOG") || rawType.includes("PLB")) jenis = "PLB (PAEDAGOG)";

            let status: StatusKeaktifan = "Aktif";
            if (item.status === "non_aktif" || item.status === "Non Aktif") status = "Non Aktif";
            else if (item.status === "selesai" || item.status === "Selesai") status = "Selesai";

            return {
              id: item.id,
              namaAnak: item.child_name || "Rayhan",
              namaWali: item.guardian_name || guardianName,
              noRekam: item.medical_record_number || (item.child_id ? `RM-${item.child_id}` : "RM-000124"),
              hari: item.day_name || "Senin",
              jamMulai: item.start_time?.slice(0, 5) || "11:00",
              jamSelesai: item.end_time?.slice(0, 5) || "12:00",
              jenisTerapi: jenis,
              terapis: item.therapist_name || "Adit Tolongin",
              status,
              periodeAwal: item.period_start || "2026-10-09",
              periodeAkhir: item.period_end || "2026-12-13",
              totalPertemuan: item.total_meetings || 4,
            };
          });
          setApiSchedules(mapped);
        }
      } catch (e) {
        console.warn("Could not fetch schedules:", e);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [guardianName]);

  const defaultFixedSchedules: JadwalTetapItem[] = useMemo(() => {
    const child1Name = childrenData[0]?.child_name || "Rayhan";
    const child1Rm = childrenData[0]?.child_id
      ? String(childrenData[0].child_id).startsWith("RM-")
        ? childrenData[0].child_id
        : `RM-${childrenData[0].child_id}`
      : "RM-000124";
    const wali = guardianName;

    const child2Name = childrenData[1]?.child_name || (childrenData.length > 0 ? child1Name : "Putra Pratama");
    const child2Rm = childrenData[1]?.child_id
      ? String(childrenData[1].child_id).startsWith("RM-")
        ? childrenData[1].child_id
        : `RM-${childrenData[1].child_id}`
      : (childrenData.length > 0 ? child1Rm : "RM-000125");

    return [
      {
        id: 1,
        namaAnak: child1Name,
        namaWali: wali,
        noRekam: child1Rm,
        hari: "Senin",
        jamMulai: "11:00",
        jamSelesai: "12:00",
        jenisTerapi: "PLB (PAEDAGOG)",
        terapis: "Adit Tolongin",
        status: "Aktif",
        periodeAwal: "2026-10-09",
        periodeAkhir: "2026-12-13",
        totalPertemuan: 4,
      },
      {
        id: 2,
        namaAnak: child1Name,
        namaWali: wali,
        noRekam: child1Rm,
        hari: "Selasa",
        jamMulai: "11:00",
        jamSelesai: "12:00",
        jenisTerapi: "TERAPI OKUPASI",
        terapis: "Alief Arifun",
        status: "Aktif",
        periodeAwal: "2026-10-09",
        periodeAkhir: "2026-12-13",
        totalPertemuan: 4,
      },
      {
        id: 3,
        namaAnak: child1Name,
        namaWali: wali,
        noRekam: child1Rm,
        hari: "Rabu",
        jamMulai: "11:00",
        jamSelesai: "12:00",
        jenisTerapi: "PLB (PAEDAGOG)",
        terapis: "Adit Tolongin",
        status: "Aktif",
        periodeAwal: "2026-10-09",
        periodeAkhir: "2026-12-13",
        totalPertemuan: 4,
      },
      {
        id: 4,
        namaAnak: child1Name,
        namaWali: wali,
        noRekam: child1Rm,
        hari: "Kamis",
        jamMulai: "11:00",
        jamSelesai: "12:00",
        jenisTerapi: "PLB (PAEDAGOG)",
        terapis: "Adit Tolongin",
        status: "Aktif",
        periodeAwal: "2026-10-09",
        periodeAkhir: "2026-12-13",
        totalPertemuan: 4,
      },
      {
        id: 5,
        namaAnak: child1Name,
        namaWali: wali,
        noRekam: child1Rm,
        hari: "Kamis",
        jamMulai: "11:00",
        jamSelesai: "12:00",
        jenisTerapi: "PLB (PAEDAGOG)",
        terapis: "Adit Tolongin",
        status: "Aktif",
        periodeAwal: "2026-10-09",
        periodeAkhir: "2026-12-13",
        totalPertemuan: 4,
      },
      {
        id: 6,
        namaAnak: child1Name,
        namaWali: wali,
        noRekam: child1Rm,
        hari: "Jum'at",
        jamMulai: "11:00",
        jamSelesai: "12:00",
        jenisTerapi: "TERAPI WICARA",
        terapis: "Alifian",
        status: "Aktif",
        periodeAwal: "2026-10-09",
        periodeAkhir: "2026-12-13",
        totalPertemuan: 4,
      },
      {
        id: 7,
        namaAnak: child2Name,
        namaWali: wali,
        noRekam: child2Rm,
        hari: "Senin",
        jamMulai: "11:00",
        jamSelesai: "12:00",
        jenisTerapi: "PLB (PAEDAGOG)",
        terapis: "Adit Tolongin",
        status: "Selesai",
        periodeAwal: "2026-07-01",
        periodeAkhir: "2026-09-30",
        totalPertemuan: 12,
      },
      {
        id: 8,
        namaAnak: child2Name,
        namaWali: wali,
        noRekam: child2Rm,
        hari: "Senin",
        jamMulai: "11:00",
        jamSelesai: "12:00",
        jenisTerapi: "PLB (PAEDAGOG)",
        terapis: "Adit Tolongin",
        status: "Non Aktif",
        periodeAwal: "2026-05-01",
        periodeAkhir: "2026-06-30",
        totalPertemuan: 8,
      },
    ];
  }, [childrenData, guardianName]);

  const finalJadwalTetapList = useMemo(() => {
    return apiSchedules && apiSchedules.length > 0 ? apiSchedules : defaultFixedSchedules;
  }, [apiSchedules, defaultFixedSchedules]);

  const totalTetap = finalJadwalTetapList.length;
  const totalTetapPages = Math.ceil(totalTetap / TETAP_PER_PAGE) || 1;
  const paginatedTetap = useMemo(() => {
    const start = (tetapPage - 1) * TETAP_PER_PAGE;
    return finalJadwalTetapList.slice(start, start + TETAP_PER_PAGE);
  }, [finalJadwalTetapList, tetapPage]);

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
      {/* =========== SECTION 1: JADWAL SESI (JADWAL TETAP) =========== */}
      <div className="mb-10 flex flex-col gap-4">
        {/* Row 1: Judul Jadwal Sesi */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-[#2B7A75]" />
            Jadwal Sesi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau jadwal tetap terapi yang telah ditetapkan di awal untuk anak Anda
          </p>
        </div>

        {/* =========== TABEL JADWAL TETAP CARD =========== */}
        <div className="bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-teal-50 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    INFORMASI PASIEN
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    JADWAL TERAPI
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    JENIS TERAPIS
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    TERAPIS
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    STATUS PASIEN
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTetap.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <CalendarCheck className="w-12 h-12 text-gray-200" />
                        <p className="text-sm font-medium">Belum ada rekam jadwal tetap</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTetap.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-[#F4F9F8]/50 transition-colors group"
                    >
                      {/* Informasi Pasien */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{item.namaAnak}</p>
                          <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                            Wali: {item.namaWali}
                          </span>
                        </div>
                      </td>

                      {/* Jadwal Terapi */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-800 font-bold">
                          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                          {item.hari}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          Pukul {item.jamMulai} - {item.jamSelesai}
                        </div>
                      </td>

                      {/* Jenis Terapis */}
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold uppercase tracking-wide text-[#2B7A75]">
                          {item.jenisTerapi}
                        </span>
                      </td>

                      {/* Terapis */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#2B7A75]">
                          <UserRound className="w-4 h-4 text-[#2B7A75] shrink-0" />
                          {item.terapis}
                        </div>
                      </td>

                      {/* Status Pasien */}
                      <td className="py-4 px-6">
                        <span
                          className={`text-xs font-extrabold uppercase tracking-wider ${
                            item.status === "Aktif"
                              ? "text-[#2B7A75]"
                              : item.status === "Non Aktif"
                              ? "text-orange-500"
                              : "text-blue-600"
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedJadwalTetap(item);
                            setIsDetailModalOpen(true);
                          }}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E5C58] hover:bg-[#163F3C] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                        >
                          <ChevronRight size={13} strokeWidth={2.5} />
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-3">
            {paginatedTetap.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <CalendarCheck className="w-10 h-10 text-gray-200" />
                <p className="text-sm font-medium">Belum ada rekam jadwal tetap</p>
              </div>
            ) : (
              paginatedTetap.map((item) => (
                <div
                  key={item.id}
                  className="border border-teal-50 rounded-2xl p-4 bg-[#F4F9F8]/30 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{item.namaAnak}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                        Wali: {item.namaWali}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider ${
                        item.status === "Aktif"
                          ? "text-[#2B7A75]"
                          : item.status === "Non Aktif"
                          ? "text-orange-500"
                          : "text-blue-600"
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-gray-500 font-medium">
                      Jenis: <span className="text-[#2B7A75] font-bold uppercase">{item.jenisTerapi}</span>
                    </p>
                    <p className="text-[#2B7A75] font-semibold flex items-center gap-1.5">
                      <UserRound size={13} />
                      {item.terapis}
                    </p>
                    <div className="flex items-center gap-3 text-gray-500 pt-1">
                      <div className="flex items-center gap-1 font-bold text-gray-700">
                        <CalendarDays size={12} className="text-gray-400" />
                        {item.hari}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        Pukul {item.jamMulai} - {item.jamSelesai}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedJadwalTetap(item);
                      setIsDetailModalOpen(true);
                    }}
                    className="cursor-pointer w-full flex items-center justify-center gap-1.5 py-2 bg-[#1E5C58] hover:bg-[#163F3C] text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <ChevronRight size={13} strokeWidth={2.5} />
                    Lihat Detail
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 text-xs text-gray-500">
            <p>
              Menampilkan{" "}
              <span className="font-bold text-[#1E5C58]">
                {paginatedTetap.length}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-[#1E5C58]">
                {totalTetap}
              </span>{" "}
              rekam jadwal <span className="font-bold text-gray-700">Anak</span>
            </p>
            {totalTetapPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTetapPage((p) => Math.max(1, p - 1))}
                  disabled={tetapPage === 1}
                  className="px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:hover:text-gray-500 cursor-pointer"
                >
                  Prev
                </button>
                {Array.from({ length: totalTetapPages }, (_, idx) => idx + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setTetapPage(pg)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                      tetapPage === pg
                        ? "bg-[#1E5C58] text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setTetapPage((p) => Math.min(totalTetapPages, p + 1))}
                  disabled={tetapPage === totalTetapPages}
                  className="px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:hover:text-gray-500 cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========== SECTION 2: DAFTAR SESI =========== */}
      <div className="mb-6 flex flex-col gap-3">

        {/* Row 1: Judul saja */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-[#2B7A75]" />
            Daftar Sesi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau jadwal, perubahan jadwal, dan hasil terapi anak Anda
          </p>
        </div>


        {/* Row 2: SATU pill — container layout-animated, chips fade in/out di dalam */}
        <div className="flex justify-end h-11">
          <div className="flex items-center px-2 bg-white border border-teal-100 rounded-2xl shadow-sm overflow-hidden h-full">
            {/* Chips — fade in/out, container expand/contract via layout */}
            <AnimatePresence>
              {activeTab === "Terjadwal" && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: {
                      opacity: 0,
                      width: 0,
                      transition: { duration: 0.3, ease: "easeInOut" }
                    },
                    visible: {
                      opacity: 1,
                      width: "auto",
                      transition: { duration: 0.3, ease: "easeInOut" }
                    },
                    exit: {
                      opacity: 0,
                      width: 0,
                      transition: { duration: 0.4, ease: "easeInOut" }
                    }
                  }}
                  className="flex items-center justify-end gap-0.5 shrink-0 overflow-hidden"
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
                        className={`cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-bold transition-colors duration-200 ${isActive
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
            <div className="flex items-center gap-1.5 shrink-0 px-1 relative z-10 bg-white">
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
          </div>
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
                  className={`relative cursor-pointer flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isActive ? "text-[#1E5C58]" : "text-gray-500 hover:text-[#2B7A75]"
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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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

      {/* =========== MODAL DETAIL PENJADWALAN =========== */}
      <AnimatePresence>
        {isDetailModalOpen && selectedJadwalTetap && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl md:max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="bg-[#1E5C58] px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                      Detail Penjadwalan
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/80 mt-0.5">
                      Informasi lengkap jadwal terapi {selectedJadwalTetap.namaAnak}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 sm:p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
                {/* Top Grid Info */}
                <div className="grid grid-cols-2 gap-y-5 gap-x-4 px-1 sm:px-2">
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1.5">No. Rekam Medis</p>
                    <p className="text-sm font-extrabold text-gray-800 break-all">
                      {selectedJadwalTetap.noRekam}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1.5">Nama Anak</p>
                    <p className="text-sm font-extrabold text-gray-800">
                      {selectedJadwalTetap.namaAnak}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1.5">Wali</p>
                    <p className="text-sm font-extrabold text-gray-800">
                      {selectedJadwalTetap.namaWali}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1.5">Status</p>
                    <div>
                      <span
                        className={`inline-block px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider ${
                          selectedJadwalTetap.status === "Aktif"
                            ? "bg-[#EAF4F2] text-[#2B7A75]"
                            : selectedJadwalTetap.status === "Non Aktif"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {selectedJadwalTetap.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-gray-400 mb-1.5">Periode</p>
                    <p className="text-sm font-extrabold text-gray-800">
                      {selectedJadwalTetap.periodeAwal && selectedJadwalTetap.periodeAkhir
                        ? `${selectedJadwalTetap.periodeAwal} - ${selectedJadwalTetap.periodeAkhir}`
                        : "Periode Aktif"}
                    </p>
                  </div>
                </div>

                {/* Terapi Card */}
                <div className="border border-gray-100 bg-[#FBFDFD] rounded-2xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#1E5C58]" />
                      <span className="text-sm sm:text-base font-extrabold text-[#1E5C58]">
                        {selectedJadwalTetap.jenisTerapi.toLowerCase().startsWith("terapi")
                          ? selectedJadwalTetap.jenisTerapi
                          : `Terapi ${selectedJadwalTetap.jenisTerapi}`}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#1E5C58] bg-white border border-gray-200 px-3 py-1 rounded-full shadow-xs">
                      1 jadwal
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 mb-1.5">Terapis</p>
                      <div
                        className="w-full px-3.5 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-800 truncate"
                        title={selectedJadwalTetap.terapis}
                      >
                        {selectedJadwalTetap.terapis}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 mb-1.5">Hari</p>
                      <div className="w-full px-3.5 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-800">
                        {selectedJadwalTetap.hari}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 mb-1.5">Jam</p>
                      <div className="w-full px-3.5 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-800 whitespace-nowrap">
                        {selectedJadwalTetap.jamMulai} - {selectedJadwalTetap.jamSelesai}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-500 mb-1.5">Pertemuan</p>
                      <div className="w-full px-3.5 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-800 text-center">
                        {selectedJadwalTetap.totalPertemuan}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Green Card */}
                <div className="bg-[#1E5C58] rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex items-center justify-between shadow-xl shadow-[#1E5C58]/10">
                  <p className="text-xs sm:text-sm font-semibold text-white/90">
                    Total Pertemuan Keseluruhan
                  </p>
                  <p className="text-xl sm:text-2xl font-extrabold text-white">
                    {selectedJadwalTetap.totalPertemuan}{" "}
                    <span className="text-xs sm:text-sm font-medium text-white/80">
                      kali pertemuan
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </ResponsiveOrangtuaLayout>
  );
}
