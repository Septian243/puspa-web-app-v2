"use client";

import React, { useEffect, useState, Suspense, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Search,
  Calendar,
  Settings,
  FileText,
  Eye,
  Download,
  RefreshCw,
  CheckCircle2,
  CalendarCheck,
  Clock,
  Phone,
  User,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTherapistProfile } from "@/context/ProfileTerapisContext";

// ── Types ──────────────────────────────────────────────────────────────────────
type TerapiTab =
  | "PLB (Paedagog)"
  | "Terapi Okupasi"
  | "Terapi Wicara"
  | "Fisioterapi";

export interface JadwalRow {
  id: string;
  namaPasien: string;
  namaOrangTua: string;
  telepon: string;
  tipeTerapi: string;
  terapis: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string;   // "09.35 - 10.35"
  status: "Terjadwal" | "Selesai";
  tanggal_lama?: string | null;
  waktu_lama?: string | null;
  kategori_alasan?: "Sakit" | "Izin" | "Tidak Hadir" | null;
  alasan?: string | null;
  nomorRM?: string;
  usia?: string;
  jenisKelamin?: string;
  tempatTglLahir?: string;
  asalSekolah?: string;
  alamat?: string;
  hubunganWali?: string;
}

const getTodayDateStr = () => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
};

const getTomorrowDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
};

const getYesterdayDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
};

const getWeekRangeStr = () => {
  const d = new Date();
  const day = d.getDay() || 7;
  const start = new Date(d);
  start.setDate(d.getDate() - day + 1);
  const end = new Date(d);
  end.setDate(d.getDate() - day + 7);
  return {
    start: start.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
    end: end.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
  };
};

const getMonthRangeStr = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    start: start.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
    end: end.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
  };
};

