"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  CheckCircle2,
  Activity,
  Calendar,
  CalendarDays,
  Search,
  Clock,
  User,
  Settings,
  ChevronDown,
  Play,
  Pencil,
  Eye,
  Download,
  X,
  ScanLine,
  Camera,
  RefreshCw,
  QrCode,
} from "lucide-react";
import QrCodeViewerModal from "@/components/modal/QrCodeViewerModal";
import { motion, AnimatePresence } from "framer-motion";
import FormCatatKehadiran, {
  PresensiManualInitialValues,
  PresensiManualPayload,
  PresensiManualTarget,
} from "@/components/form/FormMulaiPresensi";
import FormDetailPresensi, {
  PresensiDetailData,
} from "@/components/form/FormDetailPresensi";
import {
  getTodaySessions,
  getRescheduledSessions,
  markAttendance,
  updateAttendance,
  createReschedule,
  scanQrAttendance,
  getSessionQr,
  exportAttendance,
  SessionAttendanceItem,
  RescheduleItem,
} from "@/lib/api/presensi";
import { getTherapists, getChildren } from "@/lib/api/jadwal_terapi";
import { showSuccessToast, showErrorToast, handleApiError } from "@/lib/toast";

// ── Types ──────────────────────────────────────────────────────────────────────
interface PresensiData {
  id: string;
  pasienName: string;
  waliName: string;
  tanggal: string;
  waktu: string;
  terapisName: string;
  tipeTermi: string;
  status: "Belum Presensi" | "Sakit" | "Hadir" | "Izin" | "Tidak Hadir";
  keterangan: string;
  reschedule?: {
    tanggal: string;
    waktu: string;
    terapisName?: string;
  };
  rawSession?: SessionAttendanceItem;
}

// Map backend status to UI status badge
function mapBackendStatusToUi(
  status: SessionAttendanceItem["status"]
): PresensiData["status"] {
  switch (status) {
    case "present":
      return "Hadir";
    case "absent":
    case "cancelled":
      return "Tidak Hadir";
    case "sick":
      return "Sakit";
    case "excused":
    case "therapist_absent":
    case "therapist_excused":
      return "Izin";
    case "pending":
    default:
      return "Belum Presensi";
  }
}

function mapUiStatusToBackend(status: string): string {
  switch (status) {
    case "Hadir":
      return "present";
    case "Tidak Hadir":
      return "absent";
    case "Sakit":
      return "sick";
    case "Izin":
      return "excused";
    default:
      return "pending";
  }
}

function formatTherapyType(type: string): string {
  const map: Record<string, string> = {
    paedagog: "PLB (Paedagog)",
    wicara: "Terapi Wicara",
    okupasi: "Terapi Okupasi",
    fisio: "Fisioterapi",
  };
  return map[type] || type;
}

function mapSessionToPresensiData(item: SessionAttendanceItem): PresensiData {
  const [y, m, d] = item.session_date.split("-");
  const tanggal = `${d}/${m}/${y}`;
  const waktu = `Pukul ${item.start_time.replace(":", ".")} - ${item.end_time.replace(":", ".")}`;

  return {
    id: item.id,
    pasienName: item.child_name,
    waliName: item.guardian_name,
    tanggal,
    waktu,
    terapisName: item.therapist_name,
    tipeTermi: formatTherapyType(item.therapy_type),
    status: mapBackendStatusToUi(item.status),
    keterangan: item.notes || "-",
    reschedule: item.reschedule_info
      ? {
          tanggal: item.reschedule_info.new_session_date,
          waktu,
        }
      : undefined,
    rawSession: item,
  };
}

// ── Badge Status ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PresensiData["status"] }) {
  const styles: Record<string, string> = {
    "Belum Presensi": "bg-gray-100 text-gray-400 border-gray-200",
    Sakit: "bg-blue-50 text-blue-500 border-blue-200",
    Hadir: "bg-green-50 text-emerald-600 border-green-200",
    Izin: "bg-amber-50 text-amber-600 border-amber-200",
    "Tidak Hadir": "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 text-[11px] font-extrabold rounded-full border ${styles[status]}`}
    >
      {status}
    </span>
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
          Menampilkan <span className="font-bold text-[#1E5C58]">1</span> -{" "}
          <span className="font-bold text-[#1E5C58]">{totalItems}</span> dari{" "}
          <span className="font-bold text-[#1E5C58]">{totalItems}</span> data
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            disabled={currentPage <= 1}
          >
            Prev
          </button>
          <button className="px-3 py-1.5 text-xs font-bold text-white bg-[#2B7A75] border border-[#2B7A75] rounded-lg">
            {currentPage} / {totalPages}
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Action Dropdown ────────────────────────────────────────────────────────────
function ActionDropdown({
  item,
  openDropdownId,
  setOpenDropdownId,
  onMulai,
  onEdit,
  onDetail,
  onShowQr,
}: {
  item: PresensiData;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  onMulai: (item: PresensiData) => void;
  onEdit: (item: PresensiData) => void;
  onDetail: (item: PresensiData) => void;
  onShowQr: (item: PresensiData) => void;
}) {
  const isOpen = openDropdownId === item.id;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    openUpward: boolean;
  }>({
    top: 0,
    left: 0,
    openUpward: false,
  });

  const MENU_WIDTH = 192;
  const MENU_HEIGHT_ESTIMATE = 96;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < MENU_HEIGHT_ESTIMATE + 12;

      let left = rect.right - MENU_WIDTH;
      if (left < 8) left = 8;
      if (left + MENU_WIDTH > window.innerWidth - 8) {
        left = window.innerWidth - MENU_WIDTH - 8;
      }

      setMenuPos({
        top: openUpward
          ? rect.top - MENU_HEIGHT_ESTIMATE - 8
          : rect.bottom + 8,
        left,
        openUpward,
      });
    }

    setOpenDropdownId(isOpen ? null : item.id);
  };

  return (
    <td className="px-6 py-4 text-center">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-100 rounded-lg text-[#1E5C58] hover:bg-teal-50/40 text-xs font-semibold transition-colors"
      >
        <Settings size={14} />
        <span>Aksi</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                  initial={{
                    opacity: 0,
                    y: menuPos.openUpward ? 10 : -10,
                    scale: 0.95,
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: menuPos.openUpward ? 10 : -10,
                    scale: 0.95,
                  }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "fixed",
                    top: menuPos.top,
                    left: menuPos.left,
                    width: MENU_WIDTH,
                  }}
                  className="z-[101] rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-teal-50/80 overflow-hidden py-1 text-[#1E5C58]"
                >
                  <button
                    onClick={() => {
                      setOpenDropdownId(null);
                      onShowQr(item);
                    }}
                    className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors border-b border-gray-100"
                  >
                    <QrCode size={16} className="mr-2 text-[#2B7A75]" />
                    Lihat QR Code
                  </button>
                  {item.status === "Belum Presensi" ? (
                    <>
                      <button
                        onClick={() => {
                          setOpenDropdownId(null);
                          onMulai(item);
                        }}
                        className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                      >
                        <Play size={16} className="mr-2 text-[#81B7A9]" />
                        Mulai
                      </button>
                      <button
                        onClick={() => {
                          setOpenDropdownId(null);
                          onDetail(item);
                        }}
                        className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                      >
                        <Eye size={16} className="mr-2 text-[#81B7A9]" />
                        Detail
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setOpenDropdownId(null);
                          onEdit(item);
                        }}
                        className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                      >
                        <Pencil size={16} className="mr-2 text-[#81B7A9]" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setOpenDropdownId(null);
                          onDetail(item);
                        }}
                        className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                      >
                        <Eye size={16} className="mr-2 text-[#81B7A9]" />
                        Detail
                      </button>
                    </>
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

