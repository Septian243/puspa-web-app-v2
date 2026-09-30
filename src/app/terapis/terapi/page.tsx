/* eslint-disable @typescript-eslint/no-explicit-any */
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
  ClipboardList,
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

type StatusFilter = "Terjadwal" | "Selesai" | "Reschedule" | "Tertunda";

interface JadwalRow {
  id: string;
  namaPasien: string;
  namaOrangTua: string;
  telepon: string;
  tipeTerapi: string;
  terapis: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string;   // "09.35 - 10.35"
  status: "Terjadwal" | "Selesai";
  tanggal_lama?: string | null; // YYYY-MM-DD
  waktu_lama?: string | null;
  kategori_alasan?: "Sakit" | "Izin" | "Tidak Hadir" | null;
  alasan?: string | null;
}

type DateRangeFilter = "hari-ini" | "besok" | "minggu-ini" | "bulan-ini" | "custom";

const getTodayDateStr = () => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
};

const getTomorrowDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
};

const getWeekRangeStr = () => {
  const d = new Date();
  const day = d.getDay() || 7; // 1 (Mon) - 7 (Sun)

  const start = new Date(d);
  start.setDate(d.getDate() - day + 1);

  const end = new Date(d);
  end.setDate(d.getDate() - day + 7);

  return {
    start: start.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
    end: end.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  };
};

const getMonthRangeStr = () => {
  const d = new Date();

  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

  return {
    start: start.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
    end: end.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  };
};