const formatTanggal = (yyyyMmDd: string) => {
  if (!yyyyMmDd) return "";
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}/${m}/${y}`;
};

// ── Dummy data sederhana ─────────────────────────────────────────────────────
const dummyJadwalData: JadwalRow[] = [
  // 1. Kasus Normal Terjadwal
  {
    id: "1",
    namaPasien: "Zefanya Lidia",
    namaOrangTua: "Alief Arifin Mahardiko",
    telepon: "085922002245",
    tipeTerapi: "Terapi Okupasi",
    terapis: "Alief Arifun",
    tanggal: getTodayDateStr(),
    waktu: "10.00 - 11.00",
    status: "Terjadwal",
    nomorRM: "RM-000101",
    usia: "6 Tahun 2 Bulan",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Surakarta, 12 Maret 2020",
    asalSekolah: "TK Pertiwi",
    alamat: "Jl. Slamet Riyadi No. 45, Surakarta",
    hubunganWali: "Ayah",
  },
  // 2. Kasus Normal Selesai
  {
    id: "2",
    namaPasien: "Kenzi",
    namaOrangTua: "Budi Santoso",
    telepon: "081234567890",
    tipeTerapi: "Terapi Okupasi",
    terapis: "Alief Arifun",
    tanggal: getTodayDateStr(),
    waktu: "11.00 - 12.00",
    status: "Selesai",
    nomorRM: "RM-000102",
    usia: "6 Tahun 5 Bulan",
    jenisKelamin: "Laki-laki",
    tempatTglLahir: "Solo, 10 Mei 2020",
    asalSekolah: "TK Pembina",
    alamat: "Jl. Veteran No. 23, Surakarta",
    hubunganWali: "Ayah",
  },
  // 3. Kasus Reschedule (Sakit) - Diterapi Hari Ini
  {
    id: "3",
    namaPasien: "Caca",
    namaOrangTua: "Lina",
    telepon: "085566778899",
    tipeTerapi: "Terapi Okupasi",
    terapis: "Dr. Tirta",
    tanggal: getTodayDateStr(),
    waktu: "09.00 - 10.00",
    status: "Terjadwal",
    tanggal_lama: getYesterdayDateStr(),
    waktu_lama: "09.00 - 10.00",
    kategori_alasan: "Sakit",
    alasan: "Anak demam kemarin, dipindah ke hari ini.",
    nomorRM: "RM-000103",
    usia: "7 Tahun 4 Bulan",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Surakarta, 03 Mei 2019",
    asalSekolah: "TK Tunas Bangsa",
    alamat: "Surakarta",
    hubunganWali: "Ibu",
  },
  // 4. Kasus Reschedule (Izin)
  {
    id: "4",
    namaPasien: "Dian Sastro",
    namaOrangTua: "Rina Kusuma",
    telepon: "089876543210",
    tipeTerapi: "Terapi Okupasi",
    terapis: "Sus Rini",
    tanggal: getTomorrowDateStr(),
    waktu: "13.00 - 14.00",
    status: "Terjadwal",
    tanggal_lama: getTodayDateStr(),
    waktu_lama: "13.00 - 14.00",
    kategori_alasan: "Izin",
    alasan: "Acara keluarga mendadak ke luar kota.",
    nomorRM: "RM-000104",
    usia: "5 Tahun 3 Bulan",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Solo, 22 Juni 2021",
    asalSekolah: "TK Kemala",
    alamat: "Jl. Monginsidi No. 7, Surakarta",
    hubunganWali: "Ibu",
  },
  // 5. Kasus Tertunda (Jadwal Terlewat Hari Sebelumnya)
  {
    id: "5",
    namaPasien: "Gibran",
    namaOrangTua: "Jokowi",
    telepon: "082233445566",
    tipeTerapi: "Terapi Okupasi",
    terapis: "Suster M",
    tanggal: getYesterdayDateStr(), // Agar masuk tab Tertunda
    waktu: "15.00 - 16.00",
    status: "Terjadwal",
    nomorRM: "RM-000105",
    usia: "4 Tahun 6 Bulan",
    jenisKelamin: "Laki-laki",
    tempatTglLahir: "Surakarta, 30 Maret 2022",
    asalSekolah: "PAUD Melati",
    alamat: "Jl. Manahan No. 1, Solo",
    hubunganWali: "Ayah",
  },
  // 6. Kasus Reschedule (Tidak Hadir)
  {
    id: "6",
    namaPasien: "Rara",
    namaOrangTua: "Siti Nurhaliza",
    telepon: "081122334455",
    tipeTerapi: "Terapi Okupasi",
    terapis: "Dr. Tirta",
    tanggal: getTomorrowDateStr(),
    waktu: "08.00 - 09.00",
    status: "Terjadwal",
    tanggal_lama: getTodayDateStr(),
    waktu_lama: "08.00 - 09.00",
    kategori_alasan: "Tidak Hadir",
    alasan: "Pasien tidak hadir tanpa keterangan.",
    nomorRM: "RM-000106",
    usia: "6 Tahun",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Solo, 14 April 2020",
    asalSekolah: "TK Bintang",
    alamat: "Mojosongo, Solo",
    hubunganWali: "Ibu",
  },
  // 7. Kasus Normal Selesai Tambahan
  {
    id: "7",
    namaPasien: "Bima",
    namaOrangTua: "Arjuna",
    telepon: "081999888777",
    tipeTerapi: "Terapi Okupasi",
    terapis: "Suster M",
    tanggal: getTodayDateStr(),
    waktu: "14.00 - 15.00",
    status: "Selesai",
    nomorRM: "RM-000107",
    usia: "8 Tahun 1 Bulan",
    jenisKelamin: "Laki-laki",
    tempatTglLahir: "Semarang, 22 Agustus 2018",
    asalSekolah: "SD Pelita Harapan",
    alamat: "Banjarsari, Solo",
    hubunganWali: "Ayah",
  },

  // ==========================================
  // TAMBAHAN DATA UNTUK TIPE TERAPI LAIN (4 kasus x 3 tipe)
  // ==========================================

  // --- PLB (Paedagog) ---
  {
    id: "8",
    namaPasien: "Andi",
    namaOrangTua: "Bapak Andi",
    telepon: "08111222333",
    tipeTerapi: "PLB (Paedagog)",
    terapis: "Alief Arifun",
    tanggal: getTodayDateStr(),
    waktu: "09.00 - 10.00",
    status: "Terjadwal",
    nomorRM: "RM-000108",
    usia: "6 Tahun",
    jenisKelamin: "Laki-laki",
    tempatTglLahir: "Solo, 10 Januari 2020",
    asalSekolah: "TK A",
    alamat: "Solo",
    hubunganWali: "Ayah",
  },
  {
    id: "9",
    namaPasien: "Sita",
    namaOrangTua: "Ibu Sita",
    telepon: "08111222444",
    tipeTerapi: "PLB (Paedagog)",
    terapis: "Alief Arifun",
    tanggal: getTodayDateStr(),
    waktu: "10.00 - 11.00",
    status: "Selesai",
    nomorRM: "RM-000109",
    usia: "5 Tahun",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Solo, 15 Februari 2021",
    asalSekolah: "TK B",
    alamat: "Solo",
    hubunganWali: "Ibu",
  },
  {
    id: "10",
    namaPasien: "Rudi",
    namaOrangTua: "Bapak Rudi",
    telepon: "08111222555",
    tipeTerapi: "PLB (Paedagog)",
    terapis: "Alief Arifun",
    tanggal: getTomorrowDateStr(),
    waktu: "11.00 - 12.00",
    status: "Terjadwal",
    tanggal_lama: getTodayDateStr(),
    waktu_lama: "11.00 - 12.00",
    kategori_alasan: "Sakit",
    alasan: "Anak demam",
    nomorRM: "RM-000110",
    usia: "7 Tahun",
    jenisKelamin: "Laki-laki",
    tempatTglLahir: "Solo, 20 Maret 2019",
    asalSekolah: "SD 1",
    alamat: "Solo",
    hubunganWali: "Ayah",
  },
  {
    id: "11",
    namaPasien: "Nina",
    namaOrangTua: "Ibu Nina",
    telepon: "08111222666",
    tipeTerapi: "PLB (Paedagog)",
    terapis: "Alief Arifun",
    tanggal: getYesterdayDateStr(), // Tertunda
    waktu: "13.00 - 14.00",
    status: "Terjadwal",
    nomorRM: "RM-000111",
    usia: "4 Tahun",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Solo, 25 April 2022",
    asalSekolah: "PAUD",
    alamat: "Solo",
    hubunganWali: "Ibu",
  },

  // --- Terapi Wicara ---
  {
    id: "12",
    namaPasien: "Tono",
    namaOrangTua: "Bapak Tono",
    telepon: "08222333444",
    tipeTerapi: "Terapi Wicara",
    terapis: "Sus Rini",
    tanggal: getTodayDateStr(),
    waktu: "09.00 - 10.00",
    status: "Terjadwal",
    nomorRM: "RM-000112",
    usia: "6 Tahun",
    jenisKelamin: "Laki-laki",
    tempatTglLahir: "Solo, 05 Mei 2020",
    asalSekolah: "TK A",
    alamat: "Solo",
    hubunganWali: "Ayah",
  },
  {
    id: "13",
    namaPasien: "Mila",
    namaOrangTua: "Ibu Mila",
    telepon: "08222333555",
    tipeTerapi: "Terapi Wicara",
    terapis: "Sus Rini",
    tanggal: getTodayDateStr(),
    waktu: "10.00 - 11.00",
    status: "Selesai",
    nomorRM: "RM-000113",
    usia: "5 Tahun",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Solo, 10 Juni 2021",
    asalSekolah: "TK B",
    alamat: "Solo",
    hubunganWali: "Ibu",
  },
  {
    id: "14",
    namaPasien: "Luki",
    namaOrangTua: "Bapak Luki",
    telepon: "08222333666",
    tipeTerapi: "Terapi Wicara",
    terapis: "Sus Rini",
    tanggal: getTomorrowDateStr(),
    waktu: "11.00 - 12.00",
    status: "Terjadwal",
    tanggal_lama: getTodayDateStr(),
    waktu_lama: "11.00 - 12.00",
    kategori_alasan: "Izin",
    alasan: "Ke luar kota",
    nomorRM: "RM-000114",
    usia: "7 Tahun",
    jenisKelamin: "Laki-laki",
    tempatTglLahir: "Solo, 15 Juli 2019",
    asalSekolah: "SD 1",
    alamat: "Solo",
    hubunganWali: "Ayah",
  },
  {
    id: "15",
    namaPasien: "Santi",
    namaOrangTua: "Ibu Santi",
    telepon: "08222333777",
    tipeTerapi: "Terapi Wicara",
    terapis: "Sus Rini",
    tanggal: getYesterdayDateStr(), // Tertunda
    waktu: "13.00 - 14.00",
    status: "Terjadwal",
    nomorRM: "RM-000115",
    usia: "4 Tahun",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Solo, 20 Agustus 2022",
    asalSekolah: "PAUD",
    alamat: "Solo",
    hubunganWali: "Ibu",
  },

  // --- Fisioterapi ---
  {
    id: "16",
    namaPasien: "Bowo",
    namaOrangTua: "Bapak Bowo",
    telepon: "08333444555",
    tipeTerapi: "Fisioterapi",
    terapis: "Suster M",
    tanggal: getTodayDateStr(),
    waktu: "09.00 - 10.00",
    status: "Terjadwal",
    nomorRM: "RM-000116",
    usia: "6 Tahun",
    jenisKelamin: "Laki-laki",
    tempatTglLahir: "Solo, 01 September 2020",
    asalSekolah: "TK A",
    alamat: "Solo",
    hubunganWali: "Ayah",
  },
  {
    id: "17",
    namaPasien: "Rina",
    namaOrangTua: "Ibu Rina",
    telepon: "08333444666",
    tipeTerapi: "Fisioterapi",
    terapis: "Suster M",
    tanggal: getTodayDateStr(),
    waktu: "10.00 - 11.00",
    status: "Selesai",
    nomorRM: "RM-000117",
    usia: "5 Tahun",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Solo, 05 Oktober 2021",
    asalSekolah: "TK B",
    alamat: "Solo",
    hubunganWali: "Ibu",
  },
  {
    id: "18",
    namaPasien: "Doni",
    namaOrangTua: "Bapak Doni",
    telepon: "08333444777",
    tipeTerapi: "Fisioterapi",
    terapis: "Suster M",
    tanggal: getTomorrowDateStr(),
    waktu: "11.00 - 12.00",
    status: "Terjadwal",
    tanggal_lama: getTodayDateStr(),
    waktu_lama: "11.00 - 12.00",
    kategori_alasan: "Tidak Hadir",
    alasan: "Tanpa keterangan",
    nomorRM: "RM-000118",
    usia: "7 Tahun",
    jenisKelamin: "Laki-laki",
    tempatTglLahir: "Solo, 10 November 2019",
    asalSekolah: "SD 1",
    alamat: "Solo",
    hubunganWali: "Ayah",
  },
  {
    id: "19",
    namaPasien: "Vira",
    namaOrangTua: "Ibu Vira",
    telepon: "08333444888",
    tipeTerapi: "Fisioterapi",
    terapis: "Suster M",
    tanggal: getYesterdayDateStr(), // Tertunda
    waktu: "13.00 - 14.00",
    status: "Terjadwal",
    nomorRM: "RM-000119",
    usia: "4 Tahun",
    jenisKelamin: "Perempuan",
    tempatTglLahir: "Solo, 15 Desember 2022",
    asalSekolah: "PAUD",
    alamat: "Solo",
    hubunganWali: "Ibu",
  }
];

type StatusFilter = "Terjadwal" | "Selesai" | "Reschedule" | "Tertunda";
type DateRangeFilter = "hari-ini" | "besok" | "minggu-ini" | "bulan-ini" | "custom";

const getBadgeStyles = (kategori?: "Sakit" | "Izin" | "Tidak Hadir" | null) => {
  switch (kategori) {
    case "Sakit": return "bg-blue-50 text-blue-500 border-blue-200";
    case "Izin": return "bg-orange-50 text-orange-500 border-orange-200";
    case "Tidak Hadir": return "bg-red-50 text-red-600 border-red-200";
    default: return "bg-gray-50 text-gray-500 border-gray-200";
  }
};

// ── Wrapper dengan Suspense ───────────────────────────────────────────────────
export default function JadwalTerapisPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FBFB] text-[#1E5C58]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#81B7A9] border-t-transparent" />
            <p className="text-sm font-semibold">Memuat Halaman Jadwal...</p>
          </div>
        </div>
      }
    >
      <JadwalContent />
    </Suspense>
  );
}

// ── Action Dropdown (portal — pola presensi) ──────────────────────────────────
function ActionDropdown({
  item,
  openDropdownId,
  setOpenDropdownId,
  statusFilter,
  mySection,
  currentTab,
  onIsiSoap,
  onDetail,
  onLihatHasil,
}: {
  item: JadwalRow;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  statusFilter: StatusFilter;
  mySection: string;
  currentTab: string;
  onIsiSoap: (item: JadwalRow) => void;
  onDetail: (item: JadwalRow) => void;
  onLihatHasil: (item: JadwalRow) => void;
}) {
  const isOpen = openDropdownId === item.id;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    openUpward: boolean;
  }>({ top: 0, left: 0, openUpward: false });

  const MENU_WIDTH = 192;
  const MENU_HEIGHT_EST = statusFilter === "Terjadwal" ? 140 : 52;

  const isMySpecialty =
    currentTab.toLowerCase().includes(mySection.toLowerCase()) ||
    mySection.toLowerCase().includes("plb") && currentTab === "PLB (Paedagog)";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < MENU_HEIGHT_EST + 12;
      let left = rect.right - MENU_WIDTH;
      if (left < 8) left = 8;
      if (left + MENU_WIDTH > window.innerWidth - 8)
        left = window.innerWidth - MENU_WIDTH - 8;
      setMenuPos({
        top: openUpward ? rect.top - MENU_HEIGHT_EST - 8 : rect.bottom + 8,
        left,
        openUpward,
      });
    }
    setOpenDropdownId(isOpen ? null : item.id);
  };

  return (
    <td className="px-4 py-4 text-center">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-100 rounded-lg text-[#1E5C58] hover:bg-teal-50/40 text-xs font-semibold transition-colors"
      >
        <Settings size={13} />
        <span>Aksi</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setOpenDropdownId(null)}
                />
                <motion.div
                  initial={{ opacity: 0, y: menuPos.openUpward ? 10 : -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: menuPos.openUpward ? 10 : -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "fixed",
                    top: menuPos.top,
                    left: menuPos.left,
                    width: MENU_WIDTH,
                  }}
                  className="z-[101] rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-teal-50/80 overflow-hidden py-1 text-[#1E5C58]"
                >
                  {/* Status: Terjadwal / Reschedule / Tertunda */}
                  {(statusFilter === "Terjadwal" || statusFilter === "Reschedule" || statusFilter === "Tertunda") && isMySpecialty && (
                    <>
                      <button
                        onClick={() => { setOpenDropdownId(null); onIsiSoap(item); }}
                        disabled={statusFilter === "Reschedule"}
                        className={`flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors ${statusFilter === "Reschedule" ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-teal-50/30 hover:text-[#1E5C58]"}`}
                      >
                        <FileText size={16} className="mr-2 text-[#81B7A9]" />
                        Isi SOAP
                      </button>
                      <button
                        onClick={() => { setOpenDropdownId(null); onDetail(item); }}
                        disabled={statusFilter === "Reschedule"}
                        className={`flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors ${statusFilter === "Reschedule" ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-teal-50/30 hover:text-[#1E5C58]"}`}
                      >
                        <Eye size={16} className="mr-2 text-[#81B7A9]" />
                        Detail
                      </button>
                    </>
                  )}

                  {/* Status: Terjadwal / Reschedule / Tertunda — bukan keahliannya */}
                  {(statusFilter === "Terjadwal" || statusFilter === "Reschedule" || statusFilter === "Tertunda") && !isMySpecialty && (
                    <button
                      onClick={() => { setOpenDropdownId(null); onDetail(item); }}
                      disabled={statusFilter === "Reschedule"}
                      className={`flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors ${statusFilter === "Reschedule" ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-teal-50/30 hover:text-[#1E5C58]"}`}
                    >
                      <Eye size={16} className="mr-2 text-[#81B7A9]" />
                      Detail
                    </button>
                  )}

                  {/* Status: Selesai */}
                  {statusFilter === "Selesai" && (
                    <button
                      onClick={() => { setOpenDropdownId(null); onLihatHasil(item); }}
                      className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                    >
                      <Eye size={16} className="mr-2 text-[#81B7A9]" />
                      Lihat Hasil
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </td>
  );
}


