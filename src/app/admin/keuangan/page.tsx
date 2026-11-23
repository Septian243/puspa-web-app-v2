"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Wallet,
  Search,
  Download,
  Plus,
  Calendar,
  ChevronDown,
  Settings,
  ChevronUp,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowLeft,
  Printer,
  X,
  Info,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TabPembayaran, { PotonganData, RiwayatPembayaran } from "@/components/keuangan/TabPembayaran";
import PengembalianDanaModal from "@/components/keuangan/PengembalianDanaModal";

// ── Types ──────────────────────────────────────────────────────────────────────
import {
  getChildrenWithGuardians,
  ChildGuardianItem,
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  payInvoice,
  refundInvoice,
  getAttendanceForRefund,
  getCredits,
  getTransactions,
} from "@/lib/api/keuangan";
import {
  getSchedules,
  getScheduleDetail,
  ScheduleItem,
  ScheduleDetailItem,
} from "@/lib/api/jadwal_terapi";
import { showSuccessToast, showErrorToast, handleApiError } from "@/lib/toast";

type InvoiceStatus =
  | "LUNAS"
  | "BELUM DIBAYAR"
  | "PERIODE BERIKUTNYA"
  | "DIKEMBALIKAN"
  | "BERJALAN";

type InvoiceType = "Bulanan" | "Paket Durasi";

interface Invoice {
  id: string;
  no_invoice: string;
  anak: string;
  wali: string;
  child_id?: string;
  guardian_id?: string;
  tipe: InvoiceType;
  periode: string;
  total: number;
  subtotal?: number;
  tanggal_terbit: string;
  status: InvoiceStatus;
  terapiRows?: TerapiRow[];
  potongan?: number;
  pengembalian?: { tanggal: string; jumlah: number };
  periodeBerikutnya?: { tanggal: string; jumlah: number };
  pembayaran?: { tanggal: string; metode: string; noResi: string; buktiUrl?: string };
}

interface TerapiRow {
  id: string;
  jenis: string;
  jumlah_sesi: number | "";
  harga_sesi: number | "";
}

const JENIS_TERAPI_OPTIONS = [
  "Terapi Wicara",
  "Terapi Okupasi",
  "Fisioterapi",
  "PLB (Paedagog)",
];

const THERAPY_TYPE_LABEL_MAP: Record<string, string> = {
  okupasi: "Terapi Okupasi",
  wicara: "Terapi Wicara",
  fisio: "Fisioterapi",
  paedagog: "PLB (Paedagog)",
};

function normalizeTherapyType(rawType: string): string {
  if (!rawType) return "";
  const lower = rawType.toLowerCase().trim();
  if (THERAPY_TYPE_LABEL_MAP[lower]) return THERAPY_TYPE_LABEL_MAP[lower];
  const matched = JENIS_TERAPI_OPTIONS.find(
    (opt) =>
      opt.toLowerCase() === lower ||
      opt.toLowerCase().includes(lower) ||
      lower.includes(opt.toLowerCase()),
  );
  return matched || rawType;
}

function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2]))
    return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function parseYearMonth(str: string): { year: number; month: number } | null {
  if (!str) return null;
  const trimmed = str.trim();
  const yFirst = trimmed.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yFirst) {
    const year = parseInt(yFirst[1], 10);
    const month = parseInt(yFirst[2], 10);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const mFirst = trimmed.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mFirst) {
    const month = parseInt(mFirst[1], 10);
    const year = parseInt(mFirst[2], 10);
    if (month >= 1 && month <= 12) return { year, month };
  }
  return null;
}

function countDayOccurrences(
  dayOfWeek: number,
  startDateStr: string,
  endDateStr: string,
): number {
  if (!startDateStr || !endDateStr || !dayOfWeek) return 0;
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  if (
    !start ||
    !end ||
    isNaN(start.getTime()) ||
    isNaN(end.getTime()) ||
    start > end
  )
    return 0;

  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const jsDay = current.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    if (isoDay === dayOfWeek) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

// Helper: konversi "30 Nov 2025" → "2025-11-30" (untuk input type="date")
function tanggalToISO(tanggal: string): string {
  if (!tanggal) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return tanggal;
  const monthMap: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", Jun: "06",
    Jul: "07", Agu: "08", Sep: "09", Okt: "10", Nov: "11", Des: "12",
  };
  const parts = tanggal.trim().split(/\s+/);
  if (parts.length === 3) {
    const d = parts[0].padStart(2, "0");
    const m = monthMap[parts[1]] ?? "01";
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  return "";
}

// Helper: konversi "2025-11-30" → "30 Nov 2025" (untuk tampilan & simpan)
function isoToDisplayDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: InvoiceStatus | string }) {
  const norm = (status || "").toUpperCase();
  if (norm === "BELUM DIBAYAR") {
    return (
      <span className="inline-flex items-center text-[11px] text-red-500 font-extrabold">
        Belum Dibayar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] text-emerald-600 font-extrabold">
      Lunas
    </span>
  );
}

function _UnusedStatusBadge({ status }: { status: any }) {
  const config: Record<
    InvoiceStatus,
    { label: string; className: string }
  > = {
    LUNAS: {
      label: "Lunas",
      className: "text-emerald-600 font-extrabold",
    },
    "BELUM DIBAYAR": {
      label: "Belum Dibayar",
      className: "text-red-500 font-extrabold",
    },
    "PERIODE BERIKUTNYA": {
      label: "Periode Berikutnya",
      className: "text-orange-500 font-extrabold leading-tight",
    },
    DIKEMBALIKAN: {
      label: "Dikembalikan",
      className: "text-[#2B7A75] font-extrabold",
    },
    BERJALAN: {
      label: "Selesai",
      className: "text-teal-600 font-extrabold",
    },
  };

  const c = (config as any)[status] || { label: status, className: "text-gray-600 font-extrabold" };
  return (
    <span className={`inline-flex items-center text-[11px] ${c.className}`}>
      <span style={{ whiteSpace: "pre-line" }}>{c.label}</span>
    </span>
  );
}