const formatTanggal = (yyyyMmDd: string) => {
  if (!yyyyMmDd) return "";
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}/${m}/${y}`;
};

const getBadgeStyles = (kategori?: "Sakit" | "Izin" | "Tidak Hadir" | null) => {
  switch (kategori) {
    case "Sakit": return "bg-blue-50 text-blue-500 border-blue-200";
    case "Izin": return "bg-orange-50 text-orange-500 border-orange-200";
    case "Tidak Hadir": return "bg-red-50 text-red-600 border-red-200";
    default: return "bg-gray-50 text-gray-500 border-gray-200";
  }
};

// ── Dummy data (kosong — siap untuk API) ─────────────────────────────────────
const dummyJadwalData: JadwalRow[] = [
  // PLB (Paedagog)
  { id: "1", namaPasien: "Zefanya Lidia", namaOrangTua: "Alief Arifin Mahardiko", telepon: "085922002245", tipeTerapi: "PLB (Paedagog)", terapis: "Alief Arifun", tanggal: "2026-06-04", waktu: "10.00 - 11.00", status: "Terjadwal", tanggal_lama: getTodayDateStr(), waktu_lama: "09.35 - 10.35", kategori_alasan: "Izin", alasan: "Orang tua berhalangan hadir, sudah konfirmasi" },
  { id: "2", namaPasien: "Rayhan", namaOrangTua: "devi ema", telepon: "0983842", tipeTerapi: "PLB (Paedagog)", terapis: "Alief Arifun", tanggal: getTodayDateStr(), waktu: "08.50 - 09.50", status: "Terjadwal" },
  { id: "3", namaPasien: "Putra Pratama", namaOrangTua: "devi ema", telepon: "0983842", tipeTerapi: "PLB (Paedagog)", terapis: "Alief Arifun", tanggal: "2026-10-02", waktu: "13.00 - 14.00", status: "Terjadwal", tanggal_lama: getTodayDateStr(), waktu_lama: "15.07 - 16.00", kategori_alasan: "Sakit", alasan: "Demam tinggi, sudah izin dari orang tua" },
  { id: "10", namaPasien: "Kenzi", namaOrangTua: "Budi Santoso", telepon: "081234567890", tipeTerapi: "PLB (Paedagog)", terapis: "Alief Arifun", tanggal: getTodayDateStr(), waktu: "10.00 - 11.00", status: "Selesai" },

  // Terapi Okupasi
  { id: "4", namaPasien: "Aiko Putri", namaOrangTua: "Siti Rahma", telepon: "081122334455", tipeTerapi: "Terapi Okupasi", terapis: "Dr. Tirta", tanggal: getTodayDateStr(), waktu: "10.00 - 11.00", status: "Terjadwal", tanggal_lama: "2026-09-28", waktu_lama: "09.00 - 10.00" },
  { id: "5", namaPasien: "Bima Arya", namaOrangTua: "Andi Saputra", telepon: "081298765432", tipeTerapi: "Terapi Okupasi", terapis: "Dr. Tirta", tanggal: getTodayDateStr(), waktu: "13.00 - 14.00", status: "Terjadwal" },
  { id: "11", namaPasien: "Caca", namaOrangTua: "Lina", telepon: "085566778899", tipeTerapi: "Terapi Okupasi", terapis: "Dr. Tirta", tanggal: "2026-09-15", waktu: "09.00 - 10.00", status: "Terjadwal", tanggal_lama: getTodayDateStr(), waktu_lama: "09.00 - 10.00", kategori_alasan: "Tidak Hadir", alasan: "Ada keperluan keluarga" },

  // Terapi Wicara
  { id: "6", namaPasien: "Dian Sastro", namaOrangTua: "Rina Kusuma", telepon: "089876543210", tipeTerapi: "Terapi Wicara", terapis: "Sus Rini", tanggal: getTodayDateStr(), waktu: "09.00 - 10.00", status: "Terjadwal" },
  { id: "7", namaPasien: "Eno Lerian", namaOrangTua: "Joko Anwar", telepon: "087766554433", tipeTerapi: "Terapi Wicara", terapis: "Sus Rini", tanggal: getTodayDateStr(), waktu: "11.00 - 12.00", status: "Terjadwal" },
  { id: "12", namaPasien: "Fajar", namaOrangTua: "Rini", telepon: "081999888777", tipeTerapi: "Terapi Wicara", terapis: "Sus Rini", tanggal: getTodayDateStr(), waktu: "14.00 - 15.00", status: "Selesai" },

  // Fisioterapi
  { id: "8", namaPasien: "Gibran", namaOrangTua: "Jokowi", telepon: "082233445566", tipeTerapi: "Fisioterapi", terapis: "Suster M", tanggal: getTodayDateStr(), waktu: "13.00 - 14.00", status: "Terjadwal" },
  { id: "9", namaPasien: "Hana", namaOrangTua: "Anis", telepon: "083344556677", tipeTerapi: "Fisioterapi", terapis: "Suster M", tanggal: getTomorrowDateStr(), waktu: "15.00 - 16.00", status: "Terjadwal" },
  { id: "14", namaPasien: "Budi", namaOrangTua: "Susanto", telepon: "081122223333", tipeTerapi: "Fisioterapi", terapis: "Suster M", tanggal: getWeekRangeStr().end, waktu: "08.00 - 09.00", status: "Terjadwal" },
  { id: "13", namaPasien: "Kaela", namaOrangTua: "Susanti", telepon: "084455667788", tipeTerapi: "Fisioterapi", terapis: "Suster M", tanggal: "2026-09-25", waktu: "09.00 - 10.00", status: "Terjadwal" },
];

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
  mySection: string;  // therapist_section dari profile
  currentTab: string; // activeTab saat ini
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

  const initialUrlType = useRef(urlType);
  const profileApplied = useRef(false);

  useEffect(() => {
    if (!initialUrlType.current && profile?.therapist_section && !profileApplied.current) {
      const section = profile.therapist_section.toLowerCase();
      if (section.includes("okupasi")) setActiveTab("Terapi Okupasi");
      else if (section.includes("wicara")) setActiveTab("Terapi Wicara");
      else if (section.includes("fisio")) setActiveTab("Fisioterapi");
      else setActiveTab("PLB (Paedagog)");

      profileApplied.current = true;
    }
  }, [profile]);

  const [activeFilter, setActiveFilter] = useState<StatusFilter>(
    urlStatus === "selesai"
      ? "Selesai"
      : urlStatus === "reschedule"
        ? "Reschedule"
        : urlStatus === "tertunda"
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
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
      case "Selesai": return "selesai";
      case "Reschedule": return "reschedule";
      default: return "terjadwal";
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
  }, [jadwalData, activeTab, activeFilter, dateFilter, searchName]);

  const pendingSessions = useMemo(() => {
    return jadwalData.filter(
      (row) => row.tipeTerapi === activeTab && row.status === "Terjadwal" && row.tanggal < getTodayDateStr()
    );
  }, [jadwalData, activeTab]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(
    () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filtered, page]
  );

  const handleIsiSoap = (item: JadwalRow) => {
    const q = new URLSearchParams({
      namaPasien: item.namaPasien,
      namaOrangTua: item.namaOrangTua,
      telepon: item.telepon,
      tipeTerapi: item.tipeTerapi,
      terapis: item.terapis,
      tanggalTerapi: formatTanggal(item.tanggal),
      waktu: item.waktu,
    });
    router.push(`/terapis/terapi/isi-soap?${q.toString()}`);
  };

  const handleDetail = (item: JadwalRow) => {
    const q = new URLSearchParams({
      namaPasien: item.namaPasien,
      namaOrangTua: item.namaOrangTua,
      telepon: item.telepon,
      tipeTerapi: item.tipeTerapi,
      terapis: item.terapis,
      tanggalTerapi: formatTanggal(item.tanggal),
      waktu: item.waktu,
    });
    if (item.tanggal_lama) q.set("tanggal_lama", formatTanggal(item.tanggal_lama));
    if (item.waktu_lama) q.set("waktu_lama", item.waktu_lama);
    if (item.kategori_alasan) q.set("kategori_alasan", item.kategori_alasan);
    if (item.alasan) q.set("alasan", item.alasan);

    router.push(`/terapis/terapi/detail?${q.toString()}`);
  };

  const handleLihatHasil = (item: JadwalRow) => {
    const q = new URLSearchParams({
      namaPasien: item.namaPasien,
      namaOrangTua: item.namaOrangTua,
      telepon: item.telepon,
      tipeTerapi: item.tipeTerapi,
      terapis: item.terapis,
      tanggalTerapi: formatTanggal(item.tanggal),
      waktu: item.waktu,
    });
    router.push(`/terapis/terapi/hasil?${q.toString()}`);
  };

  const handleUnduh = () => {
    console.log("Unduh Hasil");
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
  }, [activeFilter, dateFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">

      {/* ── Tab Tipe Terapi + Filter Tanggal + Unduh ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Tipe Terapi Tabs */}
        <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2 p-1.5 bg-[#EAF4F2]/50 border border-teal-50/50 rounded-2xl w-full lg:w-fit">
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
                  }}
                  className={`cursor-pointer px-3 py-2.5 lg:px-4 text-[11px] lg:text-sm font-semibold rounded-xl text-center transition-all duration-300 w-full lg:w-auto ${isActive
                    ? "bg-[#1E5C58] text-white shadow-sm"
                    : "text-[#1E5C58]/80 hover:bg-white/60 hover:text-[#1E5C58]"
                    }`}
                >
                  {tab}
                </button>
              );
            }
          )}
        </div>

        {/* Filter Tanggal Cepat & Custom */}
        <div className="flex flex-col items-stretch w-full gap-3 sm:flex-row sm:items-center shrink-0 lg:w-auto">
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
                    paddingLeft: 0,
                    paddingRight: 0,
                    transition: {
                      duration: 0.3,
                      ease: "easeInOut"
                    }
                  },
                  visible: {
                    opacity: 1,
                    width: "auto",
                    paddingLeft: 4,
                    paddingRight: 4,
                    transition: {
                      duration: 0.3,
                      ease: "easeInOut"
                    }
                  },
                  exit: {
                    opacity: 0,
                    width: 0,
                    paddingLeft: 0,
                    paddingRight: 0,
                    transition: {
                      duration: 0.4,
                      ease: "easeInOut",
                    },
                  },
                }}
                className="flex bg-white border border-teal-100 rounded-xl shadow-[0_2px_8px_rgba(30,92,88,0.02)] overflow-hidden shrink-0 py-1"
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
                    className={`cursor-pointer whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg capitalize transition-colors flex-1 text-center ${dateRangeMode === mode
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

          <div className="relative w-full sm:w-auto">
            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${dateRangeMode === "custom" ? "text-[#1E5C58]" : "text-[#81B7A9]"}`} />
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
              className={`w-full sm:w-auto pl-9 pr-3 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#81B7A9] transition-colors bg-white shadow-[0_2px_8px_rgba(30,92,88,0.02)] ${dateRangeMode === "custom" ? "border-[#1E5C58] text-[#1E5C58]" : "border-teal-100 text-gray-600 hover:border-teal-200"}`}
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
          <div className="flex p-1 bg-gray-50/50 rounded-xl shrink-0">
            <button
              onClick={handleUnduh}
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-teal-50 hover:bg-teal-50/50 text-[#1E5C58] rounded-lg text-sm font-bold transition-all shadow-sm"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Unduh Hasil</span>
            </button>
          </div>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-100">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${page === 1
                      ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                      : "bg-white border-teal-100 hover:bg-teal-50/20 text-[#1E5C58] cursor-pointer"
                      }`}
                  >
                    Sebelumnya
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    Halaman {page} / {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${page === totalPages
                      ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                      : "bg-white border-teal-100 hover:bg-teal-50/20 text-[#1E5C58] cursor-pointer"
                      }`}
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