// ── Mobile Cards ──────────────────────────────────────────────────────────────
function MobilePresensiCard({
  item,
  onMulai,
  onEdit,
  onDetail,
}: {
  item: PresensiData;
  onMulai: (item: PresensiData) => void;
  onEdit: (item: PresensiData) => void;
  onDetail: (item: PresensiData) => void;
}) {
  const isBelumPresensi = item.status === "Belum Presensi";

  return (
    <article className="p-4 bg-white border border-teal-100 shadow-sm rounded-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-extrabold text-gray-800 truncate">
            {item.pasienName}
          </h4>
          <span className="mt-1 inline-flex max-w-full truncate rounded-md border border-orange-200 bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-800">
            Wali: {item.waliName}
          </span>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="grid grid-cols-1 gap-3 mt-4 text-xs sm:grid-cols-2">
        <div>
          <p className="mb-1 font-bold tracking-wide text-gray-400 uppercase">
            Jadwal terapi
          </p>
          <p className="flex items-center gap-1.5 font-bold text-gray-800">
            <Calendar className="h-3.5 w-3.5 text-[#2B7A75]" /> {item.tanggal}
          </p>
          <p className="mt-1 flex items-center gap-1.5 font-medium text-gray-500">
            <Clock className="h-3.5 w-3.5" /> {item.waktu}
          </p>
        </div>
        <div>
          <p className="mb-1 font-bold tracking-wide text-gray-400 uppercase">
            Terapis
          </p>
          <p className="flex items-center gap-1.5 font-bold text-[#1E5C58]">
            <User className="h-3.5 w-3.5 text-[#2B7A75]" /> {item.terapisName}
          </p>
          <span className="mt-2 inline-flex rounded-md border border-teal-100 bg-teal-50 px-2 py-1 text-[10px] font-bold text-[#1E5C58]">
            {item.tipeTermi}
          </span>
        </div>
      </div>
      <div className="p-3 mt-3 text-xs leading-relaxed text-gray-500 rounded-xl bg-gray-50">
        <span className="font-bold text-gray-600">Keterangan: </span>
        {item.keterangan}
      </div>
      <div className="flex flex-wrap gap-2 pt-3 mt-4 border-t border-gray-100">
        {isBelumPresensi ? (
          <button
            onClick={() => onMulai(item)}
            className="flex-1 rounded-lg bg-[#2B7A75] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1E5C58]"
          >
            Mulai
          </button>
        ) : (
          <button
            onClick={() => onEdit(item)}
            className="flex-1 rounded-lg border border-teal-200 px-3 py-2 text-xs font-bold text-[#1E5C58] transition-colors hover:bg-teal-50"
          >
            Edit
          </button>
        )}
        <button
          onClick={() => onDetail(item)}
          className="flex-1 px-3 py-2 text-xs font-bold text-gray-600 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Detail
        </button>
      </div>
    </article>
  );
}

