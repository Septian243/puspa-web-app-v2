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
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTherapistProfile } from "@/context/ProfileTerapisContext";

// ── Types ──────────────────────────────────────────────────────────────────────
type TerapiTab =
  | "PLB (Paedagog)"
  | "Terapi Okupasi"
  | "Terapi Wicara"
  | "Fisioterapi";

type StatusFilter = "Terjadwal" | "Selesai" | "Reschedule";

interface JadwalRow {
  id: string;
  namaPasien: string;
  namaOrangTua: string;
  telepon: string;
  tipeTerapi: string;
  terapis: string;
  tanggalTerapi: string; // DD/MM/YYYY
  waktu: string;         // "09.35 - 10.35"
  status: StatusFilter;
  jadwalSemula?: string;
  waktuSemula?: string;
  alasanReschedule?: string;
}

// ── Dummy data (kosong — siap untuk API) ─────────────────────────────────────
const dummyJadwal: JadwalRow[] = [
  // PLB (Paedagog)
  { id: "1", namaPasien: "Zefanya Lidia", namaOrangTua: "Alief Arifin Mahardiko", telepon: "085922002245", tipeTerapi: "PLB (Paedagog)", terapis: "Alief Arifun", tanggalTerapi: "04/06/2026", waktu: "10.00 - 11.00", status: "Reschedule", jadwalSemula: "28/05/2026", waktuSemula: "09.35 - 10.35", alasanReschedule: "Orang tua berhalangan hadir, sudah konfirmasi" },
  { id: "2", namaPasien: "Rayhan", namaOrangTua: "devi ema", telepon: "0983842", tipeTerapi: "PLB (Paedagog)", terapis: "Alief Arifun", tanggalTerapi: "25/09/2026", waktu: "08.50 - 09.50", status: "Terjadwal" },
  { id: "3", namaPasien: "Putra Pratama", namaOrangTua: "devi ema", telepon: "0983842", tipeTerapi: "PLB (Paedagog)", terapis: "Alief Arifun", tanggalTerapi: "02/10/2026", waktu: "13.00 - 14.00", status: "Reschedule", jadwalSemula: "25/09/2026", waktuSemula: "15.07 - 16.00", alasanReschedule: "Demam tinggi, sudah izin dari orang tua" },
  { id: "10", namaPasien: "Kenzi", namaOrangTua: "Budi Santoso", telepon: "081234567890", tipeTerapi: "PLB (Paedagog)", terapis: "Alief Arifun", tanggalTerapi: "20/09/2026", waktu: "10.00 - 11.00", status: "Selesai" },

  // Terapi Okupasi
  { id: "4", namaPasien: "Aiko Putri", namaOrangTua: "Siti Rahma", telepon: "081122334455", tipeTerapi: "Terapi Okupasi", terapis: "Dr. Tirta", tanggalTerapi: "26/09/2026", waktu: "10.00 - 11.00", status: "Terjadwal" },
  { id: "5", namaPasien: "Bima Arya", namaOrangTua: "Andi Saputra", telepon: "081298765432", tipeTerapi: "Terapi Okupasi", terapis: "Dr. Tirta", tanggalTerapi: "27/09/2026", waktu: "13.00 - 14.00", status: "Terjadwal" },
  { id: "11", namaPasien: "Caca", namaOrangTua: "Lina", telepon: "085566778899", tipeTerapi: "Terapi Okupasi", terapis: "Dr. Tirta", tanggalTerapi: "15/09/2026", waktu: "09.00 - 10.00", status: "Reschedule", jadwalSemula: "10/09/2026", waktuSemula: "09.00 - 10.00", alasanReschedule: "Ada urusan keluarga mendadak" },

  // Terapi Wicara
  { id: "6", namaPasien: "Dian Sastro", namaOrangTua: "Rina Kusuma", telepon: "089876543210", tipeTerapi: "Terapi Wicara", terapis: "Sus Rini", tanggalTerapi: "27/09/2026", waktu: "09.00 - 10.00", status: "Terjadwal" },
  { id: "7", namaPasien: "Eno Lerian", namaOrangTua: "Joko Anwar", telepon: "087766554433", tipeTerapi: "Terapi Wicara", terapis: "Sus Rini", tanggalTerapi: "28/09/2026", waktu: "11.00 - 12.00", status: "Terjadwal" },
  { id: "12", namaPasien: "Fajar", namaOrangTua: "Rini", telepon: "081999888777", tipeTerapi: "Terapi Wicara", terapis: "Sus Rini", tanggalTerapi: "22/09/2026", waktu: "14.00 - 15.00", status: "Selesai" },

  // Fisioterapi
  { id: "8", namaPasien: "Gibran", namaOrangTua: "Jokowi", telepon: "082233445566", tipeTerapi: "Fisioterapi", terapis: "Suster M", tanggalTerapi: "28/09/2026", waktu: "13.00 - 14.00", status: "Terjadwal" },
  { id: "9", namaPasien: "Hana", namaOrangTua: "Anis", telepon: "083344556677", tipeTerapi: "Fisioterapi", terapis: "Suster M", tanggalTerapi: "29/09/2026", waktu: "15.00 - 16.00", status: "Terjadwal" },
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
  const MENU_HEIGHT_EST = statusFilter === "Terjadwal" ? 96 : 52;

  // Cek apakah tab ini sesuai keahlian terapis yang login
  // therapist_section dari API: "PLB", "Terapi Okupasi", "Terapi Wicara", "Fisioterapi"
  // currentTab: "PLB (Paedagog)", "Terapi Okupasi", "Terapi Wicara", "Fisioterapi"
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
                  {/* Status: Terjadwal / Reschedule */}
                  {(statusFilter === "Terjadwal" || statusFilter === "Reschedule") && isMySpecialty && (
                    <>
                      <button
                        onClick={() => { setOpenDropdownId(null); onIsiSoap(item); }}
                        className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                      >
                        <FileText size={16} className="mr-2 text-[#81B7A9]" />
                        Isi SOAP
                      </button>
                      <button
                        onClick={() => { setOpenDropdownId(null); onDetail(item); }}
                        className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                      >
                        <Eye size={16} className="mr-2 text-[#81B7A9]" />
                        Detail
                      </button>
                    </>
                  )}

                  {/* Status: Terjadwal / Reschedule — bukan keahliannya */}
                  {(statusFilter === "Terjadwal" || statusFilter === "Reschedule") && !isMySpecialty && (
                    <button
                      onClick={() => { setOpenDropdownId(null); onDetail(item); }}
                      className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
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
                <Calendar size={9} /> Jadwal Semula
              </span>
              <span className="text-gray-600 block">{item.jadwalSemula || "-"}</span>
              <span className="text-[10px] text-gray-400">Pukul {item.waktuSemula || "-"}</span>
            </div>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-[#1E5C58] uppercase mb-0.5 font-bold">
                <Calendar size={9} /> Jadwal Baru
              </span>
              <span className="text-[#1E5C58] font-bold block">{item.tanggalTerapi || "-"}</span>
              <span className="text-[10px] text-[#1E5C58] font-semibold">Pukul {item.waktu || "-"}</span>
            </div>
            <div className="col-span-2">
              <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-0.5">
                <FileText size={9} /> Alasan
              </span>
              <span className="text-gray-600 leading-snug block">{item.alasanReschedule || "-"}</span>
            </div>
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
              <span>{item.tanggalTerapi || "-"}</span>
            </div>
            <div>
              <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-0.5">
                <Clock size={9} /> Waktu
              </span>
              <span>{item.waktu || "-"}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t border-teal-50/50">
        {/* Terjadwal / Reschedule + keahlian cocok */}
        {(statusFilter === "Terjadwal" || statusFilter === "Reschedule") && isMySpecialty && (
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
        {/* Terjadwal / Reschedule + bukan keahliannya */}
        {(statusFilter === "Terjadwal" || statusFilter === "Reschedule") && !isMySpecialty && (
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
        : "Terjadwal"
  );

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
    return dummyJadwal.filter((row) => {
      if (row.tipeTerapi !== activeTab) return false;
      if (row.status !== activeFilter) return false;

      if (searchName.trim()) {
        const lower = searchName.toLowerCase();
        if (
          !row.namaPasien.toLowerCase().includes(lower) &&
          !row.namaOrangTua.toLowerCase().includes(lower)
        )
          return false;
      }

      if (dateFilter) {
        const [yyyy, mm, dd] = dateFilter.split("-");
        const formatted = `${dd}/${mm}/${yyyy}`;
        if (row.tanggalTerapi !== formatted) return false;
      }

      return true;
    });
  }, [activeTab, activeFilter, dateFilter, searchName]);

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
      tanggalTerapi: item.tanggalTerapi,
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
      tanggalTerapi: item.tanggalTerapi,
      waktu: item.waktu,
    });
    router.push(`/terapis/terapi/detail?${q.toString()}`);
  };

  const handleLihatHasil = (item: JadwalRow) => {
    const q = new URLSearchParams({
      namaPasien: item.namaPasien,
      namaOrangTua: item.namaOrangTua,
      telepon: item.telepon,
      tipeTerapi: item.tipeTerapi,
      terapis: item.terapis,
      tanggalTerapi: item.tanggalTerapi,
      waktu: item.waktu,
    });
    router.push(`/terapis/terapi/hasil?${q.toString()}`);
  };

  const handleUnduh = () => {
    console.log("Unduh Hasil");
  };

  const STATUS_TABS: { label: StatusFilter; icon: React.ElementType }[] = [
    { label: "Terjadwal", icon: CalendarCheck },
    { label: "Reschedule", icon: RefreshCw },
    { label: "Selesai", icon: CheckCircle2 },
  ];

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
                    setDateFilter("");
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

        {/* Tanggal + Unduh */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#81B7A9] pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-3 py-2.5 border border-teal-100 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-[0_2px_8px_rgba(30,92,88,0.02)] hover:border-teal-200 transition-colors bg-white"
            />
          </div>
          <button
            onClick={handleUnduh}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E5C58] hover:bg-[#2E8B83] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-teal-800/20 active:scale-95 shrink-0"
          >
            <Download size={15} />
            Unduh Hasil
          </button>
        </div>
      </div>

      {/* ── Status Filter (Pill Tab) + Search ── */}
      <div className="flex flex-col items-start justify-between gap-4 p-2 bg-white border border-gray-100 shadow-sm md:flex-row md:items-center rounded-2xl">
        {/* Pill tabs */}
        <div className="relative flex w-full p-1 md:w-auto bg-gray-50/50 rounded-xl">
          {STATUS_TABS.map(({ label, icon: Icon }) => {
            const isActive = activeFilter === label;
            return (
              <button
                key={label}
                onClick={() => {
                  setActiveFilter(label);
                  setSearchName("");
                }}
                className={`cursor-pointer relative flex-1 md:w-36 py-2.5 text-sm font-bold capitalize transition-all z-10 ${isActive ? "text-[#1E5C58]" : "text-gray-400 hover:text-gray-600"
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

        {/* Search */}
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
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all font-medium text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* ── Table / Card Area ── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          /* Empty State */
          <motion.div
            key={`empty-${activeTab}-${activeFilter}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-10 border border-teal-50/60 shadow-[0_4px_24px_rgba(30,92,88,0.03)] flex flex-col items-center justify-center gap-3 text-gray-400"
          >
            <ClipboardList className="w-10 h-10 text-gray-300" />
            <p className="text-sm font-medium">
              {activeFilter === "Terjadwal"
                ? "Tidak ada jadwal terapi"
                : activeFilter === "Selesai"
                  ? "Belum ada sesi yang selesai"
                  : "Tidak ada data reschedule"}
            </p>
            <p className="max-w-xs text-xs text-center text-gray-300">
              Data akan muncul setelah tersambung dengan server.
            </p>
          </motion.div>
        ) : (
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
                      <th className="w-[20%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">PASIEN</th>
                      <th className="w-[25%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">JADWAL SEMULA</th>
                      <th className="w-[25%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">JADWAL BARU</th>
                      <th className="w-[20%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">ALASAN</th>
                      <th className="w-[10%] px-4 py-4 text-xs font-bold tracking-wider text-center text-[#1E5C58] uppercase">AKSI</th>
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
                  {paginated.map((item) => (
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
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[13px]">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {item.jadwalSemula ?? "—"}
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold text-gray-500 text-[11px] mt-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              Pukul {item.waktuSemula ?? "—"}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[13px]">
                              <Calendar className="w-3.5 h-3.5 text-[#1E5C58]" />
                              {item.tanggalTerapi}
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold text-gray-500 text-[11px] mt-1">
                              <Clock className="w-3.5 h-3.5 text-[#1E5C58]" />
                              Pukul {item.waktu}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-600 text-[12px] pr-8">
                            {item.alasanReschedule ?? "—"}
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
                            {item.tanggalTerapi}
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-500">
                            {item.waktu}
                          </td>
                        </>
                      )}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block p-4 space-y-3 lg:hidden">
              {paginated.map((item) => (
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
              ))}
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
        )}
      </AnimatePresence>
    </div>
  );
}