// ── Mobile Card ───────────────────────────────────────────────────────────────
function MobileJadwalCard({
  item,
  statusFilter,
  mySection,
  currentTab,
  onIsiSoap,
  onDetail,
  onLihatHasil,
}: {
  item: JadwalRow;
  statusFilter: StatusFilter;
  mySection: string;
  currentTab: string;
  onIsiSoap: (item: JadwalRow) => void;
  onDetail: (item: JadwalRow) => void;
  onLihatHasil: (item: JadwalRow) => void;
}) {
  const isMySpecialty =
    currentTab.toLowerCase().includes(mySection.toLowerCase()) ||
    (mySection.toLowerCase().includes("plb") && currentTab === "PLB (Paedagog)");

  return (
    <div className="bg-[#F4F9F8]/40 border border-teal-50 rounded-2xl p-4 space-y-3 shadow-xs text-left">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#1E5C58]">{item.namaPasien}</p>
          <p className="text-xs text-gray-400 mt-0.5">Wali: {item.namaOrangTua}</p>
        </div>
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF4F2] text-[#1E5C58] border border-teal-100 shrink-0">
          {item.tipeTerapi}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-medium text-gray-500 border-t border-teal-50/50">
        {statusFilter === "Reschedule" ? (
          <>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-0.5">
                <Phone size={9} /> Telepon
              </span>
              <span className="text-gray-600">{item.telepon || "-"}</span>
            </div>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-0.5">
                <User size={9} /> Terapis
              </span>
              <span className="text-gray-600">{item.terapis}</span>
            </div>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-0.5">
                <Calendar size={9} /> Jadwal Semula
              </span>
              <span className="block text-gray-600">{item.tanggal_lama ? formatTanggal(item.tanggal_lama) : "-"}</span>
              <span className="text-[10px] text-gray-400">Pukul {item.waktu_lama || "-"}</span>
            </div>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-[#1E5C58] uppercase mb-0.5 font-bold">
                <Calendar size={9} /> Jadwal Baru
              </span>
              <span className="text-[#1E5C58] font-bold block">{formatTanggal(item.tanggal)}</span>
              <span className="text-[10px] text-[#1E5C58] font-semibold">Pukul {item.waktu || "-"}</span>
            </div>

            {(item.kategori_alasan || item.alasan) && (
              <div className="col-span-2 pt-3 mt-1 border-t border-teal-50/50">
                <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-1.5 font-bold">
                  ALASAN
                </span>
                {item.kategori_alasan && (
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border ${getBadgeStyles(item.kategori_alasan)}`}>
                    {item.kategori_alasan}
                  </span>
                )}
                {item.alasan && (
                  <p className="mt-2 text-xs font-medium leading-relaxed text-gray-600">
                    {item.alasan}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-0.5">
                <Phone size={9} /> Telepon
              </span>
              <span className="text-gray-600">{item.telepon || "-"}</span>
            </div>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-0.5">
                <User size={9} /> Terapis
              </span>
              <span className="text-gray-600">{item.terapis}</span>
            </div>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-0.5">
                <Calendar size={9} /> Tanggal
              </span>
              <span>{formatTanggal(item.tanggal)}</span>
              {statusFilter === "Terjadwal" && item.tanggal_lama && item.tanggal_lama !== item.tanggal && (
                <div className="mt-0.5 flex flex-col items-start gap-1">
                  <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                    Reschedule
                  </span>
                  <span className="text-[9px] text-gray-400">
                    dari {formatTanggal(item.tanggal_lama)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-0.5">
                <Clock size={9} /> Waktu
              </span>
              <span>{item.waktu || "-"}</span>
              {statusFilter === "Terjadwal" && item.waktu_lama && item.waktu_lama !== item.waktu && (
                <div className="mt-0.5 flex flex-col items-start gap-1">
                  <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                    Reschedule
                  </span>
                  <span className="text-[9px] text-gray-400">
                    dari {item.waktu_lama}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t border-teal-50/50">
        {/* Terjadwal / Reschedule + keahlian cocok */}
        {/* Terjadwal + keahlian cocok */}
        {statusFilter === "Terjadwal" && isMySpecialty && (
          <>
            <button
              onClick={() => onIsiSoap(item)}
              className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-[#1E5C58] hover:bg-[#2E8B83] text-white text-xs font-semibold py-2 rounded-lg shadow-sm transition-colors"
            >
              <FileText size={13} />
              Isi SOAP
            </button>
            <button
              onClick={() => onDetail(item)}
              className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-white border border-teal-100 text-[#1E5C58] hover:bg-teal-50/20 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              <Eye size={13} />
              Detail
            </button>
          </>
        )}
        {/* Terjadwal + bukan keahliannya */}
        {statusFilter === "Terjadwal" && !isMySpecialty && (
          <button
            onClick={() => onDetail(item)}
            className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-white border border-teal-100 text-[#1E5C58] hover:bg-teal-50/20 text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            <Eye size={13} />
            Detail
          </button>
        )}
        {/* Selesai → Lihat Hasil */}
        {statusFilter === "Selesai" && (
          <button
            onClick={() => onLihatHasil(item)}
            className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-white border border-teal-100 text-[#1E5C58] hover:bg-teal-50/20 text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            <Eye size={13} />
            Lihat Hasil
          </button>
        )}
      </div>
    </div>
  );
}

// ── Pagination Footer ────────────────────────────────────────────────────────────
function PaginationFooter({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Calculate displayed range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-100 sm:flex-row rounded-b-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Tampilkan</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 cursor-pointer"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span>data</span>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <span className="text-sm text-gray-500">
          Menampilkan <span className="font-bold text-[#1E5C58]">{startItem}</span> - <span className="font-bold text-[#1E5C58]">{endItem}</span> dari <span className="font-bold text-[#1E5C58]">{totalItems}</span> data
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
            disabled={currentPage <= 1}
          >
            Prev
          </button>
          <button className="px-3 py-1.5 text-xs font-bold text-white bg-[#2B7A75] border border-[#2B7A75] rounded-lg">
            {currentPage} / {totalPages}
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Konten Utama ──────────────────────────────────────────────────────────────
function JadwalContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useTherapistProfile();

  const urlType = params.get("type");
  const urlStatus = params.get("status");

  const [activeTab, setActiveTab] = useState<TerapiTab>(() => {
    switch (urlType) {
      case "okupasi": return "Terapi Okupasi";
      case "wicara": return "Terapi Wicara";
      case "fisio": return "Fisioterapi";
      default: return "PLB (Paedagog)";
    }
  });

  const profileApplied = useRef(false);

  useEffect(() => {
    // Memastikan saat halaman di-refresh (mount awal), tab kembali ke keahlian aslinya
    if (profile?.therapist_section && !profileApplied.current) {
      const section = profile.therapist_section.toLowerCase();
      if (section.includes("okupasi")) setActiveTab("Terapi Okupasi");
      else if (section.includes("wicara")) setActiveTab("Terapi Wicara");
      else if (section.includes("fisio")) setActiveTab("Fisioterapi");
      else setActiveTab("PLB (Paedagog)");

      profileApplied.current = true;
    }
  }, [profile]);

  const [activeFilter, setActiveFilter] = useState<StatusFilter>(
    urlStatus === "completed" || urlStatus === "selesai"
      ? "Selesai"
      : urlStatus === "reschedule"
        ? "Reschedule"
        : urlStatus === "pending" || urlStatus === "tertunda"
          ? "Tertunda"
          : "Terjadwal"
  );

  const isMySpecialtyTab = useMemo(() => {
    if (!profile?.therapist_section) return false;
    const section = profile.therapist_section.toLowerCase();
    const tabLower = activeTab.toLowerCase();
    return tabLower.includes(section) || (section.includes("plb") && activeTab === "PLB (Paedagog)");
  }, [profile, activeTab]);

  const [jadwalData] = useState<JadwalRow[]>(dummyJadwalData);
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeFilter>("hari-ini");
  const [dateFilter, setDateFilter] = useState("");
  const [searchName, setSearchName] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getType = () => {
    switch (activeTab) {
      case "Terapi Okupasi": return "okupasi";
      case "Terapi Wicara": return "wicara";
      case "Fisioterapi": return "fisio";
      default: return "paedagog";
    }
  };

  const getMappedStatus = () => {
    switch (activeFilter) {
      case "Selesai": return "completed";
      case "Reschedule": return "reschedule";
      case "Tertunda": return "pending";
      default: return "scheduled";
    }
  };

  // Sync URL params
  useEffect(() => {
    router.replace(`?type=${getType()}&status=${getMappedStatus()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, activeTab]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [activeTab, activeFilter, dateFilter, searchName]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Filter data
  const filtered = useMemo(() => {
    return jadwalData.filter((row) => {
      if (row.tipeTerapi !== activeTab) return false;

      if (searchName.trim()) {
        const lower = searchName.toLowerCase();
        if (
          !row.namaPasien.toLowerCase().includes(lower) &&
          !row.namaOrangTua.toLowerCase().includes(lower)
        ) {
          return false;
        }
      }

      if (activeFilter === "Tertunda") {
        return row.status === "Terjadwal" && row.tanggal < getTodayDateStr();
      }

      const checkDateInRange = (dateStr: string | null | undefined) => {
        if (!dateStr) return false;
        if (dateRangeMode === "custom") return dateStr === dateFilter;
        if (dateRangeMode === "hari-ini") return dateStr === getTodayDateStr();
        if (dateRangeMode === "besok") return dateStr === getTomorrowDateStr();
        if (dateRangeMode === "minggu-ini") {
          const { start, end } = getWeekRangeStr();
          return dateStr >= start && dateStr <= end;
        }
        if (dateRangeMode === "bulan-ini") {
          const { start, end } = getMonthRangeStr();
          return dateStr >= start && dateStr <= end;
        }
        return false;
      };

      if (activeFilter === "Terjadwal") {
        return row.status === "Terjadwal" && checkDateInRange(row.tanggal);
      } else if (activeFilter === "Selesai") {
        if (dateRangeMode === "custom" && dateFilter) {
          return row.status === "Selesai" && row.tanggal === dateFilter;
        }
        return row.status === "Selesai";
      } else if (activeFilter === "Reschedule") {
        if (dateRangeMode === "custom" && dateFilter) {
          return checkDateInRange(row.tanggal_lama) && row.tanggal !== row.tanggal_lama;
        }
        return row.tanggal !== row.tanggal_lama; // tampil semua yang pernah di-reschedule
      }

      return false;
    }).sort((a, b) => {
      if (activeFilter === "Selesai") {
        if (a.tanggal !== b.tanggal) return a.tanggal > b.tanggal ? -1 : 1;
        return a.waktu > b.waktu ? -1 : 1;
      } else if (activeFilter === "Tertunda") {
        if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? -1 : 1; // terlama di atas
        return a.waktu < b.waktu ? -1 : 1;
      }
      return a.waktu > b.waktu ? 1 : -1;
    });
  }, [jadwalData, activeTab, activeFilter, dateFilter, dateRangeMode, searchName]);

  const pendingSessions = useMemo(() => {
    return jadwalData.filter(
      (row) => row.tipeTerapi === activeTab && row.status === "Terjadwal" && row.tanggal < getTodayDateStr()
    );
  }, [jadwalData, activeTab]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const handleIsiSoap = (item: JadwalRow) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`terapi_selected_${item.id}`, JSON.stringify(item));
    }
    router.push(
      `/terapis/terapi/isi-soap?jadwal_id=${item.id}&type=${getType()}&status=${getMappedStatus()}`
    );
  };

  const handleDetail = (item: JadwalRow) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`terapi_selected_${item.id}`, JSON.stringify(item));
    }
    router.push(
      `/terapis/terapi/detail?jadwal_id=${item.id}&type=${getType()}&status=${getMappedStatus()}`
    );
  };

  const handleLihatHasil = (item: JadwalRow) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`terapi_selected_${item.id}`, JSON.stringify(item));
    }
    router.push(
      `/terapis/terapi/hasil?jadwal_id=${item.id}&type=${getType()}&status=${getMappedStatus()}`
    );
  };

  const handleUnduh = () => {
    router.push("/terapis/terapi/unduh");
  };

  const STATUS_TABS: { label: StatusFilter; icon: React.ElementType }[] = [
    { label: "Terjadwal", icon: CalendarCheck },
    { label: "Selesai", icon: CheckCircle2 },
    { label: "Reschedule", icon: RefreshCw },
    { label: "Tertunda", icon: AlertCircle },
  ];

  const emptyStateText = useMemo(() => {
    let dateText = "";
    if (dateRangeMode === "hari-ini") dateText = "hari ini.";
    else if (dateRangeMode === "besok") dateText = "besok.";
    else if (dateRangeMode === "minggu-ini") dateText = "minggu ini.";
    else if (dateRangeMode === "bulan-ini") dateText = "bulan ini.";
    else dateText = `pada tanggal ${formatTanggal(dateFilter)}.`;
    if (activeFilter === "Reschedule") {
      if (dateRangeMode === "custom" && dateFilter) {
        return `Tidak ada riwayat reschedule pada tanggal ${formatTanggal(dateFilter)}.`;
      }
      return `Tidak ada riwayat reschedule secara keseluruhan.`;
    } else if (activeFilter === "Selesai") {
      if (dateRangeMode === "custom" && dateFilter) {
        return `Tidak ada data terapi selesai pada tanggal ${formatTanggal(dateFilter)}.`;
      }
      return `Tidak ada data terapi selesai secara keseluruhan.`;
    } else if (activeFilter === "Tertunda") {
      return `Tidak ada tugas tertunda saat ini.`;
    } else {
      return `Tidak ada data terapi terjadwal ${dateText}`;
    }
  }, [activeFilter, dateFilter, dateRangeMode]);

  if (!profile || !profileApplied.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FBFB]">
        <div className="flex flex-col items-center gap-3 text-[#1E5C58]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#81B7A9] border-t-transparent" />
          <p className="text-sm font-semibold animate-pulse">Menyesuaikan profil keahlian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">

      {/* ── Tab Tipe Terapi + Filter Tanggal + Unduh ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Tipe Terapi Dropdown */}
        <div className="relative z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(openDropdownId === "specialty" ? null : "specialty");
            }}
            className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border border-teal-100 rounded-xl shadow-sm text-[#1E5C58] font-bold text-sm hover:bg-teal-50 transition-all w-full lg:w-64"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-[#1E5C58]/60 font-medium uppercase tracking-wider -mb-0.5">Melihat Jadwal</span>
              <span>{activeTab}</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${openDropdownId === "specialty" ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {openDropdownId === "specialty" && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 w-full py-1 mt-2 overflow-hidden origin-top bg-white border border-teal-100 shadow-lg rounded-xl"
              >
                {(["PLB (Paedagog)", "Terapi Okupasi", "Terapi Wicara", "Fisioterapi"] as TerapiTab[]).map(
                  (tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab);
                          setActiveFilter("Terjadwal");
                          setSearchName("");
                          setOpenDropdownId(null);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${isActive ? "bg-teal-50/50 text-[#1E5C58]" : "text-gray-600 hover:bg-gray-50 hover:text-[#1E5C58]"
                          }`}
                      >
                        {tab}
                        {isActive && <CheckCircle2 size={16} className="text-[#1E5C58]" />}
                      </button>
                    );
                  }
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Tanggal Cepat & Custom */}
        {/* Filter Tanggal Cepat & Custom */}
        <div className="flex flex-col sm:flex-row sm:items-center w-full lg:w-auto bg-white border border-teal-100 rounded-xl shadow-[0_2px_8px_rgba(30,92,88,0.02)] p-1 shrink-0 gap-1 sm:gap-0">
          <AnimatePresence>
            {activeFilter === "Terjadwal" && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: {
                    opacity: 0,
                    width: 0,
                    transition: {
                      duration: 0.3,
                      ease: "easeInOut"
                    }
                  },
                  visible: {
                    opacity: 1,
                    width: "auto",
                    transition: {
                      duration: 0.3,
                      ease: "easeInOut"
                    }
                  },
                  exit: {
                    opacity: 0,
                    width: 0,
                    transition: {
                      duration: 0.4,
                      ease: "easeInOut"
                    }
                  }
                }}
                className="flex overflow-hidden shrink-0"
              >
                {(["hari-ini", "besok", "minggu-ini", "bulan-ini"] as DateRangeFilter[]).map((mode, index) => (
                  <motion.button
                    key={mode}
                    custom={index}
                    variants={{
                      hidden: (i: number) => ({
                        opacity: 0,
                        scale: 0.6,
                        x: 25 * (3 - i),
                      }),
                      visible: (i: number) => ({
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                          delay: (3 - i) * 0.06,
                        },
                      }),
                      exit: (i: number) => ({
                        opacity: 0,
                        scale: 0.6,
                        x: 25 * (3 - i),
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                          delay: i * 0.06,
                        },
                      }),
                    }}
                    onClick={() => {
                      setDateRangeMode(mode);
                      setDateFilter("");
                    }}
                    className={`cursor-pointer whitespace-nowrap px-3 sm:px-4 py-2 text-sm font-bold rounded-lg capitalize transition-colors flex-1 text-center mr-1 ${dateRangeMode === mode
                      ? "bg-[#1E5C58] text-white shadow-sm"
                      : "text-gray-500 hover:text-[#1E5C58] hover:bg-teal-50/50"
                      }`}
                  >
                    {mode.replace("-", " ")}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative w-full sm:w-auto shrink-0">
            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 ${dateRangeMode === "custom" ? "text-white" : "text-[#81B7A9]"}`} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                if (e.target.value) {
                  setDateFilter(e.target.value);
                  setDateRangeMode("custom");
                } else {
                  setDateFilter("");
                  setDateRangeMode("hari-ini");
                }
              }}
              className={`w-full sm:w-[170px] pl-9 pr-4 py-2 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#81B7A9] transition-colors cursor-pointer relative ${dateRangeMode === "custom"
                ? "bg-[#1E5C58] text-white shadow-sm [&::-webkit-calendar-picker-indicator]:invert"
                : "bg-transparent text-gray-500 hover:text-[#1E5C58] hover:bg-teal-50/50"
                }`}
            />
          </div>
        </div>
      </div>

      {/* ── Status Filter (Pill Tab) + Search ── */}
      <div className="flex flex-col items-start justify-between gap-4 p-2 bg-white border border-gray-100 shadow-sm xl:flex-row xl:items-center rounded-2xl">
        {/* Pill tabs */}
        <div className="relative grid w-full grid-cols-2 gap-1 p-1 md:flex md:flex-wrap xl:w-auto bg-gray-50/50 rounded-xl">
          {(isMySpecialtyTab ? STATUS_TABS : STATUS_TABS.filter(t => t.label !== "Tertunda")).map(({ label, icon: Icon }) => {
            const isActive = activeFilter === label;
            return (
              <button
                key={label}
                onClick={() => {
                  setActiveFilter(label);
                  setSearchName("");
                }}
                className={`cursor-pointer relative flex-1 md:min-w-[120px] py-2.5 text-xs sm:text-sm font-bold capitalize transition-all z-10 ${isActive ? "text-[#1E5C58]" : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabJadwal"
                    className="absolute inset-0 bg-white border rounded-lg shadow-sm border-teal-50"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
                <span className="relative flex items-center justify-center gap-1.5 z-20">
                  <Icon size={16} />
                  {label}
                </span>
              </button>
            );
          })}

        </div>

        {/* Search & Unduh */}
        <div className="flex w-full gap-2 md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari pasien / orangtua..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full h-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all font-medium text-gray-700"
            />
          </div>
          {isMySpecialtyTab && (
            <div className="flex p-1 bg-gray-50/50 rounded-xl shrink-0">
              <button
                onClick={handleUnduh}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-teal-50 hover:bg-teal-50/50 text-[#1E5C58] rounded-lg text-sm font-bold transition-all shadow-sm"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Hasil SOAP</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Area Konten (Banner + Tabel) ── */}
      <div className="flex flex-col gap-3 -mt-2">
        {/* ── Banner Tertunda ── */}
        <AnimatePresence>
          {isMySpecialtyTab && pendingSessions.length > 0 && activeFilter !== "Tertunda" && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col justify-between gap-3 p-4 border shadow-sm sm:flex-row sm:items-center bg-amber-50 border-amber-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">Ada Jadwal Tertunda</h3>
                    <p className="text-xs font-medium text-amber-700 mt-0.5">
                      Anda memiliki {pendingSessions.length} jadwal dari hari sebelumnya yang belum diselesaikan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveFilter("Tertunda");
                    setDateFilter("");
                  }}
                  className="px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm shrink-0 bg-amber-600 hover:bg-amber-700 rounded-xl"
                >
                  Lihat Jadwal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Area Header & Tabel ── */}
        <div className="flex flex-col gap-3">
          {/* ── Header Tabel + Unduh Hasil ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[44px]">
            <h2 className="text-sm md:text-base font-extrabold text-[#1E5C58] flex items-center gap-2.5">
              Daftar Terapi {activeFilter}
              <span className="bg-teal-50/80 text-teal-700 text-[11px] px-2.5 py-0.5 rounded-md border border-teal-100 font-bold">
                {filtered.length} Sesi
              </span>
            </h2>
          </div>

          {/* ── Table / Card Area ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`table-${activeTab}-${activeFilter}-${dateFilter}-${searchName}-${page}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-teal-50/60 shadow-[0_4px_24px_rgba(30,92,88,0.03)] hover:shadow-[0_8px_32px_rgba(30,92,88,0.06)] transition-shadow duration-300 overflow-hidden"
            >
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    {activeFilter === "Reschedule" ? (
                      <tr className="bg-[#F4F9F8] border-b border-teal-100">
                        <th className="w-[14%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">PASIEN</th>
                        <th className="w-[12%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">TELEPON</th>
                        <th className="w-[12%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">TIPE TERAPI</th>
                        <th className="w-[12%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">TERAPIS</th>
                        <th className="w-[16%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">JADWAL SEMULA</th>
                        <th className="w-[16%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">JADWAL BARU</th>
                        <th className="w-[18%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">ALASAN</th>
                      </tr>
                    ) : (
                      <tr className="bg-[#F4F9F8] border-b border-teal-100">
                        <th className="w-[14%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">Nama Pasien</th>
                        <th className="w-[14%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">Nama Orang Tua</th>
                        <th className="w-[11%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">Telepon</th>
                        <th className="w-[14%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">Tipe Terapi</th>
                        <th className="w-[13%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">Terapis</th>
                        <th className="w-[12%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">Tanggal Terapi</th>
                        <th className="w-[12%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">Waktu</th>
                        <th className="w-[10%] px-4 py-4 text-xs font-bold tracking-wider text-center text-[#1E5C58] uppercase">Aksi</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={activeFilter === "Reschedule" ? 7 : 8} className="px-4 py-8 font-medium text-center text-gray-500">
                          {emptyStateText}
                        </td>
                      </tr>
                    ) : (
                      paginated.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-[#EAF4F2]/20 transition-colors"
                        >
                          {activeFilter === "Reschedule" ? (
                            <>
                              <td className="px-4 py-4">
                                <div className="font-extrabold text-gray-800 text-[13px]">{item.namaPasien}</div>
                                <div className="inline-block bg-[#FDF1E6] text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                                  Wali: {item.namaOrangTua}
                                </div>
                              </td>
                              <td className="px-4 py-4 font-semibold text-gray-500">
                                {item.telepon}
                              </td>
                              <td className="px-4 py-4 font-bold text-gray-600">
                                {item.tipeTerapi}
                              </td>
                              <td className="px-4 py-4 font-bold text-gray-600">
                                {item.terapis}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[13px]">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  {item.tanggal_lama ? formatTanggal(item.tanggal_lama) : "—"}
                                </div>
                                <div className="flex items-center gap-1.5 font-semibold text-gray-500 text-[11px] mt-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  Pukul {item.waktu_lama ?? "—"}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1.5 font-bold text-[#1E5C58] text-[13px]">
                                  <Calendar className="w-3.5 h-3.5 text-[#1E5C58]" />
                                  {formatTanggal(item.tanggal)}
                                </div>
                                <div className="flex items-center gap-1.5 font-semibold text-gray-500 text-[11px] mt-1">
                                  <Clock className="w-3.5 h-3.5 text-[#1E5C58]" />
                                  Pukul {item.waktu}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                {item.kategori_alasan && (
                                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border ${getBadgeStyles(item.kategori_alasan)}`}>
                                    {item.kategori_alasan}
                                  </span>
                                )}
                                {item.alasan && (
                                  <p className="mt-2 text-xs text-gray-500 font-medium leading-relaxed max-w-[180px]">
                                    {item.alasan}
                                  </p>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-4 font-extrabold text-gray-800">
                                {item.namaPasien}
                              </td>
                              <td className="px-4 py-4 font-semibold text-gray-600">
                                {item.namaOrangTua}
                              </td>
                              <td className="px-4 py-4 font-semibold text-gray-500">
                                {item.telepon}
                              </td>
                              <td className="px-4 py-4 font-bold text-gray-600">
                                {item.tipeTerapi}
                              </td>
                              <td className="px-4 py-4 font-bold text-gray-600">
                                {item.terapis}
                              </td>
                              <td className="px-4 py-4 font-semibold text-gray-500">
                                <div>{formatTanggal(item.tanggal)}</div>
                                {activeFilter === "Terjadwal" && item.tanggal_lama && item.tanggal_lama !== item.tanggal && (
                                  <div className="flex flex-col items-start gap-1 mt-1">
                                    <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                      Reschedule
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      dari {formatTanggal(item.tanggal_lama)}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 font-semibold text-gray-500">
                                <div>{item.waktu}</div>
                                {activeFilter === "Terjadwal" && item.waktu_lama && item.waktu_lama !== item.waktu && (
                                  <div className="flex flex-col items-start gap-1 mt-1">
                                    <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                      Reschedule
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      dari {item.waktu_lama}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <ActionDropdown
                                item={item}
                                openDropdownId={openDropdownId}
                                setOpenDropdownId={setOpenDropdownId}
                                statusFilter={activeFilter}
                                mySection={profile?.therapist_section ?? ""}
                                currentTab={activeTab}
                                onIsiSoap={handleIsiSoap}
                                onDetail={handleDetail}
                                onLihatHasil={handleLihatHasil}
                              />
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block p-4 space-y-3 lg:hidden">
                {paginated.length === 0 ? (
                  <div className="px-4 py-8 font-medium text-center text-gray-500 bg-white border border-teal-100 border-dashed rounded-xl">
                    {emptyStateText}
                  </div>
                ) : (
                  paginated.map((item) => (
                    <MobileJadwalCard
                      key={item.id}
                      item={item}
                      statusFilter={activeFilter}
                      mySection={profile?.therapist_section ?? ""}
                      currentTab={activeTab}
                      onIsiSoap={handleIsiSoap}
                      onDetail={handleDetail}
                      onLihatHasil={handleLihatHasil}
                    />
                  ))
                )}
              </div>

              <PaginationFooter
                totalItems={filtered.length}
                currentPage={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
