"use client";

import React, { useEffect, useState, Suspense, useMemo, useRef, useCallback } from "react";
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
import {
  getTherapySessions,
  getPendingSessionsCount,
  TherapyType,
  VirtualStatus,
  DbSessionStatus,
  TherapySessionItem,
} from "@/lib/api/terapiTerapis";

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
  tanggal: string;
  waktu: string;
  status: "Terjadwal" | "Selesai";
  dbStatus: DbSessionStatus;
  hasSoap: boolean;
  isRescheduled: boolean;
  tanggal_lama?: string | null;
  waktu_lama?: string | null;
  alasan?: string | null;
  nomorRM?: string;
  usia?: string;
  jenisKelamin?: string;
  tempatTglLahir?: string;
  asalSekolah?: string;
  alamat?: string;
  hubunganWali?: string;
  notes?: string | null;
}

type StatusFilter = "Terjadwal" | "Selesai" | "Reschedule" | "Tertunda";
type DateRangeFilter = "hari-ini" | "besok" | "minggu-ini" | "bulan-ini" | "custom";
type ScheduleScope = "mine" | "all";

const formatTanggal = (yyyyMmDd: string) => {
  if (!yyyyMmDd) return "";
  const parts = yyyyMmDd.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return yyyyMmDd;
};

const checkIsMySpecialty = (tab: TerapiTab, therapistSection?: string | null): boolean => {
  if (!therapistSection) return false;
  const section = therapistSection.toLowerCase();
  const tabLower = tab.toLowerCase();
  return tabLower.includes(section) || (section.includes("plb") && tab === "PLB (Paedagog)");
};

const mapTabToTherapyType = (tab: TerapiTab): TherapyType => {
  switch (tab) {
    case "Terapi Okupasi": return "okupasi";
    case "Terapi Wicara": return "wicara";
    case "Fisioterapi": return "fisio";
    default: return "paedagog";
  }
};

const mapFilterToVirtualStatus = (filter: StatusFilter): VirtualStatus => {
  switch (filter) {
    case "Selesai": return "completed";
    case "Reschedule": return "rescheduled";
    case "Tertunda": return "pending";
    default: return "scheduled";
  }
};