// ── CONFIRM DIALOG MODAL ──────────────────────────────────────────────────────
function ConfirmDialogModal({
  isOpen,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="confirm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-2xl shadow-black/20 flex flex-col items-center text-center"
        >
          <div className={`p-3.5 rounded-full mb-4 ${confirmVariant === "danger" ? "bg-red-50 text-red-500" : "bg-teal-50 text-[#1E5C58]"}`}>
            <AlertCircle size={28} />
          </div>
          <h3 className="mb-2 text-base font-extrabold text-gray-900">{title}</h3>
          <p className="mb-6 text-xs font-medium leading-relaxed text-gray-500">{message}</p>

          <div className="flex items-center w-full gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              id="btn-confirm-action"
              className={`cursor-pointer flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-colors ${confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700 shadow-red-700/20"
                : "bg-[#1E5C58] hover:bg-[#174d49] shadow-teal-700/20"
                }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── BUKTI TRANSFER MODAL ──────────────────────────────────────────────────────
function BuktiTransferModal({
  buktiUrl,
  onClose,
}: {
  buktiUrl: string;
  onClose: () => void;
}) {
  // Derive storage base URL dari API base URL agar konsisten
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  const storageBase =
    process.env.NEXT_PUBLIC_STORAGE_URL ||
    apiBase.replace(/\/api\/v\d+\/?$/, "").replace(/\/api\/?$/, "") + "/storage";

  // Hitung fullUrl dengan toleran terhadap berbagai format path dari backend:
  // - Sudah full URL: "http://..." → pakai langsung
  // - Sudah ada "/storage/": "/storage/payments/xxx.jpg" → tambah host saja
  // - Path relatif: "payments/xxx.jpg" → tambah storageBase
  let fullUrl: string;
  if (buktiUrl.startsWith("http://") || buktiUrl.startsWith("https://")) {
    fullUrl = buktiUrl;
  } else if (buktiUrl.startsWith("/storage/") || buktiUrl.startsWith("storage/")) {
    const host = storageBase.replace(/\/storage\/?$/, "");
    fullUrl = `${host}/${buktiUrl.replace(/^\//, "")}`;
  } else {
    fullUrl = `${storageBase}/${buktiUrl.replace(/^\//, "")}`;
  }

  const isPdf = fullUrl.toLowerCase().endsWith(".pdf");
  const [imgError, setImgError] = useState(false);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="bukti-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[350] flex items-center justify-center p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[560px] max-h-[85vh] rounded-2xl bg-white shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#2B7A75]" />
              <h2 className="text-base font-extrabold text-[#1E5C58]">Bukti Transfer / Pembayaran</h2>
            </div>
            <button onClick={onClose} className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center bg-gray-50 min-h-[300px]">
            {isPdf ? (
              <iframe src={fullUrl} className="w-full h-[450px] rounded-xl border border-gray-200" title="Bukti Transfer PDF" />
            ) : imgError ? (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <AlertCircle size={36} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">Gagal memuat gambar bukti transfer.</p>
                <p className="text-xs text-gray-400 break-all max-w-xs">{fullUrl}</p>
                <a href={fullUrl} target="_blank" rel="noreferrer"
                  className="mt-1 text-xs font-bold text-blue-600 underline hover:text-blue-800">
                  Coba buka langsung di tab baru →
                </a>
              </div>
            ) : (
              <img src={fullUrl} alt="Bukti Transfer" onError={() => setImgError(true)} className="max-w-full max-h-[450px] object-contain rounded-xl shadow-sm border border-gray-200" />
            )}
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer flex-1 py-2.5 bg-[#1E5C58] text-white rounded-xl text-xs font-bold hover:bg-[#174d49] text-center shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              Buka di Tab Baru
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── Pengembalian Dana Modal ───────────────────────────────────────────────────
function _OldPengembalianDanaModal({
  invoice,
  lunasInvoices,
  onClose,
  onSave,
  onRefresh,
}: {
  invoice: Invoice;
  lunasInvoices: Invoice[];
  onClose: () => void;
  onSave?: (
    invoiceId: string,
    mode: "dikembalikan" | "catat",
    data: {
      tanggal: string;
      jumlah: number;
      metode?: string;
      noResi?: string;
      bukti?: string;
    }
  ) => void;
  onRefresh: () => void;
}) {
  const [selectedInvId, setSelectedInvId] = useState(invoice.id);
  const selectedInv = lunasInvoices.find((i) => i.id === selectedInvId) ?? invoice;

  const [totalSesi, setTotalSesi] = useState(8);
  const [kehadiran, setKehadiran] = useState(8);
  const [hargaPerSesi, setHargaPerSesi] = useState(selectedInv.total / 8);

  const [modeSisi, setModeSisi] = useState<"dikembalikan" | "catat">("dikembalikan");
  const sisaSesi = Math.max(0, totalSesi - kehadiran);
  const nilaiSisaSesi = sisaSesi * hargaPerSesi;

  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(todayStr);
  const [metodePengembalian, setMetodePengembalian] = useState("Transfer bank");
  const [noResi, setNoResi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("Tidak ada File yang dipilih");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Attendance count from backend
  useEffect(() => {
    const fetchAttendance = async () => {
      const data = await getAttendanceForRefund(selectedInvId);
      if (data) {
        setTotalSesi(data.total_sessions || 8);
        setKehadiran(data.present_sessions || 8);
        setHargaPerSesi(data.harga_per_sesi || (selectedInv.total / 8));
      } else {
        const rows = selectedInv.terapiRows || [];
        const sumSessions = rows.reduce((sum, r) => sum + (Number(r.jumlah_sesi) || 0), 0) || 8;
        setTotalSesi(sumSessions);
        setKehadiran(sumSessions);
        setHargaPerSesi(selectedInv.total / sumSessions);
      }
    };
    fetchAttendance();
  }, [selectedInvId]);

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("mode", modeSisi);
      formData.append("kehadiran", kehadiran.toString());
      formData.append("total_sesi", totalSesi.toString());
      formData.append("tanggal", tanggal);
      formData.append("metode_pengembalian", metodePengembalian);
      if (noResi) formData.append("no_resi", noResi);
      if (file) formData.append("bukti_file", file);

      await refundInvoice(selectedInvId, formData);
      showSuccessToast(
        modeSisi === "dikembalikan"
          ? "Pengembalian dana berhasil dicatat!"
          : "Sisa sesi berhasil dicatat ke periode berikutnya!",
        "Berhasil"
      );
      onRefresh();
      onClose();
    } catch (e) {
      handleApiError(e, "Gagal memproses pengembalian dana");
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all";
  const selectCls =
    "w-full pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer appearance-none";

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[460px] max-h-full rounded-2xl bg-white shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-extrabold text-[#1E5C58]">Pengembalian dana</h2>
            <button onClick={onClose} className="cursor-pointer text-sm font-bold text-[#2B7A75] hover:text-[#1E5C58] transition-colors">
              Tutup
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">
                Tagihan (sudah dibayar)
              </label>
              <div className="relative">
                <select
                  id="pengembalian-select-invoice"
                  value={selectedInvId}
                  onChange={(e) => setSelectedInvId(e.target.value)}
                  className={selectCls}
                >
                  {lunasInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.no_invoice} – {inv.anak}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2" />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Kehadiran selama periode</p>
              <div className="flex items-center gap-3">
                <span className="flex-1 text-sm font-semibold text-gray-700">Total Kehadiran</span>
                <input
                  id="pengembalian-kehadiran"
                  type="number"
                  min={0}
                  max={totalSesi}
                  value={kehadiran}
                  onChange={(e) => setKehadiran(Math.min(totalSesi, Math.max(0, Number(e.target.value))))}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]"
                />
                <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                  sesi
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-500">
                  Nilai sisa sesi (Rp)
                </label>
                <input
                  id="pengembalian-nilai-sisa"
                  type="number"
                  readOnly
                  value={nilaiSisaSesi}
                  className={`${inputCls} bg-gray-50 text-gray-500 cursor-default`}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-500">Tanggal</label>
                <input
                  id="pengembalian-tanggal"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                />
              </div>
            </div>

            <div>

              <div className="flex overflow-hidden border border-gray-200 rounded-xl">
                <button
                  id="mode-dikembalikan"
                  type="button"
                  onClick={() => setModeSisi("dikembalikan")}
                  className={`flex-1 px-3 py-2.5 text-xs font-bold transition-all ${modeSisi === "dikembalikan" ? "bg-[#1E5C58] text-white shadow-sm" : "bg-[#F4F9F8] text-gray-500 hover:text-[#2B7A75]"
                    }`}
                >
                  Dikembalikan ke orang tua
                </button>
                <button
                  id="mode-catat"
                  type="button"
                  onClick={() => setModeSisi("catat")}
                  className={`flex-1 px-3 py-2.5 text-xs font-bold transition-all ${modeSisi === "catat" ? "bg-[#1E5C58] text-white shadow-sm" : "bg-[#F4F9F8] text-gray-500 hover:text-[#2B7A75]"
                    }`}
                >
                  Catat ke periode setelahnya
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {modeSisi === "dikembalikan" ? (
                <motion.div
                  key="dikembalikan"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <p className="text-xs font-medium text-gray-400">
                    Dana dikirim kembali ke orang tua (transfer, tunai, atau QRIS).
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5 text-xs font-bold text-gray-500">Metode pengembalian</label>
                      <div className="relative">
                        <select
                          id="pengembalian-metode"
                          value={metodePengembalian}
                          onChange={(e) => setMetodePengembalian(e.target.value)}
                          className={selectCls}
                        >
                          <option>Transfer bank</option>
                          <option>Tunai</option>
                          <option>QRIS</option>
                        </select>
                        <ChevronDown size={14} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2" />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-bold text-gray-500">No. resi</label>
                      <input
                        id="pengembalian-no-resi"
                        type="text"
                        placeholder="Opsional"
                        value={noResi}
                        onChange={(e) => setNoResi(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-gray-500">
                      Upload bukti pengembalian{" "}
                      <span className="font-normal text-gray-300 normal-case">(bukti transfer / kwitansi, opsional)</span>
                    </label>
                    <div className="flex items-center gap-3 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white">
                      <button
                        id="pengembalian-pilih-file"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer shrink-0 px-4 py-1.5 bg-[#EAF4F3] text-[#1E5C58] text-xs font-bold rounded-lg hover:bg-[#d4ede9] transition-colors"
                      >
                        Pilih File
                      </button>
                      <span className="text-xs font-medium text-gray-400 truncate">{fileName}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { setFile(f); setFileName(f.name); }
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  key="catat"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="text-xs font-medium text-gray-400"
                >
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom CTA */}
          <div className="px-6 pt-4 pb-6 space-y-3 border-t border-gray-100 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                {selectedInv.anak} – {selectedInv.periode}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-extrabold border border-emerald-100">
                Lunas
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-400">Total dibayar</span>
              <span className="font-extrabold text-gray-800">{formatRupiah(selectedInv.total)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-gray-200 border-dashed">
              <span className="text-sm font-extrabold text-[#1E5C58]">Sesi tidak terpakai</span>
              <span className="text-sm font-extrabold text-[#1E5C58]">{sisaSesi} sesi</span>
            </div>

            <button
              id="btn-catat-pengembalian"
              type="button"
              onClick={handleSubmit}
              className="cursor-pointer w-full py-3 bg-[#1E5C58] text-white rounded-xl text-sm font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors"
            >
              {modeSisi === "dikembalikan" ? "Catat pengembalian dana" : "Catat ke periode setelahnya"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── CATAT BAYAR MODAL ─────────────────────────────────────────────────────────
function CatatBayarModal({
  invoice,
  onClose,
  onRefresh,
}: {
  invoice: Invoice;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(todayStr);
  const [metode, setMetode] = useState("Transfer bank");
  const [noResi, setNoResi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("Tidak ada File yang dipilih");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputCls =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all";
  const selectCls =
    "w-full pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer appearance-none";

  const handleSimpan = async () => {
    try {
      const formData = new FormData();
      formData.append("payment_date", tanggal);
      formData.append("payment_method", metode);
      if (noResi) formData.append("receipt_number", noResi);
      if (file) formData.append("bukti_file", file);

      await payInvoice(invoice.id, formData);
      showSuccessToast("Pembayaran berhasil dicatat!", "Berhasil");
      onRefresh();
      onClose();
    } catch (e) {
      handleApiError(e, "Gagal mencatat pembayaran");
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="catat-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[480px] max-h-[90vh] rounded-2xl bg-white shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-extrabold text-[#1E5C58]">Catat pembayaran</h2>
            <button onClick={onClose} className="cursor-pointer text-sm font-bold text-[#2B7A75] hover:text-[#1E5C58] transition-colors">Tutup</button>
          </div>

          <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">Tagihan yang belum dibayar</label>
              <div className="flex items-center justify-between w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium">

                <span className="truncate">{invoice.no_invoice} – {invoice.anak} ({formatRupiah(invoice.total)})</span>

              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="catat-tanggal" className="block mb-1.5 text-xs font-bold text-gray-500">Tanggal dibayar</label>
                <input id="catat-tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={`${inputCls} cursor-pointer`} />
              </div>
              <div>
                <label htmlFor="catat-metode" className="block mb-1.5 text-xs font-bold text-gray-500">Metode bayar</label>
                <div className="relative">
                  <select id="catat-metode" value={metode} onChange={(e) => setMetode(e.target.value)} className={selectCls}>
                    <option>Transfer bank</option>
                    <option>Tunai</option>
                    <option>QRIS</option>
                  </select>
                  <ChevronDown size={14} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="catat-no-resi" className="block mb-1.5 text-xs font-bold text-gray-500">No. resi</label>
              <input id="catat-no-resi" type="text" placeholder="Opsional" value={noResi} onChange={(e) => setNoResi(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">
                Upload bukti pembayaran{" "}
                <span className="font-normal text-gray-300 normal-case">(bukti transfer / kwitansi, opsional)</span>
              </label>
              <div className="flex items-center gap-3 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white">
                <button id="catat-pilih-file" type="button" onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer shrink-0 px-4 py-1.5 bg-[#EAF4F3] text-[#1E5C58] text-xs font-bold rounded-lg hover:bg-[#d4ede9] transition-colors">Pilih File</button>
                <span className="text-xs font-medium text-gray-400 truncate">{fileName}</span>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setFile(f); setFileName(f.name); }
                  }} />
              </div>
            </div>
          </div>

          <div className="px-6 pt-4 pb-6 space-y-3 border-t border-gray-100 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">{invoice.anak} – {invoice.periode}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-extrabold border border-red-100">Belum dibayar</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-400">Wali</span>
              <span className="font-semibold text-gray-700">{invoice.wali}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 border-dashed">
              <span className="text-sm font-extrabold text-[#1E5C58]">Jumlah yang dibayar</span>
              <span className="text-base font-extrabold text-[#1E5C58]">{formatRupiah(invoice.total)}</span>
            </div>
            <button id="btn-simpan-pembayaran" type="button" onClick={handleSimpan}
              className="cursor-pointer w-full py-3 bg-[#1E5C58] text-white rounded-xl text-sm font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors">
              Simpan
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── LIHAT DETAIL MODAL ────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function LihatDetailModal({
  invoice,
  onClose,
  onCetakInvoice,
  onLihatBukti,
}: {
  invoice: Invoice;
  onClose: () => void;
  onCetakInvoice: () => void;
  onUpdate?: (updated: Invoice) => void;
  initialEditMode?: boolean;
  showPaymentEditButtons?: boolean;
  onLihatBukti?: (url: string) => void;
}) {
  const statusLabelMap: Record<InvoiceStatus, string> = {
    LUNAS: "Lunas",
    "BELUM DIBAYAR": "Belum dibayar",
    "PERIODE BERIKUTNYA": "Lunas",
    DIKEMBALIKAN: "Lunas",
    BERJALAN: "Lunas",
  };
  const statusClassMap: Record<InvoiceStatus, string> = {
    LUNAS: "bg-emerald-50 text-emerald-600 border-emerald-100",
    "BELUM DIBAYAR": "bg-red-50 text-red-500 border-red-100",
    "PERIODE BERIKUTNYA": "bg-emerald-50 text-emerald-600 border-emerald-100",
    DIKEMBALIKAN: "bg-emerald-50 text-emerald-600 border-emerald-100",
    BERJALAN: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };
  const sudahDibayar = ["LUNAS", "DIKEMBALIKAN", "PERIODE BERIKUTNYA"].includes(invoice.status) ? invoice.total : 0;
  const rows = invoice.terapiRows ?? [];
  const totalSeharusnya = rows.reduce((sum, r) => sum + (Number(r.jumlah_sesi) || 0) * (Number(r.harga_sesi) || 0), 0);
  const potonganVal = invoice.potongan ?? 0;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[520px] max-h-[90vh] rounded-2xl bg-white shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-extrabold text-[#1E5C58]">Detail tagihan</h2>
            <button onClick={onClose} className="cursor-pointer text-sm font-bold text-[#2B7A75] hover:text-[#1E5C58] transition-colors">Tutup</button>
          </div>

          <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${statusClassMap[invoice.status] || ""}`}>
                  {statusLabelMap[invoice.status] || invoice.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Total tagihan</span>
                <span className="font-extrabold text-gray-800">{formatRupiah(invoice.total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Sudah dibayar</span>
                <span className="font-extrabold text-gray-800">{formatRupiah(sudahDibayar)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-extrabold text-[#1E5C58] mb-2">Riwayat transaksi</p>
              {invoice.pembayaran || invoice.pengembalian || invoice.periodeBerikutnya ? (
                <div className="p-3.5 bg-[#F4F9F8] rounded-xl space-y-3 text-sm">
                  {/* ── Baris Pembayaran ── */}
                  {invoice.pembayaran && (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{invoice.pembayaran.tanggal}</p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">
                            Pembayaran ({invoice.pembayaran.metode})
                            {invoice.pembayaran.noResi ? ` • Resi: ${invoice.pembayaran.noResi}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-teal-600">
                            + {formatRupiah(invoice.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Baris pengembalian dana ── */}
                  {invoice.pengembalian && (
                    <div className="flex items-start justify-between pt-2 border-t border-gray-200/50">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{invoice.pengembalian.tanggal}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Pengembalian dana</p>
                      </div>
                      <span className="text-sm font-extrabold text-red-500 whitespace-nowrap">
                        - {formatRupiah(invoice.pengembalian.jumlah)}
                      </span>
                    </div>
                  )}

                  {/* ── Baris dicatat ke periode berikutnya ── */}
                  {invoice.periodeBerikutnya && (
                    <div className="flex items-start justify-between pt-2 border-t border-gray-200/50">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{invoice.periodeBerikutnya.tanggal}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Dicatat ke periode berikutnya</p>
                      </div>
                      <span className="text-sm font-extrabold text-orange-500 whitespace-nowrap">
                        {formatRupiah(invoice.periodeBerikutnya.jumlah)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm italic font-medium text-gray-400">Belum ada riwayat transaksi.</p>
              )}
            </div>

            {/* Invoice preview */}
            <div>
              <p className="text-sm font-extrabold text-[#1E5C58] mb-3">Invoice</p>
              <div className="overflow-hidden border border-gray-100 shadow-sm rounded-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="p-5 bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div><p className="text-base font-extrabold text-gray-900">Puspa</p><p className="text-[10px] text-gray-400 font-medium">Holistic Integrative Care</p></div>
                    <div className="text-right"><p className="text-lg font-extrabold text-[#1E5C58]">Invoice</p><p className="text-[11px] text-gray-500 font-semibold">{invoice.no_invoice}</p></div>
                  </div>
                  <div className="h-px bg-[#2B7A75] mb-4" />
                  <div className="grid grid-cols-2 mb-4 gap-x-3 gap-y-2">
                    {[{ l: "Ditagihkan kepada", v: invoice.wali }, { l: "Nama anak", v: invoice.anak }, { l: "Periode", v: invoice.periode }, { l: "Tanggal terbit", v: invoice.tanggal_terbit }].map(({ l, v }) => (
                      <div key={l}><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{l}</p><p className="text-xs font-semibold text-gray-800">{v}</p></div>
                    ))}
                  </div>
                  {rows.length > 0 && (
                    <div className="mb-3 overflow-hidden border border-gray-100 rounded-lg">
                      <table className="w-full">
                        <thead><tr className="bg-[#EAF4F3]">
                          {["Terapi", "Jumlah sesi", "Harga", "Jumlah"].map((h, i) => (<th key={h} className={`px-3 py-2 text-[9px] font-extrabold text-[#1E5C58] uppercase ${i === 3 ? "text-right" : "text-left"}`}>{h}</th>))}
                        </tr></thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                              <td className="px-3 py-2 text-[11px] text-gray-700 font-medium">{row.jenis}</td>
                              <td className="px-3 py-2 text-[11px] text-gray-600">{row.jumlah_sesi} sesi</td>
                              <td className="px-3 py-2 text-[11px] text-gray-600">{formatRupiah(Number(row.harga_sesi))}/sesi</td>
                              <td className="px-3 py-2 text-right text-[11px] font-semibold text-gray-800">{formatRupiah((Number(row.jumlah_sesi) || 0) * (Number(row.harga_sesi) || 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="space-y-1 text-xs">
                    {rows.length > 0 && (<><div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold text-gray-700">{formatRupiah(totalSeharusnya || invoice.total)}</span></div><div className="flex justify-between"><span className="text-gray-500">Potongan</span><span className="font-semibold text-gray-700">- {formatRupiah(potonganVal)}</span></div></>)}
                    <div className="h-px bg-[#2B7A75] my-1.5" />
                    <div className="flex items-center justify-between"><span className="text-sm font-extrabold text-gray-800">Total tagihan</span><span className="text-sm font-extrabold text-[#1E5C58]">{formatRupiah(invoice.total)}</span></div>
                    <div className="flex items-center justify-between pt-0.5"><span className="text-gray-500">Status</span><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusClassMap[invoice.status] || ""}`}>{statusLabelMap[invoice.status] || invoice.status}</span></div>
                  </div>
                  <div className="flex items-end justify-between pt-3 mt-3 border-t border-gray-100">
                    <div className="text-[10px] text-gray-400 leading-relaxed"><p>Pembayaran dilakukan di awal periode.</p><p>Rek. BCA 000-000-0000 a.n. Puspa</p></div>
                    <div className="text-right"><div className="w-20 mb-1 border-t border-gray-400" /><p className="text-[10px] text-gray-500 font-semibold">Admin Puspa</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            <button id="btn-cetak-invoice-detail" type="button" onClick={onCetakInvoice}
              className="cursor-pointer w-full py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Printer size={15} />Cetak invoice
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── CETAK INVOICE MODAL ───────────────────────────────────────────────────────
function CetakInvoiceModal({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const rows = invoice.terapiRows ?? [];
  const totalSeharusnya = rows.reduce((sum, r) => sum + (Number(r.jumlah_sesi) || 0) * (Number(r.harga_sesi) || 0), 0);
  const potonganVal = invoice.potongan ?? 0;
  const statusLabelMap: Record<InvoiceStatus, string> = {
    LUNAS: "Lunas",
    "BELUM DIBAYAR": "Belum dibayar",
    "PERIODE BERIKUTNYA": "Lunas",
    DIKEMBALIKAN: "Lunas",
    BERJALAN: "Lunas",
  };
  const statusColorMap: Record<InvoiceStatus, string> = {
    LUNAS: "#059669", "BELUM DIBAYAR": "#ef4444",
    "PERIODE BERIKUTNYA": "#059669", DIKEMBALIKAN: "#059669", BERJALAN: "#059669",
  };

  const handleCetak = () => {
    const statusColor: Record<InvoiceStatus, string> = {
      LUNAS: "#059669",
      "BELUM DIBAYAR": "#ef4444",
      "PERIODE BERIKUTNYA": "#059669",
      DIKEMBALIKAN: "#059669",
      BERJALAN: "#059669",
    };

    // Build line items HTML
    const itemsHtml = rows.map((row) => {
      const subtotal = (Number(row.jumlah_sesi) || 0) * (Number(row.harga_sesi) || 0);
      return `
        <div style="margin-bottom:10px;">
          <div style="font-weight:700;font-size:11px;color:#111;margin-bottom:3px;">${row.jenis}</div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#555;">
            <span>${row.jumlah_sesi} sesi &times; ${formatRupiah(Number(row.harga_sesi))}</span>
            <span style="font-weight:600;color:#222;">${formatRupiah(subtotal)}</span>
          </div>
        </div>`;
    }).join("");

    // Potongan rows (only if exists)
    const potonganHtml = potonganVal > 0 ? `
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
        <span style="color:#888;">Subtotal</span>
        <span style="font-weight:600;">${formatRupiah(totalSeharusnya)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:6px;">
        <span style="color:#888;">Potongan</span>
        <span style="font-weight:600;">- ${formatRupiah(potonganVal)}</span>
      </div>` : "";

    // Payment info (only if exists)
    const pembayaranHtml = invoice.pembayaran ? `
      <hr style="border:none;border-top:1px dashed #ccc;margin:10px 0;" />
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
        <span style="color:#888;">Dibayar</span>
        <span style="font-weight:600;">${invoice.pembayaran.tanggal}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
        <span style="color:#888;">Metode</span>
        <span style="font-weight:600;">${invoice.pembayaran.metode}</span>
      </div>` : "";

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.no_invoice}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 32px 16px;
      min-height: 100vh;
    }
    .receipt {
      background: #fff;
      border: 1.5px dashed #d1d5db;
      border-radius: 12px;
      padding: 28px 24px;
      width: 100%;
      max-width: 360px;
    }
    .header { text-align: center; margin-bottom: 16px; }
    .header .brand { font-size: 18px; font-weight: 900; color: #111; letter-spacing: 0.5px; }
    .header .sub { font-size: 11px; color: #6b7280; margin-top: 3px; }
    .header .rek { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .divider-dash { border: none; border-top: 1px dashed #d1d5db; margin: 12px 0; }
    .divider-solid { border: none; border-top: 1.5px solid #d1d5db; margin: 12px 0; }
    .no-inv { text-align: center; margin-bottom: 4px; }
    .no-inv .label { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    .no-inv .value { font-size: 13px; font-weight: 700; color: #111; margin-top: 3px; }
    .info-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; font-size: 11px; }
    .info-row .lbl { color: #6b7280; }
    .info-row .val { font-weight: 600; color: #111; text-align: right; max-width: 220px; }
    .items { margin-bottom: 4px; }
    .item { margin-bottom: 10px; }
    .item-name { font-size: 11px; font-weight: 700; color: #111; margin-bottom: 3px; }
    .item-detail { display: flex; justify-content: space-between; font-size: 10px; }
    .item-detail .qty { color: #6b7280; }
    .item-detail .amt { font-weight: 600; color: #222; }
    .total-row { display: flex; justify-content: space-between; align-items: center; }
    .total-row .lbl { font-size: 13px; font-weight: 900; color: #111; }
    .total-row .val { font-size: 15px; font-weight: 900; color: #111; }
    .status-row { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; font-size: 11px; }
    .status-row .lbl { color: #6b7280; }
    .footer { text-align: center; }
    .footer p { font-size: 9.5px; color: #9ca3af; margin-bottom: 2px; }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt { border: none; border-radius: 0; box-shadow: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="brand">PUSPA</div>
      <div class="sub">Holistic Integrative Care</div>
      <div class="rek">Rek. BCA 000-000-0000 a.n. Puspa</div>
    </div>

    <hr class="divider-dash" />

    <div class="no-inv">
      <div class="label">No. Invoice</div>
      <div class="value">${invoice.no_invoice}</div>
    </div>

    <hr class="divider-dash" />

    <div class="info-row"><span class="lbl">Anak</span><span class="val">${invoice.anak}</span></div>
    <div class="info-row"><span class="lbl">Wali</span><span class="val">${invoice.wali}</span></div>
    <div class="info-row"><span class="lbl">Periode</span><span class="val">${invoice.periode}</span></div>
    <div class="info-row"><span class="lbl">Terbit</span><span class="val">${invoice.tanggal_terbit}</span></div>

    ${rows.length > 0 ? `<hr class="divider-dash" /><div class="items">${itemsHtml}</div>${potonganHtml}` : ""}

    <hr class="divider-solid" />

    <div class="total-row">
      <span class="lbl">TOTAL</span>
      <span class="val">${formatRupiah(invoice.total)}</span>
    </div>
    <div class="status-row">
      <span class="lbl">Status</span>
      <span style="font-weight:800;color:${statusColor[invoice.status]};">${statusLabelMap[invoice.status]}</span>
    </div>

    ${pembayaranHtml}

    <hr class="divider-dash" />

    <div class="footer">
      <p>Pembayaran dilakukan di awal periode.</p>
      <p>Terima kasih atas kepercayaan Anda.</p>
    </div>
  </div>
  <script>
    window.addEventListener('load', function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    });
  </script>
</body>
</html>`;

    const newWin = window.open("", "_blank", "width=500,height=800,toolbar=0,scrollbars=1,status=0");
    if (!newWin) return;
    newWin.document.write(html);
    newWin.document.close();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="cetak-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[350] flex items-center justify-center p-4 sm:p-6"
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[360px] max-h-[90vh] rounded-2xl bg-white shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Printer size={16} className="text-[#2B7A75]" />
              <h2 className="text-sm font-extrabold text-[#1E5C58]">Cetak Struk</h2>
            </div>
            <button onClick={onClose} className="cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"><X size={16} /></button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            <div id="receipt-print-inner" className="p-5 mx-auto bg-white border border-gray-300 border-dashed shadow-sm rounded-xl"
              style={{ maxWidth: 290, fontFamily: "'Courier New', Courier, monospace" }}>

              <div className="mb-3 text-center">
                <p className="text-base font-black tracking-wide text-gray-900" style={{ fontFamily: "sans-serif" }}>PUSPA</p>
                <p className="text-[9px] text-gray-500" style={{ fontFamily: "sans-serif" }}>Holistic Integrative Care</p>
                <p className="text-[9px] text-gray-400 mt-0.5" style={{ fontFamily: "sans-serif" }}>Rek. BCA 000-000-0000 a.n. Puspa</p>
              </div>
              <div className="border-t border-dashed border-gray-300 my-2.5" />
              <div className="mb-2 text-center">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">No. Invoice</p>
                <p className="text-[11px] font-bold text-gray-800 mt-0.5">{invoice.no_invoice}</p>
              </div>
              <div className="border-t border-dashed border-gray-300 my-2.5" />

              <div className="mb-2 space-y-1">
                {[{ label: "Anak", value: invoice.anak }, { label: "Wali", value: invoice.wali }, { label: "Periode", value: invoice.periode }, { label: "Terbit", value: invoice.tanggal_terbit }].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-[10px]">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-bold text-right text-gray-800" style={{ maxWidth: 170 }}>{value}</span>
                  </div>
                ))}
              </div>
              {rows.length > 0 && (
                <>
                  <div className="border-t border-dashed border-gray-300 my-2.5" />
                  <div className="mb-2 space-y-2">
                    {rows.map((row) => (
                      <div key={row.id}>
                        <p className="text-[10px] font-bold text-gray-800">{row.jenis}</p>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-400">{row.jumlah_sesi} sesi × {formatRupiah(Number(row.harga_sesi))}</span>
                          <span className="font-semibold text-gray-700">{formatRupiah((Number(row.jumlah_sesi) || 0) * (Number(row.harga_sesi) || 0))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {potonganVal > 0 && (
                    <div className="text-[10px] space-y-0.5 mb-2">
                      <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="font-semibold">{formatRupiah(totalSeharusnya)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Potongan</span><span className="font-semibold">- {formatRupiah(potonganVal)}</span></div>
                    </div>
                  )}
                </>
              )}
              <div className="border-t border-gray-400 my-2.5" />
              <div className="flex justify-between text-sm font-black text-gray-900">
                <span>TOTAL</span>
                <span>{formatRupiah(invoice.total)}</span>
              </div>
              <div className="flex justify-between items-center mt-1 text-[10px]">
                <span className="text-gray-400">Status</span>
                <span className="font-extrabold" style={{ color: statusColorMap[invoice.status] || "#1E5C58" }}>
                  {statusLabelMap[invoice.status] || (invoice.status === "BELUM DIBAYAR" ? "Belum dibayar" : "Lunas")}
                </span>
              </div>
              {invoice.pembayaran && (
                <>
                  <div className="border-t border-dashed border-gray-300 my-2.5" />
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between"><span className="text-gray-400">Dibayar</span><span className="font-semibold">{invoice.pembayaran.tanggal}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Metode</span><span className="font-semibold">{invoice.pembayaran.metode}</span></div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 px-5 pt-3 pb-5 border-t border-gray-100 shrink-0">
            <button type="button" onClick={onClose}
              className="cursor-pointer flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Tutup
            </button>
            <button id="btn-cetak-struk" type="button" onClick={handleCetak}
              className="cursor-pointer flex-1 py-2.5 bg-[#1E5C58] text-white rounded-xl text-sm font-bold hover:bg-[#174d49] shadow-sm transition-colors flex items-center justify-center gap-2">
              <Printer size={14} />Cetak
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── Action Dropdown ───────────────────────────────────────────────────────────
function ActionDropdown({
  item,
  openDropdownId,
  setOpenDropdownId,
  onPengembalian,
  onCatatBayar,
  onLihatDetail,
  onLihatBukti,
  onEdit,
  onCetakInvoice,
  onHapus,
}: {
  item: Invoice;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  onPengembalian: (inv: Invoice) => void;
  onCatatBayar: (inv: Invoice) => void;
  onLihatDetail: (inv: Invoice) => void;
  onLihatBukti?: (url: string) => void;
  onEdit: (inv: Invoice) => void;
  onCetakInvoice: (inv: Invoice) => void;
  onHapus: (id: string) => void;
}) {
  const isOpen = openDropdownId === item.id;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, openUpward: false });
  const MENU_WIDTH = 192;
  const MENU_HEIGHT_ESTIMATE = 250;

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
        top: openUpward ? rect.top - MENU_HEIGHT_ESTIMATE - 8 : rect.bottom + 8,
        left,
        openUpward,
      });
    }
    setOpenDropdownId(isOpen ? null : item.id);
  };

  const primaryItemClass =
    "cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-bold text-[#1E5C58] bg-[#EAF4F3] hover:bg-[#d4ede9] transition-colors border-b border-teal-100/80";
  const normalItemClass =
    "cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#1E5C58] transition-colors border-b border-gray-100";
  const dangerItemClass =
    "cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors";

  return (
    <td className="px-4 py-3 text-right">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 border border-teal-100 rounded-lg text-[#1E5C58] hover:bg-teal-50/40 text-[11px] font-semibold transition-colors"
      >
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
                <div className="fixed inset-0 z-[100]" onClick={() => setOpenDropdownId(null)} />
                <motion.div
                  initial={{ opacity: 0, y: menuPos.openUpward ? 8 : -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: menuPos.openUpward ? 8 : -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "fixed",
                    top: menuPos.top,
                    left: menuPos.left,
                    width: MENU_WIDTH,
                  }}
                  className="z-[101] rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13)] border border-gray-100 overflow-hidden"
                >
                  {item.status === "LUNAS" && (
                    <button onClick={() => { setOpenDropdownId(null); onPengembalian(item); }} className={primaryItemClass}>
                      Pengembalian dana
                    </button>
                  )}
                  {item.status === "BELUM DIBAYAR" && (
                    <button onClick={() => { setOpenDropdownId(null); onCatatBayar(item); }} className={primaryItemClass}>
                      Catat bayar
                    </button>
                  )}
                  {item.pembayaran?.buktiUrl && onLihatBukti && (
                    <button onClick={() => { setOpenDropdownId(null); onLihatBukti(item.pembayaran!.buktiUrl!); }} className={normalItemClass}>
                      Lihat Bukti Transfer
                    </button>
                  )}
                  <button onClick={() => { setOpenDropdownId(null); onLihatDetail(item); }} className={normalItemClass}>
                    Lihat detail
                  </button>
                  <button onClick={() => { setOpenDropdownId(null); onEdit(item); }} className={normalItemClass}>
                    Edit
                  </button>
                  <button onClick={() => { setOpenDropdownId(null); onCetakInvoice(item); }} className={normalItemClass}>
                    Cetak invoice
                  </button>
                  <button onClick={() => { setOpenDropdownId(null); onHapus(item.id); }} className={dangerItemClass}>
                    Hapus
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </td>
  );
}

type TabKey = "Semua" | "Belum dibayar" | "Berjalan" | "Periode berakhir" | "Selesai";
type MainTab = "Tagihan" | "Pembayaran";
type PageView = "list" | "buat-tagihan" | "edit-tagihan";

const TABS: TabKey[] = ["Semua", "Belum dibayar", "Berjalan", "Periode berakhir", "Selesai"];

// ─────────────────────────────────────────────────────────────────────────────
// ── PRATINJAU INVOICE MODAL ───────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
interface PratinjauData {
  wali: string;
  anak: string;
  tipeTagihan: string;
  periode: string;
  tanggalTerbit: string;
  noInvoice: string;
  rows: TerapiRow[];
  potongan: number;
  totalSeharusnya: number;
  totalBayar: number;
}

function PratinjauInvoiceModal({
  data,
  onClose,
}: {
  data: PratinjauData;
  onClose: () => void;
}) {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-2xl shadow-black/20"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="cursor-pointer absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Invoice Content */}
          <div className="p-7">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-lg font-extrabold leading-tight text-gray-900">Puspa</p>
                <p className="text-[11px] text-gray-400 font-medium">Holistic Integrative Care</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-[#1E5C58]">Invoice</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">{data.noInvoice}</p>
              </div>
            </div>

            {/* Teal divider */}
            <div className="h-px bg-[#2B7A75] mb-5" />

            {/* Billing info */}
            <div className="grid grid-cols-2 mb-5 text-sm gap-x-4 gap-y-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                  Ditagihkan kepada
                </p>
                <p className="font-semibold text-gray-800">{data.wali}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                  Nama anak
                </p>
                <p className="font-semibold text-gray-800">{data.anak}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                  Periode
                </p>
                <p className="font-semibold text-gray-800">{data.periode || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                  Tanggal terbit
                </p>
                <p className="font-semibold text-gray-800">{today}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="mb-4 overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#EAF4F3]">
                    <th className="px-4 py-2.5 text-left text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wide">
                      Terapi
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wide">
                      Jumlah sesi
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wide">
                      Harga
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-extrabold text-[#1E5C58] uppercase tracking-wide">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{row.jenis}</td>
                      <td className="px-4 py-2.5 text-gray-600">{row.jumlah_sesi} sesi</td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {formatRupiah(Number(row.harga_sesi) || 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                        {formatRupiah((Number(row.jumlah_sesi) || 0) * (Number(row.harga_sesi) || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-gray-700">{formatRupiah(data.totalSeharusnya)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Potongan</span>
                <span className="font-semibold text-gray-700">- Rp 0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Potongan dari sisa sesi sebelumnya</span>
                <span className="font-semibold text-gray-700">- {formatRupiah(data.potongan)}</span>
              </div>

              {/* Teal divider */}
              <div className="h-px bg-[#2B7A75] my-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-gray-800">Total tagihan</span>
                <span className="text-base font-extrabold text-[#1E5C58]">
                  {formatRupiah(data.totalBayar)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-gray-500">Status</span>
                <span className="inline-flex items-center px-3 py-1 text-xs font-extrabold text-red-600 bg-red-100 rounded-full">
                  Belum dibayar
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between pt-4 border-t border-gray-100">
              <div className="text-[11px] text-gray-400 leading-relaxed">
                <p>Pembayaran dilakukan di awal periode.</p>
                <p>Rek. BCA 000-000-0000 a.n. Puspa</p>
              </div>
              <div className="text-right">
                <div className="w-24 mb-1 border-t border-gray-400" />
                <p className="text-[11px] text-gray-500 font-semibold">Admin Puspa</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── FORM BUAT TAGIHAN ─────────────────────────────────────────────────────────
function hitungDurasiPaket(mulai: string, selesai: string) {
  if (!mulai || !selesai) return null;
  const d1 = new Date(mulai);
  const d2 = new Date(selesai);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 <= d1) return null;
  const hari = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  const bulan = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  const minggu = Math.floor(hari / 7);
  return { hari, bulan, minggu };
}

function BuatTagihanForm({
  onBack,
  onSave,
  initialData,
  prefillData,
  isSubmitting,
}: {
  onBack: () => void;
  onSave: (invData: any) => Promise<void> | void;
  initialData?: Invoice;
  prefillData?: { anak: string; wali: string; potongan?: number; childId?: string; guardianId?: string } | null;
  isSubmitting?: boolean;
}) {
  const [childrenList, setChildrenList] = useState<ChildGuardianItem[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [isChildDropdownOpen, setIsChildDropdownOpen] = useState(false);
  const [childSearchTerm, setChildSearchTerm] = useState("");
  const childDropdownRef = useRef<HTMLDivElement>(null);
  const childInputRef = useRef<HTMLInputElement>(null);

  const [tipeTagihan, setTipeTagihan] = useState<"Bulanan" | "Paket Durasi">(initialData?.tipe ?? "Bulanan");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = Boolean(initialData);
  const isLockedChild = isEditMode || Boolean(prefillData?.anak || prefillData?.childId);

  const [selectedChildId, setSelectedChildId] = useState(initialData?.child_id ?? prefillData?.childId ?? "");
  const [selectedGuardianId, setSelectedGuardianId] = useState(initialData?.guardian_id ?? prefillData?.guardianId ?? "");
  const [selectedWaliName, setSelectedWaliName] = useState(initialData?.wali ?? prefillData?.wali ?? "");
  const [selectedAnakName, setSelectedAnakName] = useState(initialData?.anak ?? prefillData?.anak ?? "");

  // Outside click listener for child searchable combobox
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        childDropdownRef.current &&
        !childDropdownRef.current.contains(event.target as Node)
      ) {
        setIsChildDropdownOpen(false);
        setChildSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Load children list from Backend API (filter children with active schedules)
  useEffect(() => {
    let isMounted = true;
    const fetchList = async () => {
      setIsLoadingChildren(true);
      try {
        const [allChildren, schedulesRes] = await Promise.all([
          getChildrenWithGuardians(),
          getSchedules({ status: "aktif", per_page: 200 }).catch(() => null),
        ]);
        if (!isMounted) return;

        const activeSchedules: ScheduleItem[] = schedulesRes?.items || [];
        const scheduledChildIds = new Set(
          activeSchedules.map((s) => s.child_id).filter(Boolean)
        );
        const scheduledChildNames = new Set(
          activeSchedules
            .map((s) => s.child_name?.toLowerCase().trim())
            .filter(Boolean)
        );

        let filtered = (allChildren || []).filter(
          (c) =>
            scheduledChildIds.has(c.child_id) ||
            scheduledChildNames.has(c.child_name?.toLowerCase().trim()) ||
            (initialData?.child_id && c.child_id === initialData.child_id)
        );

        if (filtered.length === 0 && allChildren.length > 0) {
          filtered = allChildren;
        }
        setChildrenList(filtered);

        if (initialData?.child_id) {
          const found = filtered.find((c) => c.child_id === initialData.child_id);
          if (found) {
            setSelectedChildId(found.child_id);
            setSelectedGuardianId(found.guardian_id);
            setSelectedWaliName(found.guardian_name);
            setSelectedAnakName(found.child_name);
          }
        } else if (prefillData?.childId || prefillData?.anak) {
          const found = filtered.find(
            (c) =>
              (prefillData.childId && c.child_id === prefillData.childId) ||
              (prefillData.anak && c.child_name.toLowerCase() === prefillData.anak.toLowerCase())
          );
          if (found) {
            setSelectedChildId(found.child_id);
            setSelectedGuardianId(found.guardian_id);
            setSelectedWaliName(found.guardian_name);
            setSelectedAnakName(found.child_name);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data anak:", err);
      } finally {
        if (isMounted) {
          setIsLoadingChildren(false);
        }
      }
    };
    fetchList();
    return () => {
      isMounted = false;
    };
  }, [initialData, prefillData]);

  // Child selection handler: auto-populates Guardian
  const handleSelectChild = (c: ChildGuardianItem) => {
    setSelectedChildId(c.child_id);
    setSelectedAnakName(c.child_name);
    setSelectedGuardianId(c.guardian_id);
    setSelectedWaliName(c.guardian_name);
    setErrors((prev) => ({ ...prev, anak: false, wali: false }));
    setIsChildDropdownOpen(false);
    setChildSearchTerm("");
  };

  const filteredChildren = childrenList.filter((c) => {
    const term = childSearchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.child_name.toLowerCase().includes(term) ||
      (c.guardian_name && c.guardian_name.toLowerCase().includes(term))
    );
  });

  let initPeriode = "";
  if (initialData?.tipe === "Bulanan" && initialData.periode && initialData.periode !== "—") {
    const names = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const [mName, y] = initialData.periode.split(" ");
    const mIdx = names.indexOf(mName);
    if (mIdx !== -1 && y) {
      initPeriode = `${y}-${String(mIdx + 1).padStart(2, "0")}`;
    }
  }
  const [periode, setPeriode] = useState(initPeriode);

  let initMulai = "", initSelesai = "";
  if (initialData?.tipe === "Paket Durasi" && initialData.periode && initialData.periode !== "—") {
    const parts = initialData.periode.split(" – ");
    if (parts.length === 2) { initMulai = parts[0]; initSelesai = parts[1]; }
  }
  const [tanggalMulai, setTanggalMulai] = useState(initMulai);
  const [tanggalSelesai, setTanggalSelesai] = useState(initSelesai);

  const [terapiRows, setTerapiRows] = useState<TerapiRow[]>(
    initialData?.terapiRows && initialData.terapiRows.length > 0
      ? initialData.terapiRows
      : [{ id: genId(), jenis: "", jumlah_sesi: "", harga_sesi: "" }]
  );

  // Jadwal & Kalkulasi Otomatis Sesi Terapi
  const [childSchedules, setChildSchedules] = useState<ScheduleItem[]>([]);
  const [scheduleDetails, setScheduleDetails] = useState<Record<string, ScheduleDetailItem>>({});
  const [autoFilledFromSchedule, setAutoFilledFromSchedule] = useState(false);
  const lastAutoAppliedKey = useRef<string>("");

  // Harga & Pembayaran
  const [potongan, setPotongan] = useState<number | "">(
    initialData?.potongan ?? (prefillData?.potongan !== undefined ? prefillData.potongan : "")
  );
  const [catatan, setCatatan] = useState("");

  const [errors, setErrors] = useState<{
    wali?: boolean;
    anak?: boolean;
    periode?: boolean;
    tanggalMulai?: boolean;
    tanggalSelesai?: boolean;
    terapi?: { id: string; field: keyof TerapiRow }[];
  }>({});

  // Reset helpers
  const resetTerapiToDefault = () => {
    setTerapiRows([{ id: genId(), jenis: "", jumlah_sesi: "", harga_sesi: "" }]);
    setAutoFilledFromSchedule(false);
    lastAutoAppliedKey.current = "";
    setErrors((prev) => ({ ...prev, terapi: [] }));
  };

  const handleClearPeriode = () => {
    setPeriode("");
    resetTerapiToDefault();
    setErrors((prev) => ({ ...prev, periode: false }));
  };

  const handleClearChild = () => {
    // 1. Reset Identitas Anak & Wali
    setSelectedChildId("");
    setSelectedAnakName("");
    setSelectedGuardianId("");
    setSelectedWaliName("");
    setChildSearchTerm("");
    setIsChildDropdownOpen(false);

    // 2. Reset Periode & Tanggal
    setPeriode("");
    setTanggalMulai("");
    setTanggalSelesai("");

    // 3. Reset Jadwal Anak
    setChildSchedules([]);
    setScheduleDetails({});

    // 4. Reset Terapi & Jumlah Sesi ke setelan awal (1 baris kosong)
    resetTerapiToDefault();

    // 5. Reset Potongan & Catatan
    setPotongan("");
    setCatatan("");

    // 6. Reset semua error formulir
    setErrors({ terapi: [] });
  };

  const applySchedulesToRows = (
    schedules: ScheduleItem[],
    tipe: "Bulanan" | "Paket Durasi",
    existingRows: TerapiRow[] = [],
    customPeriode?: string,
    customStart?: string,
    customEnd?: string,
    detailsMapOverride?: Record<string, ScheduleDetailItem>
  ) => {
    if (!schedules || schedules.length === 0) {
      setAutoFilledFromSchedule(false);
      return;
    }

    const currentDetailsMap = detailsMapOverride || scheduleDetails;
    const activePeriode = customPeriode !== undefined ? customPeriode : periode;
    const activeStart = customStart !== undefined ? customStart : tanggalMulai;
    const activeEnd = customEnd !== undefined ? customEnd : tanggalSelesai;

    let targetRangeStart = "";
    let targetRangeEnd = "";

    if (tipe === "Bulanan") {
      const ym = parseYearMonth(activePeriode);
      if (ym) {
        targetRangeStart = `${ym.year}-${String(ym.month).padStart(2, "0")}-01`;
        const lastDay = new Date(ym.year, ym.month, 0).getDate();
        targetRangeEnd = `${ym.year}-${String(ym.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      } else {
        return;
      }
    } else if (tipe === "Paket Durasi") {
      targetRangeStart = activeStart;
      targetRangeEnd = activeEnd;
      if (!targetRangeStart || !targetRangeEnd) return;
    }

    const grouped: Record<
      string,
      { jenis: string; totalSessions: number; schedules: ScheduleItem[] }
    > = {};

    schedules.forEach((sch) => {
      const jenis = normalizeTherapyType(sch.therapy_type);
      if (!grouped[jenis]) {
        grouped[jenis] = { jenis, totalSessions: 0, schedules: [] };
      }
      grouped[jenis].schedules.push(sch);

      let schCount = 0;
      const detail = currentDetailsMap[sch.id];

      const schStart = sch.period_start || targetRangeStart;
      const schEnd = sch.period_end || targetRangeEnd;
      const effStart = schStart > targetRangeStart ? schStart : targetRangeStart;
      const effEnd = schEnd < targetRangeEnd ? schEnd : targetRangeEnd;

      if (effStart > effEnd) return;

      // A. Cek sesi faktual jika detail sudah ada
      if (
        detail?.sessions &&
        Array.isArray(detail.sessions) &&
        detail.sessions.length > 0
      ) {
        const inRange = detail.sessions.filter((sess) => {
          if (!sess.session_date) return false;
          // PENTING: Filter keluar sesi yang merupakan limpahan reschedule dari bulan sebelumnya!
          // Sesi reschedule sudah dibayar lunas di invoice periode asalnya sehingga TIDAK boleh ditagihkan lagi.
          if (
            (sess as any).reschedule_replacement ||
            (sess as any).rescheduleReplacement ||
            (sess.notes && sess.notes.includes("Reschedule dari"))
          ) {
            return false;
          }
          return sess.session_date >= effStart && sess.session_date <= effEnd;
        });
        schCount = inRange.length;
      }

      // B. Cek berdasarkan kemunculan hari kalender reguler
      if (schCount === 0 && sch.day_of_week) {
        schCount = countDayOccurrences(sch.day_of_week, effStart, effEnd);
      }

      // C. Fallback default
      if (schCount === 0 && (!sch.day_of_week || sch.day_of_week < 1)) {
        schCount = Number(sch.total_meetings) || 4;
      }

      grouped[jenis].totalSessions += schCount;
    });

    const activeEntries = Object.values(grouped).filter(
      (g) => g.totalSessions > 0
    );
    if (activeEntries.length > 0) {
      const currentRows = existingRows.length > 0 ? existingRows : terapiRows;
      const newRows: TerapiRow[] = activeEntries.map((g) => {
        const prevRow = currentRows.find((r) => r.jenis === g.jenis);
        return {
          id: prevRow?.id || genId(),
          jenis: g.jenis,
          jumlah_sesi: g.totalSessions,
          harga_sesi: prevRow?.harga_sesi ?? "",
        };
      });
      setTerapiRows(newRows);
      setAutoFilledFromSchedule(true);
    }
  };

  // Load schedules for the selected child and auto calculate sessions
  useEffect(() => {
    if (!selectedChildId) {
      setChildSchedules([]);
      setAutoFilledFromSchedule(false);
      lastAutoAppliedKey.current = "";
      resetTerapiToDefault();
      return;
    }
    let isMounted = true;
    getSchedules({ status: "aktif", per_page: 200 })
      .then(async (res) => {
        if (!isMounted || !res?.items) return;
        const matched: ScheduleItem[] = res.items.filter(
          (s: ScheduleItem) =>
            s.child_id === selectedChildId ||
            (selectedAnakName &&
              s.child_name?.toLowerCase().trim() ===
              selectedAnakName.toLowerCase().trim())
        );
        setChildSchedules(matched);

        const detailsMap: Record<string, ScheduleDetailItem> = {};
        await Promise.all(
          matched.map(async (sch: ScheduleItem) => {
            try {
              const det = await getScheduleDetail(sch.id);
              if (det) detailsMap[sch.id] = det;
            } catch {
              // ignore
            }
          })
        );
        if (!isMounted) return;
        setScheduleDetails(detailsMap);

        const isTargetValid =
          tipeTagihan === "Bulanan"
            ? Boolean(periode)
            : Boolean(tanggalMulai && tanggalSelesai);

        if (!isTargetValid) {
          resetTerapiToDefault();
          return;
        }

        const targetVal = tipeTagihan === "Bulanan" ? periode : `${tanggalMulai}_${tanggalSelesai}`;
        const autoKey = `${selectedChildId}_${tipeTagihan}_${targetVal}`;
        if (matched.length > 0 && lastAutoAppliedKey.current !== autoKey) {
          lastAutoAppliedKey.current = autoKey;
          applySchedulesToRows(matched, tipeTagihan, undefined, undefined, undefined, undefined, detailsMap);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat jadwal anak:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChildId, selectedAnakName, periode, tanggalMulai, tanggalSelesai, tipeTagihan]);

  // Recalculate sessions when period or date range changes
  useEffect(() => {
    if (!selectedChildId) {
      resetTerapiToDefault();
      return;
    }
    const isTargetValid =
      tipeTagihan === "Bulanan"
        ? Boolean(periode)
        : Boolean(tanggalMulai && tanggalSelesai);

    if (!isTargetValid) {
      resetTerapiToDefault();
      return;
    }

    if (childSchedules.length === 0) return;

    const targetVal = tipeTagihan === "Bulanan" ? periode : `${tanggalMulai}_${tanggalSelesai}`;
    const autoKey = `${selectedChildId}_${tipeTagihan}_${targetVal}`;
    if (lastAutoAppliedKey.current !== autoKey) {
      lastAutoAppliedKey.current = autoKey;
      applySchedulesToRows(childSchedules, tipeTagihan);
    }
  }, [periode, tanggalMulai, tanggalSelesai, tipeTagihan, childSchedules, selectedChildId]);

  // Pratinjau modal
  const [showPratinjau, setShowPratinjau] = useState(false);
  const noInvoicePreview = useRef(
    initialData?.no_invoice || `INV/${new Date().getFullYear()}/PKT/${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`
  ).current;

  const isPaket = tipeTagihan === "Paket Durasi";
  const rowSubtotal = (row: TerapiRow) => (Number(row.jumlah_sesi) || 0) * (Number(row.harga_sesi) || 0);
  const totalSeharusnya = terapiRows.reduce((sum, r) => sum + rowSubtotal(r), 0);
  const totalBayar = Math.max(0, totalSeharusnya - (Number(potongan) || 0));
  const durasiPaket = isPaket ? hitungDurasiPaket(tanggalMulai, tanggalSelesai) : null;

  const periodeLabel = tipeTagihan === "Bulanan"
    ? (() => {
      if (!periode) return "—";
      const [y, m] = periode.split("-");
      const names = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      return `${names[parseInt(m, 10) - 1]} ${y}`;
    })()
    : tanggalMulai && tanggalSelesai
      ? `${tanggalMulai} – ${tanggalSelesai}`
      : "—";

  const updateTerapiRow = (id: string, field: keyof TerapiRow, value: string | number) => {
    setTerapiRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addTerapiRow = () => {
    setTerapiRows((rows) => [...rows, { id: genId(), jenis: "", jumlah_sesi: "", harga_sesi: "" }]);
  };

  const removeTerapiRow = (id: string) => {
    setTerapiRows((rows) => {
      if (rows.length <= 1) {
        return [{ id: genId(), jenis: "", jumlah_sesi: "", harga_sesi: "" }];
      }
      return rows.filter((r) => r.id !== id);
    });
    setErrors((prev) => ({
      ...prev,
      terapi: prev.terapi?.filter((t) => t.id !== id),
    }));
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all";

  const selectClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all cursor-pointer appearance-none";

  const handleSimpan = async () => {
    const newErrors: typeof errors = { terapi: [] };
    let hasError = false;

    let guardianId = selectedGuardianId;
    if (!guardianId && selectedChildId) {
      const childItem = childrenList.find((c) => c.child_id === selectedChildId);
      if (childItem?.guardian_id) {
        guardianId = childItem.guardian_id;
      }
    }

    if (!selectedChildId) { newErrors.anak = true; hasError = true; }
    if (!guardianId) { newErrors.wali = true; hasError = true; }
    if (tipeTagihan === "Bulanan" && !periode) { newErrors.periode = true; hasError = true; }
    if (tipeTagihan === "Paket Durasi") {
      if (!tanggalMulai) { newErrors.tanggalMulai = true; hasError = true; }
      if (!tanggalSelesai) { newErrors.tanggalSelesai = true; hasError = true; }
    }

    terapiRows.forEach((row) => {
      if (!row.jenis) { newErrors.terapi!.push({ id: row.id, field: "jenis" }); hasError = true; }
      if (row.jumlah_sesi === "") { newErrors.terapi!.push({ id: row.id, field: "jumlah_sesi" }); hasError = true; }
      if (row.harga_sesi === "") { newErrors.terapi!.push({ id: row.id, field: "harga_sesi" }); hasError = true; }
    });

    if (hasError) {
      setErrors(newErrors);
      showErrorToast("Silakan lengkapi semua data wajib pada formulir!", "Validasi Formulir");
      return;
    }

    let computedStartDate = isPaket ? tanggalMulai : null;
    let computedEndDate = isPaket ? tanggalSelesai : null;
    if (!isPaket && periode) {
      const [y, m] = periode.split("-");
      const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
      computedStartDate = `${y}-${m}-01`;
      computedEndDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    }

    const payload = {
      child_id: selectedChildId,
      guardian_id: guardianId,
      type: tipeTagihan,
      period_label: periodeLabel,
      start_date: computedStartDate,
      end_date: computedEndDate,
      discount: Number(potongan) || 0,
      notes: catatan,
      items: terapiRows.map((r) => ({
        therapy_type: r.jenis,
        session_count: Number(r.jumlah_sesi),
        price_per_session: Number(r.harga_sesi),
      })),
    };

    setIsSaving(true);
    try {
      await onSave(payload);
    } catch {
      // Error is handled in onSave
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      key="buat-tagihan"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
    >
      <div className="p-4 space-y-5 sm:p-6">
        <div className="relative z-20 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 rounded-t-2xl">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E5C58] text-white text-xs font-extrabold shrink-0">
              1
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Penerima Tagihan</h2>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <label className="block mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                Tipe tagihan
              </label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-[#F4F9F8]">
                {(["Bulanan", "Paket Durasi"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTipeTagihan(t); setErrors({}); }}
                    id={`tipe-${t.toLowerCase().replace(" ", "-")}`}
                    className={`flex-1 px-6 py-2.5 text-sm font-bold transition-all ${tipeTagihan === t ? "bg-[#1E5C58] text-white shadow-sm" : "text-gray-500 hover:text-[#2B7A75]"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div ref={childDropdownRef} className="relative z-30">
                <label className="block mb-1.5 text-xs font-bold text-gray-500">
                  {isLockedChild ? "Nama Anak" : "Pilih Anak"}
                  {!isLockedChild && childrenList.length > 0 && (
                    <span className="ml-1.5 font-normal text-gray-400">
                      ({childrenList.length} anak terdaftar)
                    </span>
                  )}
                </label>
                <div
                  className={`relative flex items-center rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isLockedChild
                      ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed select-none"
                      : errors.anak
                      ? "!border-red-500 !ring-red-500/20 !bg-red-50"
                      : "border-gray-200 bg-white focus-within:border-[#2B7A75] focus-within:ring-2 focus-within:ring-[#2B7A75]/20"
                  }`}
                >
                  <input
                    ref={childInputRef}
                    id="input-cari-anak"
                    type="text"
                    value={!isLockedChild && isChildDropdownOpen ? childSearchTerm : selectedAnakName}
                    onFocus={() => {
                      if (!isLockedChild) setIsChildDropdownOpen(true);
                    }}
                    onChange={(e) => {
                      if (!isLockedChild) {
                        setChildSearchTerm(e.target.value);
                        setIsChildDropdownOpen(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!isLockedChild && e.key === "Escape") {
                        setIsChildDropdownOpen(false);
                        setChildSearchTerm("");
                      }
                    }}
                    placeholder={
                      isLoadingChildren
                        ? "Memuat daftar anak..."
                        : isChildDropdownOpen
                          ? "Cari nama anak / nama orang tua..."
                          : "Pilih Nama Anak"
                    }
                    className={`w-full text-sm font-medium text-gray-800 bg-transparent outline-none ${
                      isLockedChild ? "cursor-not-allowed pr-3 font-semibold" : "pr-14"
                    } placeholder:text-gray-400`}
                    readOnly={isLoadingChildren || isLockedChild}
                    disabled={isLockedChild}
                  />

                  {/* Clear button if child is selected (Hanya saat anak tidak terkunci) */}
                  {!isLockedChild && selectedChildId && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearChild();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearChild();
                      }}
                      title="Hapus pilihan"
                      className="absolute z-10 p-1 text-gray-400 transition-colors rounded-full cursor-pointer right-8 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Chevron / Loading indicator (Hanya saat anak tidak terkunci) */}
                  {!isLockedChild && (
                    <div
                      onClick={() => {
                        if (isLoadingChildren) return;
                        setIsChildDropdownOpen((prev) => !prev);
                        if (!isChildDropdownOpen) {
                          requestAnimationFrame(() => childInputRef.current?.focus());
                        }
                      }}
                      className="absolute flex items-center text-gray-400 cursor-pointer right-3"
                    >
                      {isLoadingChildren ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#2B7A75]" />
                      ) : (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isChildDropdownOpen ? "rotate-180 text-[#2B7A75]" : ""
                          }`}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Dropdown Menu (Hanya saat anak tidak terkunci) */}
                {!isLockedChild && isChildDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-teal-100 bg-white shadow-2xl">
                    {isLoadingChildren ? (
                      <div className="flex items-center justify-center gap-2 p-4 text-xs font-medium text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin text-[#2B7A75]" />
                        <span>Memuat data anak...</span>
                      </div>
                    ) : filteredChildren.length === 0 ? (
                      <div className="p-4 text-xs text-center text-gray-400">
                        {childrenList.length === 0
                          ? "Belum ada data anak di sistem"
                          : `Tidak ditemukan anak dengan kata kunci "${childSearchTerm}"`}
                      </div>
                    ) : (
                      <div className="p-1.5 space-y-0.5">
                        {filteredChildren.map((child) => {
                          const isSelected = child.child_id === selectedChildId;
                          return (
                            <button
                              key={child.child_id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelectChild(child)}
                              className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${isSelected
                                ? "bg-teal-50 text-[#1E5C58] font-bold"
                                : "hover:bg-gray-50 text-gray-700"
                                }`}
                            >
                              <div>
                                <p className="font-semibold text-gray-800 text-[13px]">
                                  {child.child_name}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  Wali: {child.guardian_name || "—"}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#2B7A75] shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-500">
                  Orang tua / wali
                </label>
                <input
                  type="text"
                  value={selectedWaliName}
                  onChange={(e) => {
                    if (!isLockedChild) setSelectedWaliName(e.target.value);
                  }}
                  readOnly={isLockedChild}
                  disabled={isLockedChild}
                  placeholder="Nama Orangtua/Wali"
                  className={`${inputClass} bg-gray-50 placeholder:text-gray-400 ${
                    isLockedChild ? "cursor-not-allowed font-semibold text-gray-700" : ""
                  }`}
                />
              </div>
            </div>

            {tipeTagihan === "Bulanan" ? (
              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-500">
                  Periode (bulan)
                </label>
                <div className="relative max-w-xs">
                  {/* Text display — hanya menampilkan mm/yyyy */}
                  <input
                    type="text"
                    readOnly
                    value={
                      periode
                        ? (() => {
                          const [y, m] = periode.split("-");
                          return `${m}/${y}`;
                        })()
                        : ""
                    }
                    placeholder="mm/yyyy"
                    onClick={() => {
                      const el = document.getElementById("input-periode-bulan") as HTMLInputElement | null;
                      if (el) {
                        if (typeof el.showPicker === "function") {
                          try { el.showPicker(); } catch { el.focus(); }
                        } else {
                          el.focus();
                        }
                      }
                    }}
                    className={`${inputClass} cursor-pointer ${periode ? "pr-14" : "pr-10"} placeholder:text-gray-400 ${errors.periode ? "!border-red-500 !ring-red-500/20 !bg-red-50" : ""}`}
                  />
                  {periode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearPeriode();
                      }}
                      title="Hapus periode"
                      className="absolute p-1 text-gray-400 transition-colors -translate-y-1/2 rounded-full cursor-pointer right-8 top-1/2 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div
                    onClick={() => {
                      const el = document.getElementById("input-periode-bulan") as HTMLInputElement | null;
                      if (el) {
                        if (typeof el.showPicker === "function") {
                          try { el.showPicker(); } catch { el.focus(); }
                        } else {
                          el.focus();
                        }
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center cursor-pointer text-gray-400 hover:text-[#2B7A75] transition-colors"
                  >
                    <Calendar size={16} />
                  </div>
                  {/* Input month tersembunyi — mengelola value & membuka picker */}
                  <input
                    id="input-periode-bulan"
                    type="month"
                    value={periode}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        handleClearPeriode();
                      } else {
                        setPeriode(val);
                        setErrors((prev) => ({ ...prev, periode: false }));
                      }
                    }}
                    className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
                    tabIndex={-1}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-gray-500">Tanggal mulai</label>
                  <div className="relative">
                    <input
                      id="input-tanggal-mulai"
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => { setTanggalMulai(e.target.value); setErrors(prev => ({ ...prev, tanggalMulai: false })); }}
                      className={`${inputClass} cursor-pointer pr-10 ${!tanggalMulai ? "text-transparent" : ""} ${errors.tanggalMulai ? "!border-red-500 !ring-red-500/20 !bg-red-50" : ""}`}
                    />
                    <Calendar
                      size={16}
                      className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-gray-500">Tanggal berakhir</label>
                  <div className="relative">
                    <input
                      id="input-tanggal-selesai"
                      type="date"
                      value={tanggalSelesai}
                      min={tanggalMulai || undefined}
                      onChange={(e) => { setTanggalSelesai(e.target.value); setErrors(prev => ({ ...prev, tanggalSelesai: false })); }}
                      className={`${inputClass} cursor-pointer pr-10 ${!tanggalSelesai ? "text-transparent" : ""} ${errors.tanggalSelesai ? "!border-red-500 !ring-red-500/20 !bg-red-50" : ""}`}
                    />
                    <Calendar
                      size={16}
                      className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Terapi */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E5C58] text-white text-xs font-extrabold shrink-0">
              2
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Terapi & Jumlah Sesi</h2>
            {autoFilledFromSchedule && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9, y: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="ml-auto text-[10px] font-bold text-[#1E5C58] bg-[#EAF7F2] border border-[#2B7A75]/20 px-2 py-0.5 rounded-full flex items-center gap-1"
              >
                <CheckCircle2 size={11} className="text-[#2B7A75]" />
                Otomatis dihitung dari kalender jadwal
              </motion.span>
            )}
          </div>

          <div className="p-5 space-y-3">
            <div className="hidden sm:grid grid-cols-[1.2fr_90px_1fr_1.1fr_auto] gap-3 items-center">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                Jenis terapi
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 text-center">
                Jumlah sesi
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                {isPaket ? "Harga paket" : "Harga / sesi"}
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                Subtotal
              </span>
              <span className="w-7" />
            </div>

            <motion.div
              key={autoFilledFromSchedule ? `autofill-${lastAutoAppliedKey.current}` : "default-rows"}
              initial={autoFilledFromSchedule ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="space-y-3"
            >
              {terapiRows.map((row, idx) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 sm:grid-cols-[1.2fr_90px_1fr_1.1fr_auto] gap-3 items-center"
                >
                  {isEditMode ? (
                    <input
                      id={`jenis-terapi-${idx}`}
                      type="text"
                      readOnly
                      disabled
                      value={row.jenis}
                      className={`${inputClass} bg-gray-50 text-gray-700 cursor-not-allowed`}
                    />
                  ) : (
                    <div className="relative">
                      <select
                        id={`jenis-terapi-${idx}`}
                        value={row.jenis}
                        onChange={(e) => updateTerapiRow(row.id, "jenis", e.target.value)}
                        className={`${selectClass} pr-8 ${!row.jenis ? "text-gray-400" : "text-gray-700"}`}
                      >
                        <option value="" disabled className="text-gray-400">Pilih Jenis Terapi</option>
                        {JENIS_TERAPI_OPTIONS.map((j) => (
                          <option key={j} value={j} className="text-gray-700">{j}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2" />
                    </div>
                  )}

                  <input
                    id={`jumlah-sesi-${idx}`}
                    type="number"
                    min={1}
                    value={row.jumlah_sesi}
                    placeholder="Sesi"
                    onChange={(e) => updateTerapiRow(row.id, "jumlah_sesi", e.target.value === "" ? "" : Number(e.target.value))}
                    className={`${inputClass} text-center`}
                  />

                  <input
                    id={`harga-sesi-${idx}`}
                    type="number"
                    min={0}
                    value={row.harga_sesi}
                    placeholder={isPaket ? "Harga paket" : "Harga/sesi"}
                    onChange={(e) => {
                      updateTerapiRow(row.id, "harga_sesi", e.target.value === "" ? "" : Number(e.target.value));
                      setErrors(prev => ({ ...prev, terapi: prev.terapi?.filter(t => !(t.id === row.id && t.field === "harga_sesi")) }));
                    }}
                    className={`${inputClass} ${errors.terapi?.some(t => t.id === row.id && t.field === "harga_sesi") ? "!border-red-500 !ring-red-500/20 !bg-red-50" : ""}`}
                  />

                  <p className="text-sm font-extrabold text-gray-800 whitespace-nowrap">
                    {formatRupiah(rowSubtotal(row))}
                  </p>

                  {terapiRows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeTerapiRow(row.id)}
                      className="flex items-center justify-center text-red-400 transition-colors rounded-lg cursor-pointer w-7 h-7 hover:text-red-600 hover:bg-red-50 shrink-0"
                      title="Hapus baris"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <span className="w-7 h-7 shrink-0" />
                  )}
                </div>
              ))}
            </motion.div>

            <button
              type="button"
              id="btn-tambah-terapi"
              onClick={addTerapiRow}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 border border-dashed border-[#2B7A75] rounded-xl text-sm font-semibold text-[#2B7A75] hover:bg-teal-50 transition-colors mt-1"
            >
              <Plus size={15} />
              Tambah terapi
            </button>

            {/* Info note — berbeda per tipe */}
            <div className="min-h-[40px] pt-1 flex items-start">
              <AnimatePresence mode="wait">
                <motion.p
                  key={isPaket ? "paket" : "bulanan"}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="text-[11px] text-[#2B7A75] font-medium leading-relaxed m-0"
                >
                  Subtotal = jumlah sesi × harga per sesi. Kehadiran dicatat di akhir periode saat penyelesaian sisa sesi.
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Durasi paket (hanya Paket Durasi, jika tanggal sudah diisi) */}
            {isPaket && durasiPaket && (
              <p className="text-[11px] font-bold text-[#1E5C58] bg-[#EAF4F3] rounded-lg px-3 py-2">
                Durasi paket: {durasiPaket.hari} hari (± {durasiPaket.bulan} bulan,{" "}
                {durasiPaket.minggu} minggu)
              </p>
            )}
          </div>
        </div>

        {/* Section 3: Pembayaran */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E5C58] text-white text-xs font-extrabold shrink-0">
              3
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Pembayaran</h2>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">
                Potongan (Rp)
              </label>
              <input
                id="input-potongan"
                type="number"
                min={0}
                value={potongan}
                onChange={(e) => setPotongan(Number(e.target.value))}
                className={`${inputClass} max-w-xs`}
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">Catatan</label>
              <input
                id="input-catatan"
                type="text"
                placeholder="Mis. 1 sesi pengganti"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-700">{formatRupiah(totalSeharusnya)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Potongan</span>
                <span className="font-semibold text-red-500">- {formatRupiah(Number(potongan) || 0)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#1E5C58]">Total</span>
                  <span className="text-lg font-extrabold text-[#1E5C58]">{formatRupiah(totalBayar)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-2">
          <AnimatePresence>
            {(errors.wali || errors.anak || errors.periode || errors.tanggalMulai || errors.tanggalSelesai || (errors.terapi && errors.terapi.length > 0)) && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="mb-3 text-sm font-bold text-red-500"
              >
                * Silakan lengkapi semua data utama!
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-simpan-tagihan"
              type="button"
              disabled={isSaving || !!isSubmitting}
              onClick={handleSimpan}
              className={`cursor-pointer px-6 py-2.5 text-white rounded-xl text-sm font-bold shadow-sm transition-colors inline-flex items-center gap-2 ${(isSaving || isSubmitting) ? "opacity-75 cursor-not-allowed" : ""
                } ${initialData ? "bg-[#059669] hover:bg-[#047857] shadow-emerald-700/20" : "bg-[#1E5C58] hover:bg-[#174d49] shadow-teal-700/20"}`}
            >
              {(isSaving || isSubmitting) && <Loader2 size={16} className="animate-spin" />}
              {(isSaving || isSubmitting)
                ? "Menyimpan..."
                : initialData
                  ? "Simpan Perubahan"
                  : "Simpan tagihan"}
            </button>
            <button
              id="btn-batal-tagihan"
              type="button"
              onClick={onBack}
              className="cursor-pointer px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
      {/* Pratinjau Invoice Modal */}
      {showPratinjau && (
        <PratinjauInvoiceModal
          data={{
            wali: selectedWaliName,
            anak: selectedAnakName,
            tipeTagihan,
            periode: periodeLabel,
            tanggalTerbit: new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            noInvoice: noInvoicePreview,
            rows: terapiRows,
            potongan: Number(potongan) || 0,
            totalSeharusnya,
            totalBayar,
          }}
          onClose={() => setShowPratinjau(false)}
        />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function KeuanganPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [riwayatList, setRiwayatList] = useState<RiwayatPembayaran[]>([]);
  const [potonganList, setPotonganList] = useState<PotonganData[]>([]);
  const [summary, setSummary] = useState({
    jumlah_tagihan: 0,
    total_belum_dibayar: 0,
    periode_berakhir: 0,
    potongan_berikutnya: 0,
  });

  const [mainTab, setMainTab] = useState<MainTab>("Tagihan");
  const [pageView, setPageView] = useState<PageView>("list");
  const [activeTab, setActiveTab] = useState<TabKey>("Semua");
  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState("Tipe");
  const [tahun, setTahun] = useState("Tahun");
  const [bulan, setBulan] = useState("Bulan");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [pengembalianInvoice, setPengembalianInvoice] = useState<Invoice | null>(null);
  const [catatBayarInvoice, setCatatBayarInvoice] = useState<Invoice | null>(null);
  const [lihatDetailInvoice, setLihatDetailInvoice] = useState<Invoice | null>(null);
  const [cetakInvoiceData, setCetakInvoiceData] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previousTab, setPreviousTab] = useState<MainTab>("Tagihan");
  const [prefillData, setPrefillData] = useState<{ anak: string; wali: string; potongan?: number; childId?: string; guardianId?: string } | null>(null);
  const [selectedBuktiUrl, setSelectedBuktiUrl] = useState<string | null>(null);
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // Confirmation Pop-up state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: "primary" | "danger";
    action?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [backendTotalPages, setBackendTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const activeRequestIdRef = useRef(0);
  const cacheRef = useRef<Record<string, {
    invoices: Invoice[];
    summary: any;
    totalPages: number;
    total: number;
  }>>({});
  const ITEMS_PER_PAGE = 10;

  // Debounce search input (300ms) to avoid server bombardment and race conditions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBack = () => {
    setPageView("list");
    setMainTab(previousTab);
    setEditingInvoice(null);
    setPrefillData(null);
    if (typeof window !== "undefined" && window.history.state?.view) {
      window.history.back();
    }
  };

  const handleSaveInvoice = async (invData: any) => {
    try {
      setIsSubmittingInvoice(true);
      if ((pageView === "edit-tagihan" || editingInvoice) && editingInvoice) {
        await updateInvoice(editingInvoice.id, invData);
        showSuccessToast("Tagihan berhasil diperbarui!", "Berhasil");
      } else {
        await createInvoice(invData);
        showSuccessToast("Tagihan berhasil dibuat!", "Berhasil");
      }
      cacheRef.current = {};
      await fetchInvoicesData(currentPage, debouncedSearch, activeTab, true);
      handleBack();
    } catch (e: any) {
      handleApiError(e, editingInvoice ? "Gagal memperbarui tagihan" : "Gagal membuat tagihan");
      throw e;
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      await deleteInvoice(invoiceId);
      showSuccessToast("Invoice berhasil dihapus", "Berhasil");
      cacheRef.current = {};
      fetchInvoicesData(currentPage, debouncedSearch, activeTab, true);
    } catch (e: any) {
      showErrorToast(e.message || "Gagal menghapus invoice", "Error");
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setPageView("list");
      setMainTab(previousTab);
      setEditingInvoice(null);
      setPrefillData(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [previousTab]);

  // Load backend invoices data with caching, cancellation guard, and no desync
  const fetchInvoicesData = async (
    targetPage = currentPage,
    targetSearch = debouncedSearch,
    targetTab = activeTab,
    forceRefresh = false
  ) => {
    const requestId = ++activeRequestIdRef.current;
    const cacheKey = `${targetTab}_${targetSearch}_${tipe}_${tahun}_${bulan}_${targetPage}`;

    if (!forceRefresh && cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setInvoices(cached.invoices);
      if (cached.summary) setSummary(cached.summary);
      setBackendTotalPages(cached.totalPages);
      setTotalData(cached.total);
      setIsLoadingInvoices(false);
      return;
    }

    setIsLoadingInvoices(true);

    try {
      const res = await getInvoices({
        status_tab: targetTab,
        tipe,
        tahun,
        bulan,
        search: targetSearch,
        page: targetPage,
        per_page: ITEMS_PER_PAGE,
      });

      if (activeRequestIdRef.current !== requestId) return;

      if (res) {
        if (res.summary) setSummary(res.summary);
        if (res.invoices) {
          const mapped: Invoice[] = (res.invoices.data || []).map((inv: any) => ({
            id: inv.id,
            no_invoice: inv.no_invoice,
            anak: inv.child?.child_name || "—",
            wali: inv.guardian?.guardian_name || "—",
            child_id: inv.child_id,
            guardian_id: inv.guardian_id,
            tipe: inv.type,
            periode: inv.period_label,
            total: parseFloat(inv.total_amount || 0),
            subtotal: parseFloat(inv.subtotal_amount || 0),
            tanggal_terbit: inv.issued_date ? new Date(inv.issued_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—",
            status: inv.status as InvoiceStatus,
            potongan: parseFloat(inv.discount_amount || 0),
            terapiRows: (inv.items || []).map((it: any) => ({
              id: it.id,
              jenis: it.therapy_type,
              jumlah_sesi: it.session_count,
              harga_sesi: parseFloat(it.price_per_session || 0),
            })),
            pembayaran: inv.payments && inv.payments.length > 0 ? {
              tanggal: inv.payments[0].payment_date
                ? (() => {
                  const raw = String(inv.payments[0].payment_date);
                  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
                  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
                  const d = new Date(raw);
                  if (!isNaN(d.getTime())) {
                    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                  }
                  return raw;
                })()
                : "—",
              metode: inv.payments[0].payment_method,
              noResi: inv.payments[0].receipt_number || "",
              buktiUrl: inv.payments[0].proof_file_path || inv.payments[0].bukti_url || inv.payments[0].proof_url || inv.payments[0].bukti || undefined,
            } : undefined,
          }));

          const totalPages = res.invoices.last_page || 1;
          const total = res.invoices.total || 0;

          setInvoices(mapped);
          setBackendTotalPages(totalPages);
          setTotalData(total);

          cacheRef.current[cacheKey] = {
            invoices: mapped,
            summary: res.summary,
            totalPages,
            total,
          };
        }
      }
    } catch (err) {
      console.error("Gagal memuat data tagihan:", err);
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoadingInvoices(false);
      }
    }
  };

  // Reset page to 1 when filters change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [activeTab, debouncedSearch, tipe, tahun, bulan]);

  // Fetch when filters or page change
  useEffect(() => {
    fetchInvoicesData(currentPage, debouncedSearch, activeTab);
  }, [activeTab, debouncedSearch, tipe, tahun, bulan, currentPage]);

  useEffect(() => {
    async function loadSessionCredits() {
      try {
        const creditData = await getCredits();
        if (creditData && creditData.items) {
          const mappedCredits: PotonganData[] = creditData.items.map((c: any) => ({
            id: c.id,
            anak: c.anak,
            wali: c.wali,
            jumlah: c.jumlah,
          }));
          setPotonganList(mappedCredits);
        }
      } catch (err) {
        console.warn("Gagal memuat session credits:", err);
      }
    }
    loadSessionCredits();
  }, []);

  const lunasInvoices = invoices.filter((i) => i.status === "LUNAS");

  // Summary stats — jumlah tagihan, belum dibayar, lunas, dan total keseluruhan
  const jumlahTagihan = totalData;
  const totalBelumDibayar = summary.total_belum_dibayar;
  const totalLunas = invoices
    .filter((i) => i.status === "LUNAS")
    .reduce((sum, i) => sum + i.total, 0);
  const grandTotal = totalBelumDibayar + totalLunas;

  const handleExport = () => {
    const headers = ["No. invoice", "Tipe", "Anak", "Orang tua", "Periode", "Tanggal terbit", "Total tagihan", "Status"];
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;

    invoices.forEach((inv) => {
      const displayStatus = inv.status === "BELUM DIBAYAR" ? "Belum Dibayar" : "Lunas";
      tableHtml += `<tr><td>${inv.no_invoice}</td><td>${inv.tipe}</td><td>${inv.anak}</td><td>${inv.wali}</td><td>${inv.periode}</td><td>${inv.tanggal_terbit}</td><td>${inv.total}</td><td>${displayStatus}</td></tr>`;
    });
    tableHtml += `</tbody></table></body></html>`;

    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Data_Keuangan.xls");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccessToast("Data berhasil diexport ke Excel!", "Berhasil");
  };

  return (
    <>
      <div className="min-h-screen bg-[#F8FAFA] p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          {pageView === "buat-tagihan" || pageView === "edit-tagihan" ? (
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2.5 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight">
                  {pageView === "edit-tagihan" ? "Edit Tagihan" : "Buat Tagihan Baru"}
                </h1>
                <p className="text-sm font-medium text-gray-400">
                  {pageView === "edit-tagihan" ? "Perbarui detail tagihan anak." : "Buat tagihan untuk anak berdasarkan sesi terapi."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-2xl bg-[#2B7A75]/10">
                <Wallet size={22} className="text-[#2B7A75]" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight">
                  Manajemen Keuangan
                </h1>
                <p className="text-sm font-medium text-gray-400">
                  Kelola tagihan, catat pembayaran, dan pantau riwayat keuangan klinik.
                </p>
              </div>
            </div>
          )}
        </div>

        {(pageView !== "buat-tagihan" && pageView !== "edit-tagihan") && (
          <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] p-2 mb-6 flex gap-2">
            <button
              onClick={() => {
                setMainTab("Tagihan");
                setPreviousTab("Tagihan");
                setPageView("list");
              }}
              id="tab-tagihan"
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${mainTab === "Tagihan" ? "bg-[#1E5C58] text-white shadow-md shadow-teal-700/20" : "bg-transparent text-gray-400 hover:bg-gray-50"
                }`}
            >
              <FileText size={16} /> Tagihan
            </button>
            <button
              onClick={() => {
                setMainTab("Pembayaran");
                setPreviousTab("Pembayaran");
                setPageView("list");
              }}
              id="tab-pembayaran"
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${mainTab === "Pembayaran" ? "bg-[#1E5C58] text-white shadow-md shadow-teal-700/20" : "bg-transparent text-gray-400 hover:bg-gray-50"
                }`}
            >
              <CreditCard size={16} />
              Riwayat Transaksi
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {pageView === "buat-tagihan" || pageView === "edit-tagihan" ? (
            <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
              <BuatTagihanForm
                key={pageView + (editingInvoice?.id ?? "")}
                initialData={pageView === "edit-tagihan" && editingInvoice ? editingInvoice : undefined}
                prefillData={prefillData}
                onBack={handleBack}
                onSave={handleSaveInvoice}
                isSubmitting={isSubmittingInvoice}
              />
            </div>
          ) : mainTab === "Tagihan" ? (
            <motion.div
              key="tagihan-list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] overflow-hidden"
            >
              {/* Status Tabs */}
              <div className="flex items-center gap-1 px-4 pt-3.5 overflow-x-auto no-scrollbar border-b border-gray-100">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (activeTab === tab) return;
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                    id={`status-tab-${tab.toLowerCase().replace(/ /g, "-")}`}
                    className={`cursor-pointer whitespace-nowrap px-3 py-2 text-xs font-semibold transition-all border-b-2 ${activeTab === tab
                      ? "border-[#2B7A75] text-[#1E5C58] font-bold"
                      : "border-transparent text-gray-400 hover:text-[#2B7A75]"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Filters Bar */}
              <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto border-b border-gray-100 no-scrollbar">
                {/* Semua tipe */}
                <div className="relative shrink-0">
                  <select
                    id="filter-tipe"
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                  >
                    <option>Tipe</option>
                    <option>Bulanan</option>
                    <option>Paket Durasi</option>
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <div className="relative shrink-0">
                  <select
                    id="filter-tahun"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                  >
                    <option>Tahun</option>
                    <option>2025</option>
                    <option>2026</option>
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <div className="relative shrink-0">
                  <select
                    id="filter-bulan"
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                  >
                    <option>Bulan</option>
                    {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Group Search Box, Export & Buat tagihan on the right */}
                <div className="flex items-center gap-2 ml-auto shrink-0 whitespace-nowrap">
                  {/* Search box — compact width */}
                  <div className="relative w-[210px]">
                    <Search
                      size={14}
                      className="absolute text-gray-300 -translate-y-1/2 pointer-events-none left-3 top-1/2"
                    />
                    <input
                      id="search-invoice"
                      type="text"
                      placeholder="Cari anak, wali, invoice"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all"
                    />
                  </div>

                  <button
                    id="btn-export"
                    onClick={handleExport}
                    className="cursor-pointer flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Download size={14} />
                    Export
                  </button>
                  <button
                    id="btn-buat-tagihan"
                    onClick={() => {
                      setPreviousTab("Tagihan");
                      setPrefillData(null);
                      setEditingInvoice(null);
                      setPageView("buat-tagihan");
                      if (typeof window !== "undefined") {
                        window.history.pushState({ view: "buat-tagihan", fromTab: "Tagihan" }, "");
                      }
                    }}
                    className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 bg-[#1E5C58] text-white rounded-xl text-xs font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors"
                  >
                    <Plus size={14} />
                    Buat tagihan
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${search}-${tipe}-${tahun}-${bulan}-${currentPage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Table */}
                  <div className="overflow-x-auto no-scrollbar min-h-[300px]">
                    <table className="w-full text-xs table-fixed">
                      <thead>
                        <tr className="border-gray-100 border-y bg-gray-50/60">
                          <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-gray-400 w-[15%]">
                            No. Invoice
                          </th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-gray-400 w-[18%]">
                            Anak
                          </th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-gray-400 w-[17%]">
                            Periode
                          </th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-gray-400 w-[14%]">
                            Total
                          </th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-gray-400 w-[15%]">
                            Tanggal Terbit
                          </th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-gray-400 w-[9%]">
                            Status
                          </th>
                          <th className="px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider text-gray-400 w-[9%]">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingInvoices ? (
                          Array.from({ length: 5 }).map((_, idx) => (
                            <tr key={`skel-${idx}`} className="border-b border-gray-100">
                              <td className="px-4 py-3">
                                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-24 mb-1.5" />
                                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-16" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-28 mb-1.5" />
                                <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-24" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-20" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-20" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-3.5 bg-gray-200 rounded animate-pulse w-14" />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="w-12 h-6 mx-auto bg-gray-100 rounded-lg animate-pulse" />
                              </td>
                            </tr>
                          ))
                        ) : invoices.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-16 text-center">
                              <div className="flex flex-col items-center gap-2.5">
                                <Filter size={32} className="text-gray-300" strokeWidth={1.5} />
                                <p className="text-xs font-semibold text-gray-400">
                                  Tidak Ada Data Yang Ditemukan
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          invoices.map((inv) => (
                            <tr
                              key={inv.id}
                              className="transition-colors border-b border-gray-100 hover:bg-teal-50/20 group"
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-bold text-[#1E5C58] text-[11px] truncate">
                                    {inv.no_invoice}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                    {inv.tipe}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-xs font-bold text-gray-800 truncate">
                                    {inv.anak}
                                  </p>
                                  <span className="mt-0.5 inline-flex max-w-[140px] truncate rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                                    Wali: {inv.wali}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
                                  <Calendar size={13} className="text-[#2B7A75] shrink-0" />
                                  <span className="truncate">{inv.periode}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs font-extrabold text-gray-800">
                                  {formatRupiah(inv.total)}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                                  <Clock size={13} className="text-gray-300 shrink-0" />
                                  <span className="truncate">{inv.tanggal_terbit}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={inv.status} />
                              </td>
                              <ActionDropdown
                                item={inv}
                                openDropdownId={openDropdownId}
                                setOpenDropdownId={setOpenDropdownId}
                                onPengembalian={setPengembalianInvoice}
                                onCatatBayar={setCatatBayarInvoice}
                                onLihatDetail={setLihatDetailInvoice}
                                onEdit={(i) => {
                                  setPreviousTab("Tagihan");
                                  setEditingInvoice(i);
                                  setPrefillData(null);
                                  setPageView("edit-tagihan");
                                  if (typeof window !== "undefined") {
                                    window.history.pushState({ view: "edit-tagihan", fromTab: "Tagihan" }, "");
                                  }
                                }}
                                onLihatBukti={(url) => setSelectedBuktiUrl(url)}
                                onCetakInvoice={setCetakInvoiceData}
                                onHapus={handleDeleteInvoice}
                              />
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  {!isLoadingInvoices && totalData > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-gray-100 bg-[#F4F9F8]/60">
                      {/* Jumlah Tagihan */}
                      <div className="px-5 py-3.5 border-r border-gray-100">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">Jumlah Tagihan</p>
                        <p className="text-base font-extrabold text-[#1E5C58]">{jumlahTagihan}</p>
                      </div>
                      {/* Belum Dibayar */}
                      <div className="px-5 py-3.5 border-r border-gray-100">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">Belum Dibayar</p>
                        <p className="text-base font-extrabold text-red-500">
                          {formatRupiah(totalBelumDibayar)}
                        </p>
                      </div>
                      {/* Lunas */}
                      <div className="px-5 py-3.5 border-r border-gray-100">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">Lunas</p>
                        <p className="text-base font-extrabold text-emerald-600">{formatRupiah(totalLunas)}</p>
                      </div>
                      {/* Total */}
                      <div className="px-5 py-3.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-0.5">Total</p>
                        <p className="text-base font-extrabold text-[#1E5C58]">{formatRupiah(grandTotal)}</p>
                      </div>
                    </div>
                  )}

                  {backendTotalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Menampilkan <span className="font-semibold text-gray-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga{" "}
                        <span className="font-semibold text-gray-800">
                          {Math.min(currentPage * ITEMS_PER_PAGE, totalData)}
                        </span>{" "}
                        dari <span className="font-semibold text-gray-800">{totalData}</span> data
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={isLoadingInvoices || currentPage === 1}
                          className="p-1 text-gray-500 transition-colors border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="px-1.5 text-xs font-medium text-gray-700">
                          Halaman {currentPage} dari {backendTotalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, backendTotalPages))}
                          disabled={isLoadingInvoices || currentPage >= backendTotalPages}
                          className="p-1 text-gray-500 transition-colors border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <TabPembayaran
              data={potonganList}
              riwayatList={riwayatList}
              onLihatBukti={(url) => setSelectedBuktiUrl(url)}
              onBuatTagihan={(anak, wali, childId, guardianId) => {
                setPreviousTab("Pembayaran");
                const potItem = potonganList.find((p) => p.anak === anak);
                setPrefillData({
                  anak,
                  wali,
                  potongan: potItem?.jumlah,
                  childId: childId || potItem?.child_id,
                  guardianId: guardianId || potItem?.guardian_id,
                });
                setEditingInvoice(null);
                setPageView("buat-tagihan");
                if (typeof window !== "undefined") {
                  window.history.pushState({ view: "buat-tagihan", fromTab: "Pembayaran" }, "");
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {pengembalianInvoice && (
        <PengembalianDanaModal
          invoice={pengembalianInvoice}
          lunasInvoices={lunasInvoices}
          onClose={() => setPengembalianInvoice(null)}
          onSave={(invId, mode, data) => {
            const targetInv = invoices.find((i) => i.id === invId) || pengembalianInvoice;
            setInvoices((prev) =>
              prev.map((inv) => {
                if (inv.id !== invId) return inv;
                if (mode === "dikembalikan") {
                  return {
                    ...inv,
                    status: "LUNAS",
                    pengembalian: { tanggal: data.tanggal, jumlah: data.jumlah },
                  };
                } else {
                  return {
                    ...inv,
                    status: "LUNAS",
                    periodeBerikutnya: { tanggal: data.tanggal, jumlah: data.jumlah },
                  };
                }
              })
            );

            // Tambahkan catatan transaksi ke Riwayat Transaksi
            const newRiwayat: RiwayatPembayaran = {
              id: `riwayat-${Date.now()}`,
              tanggal: data.tanggal,
              noInvoice: targetInv.no_invoice,
              anak: targetInv.anak,
              wali: targetInv.wali,
              status: mode === "dikembalikan" ? "Dikembalikan" : "Periode selanjutnya",
              metode: (data.metode as any) || "-",
              bukti: data.bukti || "-",
              jumlah: data.jumlah,
            };
            setRiwayatList((prev) => [newRiwayat, ...(prev ?? [])]);

            // Jika dialihkan ke periode berikutnya -> tambahkan ke potongan untuk tagihan berikutnya
            if (mode === "catat") {
              setPotonganList((prev) => {
                const existingIndex = prev.findIndex((p) => p.anak === targetInv.anak);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    jumlah: updated[existingIndex].jumlah + data.jumlah,
                  };
                  return updated;
                } else {
                  return [
                    {
                      id: `pot-${Date.now()}`,
                      anak: targetInv.anak,
                      wali: targetInv.wali,
                      jumlah: data.jumlah,
                    },
                    ...prev,
                  ];
                }
              });
            }
          }}
          onRefresh={() => {
            cacheRef.current = {};
            fetchInvoicesData(currentPage, debouncedSearch, activeTab, true);
          }}
        />
      )}

      {catatBayarInvoice && (
        <CatatBayarModal
          invoice={catatBayarInvoice}
          onClose={() => setCatatBayarInvoice(null)}
          onRefresh={() => {
            cacheRef.current = {};
            fetchInvoicesData(currentPage, debouncedSearch, activeTab, true);
          }}
        />
      )}

      {lihatDetailInvoice && (
        <LihatDetailModal
          invoice={lihatDetailInvoice}
          onClose={() => setLihatDetailInvoice(null)}
          onLihatBukti={(url) => setSelectedBuktiUrl(url)}
          onCetakInvoice={() => {
            const current = lihatDetailInvoice;
            setLihatDetailInvoice(null);
            setCetakInvoiceData(current);
          }}
        />
      )}

      {cetakInvoiceData && (
        <CetakInvoiceModal
          invoice={cetakInvoiceData}
          onClose={() => setCetakInvoiceData(null)}
        />
      )}

      {selectedBuktiUrl && (
        <BuktiTransferModal
          buktiUrl={selectedBuktiUrl}
          onClose={() => setSelectedBuktiUrl(null)}
        />
      )}

      <ConfirmDialogModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        confirmVariant={confirmState.confirmVariant}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          const act = confirmState.action;
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          if (act) await act();
        }}
      />
    </>
  );
}