function MobileRescheduleCard({ item }: { item: RescheduleItem }) {
  const originalDate = item.original_session?.session_date || "-";
  const newDate = item.new_session?.session_date || "-";

  return (
    <article className="p-4 bg-white border border-teal-100 shadow-sm rounded-2xl">
      <h4 className="text-sm font-extrabold text-gray-800">
        {item.child_name} ({item.medical_record_number})
      </h4>
      <div className="grid gap-3 mt-4 sm:grid-cols-2">
        <div className="p-3 text-xs rounded-xl bg-gray-50">
          <p className="mb-2 font-bold tracking-wide text-gray-400 uppercase">
            Jadwal semula
          </p>
          <p className="font-bold text-gray-800">{originalDate}</p>
          <p className="mt-1 text-gray-500">
            {item.original_session?.therapist_name}
          </p>
        </div>
        <div className="p-3 text-xs rounded-xl bg-teal-50/60">
          <p className="mb-2 font-bold uppercase tracking-wide text-[#2B7A75]">
            Jadwal baru
          </p>
          <p className="font-bold text-[#1E5C58]">{newDate}</p>
          <p className="mt-1 text-gray-500">
            {item.new_session?.therapist_name}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        <span className="font-bold text-gray-600">Alasan: </span>
        {item.reason || "-"}
      </p>
    </article>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── REKAP KEHADIRAN ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
type Periode = "Harian" | "Mingguan" | "Bulanan" | "Custom";

interface PeriodeValues {
  hari: string;
  minggu: string;
  bulan: string;
  dari: string;
  sampai: string;
}

const BULAN_SINGKAT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const PERIODE_OPTIONS: Periode[] = ["Harian", "Mingguan", "Bulanan", "Custom"];

const DEFAULT_PERIODE: Periode = "Bulanan";
const DEFAULT_PERIODE_VALUES: PeriodeValues = {
  hari: "",
  minggu: "",
  bulan: new Date().toISOString().slice(0, 7),
  dari: "",
  sampai: "",
};

function RekapKehadiran() {
  const [anakId, setAnakId] = useState("");
  const [terapisId, setTerapisId] = useState("");
  const [jenisTerapi, setJenisTerapi] = useState("");
  const [periode, setPeriode] = useState<Periode>(DEFAULT_PERIODE);
  const [periodeValues, setPeriodeValues] = useState<PeriodeValues>(
    DEFAULT_PERIODE_VALUES
  );

  const [childrenList, setChildrenList] = useState<{ id: string; name: string }[]>([]);
  const [therapistsList, setTherapistsList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadOptions() {
      const [cRes, tRes] = await Promise.all([getChildren(), getTherapists()]);
      if (Array.isArray(cRes)) {
        setChildrenList(
          cRes.map((c: any) => ({
            id: c.id,
            name: `${c.child_name} (${c.medical_record_number || "-"})`,
          }))
        );
      }
      if (Array.isArray(tRes)) {
        setTherapistsList(
          tRes.map((t: any) => ({
            id: t.id,
            name: t.therapist_name,
          }))
        );
      }
    }
    loadOptions();
  }, []);

  const [previewItems, setPreviewItems] = useState<SessionAttendanceItem[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Compute date_from and date_to based on current periode state
  const computedDateRange = useMemo(() => {
    let dateFrom = "";
    let dateTo = "";

    if (periode === "Harian" && periodeValues.hari) {
      dateFrom = periodeValues.hari;
      dateTo = periodeValues.hari;
    } else if (periode === "Bulanan" && periodeValues.bulan) {
      const [y, m] = periodeValues.bulan.split("-");
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      dateFrom = `${periodeValues.bulan}-01`;
      dateTo = `${periodeValues.bulan}-${String(lastDay).padStart(2, "0")}`;
    } else if (periode === "Custom") {
      dateFrom = periodeValues.dari;
      dateTo = periodeValues.sampai;
    }

    return { dateFrom, dateTo };
  }, [periode, periodeValues]);

  // Fetch preview data when filters change
  useEffect(() => {
    let isSubscribed = true;
    async function fetchPreview() {
      setLoadingPreview(true);
      try {
        const res = await getTodaySessions({
          date_from: computedDateRange.dateFrom || undefined,
          date_to: computedDateRange.dateTo || undefined,
          child_id: anakId || undefined,
          therapist_id: terapisId || undefined,
          therapy_type: jenisTerapi || undefined,
          per_page: 10,
          page: 1,
        } as any);

        if (isSubscribed) {
          setPreviewItems(res.items || []);
          setTotalFiltered(res.meta?.total || 0);
        }
      } catch (err) {
        console.error("Gagal memuat preview export:", err);
      } finally {
        if (isSubscribed) setLoadingPreview(false);
      }
    }

    fetchPreview();
    return () => {
      isSubscribed = false;
    };
  }, [anakId, terapisId, jenisTerapi, computedDateRange]);

  const handleExportClick = async (format: "excel" | "pdf") => {
    try {
      await exportAttendance({
        date_from: computedDateRange.dateFrom || undefined,
        date_to: computedDateRange.dateTo || undefined,
        therapy_type: jenisTerapi || undefined,
        therapist_id: terapisId || undefined,
        child_id: anakId || undefined,
        format,
      });

      showSuccessToast(
        `Rekap kehadiran berhasil di-export ke format ${format.toUpperCase()}`
      );
    } catch (err: any) {
      handleApiError(err, "Gagal meng-export rekap kehadiran");
    }
  };

  const handleReset = () => {
    setAnakId("");
    setTerapisId("");
    setJenisTerapi("");
    setPeriode(DEFAULT_PERIODE);
    setPeriodeValues(DEFAULT_PERIODE_VALUES);
  };

  const rekapInputClass =
    "w-full px-4 py-2.5 bg-white border border-teal-100 rounded-xl text-sm text-gray-700 font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]";

  return (
    <div className="bg-white rounded-2xl border border-teal-50 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <div className="w-2 h-2 rounded-full bg-[#2B7A75]" />
        <h3 className="text-sm font-extrabold text-[#1E5C58]">
          Export Rekap Kehadiran
        </h3>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <p className="mb-3 text-xs font-extrabold tracking-wider text-gray-400 uppercase">
            Filter Data
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">
                Anak / Pasien
              </label>
              <select
                value={anakId}
                onChange={(e) => setAnakId(e.target.value)}
                className={rekapInputClass}
              >
                <option value="">Semua Anak</option>
                {childrenList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">
                Terapis
              </label>
              <select
                value={terapisId}
                onChange={(e) => setTerapisId(e.target.value)}
                className={rekapInputClass}
              >
                <option value="">Semua Terapis</option>
                {therapistsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">
                Jenis Terapi
              </label>
              <select
                value={jenisTerapi}
                onChange={(e) => setJenisTerapi(e.target.value)}
                className={rekapInputClass}
              >
                <option value="">Semua Jenis Terapi</option>
                <option value="okupasi">Terapi Okupasi</option>
                <option value="fisio">Fisioterapi</option>
                <option value="wicara">Terapi Wicara</option>
                <option value="paedagog">PLB (Paedagog)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-extrabold tracking-wider text-gray-400 uppercase">
            Periode Laporan
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex p-1 bg-[#F4F9F8] border border-teal-50 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
              {PERIODE_OPTIONS.map((opt) => {
                const isActive = periode === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPeriode(opt)}
                    className={`cursor-pointer flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-[#1E5C58] text-white font-bold shadow-sm"
                        : "text-gray-400 font-semibold hover:text-[#2B7A75]"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="flex-1">
              {periode === "Harian" && (
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-gray-500">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={periodeValues.hari}
                    onChange={(e) =>
                      setPeriodeValues((prev) => ({
                        ...prev,
                        hari: e.target.value,
                      }))
                    }
                    className={`${rekapInputClass} cursor-pointer`}
                  />
                </div>
              )}
              {periode === "Bulanan" && (
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-gray-500">
                    Bulan
                  </label>
                  <input
                    type="month"
                    value={periodeValues.bulan}
                    onChange={(e) =>
                      setPeriodeValues((prev) => ({
                        ...prev,
                        bulan: e.target.value,
                      }))
                    }
                    className={`${rekapInputClass} cursor-pointer`}
                  />
                </div>
              )}
              {periode === "Custom" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-gray-500">
                      Dari Tanggal
                    </label>
                    <input
                      type="date"
                      value={periodeValues.dari}
                      onChange={(e) =>
                        setPeriodeValues((prev) => ({
                          ...prev,
                          dari: e.target.value,
                        }))
                      }
                      className={`${rekapInputClass} cursor-pointer`}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-gray-500">
                      Sampai Tanggal
                    </label>
                    <input
                      type="date"
                      value={periodeValues.sampai}
                      min={periodeValues.dari || undefined}
                      onChange={(e) =>
                        setPeriodeValues((prev) => ({
                          ...prev,
                          sampai: e.target.value,
                        }))
                      }
                      className={`${rekapInputClass} cursor-pointer`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Table (First 10 rows) */}
        <div className="pt-2 border-t border-teal-50/80">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold tracking-wider text-gray-400 uppercase flex items-center gap-2">
              <span>Preview Data Laporan</span>
              <span className="px-2 py-0.5 text-[10px] text-[#1E5C58] bg-teal-50 border border-teal-100 rounded-md font-bold lowercase">
                (maks 10 baris pertama)
              </span>
            </p>
            <span className="text-xs font-semibold text-gray-500">
              Total terfilter: <b className="text-[#1E5C58]">{totalFiltered}</b> sesi
            </span>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl bg-gray-50/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F4F9F8] text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                  <th className="py-3 px-4">No. RM & Nama Anak</th>
                  <th className="py-3 px-4">Tanggal & Jam</th>
                  <th className="py-3 px-4">Terapi & Terapis</th>
                  <th className="py-3 px-4 text-center">Status Presensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {loadingPreview ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">
                      Memuat preview data...
                    </td>
                  </tr>
                ) : previewItems.length > 0 ? (
                  previewItems.map((item) => {
                    const uiStatus = mapBackendStatusToUi(item.status);
                    return (
                      <tr key={item.id} className="hover:bg-white transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800">{item.child_name}</div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            No. RM: {item.medical_record_number || "-"}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-600">
                          <div>{item.session_date}</div>
                          <div className="text-[11px] text-gray-400 font-normal">
                            {item.start_time} - {item.end_time}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1E5C58]">
                            {formatTherapyType(item.therapy_type)}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {item.therapist_name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={uiStatus} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">
                      Tidak ada data sesi terapi sesuai filter di atas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-red-600 transition-colors cursor-pointer hover:text-red-700"
        >
          Reset Filter
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleExportClick("excel")}
            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#2B7A75] rounded-xl shadow-sm hover:bg-[#1E5C58] active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" strokeWidth={2.5} />
            Export Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => handleExportClick("pdf")}
            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#1E5C58] bg-white border border-teal-100 rounded-xl shadow-sm hover:bg-teal-50 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" strokeWidth={2.5} />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGE UTAMA ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function PresensiPage() {
  const [activeTab, setActiveTab] = useState("Presensi");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Today Presensi Data
  const [presensiItems, setPresensiItems] = useState<PresensiData[]>([]);
  const [presensiMeta, setPresensiMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  // Reschedule Data
  const [rescheduleItems, setRescheduleItems] = useState<RescheduleItem[]>([]);
  const [rescheduleMeta, setRescheduleMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [pageSize, setPageSize] = useState(10);
  const [presensiPage, setPresensiPage] = useState(1);
  const [reschedulePage, setReschedulePage] = useState(1);
  const [therapistsList, setTherapistsList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadTherapists() {
      const res = await getTherapists();
      if (Array.isArray(res)) {
        setTherapistsList(
          res.map((t: any) => ({
            id: t.id,
            name: t.therapist_name,
          }))
        );
      }
    }
    loadTherapists();
  }, []);

  // Modals Target
  const [detailTarget, setDetailTarget] = useState<PresensiDetailData | null>(
    null
  );
  const [presensiTarget, setPresensiTarget] =
    useState<PresensiManualTarget | null>(null);
  const [presensiInitialValues, setPresensiInitialValues] = useState<
    PresensiManualInitialValues | undefined
  >(undefined);
  const [presensiMode, setPresensiMode] = useState<"create" | "edit">("create");
  const [activeSession, setActiveSession] =
    useState<SessionAttendanceItem | null>(null);
  const [qrModalData, setQrModalData] = useState<{
    sessionId: string;
    childName: string;
    medicalRecordNumber: string;
    therapyType: string;
    therapistName: string;
    sessionDate: string;
    sessionTime: string;
    attendanceToken: string;
  } | null>(null);

  // Camera / Scan State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [scanHistory, setScanHistory] = useState<
    { code: string; time: string; patient?: string }[]
  >([]);

  // Fetch Today Sessions from API
  const fetchTodaySessions = async () => {
    setLoading(true);
    try {
      const res = await getTodaySessions({
        date: selectedDate || undefined,
        search: searchTerm || undefined,
        page: presensiPage,
        per_page: pageSize,
      });

      const mapped = (res.items || []).map(mapSessionToPresensiData);
      setPresensiItems(mapped);
      setPresensiMeta(res.meta);
    } catch (err: any) {
      handleApiError(err, "Gagal mengambil data presensi hari ini");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Rescheduled Sessions from API
  const fetchReschedules = async () => {
    setLoading(true);
    try {
      const res = await getRescheduledSessions({
        search: searchTerm || undefined,
        page: reschedulePage,
        per_page: pageSize,
      });

      setRescheduleItems(res.items || []);
      setRescheduleMeta(res.meta);
    } catch (err: any) {
      handleApiError(err, "Gagal mengambil data reschedule");
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 when filter date or search changes
  useEffect(() => {
    setPresensiPage(1);
    setReschedulePage(1);
  }, [selectedDate, searchTerm]);

  useEffect(() => {
    if (activeTab === "Presensi") {
      fetchTodaySessions();
    } else if (activeTab === "Reschedule") {
      fetchReschedules();
    }
  }, [activeTab, selectedDate, searchTerm, presensiPage, reschedulePage, pageSize]);

  const tabs = [
    { id: "Presensi", label: "Presensi", icon: CheckCircle2 },
    { id: "Scan Barcode", label: "Scan Barcode / QR", icon: Activity },
    { id: "Reschedule", label: "Reschedule", icon: Calendar },
    { id: "Rekap Kehadiran", label: "Rekap Kehadiran", icon: CalendarDays },
  ];

  const handleMulai = (item: PresensiData) => {
    setPresensiMode("create");
    setActiveSession(item.rawSession || null);
    setPresensiInitialValues(undefined);
    setPresensiTarget({
      id: item.id,
      pasienName: item.pasienName,
      terapisName: item.terapisName,
      tanggal: item.tanggal,
      waktu: item.waktu,
      therapyType: item.rawSession?.therapy_type,
    });
  };

  const handleEdit = (item: PresensiData) => {
    setPresensiMode("edit");
    setActiveSession(item.rawSession || null);
    setPresensiInitialValues({
      status: item.status === "Belum Presensi" ? undefined : item.status,
      keterangan: item.keterangan === "-" ? "" : item.keterangan,
      reschedule: Boolean(item.reschedule),
    });
    setPresensiTarget({
      id: item.id,
      pasienName: item.pasienName,
      terapisName: item.terapisName,
      tanggal: item.tanggal,
      waktu: item.waktu,
      therapyType: item.rawSession?.therapy_type,
    });
  };

  const handleDetail = (item: PresensiData) => {
    setDetailTarget({
      id: item.id,
      pasienName: item.pasienName,
      waliName: item.waliName,
      tanggal: item.tanggal,
      waktu: item.waktu,
      terapisName: item.terapisName,
      tipeTermi: item.tipeTermi,
      status: item.status,
      keterangan: item.keterangan,
      reschedule: item.reschedule,
    });
  };

  const handleShowQr = async (item: PresensiData) => {
    const raw = item.rawSession;

    try {
      const qrRes = await getSessionQr(item.id);
      const token = qrRes?.attendance_token || raw?.attendance_token || item.id;

      if (raw) {
        raw.attendance_token = token;
      }

      setQrModalData({
        sessionId: item.id,
        childName: item.pasienName,
        medicalRecordNumber: raw?.medical_record_number || "RM-N/A",
        therapyType: item.tipeTermi,
        therapistName: item.terapisName,
        sessionDate: item.tanggal,
        sessionTime: item.waktu,
        attendanceToken: token,
      });
    } catch (err: any) {
      handleApiError(err, "Gagal mengambil QR token dari server");
    }
  };

  const handleSavePresensi = async (payload: PresensiManualPayload) => {
    try {
      const backendStatus = mapUiStatusToBackend(payload.status);

      if (presensiMode === "edit") {
        await updateAttendance(payload.id, {
          status: backendStatus,
          notes: payload.keterangan,
        });
      } else {
        await markAttendance(payload.id, {
          status: backendStatus,
          notes: payload.keterangan,
        });
      }

      if (payload.reschedule && payload.tanggalBaru) {
        await createReschedule(payload.id, {
          new_date: payload.tanggalBaru,
          new_therapist_id: payload.terapisBaruId || undefined,
          reason: payload.keterangan || "Di-reschedule saat presensi",
          requested_by: "guardian",
        });
        showSuccessToast(
          "Presensi dan Reschedule berhasil disimpan!",
          "Berhasil"
        );
      } else {
        showSuccessToast("Presensi berhasil disimpan!", "Berhasil");
      }

      setPresensiTarget(null);
      fetchTodaySessions();
    } catch (err: any) {
      handleApiError(err, "Gagal menyimpan presensi");
    }
  };

  // Camera / QR Code Scan Handler
  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Browser ini tidak mendukung akses kamera.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setCameraError(
        "Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan."
      );
      setIsCameraActive(false);
    }
  };

  const handleProcessScanCode = async (code: string) => {
    if (!code.trim()) return;

    try {
      const res = await scanQrAttendance(code.trim());
      const childName = res.data?.child_name || "Pasien";

      showSuccessToast(`Presensi berhasil dicatat untuk ${childName}!`, "Scan Berhasil");
      setScanHistory((history) => [
        {
          code: code.trim(),
          patient: childName,
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...history,
      ]);
      fetchTodaySessions();
    } catch (err: any) {
      handleApiError(err, "Gagal memproses QR Code presensi");
    }
  };

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = cameraVideoRef.current;
    const stream = cameraStreamRef.current;
    if (!isCameraActive || !video || !stream) return;

    video.srcObject = stream;
    void video.play();
  }, [isCameraActive]);

  useEffect(() => {
    if (!isCameraActive || !cameraVideoRef.current) return;

    const BarcodeDetectorClass = (
      window as Window & {
        BarcodeDetector?: new (options?: { formats: string[] }) => {
          detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
        };
      }
    ).BarcodeDetector;

    if (!BarcodeDetectorClass) return;

    const detector = new BarcodeDetectorClass({
      formats: ["code_128", "code_39", "ean_13", "qr_code"],
    });
    let cancelled = false;

    const detect = async () => {
      if (cancelled || !cameraVideoRef.current) return;
      try {
        const results = await detector.detect(cameraVideoRef.current);
        const code = results[0]?.rawValue;
        if (code) {
          stopCamera();
          handleProcessScanCode(code);
          return;
        }
      } catch {
        // frame retry
      }
      if (!cancelled) window.requestAnimationFrame(detect);
    };

    window.requestAnimationFrame(detect);
    return () => {
      cancelled = true;
    };
  }, [isCameraActive]);

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
      <div className="flex flex-col flex-1 w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-[#2B7A75]" strokeWidth={2.5} />
              Manajemen Kehadiran
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola data seluruh pasien untuk catatan kehadiran maupun pergantian jadwal.
            </p>
          </div>

          <button
            onClick={() =>
              activeTab === "Presensi"
                ? fetchTodaySessions()
                : fetchReschedules()
            }
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#1E5C58] bg-white border border-teal-100 rounded-xl hover:bg-teal-50 transition-colors shadow-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="p-2 mb-6 bg-white border shadow-sm rounded-2xl border-teal-50">
          <div className="flex w-full bg-[#F4F9F8] rounded-xl p-1.5 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 flex items-center justify-center gap-2 whitespace-nowrap px-4 sm:px-6 py-3 rounded-lg text-sm cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "text-white font-bold"
                      : "text-gray-400 hover:text-[#2B7A75] font-semibold hover:bg-white/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-[#1E5C58] rounded-lg shadow-sm border border-teal-50/50"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 w-4 h-4 ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col flex-1 w-full gap-6"
          >
            {/* ── TAB: PRESENSI ── */}
            {activeTab === "Presensi" && (
              <>
                <div className="flex flex-col gap-4 p-4 bg-white border border-teal-50 rounded-2xl sm:flex-row sm:items-end">
                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-gray-500">
                      Tanggal Presensi
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2.5 mt-1.5 bg-white border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all shadow-sm text-gray-700 font-medium cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari anak atau terapis..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all shadow-sm text-gray-700"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-teal-50 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-[#1E5C58]" />
                    <h3 className="text-sm font-extrabold text-[#1E5C58]">
                      Presensi Terapi ({selectedDate})
                    </h3>
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-[#F4F9F8] border-b border-teal-50">
                          <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Informasi Pasien
                          </th>
                          <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Jadwal Terapi
                          </th>
                          <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Terapis
                          </th>
                          <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Tipe Terapi
                          </th>
                          <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Status
                          </th>
                          <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Keterangan
                          </th>
                          <th className="py-3 px-6 text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wider text-center">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {loading ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-10 text-sm text-center text-gray-400"
                            >
                              Memuat data presensi...
                            </td>
                          </tr>
                        ) : presensiItems.length > 0 ? (
                          presensiItems.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-[#F4F9F8]/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-800 text-sm mb-1.5">
                                  {item.pasienName}
                                </div>
                                <div className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 rounded-md text-[10px] font-bold border border-orange-200">
                                  Wali: {item.waliName}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="flex items-center gap-1.5 text-gray-800 font-bold mb-1">
                                  <Calendar
                                    className="w-4 h-4 text-[#A2E4D3]"
                                    strokeWidth={2.5}
                                  />{" "}
                                  {item.tanggal}
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                  <Clock className="w-3.5 h-3.5" /> {item.waktu}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-[#1E5C58]">
                                  <User
                                    className="w-4 h-4 text-[#2B7A75]"
                                    strokeWidth={2.5}
                                  />{" "}
                                  {item.terapisName}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-block px-2.5 py-1 bg-teal-50 text-[#1E5C58] rounded-md text-[11px] font-bold border border-teal-100">
                                  {item.tipeTermi}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={item.status} />
                              </td>
                              <td className="py-4 px-6 text-xs font-medium text-gray-500 max-w-[180px] leading-relaxed">
                                {item.keterangan}
                              </td>
                              <ActionDropdown
                                item={item}
                                openDropdownId={openDropdownId}
                                setOpenDropdownId={setOpenDropdownId}
                                onMulai={handleMulai}
                                onEdit={handleEdit}
                                onDetail={handleDetail}
                                onShowQr={handleShowQr}
                              />
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-10 text-sm text-center text-gray-400"
                            >
                              Tidak ada data presensi untuk tanggal ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 space-y-3 md:hidden">
                    {presensiItems.map((item) => (
                      <MobilePresensiCard
                        key={item.id}
                        item={item}
                        onMulai={handleMulai}
                        onEdit={handleEdit}
                        onDetail={handleDetail}
                      />
                    ))}
                    {presensiItems.length === 0 && (
                      <p className="py-8 text-sm text-center text-gray-400">
                        Tidak ada data presensi.
                      </p>
                    )}
                  </div>

                  <PaginationFooter
                    totalItems={presensiMeta.total}
                    currentPage={presensiPage}
                    pageSize={pageSize}
                    onPageChange={setPresensiPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </>
            )}

            {/* ── TAB: RESCHEDULE ── */}
            {activeTab === "Reschedule" && (
              <>
                <div className="flex flex-col gap-4 p-4 bg-white border border-teal-50 rounded-2xl sm:flex-row sm:items-end">
                  <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari anak atau terapis..."
                      className="w-full py-2.5 pl-10 pr-4 text-sm text-gray-700 transition-all bg-white border border-teal-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-teal-50 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                      <h3 className="text-sm font-extrabold text-[#1E5C58]">
                        Jadwal yang Dialihkan (Reschedule)
                      </h3>
                      <span className="px-2 py-1 text-[10px] font-bold text-[#1E5C58] bg-teal-50 rounded-full">
                        {rescheduleMeta.total} jadwal
                      </span>
                    </div>
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-[#F4F9F8] border-b border-teal-50">
                          <th className="py-3 px-6 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Pasien
                          </th>
                          <th className="py-3 px-6 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Jadwal Semula
                          </th>
                          <th className="py-3 px-6 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Jadwal Baru
                          </th>
                          <th className="py-3 px-6 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                            Pemohon & Alasan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {loading ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-10 text-sm text-center text-gray-400"
                            >
                              Memuat data reschedule...
                            </td>
                          </tr>
                        ) : rescheduleItems.length > 0 ? (
                          rescheduleItems.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-[#F4F9F8]/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-800 text-sm mb-1.5">
                                  {item.child_name}
                                </div>
                                <div className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 rounded-md text-[10px] font-bold border border-orange-200">
                                  RM: {item.medical_record_number}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="flex items-center gap-1.5 text-gray-800 font-bold mb-1">
                                  <Calendar
                                    className="w-4 h-4 text-[#A2E4D3]"
                                    strokeWidth={2.5}
                                  />{" "}
                                  {item.original_session?.session_date}
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                  <User className="w-3.5 h-3.5" />{" "}
                                  {item.original_session?.therapist_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="inline-block px-3 py-2 bg-emerald-50 rounded-xl">
                                  <div className="flex items-center gap-1.5 text-[#1E5C58] font-bold mb-1">
                                    <Calendar
                                      className="w-3.5 h-3.5 text-[#2B7A75]"
                                      strokeWidth={2.5}
                                    />{" "}
                                    {item.new_session?.session_date}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-400 font-medium text-xs">
                                    <User className="w-3.5 h-3.5" />{" "}
                                    {item.new_session?.therapist_name}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-xs font-medium text-gray-500 max-w-[240px] leading-relaxed">
                                <div className="font-bold text-[#1E5C58] mb-1 capitalize">
                                  Oleh: {item.requested_by}
                                </div>
                                <div>{item.reason || "-"}</div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-10 text-sm text-center text-gray-400"
                            >
                              Tidak ada data reschedule.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 space-y-3 md:hidden">
                    {rescheduleItems.map((item) => (
                      <MobileRescheduleCard key={item.id} item={item} />
                    ))}
                    {rescheduleItems.length === 0 && (
                      <p className="py-8 text-sm text-center text-gray-400">
                        Tidak ada jadwal reschedule.
                      </p>
                    )}
                  </div>

                  <PaginationFooter
                    totalItems={rescheduleMeta.total}
                    currentPage={reschedulePage}
                    pageSize={pageSize}
                    onPageChange={setReschedulePage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </>
            )}

            {/* ── TAB: REKAP KEHADIRAN ── */}
            {activeTab === "Rekap Kehadiran" && <RekapKehadiran />}

            {/* ── TAB: SCAN BARCODE / QR ── */}
            {activeTab === "Scan Barcode" && (
              <div className="grid items-stretch grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="overflow-hidden bg-white border border-teal-50 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-[#1E5C58]">
                      <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                      Scan Barcode / QR Code Presensi
                    </div>
                    <button
                      type="button"
                      onClick={isCameraActive ? stopCamera : startCamera}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {isCameraActive ? "Matikan Kamera" : "Mulai Kamera"}
                    </button>
                  </div>

                  <div className="relative m-6 flex min-h-[250px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#2B7A75] bg-[#F4F9F8]/60 px-5 py-6 text-center">
                    <div
                      className={`relative z-10 flex flex-col items-center ${
                        isCameraActive
                          ? "px-6 py-5 bg-white/85 rounded-2xl backdrop-blur-sm"
                          : ""
                      }`}
                    >
                      {isCameraActive ? (
                        <Camera
                          className="w-9 h-9 mb-5 text-[#1E5C58]"
                          strokeWidth={1.8}
                        />
                      ) : (
                        <ScanLine
                          className="w-9 h-9 mb-5 text-[#1E5C58]"
                          strokeWidth={1.8}
                        />
                      )}
                      <h3 className="text-base font-extrabold text-[#1E5C58]">
                        {isCameraActive
                          ? "Arahkan Barcode / QR Code ke kamera"
                          : "Scan Barcode / QR Code Kartu Pasien"}
                      </h3>
                      <p className="max-w-sm mt-2 text-sm font-medium leading-relaxed text-gray-400">
                        {isCameraActive
                          ? "Pastikan kode terlihat jelas di dalam kamera."
                          : "Klik tombol di bawah untuk mengaktifkan kamera."}
                      </p>

                      {isCameraActive && (
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="inline-flex items-center justify-center mt-5 text-white transition-colors bg-red-500 rounded-full shadow-sm w-11 h-11 hover:bg-red-600 cursor-pointer"
                        >
                          <X className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                      )}

                      {!isCameraActive && (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="inline-flex items-center gap-2 px-4 py-2.5 mt-5 text-sm font-bold text-white bg-[#2B7A75] rounded-xl shadow-sm hover:bg-[#1E5C58] transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          Buka Kamera Scan
                        </button>
                      )}

                      {cameraError && (
                        <p className="max-w-sm mt-3 text-xs font-semibold text-red-500">
                          {cameraError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Manual Token Input (QA / Testing / Simulation) */}
                  <div className="mx-6 mb-6 p-4 bg-teal-50/40 border border-teal-100 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="manual-token-input" className="text-xs font-extrabold text-[#1E5C58] flex items-center gap-1.5">
                        <ScanLine className="w-3.5 h-3.5" />
                        Simulasi Scan QR / Manual Token Input (QA Testing)
                      </label>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
                        Dev / QA Helper
                      </span>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const inputEl = e.currentTarget.elements.namedItem("manualToken") as HTMLInputElement;
                        if (inputEl && inputEl.value.trim()) {
                          handleProcessScanCode(inputEl.value.trim());
                          inputEl.value = "";
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        id="manual-token-input"
                        name="manualToken"
                        type="text"
                        placeholder="Paste Token QR (contoh: salin dari modal QR)..."
                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#2B7A75] focus:ring-1 focus:ring-[#2B7A75] bg-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-white bg-[#1E5C58] hover:bg-[#2B7A75] rounded-xl transition-colors cursor-pointer flex-none flex items-center gap-1"
                      >
                        Submit Scan
                      </button>
                    </form>
                  </div>
                </div>

                <div className="overflow-hidden bg-white border border-teal-50 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                    <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                    <h3 className="text-sm font-extrabold text-[#1E5C58]">
                      Petunjuk Presensi QR Code
                    </h3>
                  </div>
                  <div className="p-5">
                    <p className="mb-4 text-sm font-medium leading-relaxed text-gray-500">
                      Terapis dapat melakukan scan pada QR Code kartu sesi
                      pasien untuk secara otomatis mencatat kehadiran (Hadir).
                    </p>
                    <div className="space-y-3">
                      {[
                        "Buka kamera dengan menekan tombol Buka Kamera Scan.",
                        "Arahkan kamera ke QR Code milik sesi pasien.",
                        "Sistem akan memverifikasi token dan mengubah status menjadi Hadir.",
                        "Waktu kedatangan aktual (Check-in) akan otomatis tercatat.",
                      ].map((step, index) => (
                        <div key={step} className="flex items-start gap-3">
                          <span className="flex items-center justify-center flex-none w-7 h-7 text-xs font-extrabold text-white bg-[#2B7A75] rounded-full">
                            {index + 1}
                          </span>
                          <p className="pt-1 text-sm font-medium leading-relaxed text-gray-600">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Camera Modal Overlay */}
                {isCameraActive &&
                  typeof document !== "undefined" &&
                  createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/55">
                      <div className="relative w-full max-w-[560px] overflow-hidden bg-white rounded-3xl shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                          <h2 className="text-base font-extrabold text-[#1E5C58]">
                            Scan QR Code Presensi
                          </h2>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="inline-flex items-center justify-center w-9 h-9 text-[#8EA2BE] rounded-full hover:bg-gray-100 hover:text-[#30445F] transition-colors cursor-pointer"
                          >
                            <X className="w-6 h-6" strokeWidth={2} />
                          </button>
                        </div>
                        <div className="p-6">
                          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 rounded-xl">
                            <video
                              ref={cameraVideoRef}
                              muted
                              playsInline
                              autoPlay
                              className="absolute inset-0 object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/25" />
                            <div className="absolute top-1/2 left-1/2 w-[48%] max-w-[250px] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                              <span className="absolute top-0 left-0 h-12 border-t-4 border-l-4 border-white w-14 rounded-tl-md" />
                              <span className="absolute top-0 right-0 h-12 border-t-4 border-r-4 border-white w-14 rounded-tr-md" />
                              <span className="absolute bottom-0 left-0 h-12 border-b-4 border-l-4 border-white w-14 rounded-bl-md" />
                              <span className="absolute bottom-0 right-0 h-12 border-b-4 border-r-4 border-white w-14 rounded-br-md" />
                            </div>
                          </div>
                          <p className="mt-5 text-sm font-medium leading-relaxed text-center text-[#7184A0]">
                            Arahkan kamera ke QR Code presensi.
                            <br />
                            Presensi akan otomatis tercatat saat terdeteksi.
                          </p>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}

                {/* Scan History */}
                <div className="overflow-hidden bg-white border border-teal-50 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] lg:col-span-2">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-[#1E5C58]">
                      <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                      Riwayat Scan Hari Ini
                    </div>
                    <span className="px-3 py-1 text-xs font-bold text-[#1E5C58] bg-[#F4F9F8] border border-teal-50 rounded-full">
                      {scanHistory.length} presensi
                    </span>
                  </div>
                  {scanHistory.length === 0 ? (
                    <div className="flex min-h-[150px] items-center justify-center px-8 py-10 text-center">
                      <p className="max-w-sm text-sm font-medium leading-relaxed text-gray-400">
                        Belum ada presensi QR hari ini. Riwayat akan muncul di
                        sini setelah scan berhasil.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {scanHistory.map((scan, index) => (
                        <div
                          key={`${scan.code}-${index}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F4F9F8] rounded-xl"
                        >
                          <div className="flex items-center gap-2 text-sm font-bold text-[#1E5C58]">
                            <ScanLine className="w-4 h-4 text-[#2B7A75]" />
                            {scan.patient} (Token: {scan.code.slice(0, 10)}...)
                          </div>
                          <span className="text-xs font-medium text-gray-400">
                            {scan.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <FormCatatKehadiran
        open={!!presensiTarget}
        onCloseAction={() => setPresensiTarget(null)}
        target={presensiTarget}
        onSaveAction={handleSavePresensi}
        initialValues={presensiInitialValues}
        mode={presensiMode}
        therapistsList={therapistsList}
      />

      {detailTarget && (
        <FormDetailPresensi
          item={detailTarget}
          onCloseAction={() => setDetailTarget(null)}
        />
      )}

      <QrCodeViewerModal
        open={!!qrModalData}
        onClose={() => setQrModalData(null)}
        sessionData={qrModalData}
      />
    </div>
  );
}