const transformSessionItemToRow = (
  item: TherapySessionItem,
  activeFilter: StatusFilter
): JadwalRow => {
  let tanggalLama: string | null = null;
  let waktuLama: string | null = null;
  let alasan: string | null = null;
  let tanggal = item.session_date;
  let waktu = `${item.start_time} - ${item.end_time}`;
  let terapis = item.therapist_name;

  if (activeFilter === "Reschedule") {
    tanggalLama = item.session_date;
    waktuLama = `${item.start_time} - ${item.end_time}`;
    tanggal = item.reschedule_info?.new_session_date || item.session_date;
    alasan = item.reschedule_info?.reason || item.notes || null;

    const newStart = item.reschedule_info?.start_time || item.reschedule_info?.new_start_time;
    const newEnd = item.reschedule_info?.end_time || item.reschedule_info?.new_end_time;
    if (newStart && newEnd && newStart !== "-" && newEnd !== "-") {
      waktu = `${newStart.slice(0, 5)} - ${newEnd.slice(0, 5)}`;
    } else if (item.notes) {
      const match = item.notes.match(/pukul\s+([0-9]{1,2}[:.][0-9]{2})\s*-\s*([0-9]{1,2}[:.][0-9]{2})/i);
      if (match) {
        waktu = `${match[1].replace(".", ":")} - ${match[2].replace(".", ":")}`;
      }
    }

    if (item.reschedule_info?.new_therapist_name && item.reschedule_info.new_therapist_name !== "-") {
      terapis = item.reschedule_info.new_therapist_name;
    }
  } else {
    if (item.notes && item.notes.includes("Reschedule dari sesi tanggal")) {
      const match = item.notes.match(
        /Reschedule dari sesi tanggal\s+([^\s]+)(?:\s+pukul\s+(.+))?/i
      );
      if (match) {
        tanggalLama = match[1];
        if (match[2]) {
          waktuLama = match[2].trim();
        }
      } else {
        const oldDate = item.notes.replace("Reschedule dari sesi tanggal", "").trim();
        tanggalLama = oldDate;
      }
    }
  }

  return {
    id: item.id,
    namaPasien: item.child_name,
    namaOrangTua: item.guardian_name,
    telepon: item.guardian_phone || "-",
    tipeTerapi: item.therapy_type_label,
    terapis,
    tanggal,
    waktu,
    status: item.has_soap ? "Selesai" : "Terjadwal",
    dbStatus: item.status,
    hasSoap: item.has_soap,
    isRescheduled: Boolean(
      item.is_rescheduled ||
      item.is_reschedule ||
      (item.notes && item.notes.includes("Reschedule dari sesi tanggal"))
    ),
    tanggal_lama: tanggalLama,
    waktu_lama: waktuLama,
    alasan,
    nomorRM: item.medical_record_number,
    hubunganWali: item.guardian_type,
    notes: item.notes,
  };
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
  canEdit,
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
  canEdit: boolean;
  onIsiSoap: (item: JadwalRow) => void;
  onDetail: (item: JadwalRow) => void;
  onLihatHasil: (item: JadwalRow) => void;
}) {
  const isOpen = openDropdownId === item.id;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    openUpward: boolean;
  }>({ left: 0, openUpward: false });

  const MENU_WIDTH = 200;

  const isMySpecialty =
    currentTab.toLowerCase().includes(mySection.toLowerCase()) ||
    (mySection.toLowerCase().includes("plb") && currentTab === "PLB (Paedagog)");

  const isPresent = item.dbStatus === "present";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 110;
      let left = rect.right - MENU_WIDTH;
      if (left < 8) left = 8;
      if (left + MENU_WIDTH > window.innerWidth - 8)
        left = window.innerWidth - MENU_WIDTH - 8;
      setMenuPos({
        top: openUpward ? undefined : rect.bottom + 8,
        bottom: openUpward ? window.innerHeight - rect.top + 8 : undefined,
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
                    ...(menuPos.openUpward
                      ? { bottom: menuPos.bottom }
                      : { top: menuPos.top }),
                    left: menuPos.left,
                    width: MENU_WIDTH,
                  }}
                  className="z-[101] rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-teal-50/80 overflow-hidden py-1 text-[#1E5C58]"
                >
                  {/* Status: Terjadwal / Tertunda & cocok keahlian & canEdit */}
                  {(statusFilter === "Terjadwal" || statusFilter === "Tertunda") && isMySpecialty && canEdit && (
                    <>
                      <button
                        onClick={() => {
                          if (isPresent) {
                            setOpenDropdownId(null);
                            onIsiSoap(item);
                          }
                        }}
                        disabled={!isPresent}
                        title={!isPresent ? "Presensi anak harus Hadir terlebih dahulu untuk mengisi SOAP" : undefined}
                        className={`flex items-center w-full px-4 py-2.5 text-xs font-semibold transition-colors ${!isPresent
                          ? "opacity-50 cursor-not-allowed text-gray-400 bg-gray-50/40"
                          : "cursor-pointer hover:bg-teal-50/30 hover:text-[#1E5C58] text-gray-700"
                          }`}
                      >
                        <FileText size={16} className={`mr-2 ${isPresent ? "text-[#81B7A9]" : "text-gray-400"}`} />
                        <span>Isi SOAP {!isPresent && <span className="text-[10px] text-amber-600 block">(Belum Hadir)</span>}</span>
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

                  {/* Status: Terjadwal / Tertunda — bukan keahliannya / tidak canEdit */}
                  {(statusFilter === "Terjadwal" || statusFilter === "Tertunda") && (!isMySpecialty || !canEdit) && (
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
  canEdit,
  onIsiSoap,
  onDetail,
  onLihatHasil,
}: {
  item: JadwalRow;
  statusFilter: StatusFilter;
  mySection: string;
  currentTab: string;
  canEdit: boolean;
  onIsiSoap: (item: JadwalRow) => void;
  onDetail: (item: JadwalRow) => void;
  onLihatHasil: (item: JadwalRow) => void;
}) {
  const isMySpecialty =
    currentTab.toLowerCase().includes(mySection.toLowerCase()) ||
    (mySection.toLowerCase().includes("plb") && currentTab === "PLB (Paedagog)");

  const isPresent = item.dbStatus === "present";

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

            {item.alasan && (
              <div className="col-span-2 pt-3 mt-1 border-t border-teal-50/50">
                <span className="flex items-center gap-1 text-[10px] text-gray-400 uppercase mb-1.5 font-bold">
                  ALASAN
                </span>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-600">
                  {item.alasan}
                </p>
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
              {item.tanggal_lama && (
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
              {item.waktu_lama && item.waktu_lama !== item.waktu && (
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

      {statusFilter !== "Reschedule" && (
        <div className="flex gap-2 pt-3 border-t border-teal-50/50">
          {(statusFilter === "Terjadwal" || statusFilter === "Tertunda") && isMySpecialty && canEdit && (
            <>
              {isPresent ? (
                <button
                  onClick={() => onIsiSoap(item)}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-[#1E5C58] hover:bg-[#2E8B83] text-white text-xs font-semibold py-2 rounded-lg shadow-sm transition-colors"
                >
                  <FileText size={13} />
                  Isi SOAP
                </button>
              ) : (
                <button
                  disabled
                  title="Presensi anak harus Hadir terlebih dahulu untuk mengisi SOAP"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 text-xs font-semibold py-2 rounded-lg cursor-not-allowed border border-gray-200"
                >
                  <FileText size={13} />
                  Isi SOAP (Belum Hadir)
                </button>
              )}
              <button
                onClick={() => onDetail(item)}
                className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-white border border-teal-100 text-[#1E5C58] hover:bg-teal-50/20 text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                <Eye size={13} />
                Detail
              </button>
            </>
          )}

          {(statusFilter === "Terjadwal" || statusFilter === "Tertunda") && (!isMySpecialty || !canEdit) && (
            <button
              onClick={() => onDetail(item)}
              className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-white border border-teal-100 text-[#1E5C58] hover:bg-teal-50/20 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              <Eye size={13} />
              Detail
            </button>
          )}

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
      )}
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

  const profileApplied = useRef(Boolean(urlType));

  useEffect(() => {
    if (profile?.therapist_section && !profileApplied.current) {
      if (!urlType) {
        const section = profile.therapist_section.toLowerCase();
        let targetTab: TerapiTab = "PLB (Paedagog)";
        if (section.includes("okupasi")) targetTab = "Terapi Okupasi";
        else if (section.includes("wicara")) targetTab = "Terapi Wicara";
        else if (section.includes("fisio")) targetTab = "Fisioterapi";
        setActiveTab(targetTab);
        setScheduleScope("mine");
      } else {
        const isSpecialty = checkIsMySpecialty(activeTab, profile.therapist_section);
        setScheduleScope(isSpecialty ? "mine" : "all");
      }
      profileApplied.current = true;
    }
  }, [profile, urlType, activeTab]);

  useEffect(() => {
    if (urlType) {
      const mappedTab: TerapiTab = (() => {
        switch (urlType) {
          case "okupasi": return "Terapi Okupasi";
          case "wicara": return "Terapi Wicara";
          case "fisio": return "Fisioterapi";
          default: return "PLB (Paedagog)";
        }
      })();

      setActiveTab((prev) => {
        if (prev !== mappedTab) {
          const isSpecialty = checkIsMySpecialty(mappedTab, profile?.therapist_section);
          setScheduleScope(isSpecialty ? "mine" : "all");
          return mappedTab;
        }
        return prev;
      });
    }
  }, [urlType, profile?.therapist_section]);

  useEffect(() => {
    if (urlStatus) {
      if (urlStatus === "completed" || urlStatus === "selesai") {
        setActiveFilter("Selesai");
      } else if (urlStatus === "reschedule") {
        setActiveFilter("Reschedule");
      } else if (urlStatus === "pending" || urlStatus === "tertunda") {
        setActiveFilter("Tertunda");
      } else if (urlStatus === "scheduled" || urlStatus === "terjadwal") {
        setActiveFilter("Terjadwal");
      }
    }
  }, [urlStatus]);

  const [activeFilter, setActiveFilter] = useState<StatusFilter>(
    urlStatus === "completed" || urlStatus === "selesai"
      ? "Selesai"
      : urlStatus === "reschedule"
        ? "Reschedule"
        : urlStatus === "pending" || urlStatus === "tertunda"
          ? "Tertunda"
          : "Terjadwal"
  );
  const [scheduleScope, setScheduleScope] = useState<ScheduleScope>("mine");

  const isMySpecialtyTab = useMemo(() => {
    return checkIsMySpecialty(activeTab, profile?.therapist_section);
  }, [profile, activeTab]);

  const prevTabRef = useRef(activeTab);

  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      if (isMySpecialtyTab) {
        setScheduleScope("mine");
      } else {
        setScheduleScope("all");
      }
      setDateRangeMode("hari-ini");
      setDateFilter("");
    }
  }, [activeTab, isMySpecialtyTab]);

  const prevFilterRef = useRef(activeFilter);

  useEffect(() => {
    if (prevFilterRef.current !== activeFilter) {
      prevFilterRef.current = activeFilter;
      setDateRangeMode("hari-ini");
      setDateFilter("");
    }
  }, [activeFilter]);

  const activeRequestIdRef = useRef(0);

  const [items, setItems] = useState<JadwalRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSessionsCount, setPendingSessionsCount] = useState(0);

  const [dateRangeMode, setDateRangeMode] = useState<DateRangeFilter>("hari-ini");
  const [dateFilter, setDateFilter] = useState("");
  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    const currentType = getType();
    const currentStatus = getMappedStatus();
    if (urlType !== currentType || urlStatus !== currentStatus) {
      router.replace(`?type=${currentType}&status=${currentStatus}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, activeTab, urlType, urlStatus]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchName);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchName]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [activeTab, activeFilter, dateRangeMode, dateFilter, debouncedSearch, scheduleScope]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Fetch pending count untuk banner
  const fetchPendingCount = useCallback(async () => {
    if (!isMySpecialtyTab || scheduleScope !== "mine") {
      setPendingSessionsCount(0);
      return;
    }
    const count = await getPendingSessionsCount(mapTabToTherapyType(activeTab));
    setPendingSessionsCount(count);
  }, [activeTab, scheduleScope, isMySpecialtyTab]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Fetch jadwal terapi dari API backend
  const fetchJadwalData = useCallback(async () => {
    const requestId = ++activeRequestIdRef.current;
    setIsLoading(true);

    try {
      const therapyType = mapTabToTherapyType(activeTab);
      const statusParam = mapFilterToVirtualStatus(activeFilter);

      let dateRangeParam: "today" | "tomorrow" | "this_week" | "this_month" | undefined = undefined;
      let dateParam: string | undefined = undefined;

      if (dateRangeMode === "custom" && dateFilter) {
        dateParam = dateFilter;
      } else if (activeFilter === "Terjadwal") {
        if (dateRangeMode === "hari-ini") dateRangeParam = "today";
        else if (dateRangeMode === "besok") dateRangeParam = "tomorrow";
        else if (dateRangeMode === "minggu-ini") dateRangeParam = "this_week";
        else if (dateRangeMode === "bulan-ini") dateRangeParam = "this_month";
      }

      const res = await getTherapySessions({
        therapy_type: therapyType,
        status: statusParam,
        date_range: dateRangeParam,
        date: dateParam,
        my_sessions: isMySpecialtyTab ? scheduleScope === "mine" : false,
        search: debouncedSearch.trim() || undefined,
        page,
        per_page: pageSize,
      });

      if (requestId !== activeRequestIdRef.current) {
        return;
      }

      const cleanItems = res.items.filter((item) => {
        if (activeFilter === "Terjadwal") {
          return item.status !== "cancelled" && !item.reschedule_info;
        }
        return true;
      });

      const mapped = cleanItems.map((item) =>
        transformSessionItemToRow(item, activeFilter)
      );

      setItems(mapped);
      setTotalItems(res.meta.total);
    } catch (err) {
      if (requestId !== activeRequestIdRef.current) return;
      console.error("Gagal memuat jadwal terapi:", err);
      setItems([]);
      setTotalItems(0);
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    activeTab,
    activeFilter,
    dateRangeMode,
    dateFilter,
    scheduleScope,
    isMySpecialtyTab,
    debouncedSearch,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchJadwalData();
  }, [fetchJadwalData]);

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
                          if (activeTab === tab) {
                            setOpenDropdownId(null);
                            return;
                          }
                          const isSpecialty = checkIsMySpecialty(tab, profile?.therapist_section);
                          setItems([]);
                          setIsLoading(true);
                          setActiveTab(tab);
                          setScheduleScope(isSpecialty ? "mine" : "all");
                          setActiveFilter("Terjadwal");
                          setDateRangeMode("hari-ini");
                          setDateFilter("");
                          setPage(1);
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
                      ease: "easeInOut",
                    },
                  },
                  visible: {
                    opacity: 1,
                    width: "auto",
                    transition: {
                      duration: 0.3,
                      ease: "easeInOut",
                    },
                  },
                  exit: {
                    opacity: 0,
                    width: 0,
                    transition: {
                      duration: 0.4,
                      ease: "easeInOut",
                    },
                  },
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
            <Calendar
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 ${dateRangeMode === "custom" ? "text-white" : "text-[#81B7A9]"
                }`}
            />
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
          {(isMySpecialtyTab
            ? STATUS_TABS.filter((t) => t.label !== "Tertunda" || pendingSessionsCount > 0)
            : STATUS_TABS.filter((t) => t.label !== "Tertunda")
          ).map(({ label, icon: Icon }) => {
            const isActive = activeFilter === label;
            return (
              <button
                key={label}
                onClick={() => {
                  if (activeFilter === label) return;
                  setItems([]);
                  setIsLoading(true);
                  setActiveFilter(label);
                  setDateRangeMode("hari-ini");
                  setDateFilter("");
                  if (label === "Tertunda" && isMySpecialtyTab) setScheduleScope("mine");
                  setPage(1);
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
        <div className="flex items-center w-full gap-2 md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari pasien / orangtua..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all font-medium text-gray-700"
            />
          </div>
          {isMySpecialtyTab && (
            <div className="flex p-1 bg-gray-50/50 rounded-xl shrink-0">
              <button
                onClick={handleUnduh}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-teal-50 hover:bg-teal-50/50 text-[#1E5C58] rounded-lg text-sm font-bold transition-all shadow-sm"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export SOAP</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Area Konten (Banner + Tabel) ── */}
      <div className="flex flex-col gap-3 -mt-2">
        {/* ── Banner Tertunda ── */}
        <AnimatePresence>
          {isMySpecialtyTab && pendingSessionsCount > 0 && activeFilter !== "Tertunda" && (
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
                      Anda memiliki {pendingSessionsCount} jadwal dari hari sebelumnya yang belum diselesaikan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveFilter("Tertunda");
                    setDateRangeMode("hari-ini");
                    setDateFilter("");
                  }}
                  className="px-4 py-2 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer shrink-0 bg-amber-600 hover:bg-amber-700 rounded-xl"
                >
                  Lihat Jadwal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Area Header & Tabel ── */}
        <div className="flex flex-col gap-3">
          {/* Header Tabel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[44px]">
            <h2 className="text-sm md:text-base font-extrabold text-[#1E5C58] flex items-center gap-2.5">
              Daftar Terapi {activeFilter}
              <span className="bg-teal-50/80 text-teal-700 text-[11px] px-2.5 py-0.5 rounded-md border border-teal-100 font-bold">
                {totalItems} Sesi
              </span>
            </h2>
            {isMySpecialtyTab && activeFilter !== "Tertunda" && (
              <div className="inline-flex items-center self-start gap-1 p-1 bg-white border border-teal-100 shadow-sm rounded-xl sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (scheduleScope === "mine") return;
                    setItems([]);
                    setIsLoading(true);
                    setScheduleScope("mine");
                    setPage(1);
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${scheduleScope === "mine"
                    ? "bg-[#1E5C58] text-white shadow-sm"
                    : "text-gray-500 hover:bg-teal-50/50 hover:text-[#1E5C58]"
                    }`}
                >
                  Jadwalku
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (scheduleScope === "all") return;
                    setItems([]);
                    setIsLoading(true);
                    setScheduleScope("all");
                    setPage(1);
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${scheduleScope === "all"
                    ? "bg-[#1E5C58] text-white shadow-sm"
                    : "text-gray-500 hover:bg-teal-50/50 hover:text-[#1E5C58]"
                    }`}
                >
                  Semua Jadwal
                </button>
              </div>
            )}
          </div>

          {/* Table / Card Area */}
          <div className="bg-white rounded-2xl border border-teal-50/60 shadow-[0_4px_24px_rgba(30,92,88,0.03)] hover:shadow-[0_8px_32px_rgba(30,92,88,0.06)] transition-shadow duration-300 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm table-fixed">
                <thead>
                  {activeFilter === "Reschedule" ? (
                    <tr className="bg-[#F4F9F8] border-b border-teal-100">
                      <th className="w-[16%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">PASIEN</th>
                      <th className="w-[12%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">TELEPON</th>
                      <th className="w-[12%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">TIPE TERAPI</th>
                      <th className="w-[14%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">TERAPIS</th>
                      <th className="w-[18%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">JADWAL SEMULA</th>
                      <th className="w-[18%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">JADWAL BARU</th>
                      <th className="w-[20%] px-4 py-4 text-xs font-bold tracking-wider text-left text-[#1E5C58] uppercase">ALASAN</th>
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={activeFilter === "Reschedule" ? 7 : 8} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-[#1E5C58]">
                          <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#81B7A9] border-t-transparent" />
                          <p className="text-xs font-semibold text-gray-500">Memuat data terapi...</p>
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={activeFilter === "Reschedule" ? 7 : 8} className="px-4 py-12 font-medium text-center text-gray-500">
                        {emptyStateText}
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
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
                              {item.alasan ? (
                                <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-[220px]">
                                  {item.alasan}
                                </p>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
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
                              {item.tanggal_lama && (
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
                              {item.waktu_lama && item.waktu_lama !== item.waktu && (
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
                              canEdit={
                                isMySpecialtyTab &&
                                !!profile?.therapist_name &&
                                item.terapis.toLowerCase() === profile.therapist_name.toLowerCase()
                              }
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
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#81B7A9] border-t-transparent" />
                  <p className="text-xs font-semibold text-gray-500">Memuat data terapi...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-8 font-medium text-center text-gray-500 bg-white border border-teal-100 border-dashed rounded-xl">
                  {emptyStateText}
                </div>
              ) : (
                items.map((item) => (
                  <MobileJadwalCard
                    key={item.id}
                    item={item}
                    statusFilter={activeFilter}
                    mySection={profile?.therapist_section ?? ""}
                    currentTab={activeTab}
                    canEdit={
                      isMySpecialtyTab &&
                      !!profile?.therapist_name &&
                      item.terapis.toLowerCase() === profile.therapist_name.toLowerCase()
                    }
                    onIsiSoap={handleIsiSoap}
                    onDetail={handleDetail}
                    onLihatHasil={handleLihatHasil}
                  />
                ))
              )}
            </div>

            <PaginationFooter
              totalItems={totalItems}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
