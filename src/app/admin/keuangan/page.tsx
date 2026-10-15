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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TabPembayaran, { PotonganData } from "@/components/keuangan/TabPembayaran";
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
} from "@/lib/api/keuangan";
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

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: InvoiceStatus }) {
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

  const c = config[status] || { label: status, className: "text-gray-600 font-extrabold" };
  return (
    <span className={`inline-flex items-center text-xs ${c.className}`}>
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
          <h3 className="text-base font-extrabold text-gray-900 mb-2">{title}</h3>
          <p className="text-xs font-medium text-gray-500 mb-6 leading-relaxed">{message}</p>

          <div className="flex items-center gap-3 w-full">
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
  const fullUrl = buktiUrl.startsWith("http")
    ? buktiUrl
    : `${process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage"}/${buktiUrl.replace(/^\//, "")}`;

  const isPdf = fullUrl.toLowerCase().endsWith(".pdf");

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
            ) : (
              <img src={fullUrl} alt="Bukti Transfer" className="max-w-full max-h-[450px] object-contain rounded-xl shadow-sm border border-gray-200" />
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
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
function PengembalianDanaModal({
  invoice,
  lunasInvoices,
  onClose,
  onRefresh,
}: {
  invoice: Invoice;
  lunasInvoices: Invoice[];
  onClose: () => void;
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
                      {inv.no_invoice} – {inv.anak} ({inv.periode})
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2" />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Kehadiran selama periode</p>
              <div className="h-px bg-gradient-to-r from-[#2B7A75]/60 to-transparent mb-3" />
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
                  dari {totalSesi} sesi
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
              <p className="mb-2 text-xs font-bold text-gray-500">Sisa sesi mau diapakan?</p>
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
                  Nilainya otomatis jadi potongan di tagihan periode berikutnya.
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
                <ChevronDown size={15} className="text-gray-400 shrink-0 ml-2" />
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
            <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-200">
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
function LihatDetailModal({
  invoice,
  onClose,
  onCetakInvoice,
  onLihatBukti,
}: {
  invoice: Invoice;
  onClose: () => void;
  onCetakInvoice: () => void;
  onLihatBukti?: (url: string) => void;
}) {
  const statusLabelMap: Record<InvoiceStatus, string> = {
    LUNAS: "Lunas",
    "BELUM DIBAYAR": "Belum dibayar",
    "PERIODE BERIKUTNYA": "Periode berikutnya",
    DIKEMBALIKAN: "Dikembalikan",
    BERJALAN: "Berjalan",
  };
  const statusClassMap: Record<InvoiceStatus, string> = {
    LUNAS: "bg-emerald-50 text-emerald-600 border-emerald-100",
    "BELUM DIBAYAR": "bg-red-50 text-red-500 border-red-100",
    "PERIODE BERIKUTNYA": "bg-orange-50 text-orange-500 border-orange-100",
    DIKEMBALIKAN: "bg-teal-50 text-[#2B7A75] border-teal-100",
    BERJALAN: "bg-teal-50 text-teal-600 border-teal-100",
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
              {invoice.pembayaran ? (
                <div className="p-3.5 bg-[#F4F9F8] rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Tanggal</span><span className="font-semibold text-gray-800">{invoice.pembayaran.tanggal}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">Metode</span><span className="font-semibold text-gray-800">{invoice.pembayaran.metode}</span></div>
                  {invoice.pembayaran.noResi && (
                    <div className="flex justify-between"><span className="text-gray-500 font-medium">No. resi</span><span className="font-semibold text-gray-800">{invoice.pembayaran.noResi}</span></div>
                  )}
                  {invoice.pembayaran.buktiUrl && onLihatBukti && (
                    <div className="flex justify-between items-center pt-1 border-t border-[#2B7A75]/10">
                      <span className="text-gray-500 font-medium">Bukti Pembayaran</span>
                      <button
                        type="button"
                        onClick={() => onLihatBukti(invoice.pembayaran!.buktiUrl!)}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E5C58] text-white text-xs font-bold rounded-lg hover:bg-[#174d49] transition-colors"
                      >
                        <FileText size={13} />
                        Lihat Bukti Transfer
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-[#2B7A75]/10">
                    <span className="font-extrabold text-[#1E5C58]">Jumlah dibayar</span>
                    <span className="font-extrabold text-[#1E5C58]">{formatRupiah(invoice.total)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 font-medium italic">Belum ada pembayaran.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-extrabold text-[#1E5C58] mb-3">Invoice</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
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
  const statusColorMap: Record<InvoiceStatus, string> = {
    LUNAS: "#059669", "BELUM DIBAYAR": "#ef4444",
    "PERIODE BERIKUTNYA": "#f97316", DIKEMBALIKAN: "#2B7A75", BERJALAN: "#0d9488",
  };

  const handleCetak = () => {
    const content = document.getElementById("receipt-print-inner");
    if (!content) return;
    const newWin = window.open("", "_blank", "width=420,height=700,toolbar=0,scrollbars=1,status=0");
    if (!newWin) return;
    newWin.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice.no_invoice}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:11px;padding:16px;max-width:300px;margin:0 auto}.center{text-align:center}.divider-dash{border:none;border-top:1px dashed #ccc;margin:8px 0}.divider-solid{border:none;border-top:1px solid #999;margin:8px 0}.row{display:flex;justify-content:space-between;margin:2px 0;font-size:10px}.bold{font-weight:700}.total-row{display:flex;justify-content:space-between;font-weight:900;font-size:13px;margin:6px 0}.item{margin:4px 0}.item-name{font-weight:700;font-size:10px}.item-detail{display:flex;justify-content:space-between;font-size:10px;color:#555}</style>
    </head><body>${content.innerHTML}<script>window.print();window.onafterprint=function(){window.close();};<\/script></body></html>`);
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

          <div className="flex-1 overflow-y-auto p-5">
            <div id="receipt-print-inner" className="bg-white border border-dashed border-gray-300 rounded-xl p-5 mx-auto shadow-sm"
              style={{ maxWidth: 290, fontFamily: "'Courier New', Courier, monospace" }}>
              <div className="text-center mb-3">
                <p className="text-base font-black text-gray-900 tracking-wide" style={{ fontFamily: "sans-serif" }}>PUSPA</p>
                <p className="text-[9px] text-gray-500" style={{ fontFamily: "sans-serif" }}>Holistic Integrative Care</p>
                <p className="text-[9px] text-gray-400 mt-0.5" style={{ fontFamily: "sans-serif" }}>Rek. BCA 000-000-0000 a.n. Puspa</p>
              </div>
              <div className="border-t border-dashed border-gray-300 my-2.5" />
              <div className="text-center mb-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">No. Invoice</p>
                <p className="text-[11px] font-bold text-gray-800 mt-0.5">{invoice.no_invoice}</p>
              </div>
              <div className="border-t border-dashed border-gray-300 my-2.5" />
              <div className="space-y-1 mb-2">
                {[{ label: "Anak", value: invoice.anak }, { label: "Wali", value: invoice.wali }, { label: "Periode", value: invoice.periode }, { label: "Terbit", value: invoice.tanggal_terbit }].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-[10px]">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-bold text-gray-800 text-right" style={{ maxWidth: 170 }}>{value}</span>
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
              <div className="flex justify-between font-black text-sm text-gray-900">
                <span>TOTAL</span>
                <span>{formatRupiah(invoice.total)}</span>
              </div>
              <div className="flex justify-between items-center mt-1 text-[10px]">
                <span className="text-gray-400">Status</span>
                <span className="font-extrabold" style={{ color: statusColorMap[invoice.status] || "#1E5C58" }}>{invoice.status}</span>
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

          <div className="px-5 pb-5 pt-3 border-t border-gray-100 shrink-0 flex gap-3">
            <button type="button" onClick={onClose} className="cursor-pointer flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">Tutup</button>
            <button id="btn-cetak-struk" type="button" onClick={handleCetak} className="cursor-pointer flex-1 py-2.5 bg-[#1E5C58] text-white rounded-xl text-sm font-bold hover:bg-[#174d49] shadow-sm transition-colors flex items-center justify-center gap-2"><Printer size={14} />Cetak</button>
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
    <td className="px-6 py-4 text-right">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-teal-100 rounded-xl text-[#1E5C58] hover:bg-teal-50/40 text-xs font-semibold transition-colors"
      >
        <span>Aksi</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
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
}: {
  onBack: () => void;
  onSave: (invData: any) => void;
  initialData?: Invoice;
}) {
  const [childrenList, setChildrenList] = useState<ChildGuardianItem[]>([]);
  const [tipeTagihan, setTipeTagihan] = useState<"Bulanan" | "Paket Durasi">(initialData?.tipe ?? "Bulanan");

  const [selectedChildId, setSelectedChildId] = useState(initialData?.child_id ?? "");
  const [selectedGuardianId, setSelectedGuardianId] = useState(initialData?.guardian_id ?? "");
  const [selectedWaliName, setSelectedWaliName] = useState(initialData?.wali ?? "");
  const [selectedAnakName, setSelectedAnakName] = useState(initialData?.anak ?? "");

  // Load children list from Backend API
  useEffect(() => {
    const fetchList = async () => {
      const data = await getChildrenWithGuardians();
      setChildrenList(data);

      if (initialData?.child_id) {
        const found = data.find((c) => c.child_id === initialData.child_id);
        if (found) {
          setSelectedChildId(found.child_id);
          setSelectedGuardianId(found.guardian_id);
          setSelectedWaliName(found.guardian_name);
          setSelectedAnakName(found.child_name);
        }
      }
    };
    fetchList();
  }, [initialData]);

  // Child selection handler: auto-populates Guardian
  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    const item = childrenList.find((c) => c.child_id === childId);
    if (item) {
      setSelectedAnakName(item.child_name);
      setSelectedGuardianId(item.guardian_id);
      setSelectedWaliName(item.guardian_name);
      setErrors((prev) => ({ ...prev, anak: false, wali: false }));
    }
  };

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

  const [potongan, setPotongan] = useState<number | "">(initialData?.potongan ?? "");
  const [catatan, setCatatan] = useState("");

  const [errors, setErrors] = useState<{
    wali?: boolean;
    anak?: boolean;
    periode?: boolean;
    tanggalMulai?: boolean;
    tanggalSelesai?: boolean;
    terapi?: { id: string; field: keyof TerapiRow }[];
  }>({});

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
    setTerapiRows((rows) => rows.filter((r) => r.id !== id));
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all";

  const selectClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all cursor-pointer appearance-none";

  const handleSimpan = () => {
    const newErrors: typeof errors = { terapi: [] };
    let hasError = false;

    if (!selectedChildId) { newErrors.anak = true; hasError = true; }
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
      return;
    }

    const payload = {
      child_id: selectedChildId,
      guardian_id: selectedGuardianId,
      type: tipeTagihan,
      period_label: periodeLabel,
      start_date: isPaket ? tanggalMulai : null,
      end_date: isPaket ? tanggalSelesai : null,
      discount: Number(potongan) || 0,
      notes: catatan,
      items: terapiRows.map((r) => ({
        therapy_type: r.jenis,
        session_count: Number(r.jumlah_sesi),
        price_per_session: Number(r.harga_sesi),
      })),
    };

    onSave(payload);
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
        <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
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
              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-500">
                  Pilih Anak
                </label>
                <div className="relative">
                  <select
                    id="select-anak"
                    value={selectedChildId}
                    onChange={(e) => handleChildChange(e.target.value)}
                    className={`${selectClass} ${errors.anak ? "!border-red-500 !ring-red-500/20 !bg-red-50" : ""}`}
                  >
                    <option value="" disabled>Pilih Anak</option>
                    {childrenList.map((c) => (
                      <option key={c.child_id} value={c.child_id}>
                        {c.child_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2" />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-500">
                  Orang tua / wali (Otomatis)
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedWaliName || "Pilih anak terlebih dahulu"}
                  className={`${inputClass} bg-gray-50 text-gray-700 cursor-default font-semibold`}
                />
              </div>
            </div>

            {tipeTagihan === "Bulanan" ? (
              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-500">
                  Periode (bulan)
                </label>
                <div className="relative max-w-xs">
                  <input
                    id="input-periode-bulan"
                    type="month"
                    value={periode}
                    onChange={(e) => { setPeriode(e.target.value); setErrors(prev => ({ ...prev, periode: false })); }}
                    className={`${inputClass} cursor-pointer pr-10 ${!periode ? "text-transparent" : ""} ${errors.periode ? "!border-red-500 !ring-red-500/20 !bg-red-50" : ""}`}
                  />
                  {!periode && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                      mm/yyyy
                    </span>
                  )}
                  <Calendar size={16} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2" />
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
                      className={`${inputClass} cursor-pointer pr-10 ${errors.tanggalMulai ? "!border-red-500 !ring-red-500/20 !bg-red-50" : ""}`}
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
                      className={`${inputClass} cursor-pointer pr-10 ${errors.tanggalSelesai ? "!border-red-500 !ring-red-500/20 !bg-red-50" : ""}`}
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
          </div>

          <div className="p-5 space-y-3">
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Jenis terapi</span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Jumlah sesi</span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">{isPaket ? "Harga paket" : "Harga / sesi"}</span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Subtotal</span>
              <span className="w-6" />
            </div>

            <AnimatePresence>
              {terapiRows.map((row, idx) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center"
                >
                  <div className="relative">
                    <select
                      id={`jenis-terapi-${idx}`}
                      value={row.jenis}
                      onChange={(e) => updateTerapiRow(row.id, "jenis", e.target.value)}
                      className={selectClass}
                    >
                      <option value="" disabled>Pilih Jenis Terapi</option>
                      {JENIS_TERAPI_OPTIONS.map((j) => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2" />
                  </div>

                  <input
                    id={`jumlah-sesi-${idx}`}
                    type="number"
                    min={1}
                    value={row.jumlah_sesi}
                    placeholder="Jumlah sesi"
                    onChange={(e) => updateTerapiRow(row.id, "jumlah_sesi", e.target.value === "" ? "" : Number(e.target.value))}
                    className={inputClass}
                  />

                  <input
                    id={`harga-sesi-${idx}`}
                    type="number"
                    min={0}
                    value={row.harga_sesi}
                    placeholder={isPaket ? "Harga paket" : "Harga/sesi"}
                    onChange={(e) => updateTerapiRow(row.id, "harga_sesi", e.target.value === "" ? "" : Number(e.target.value))}
                    className={inputClass}
                  />

                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-gray-800 whitespace-nowrap">
                      {formatRupiah(rowSubtotal(row))}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeTerapiRow(row.id)}
                      disabled={terapiRows.length === 1}
                      className="text-red-400 transition-colors cursor-pointer hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              id="btn-tambah-terapi"
              onClick={addTerapiRow}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 border border-dashed border-[#2B7A75] rounded-xl text-sm font-semibold text-[#2B7A75] hover:bg-teal-50 transition-colors mt-1"
            >
              <Plus size={15} />
              Tambah terapi
            </button>
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
          <div className="flex items-center flex-wrap gap-3">
            <button
              id="btn-simpan-tagihan"
              type="button"
              onClick={handleSimpan}
              className="cursor-pointer px-6 py-2.5 bg-[#1E5C58] hover:bg-[#174d49] text-white rounded-xl text-sm font-bold shadow-sm shadow-teal-700/20 transition-colors"
            >
              {initialData ? "Simpan Perubahan" : "Simpan tagihan"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function KeuanganPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
  const [selectedBuktiUrl, setSelectedBuktiUrl] = useState<string | null>(null);

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
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Load backend invoices data
  const fetchInvoicesData = async () => {
    const res = await getInvoices({
      status_tab: activeTab,
      tipe,
      tahun,
      bulan,
      search,
      page: currentPage,
      per_page: ITEMS_PER_PAGE,
    });

    if (res) {
      if (res.summary) setSummary(res.summary);
      if (res.invoices) {
        const mapped = (res.invoices.data || []).map((inv: any) => ({
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
            tanggal: inv.payments[0].payment_date,
            metode: inv.payments[0].payment_method,
            noResi: inv.payments[0].receipt_number || "",
            buktiUrl: inv.payments[0].proof_file_path || undefined,
          } : undefined,
        }));
        setInvoices(mapped);
        setTotalPages(res.invoices.last_page || 1);
        setTotalData(res.invoices.total || 0);
      }
    }
  };

  useEffect(() => {
    fetchInvoicesData();
  }, [activeTab, search, tipe, tahun, bulan, currentPage]);

  const lunasInvoices = invoices.filter((i) => i.status === "LUNAS");

  const handleSaveInvoice = (payload: any) => {
    const isEdit = pageView === "edit-tagihan" && editingInvoice;
    setConfirmState({
      isOpen: true,
      title: isEdit ? "Konfirmasi Edit Tagihan" : "Konfirmasi Buat Tagihan",
      message: isEdit
        ? `Apakah Anda yakin ingin memperbarui tagihan ${editingInvoice.no_invoice}?`
        : "Apakah Anda yakin data tagihan baru yang dimasukkan sudah benar?",
      confirmText: isEdit ? "Ya, Perbarui" : "Ya, Simpan",
      confirmVariant: "primary",
      action: async () => {
        try {
          if (isEdit) {
            await updateInvoice(editingInvoice.id, payload);
            showSuccessToast("Tagihan berhasil diperbarui!", "Berhasil");
          } else {
            await createInvoice(payload);
            showSuccessToast("Tagihan berhasil dibuat!", "Berhasil");
          }
          setPageView("list");
          setEditingInvoice(null);
          fetchInvoicesData();
        } catch (e) {
          handleApiError(e, "Gagal menyimpan tagihan");
        }
      },
    });
  };

  const handleDeleteInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    setConfirmState({
      isOpen: true,
      title: "Konfirmasi Hapus Tagihan",
      message: `Apakah Anda yakin ingin menghapus tagihan ${inv?.no_invoice || ""}? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Ya, Hapus",
      confirmVariant: "danger",
      action: async () => {
        try {
          await deleteInvoice(id);
          showSuccessToast("Tagihan berhasil dihapus!", "Berhasil");
          fetchInvoicesData();
        } catch (e) {
          handleApiError(e, "Gagal menghapus tagihan");
        }
      },
    });
  };

  const handleExport = () => {
    const headers = ["No. invoice", "Tipe", "Anak", "Orang tua", "Periode", "Tanggal terbit", "Total tagihan", "Status"];
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;

    invoices.forEach((inv) => {
      tableHtml += `<tr><td>${inv.no_invoice}</td><td>${inv.tipe}</td><td>${inv.anak}</td><td>${inv.wali}</td><td>${inv.periode}</td><td>${inv.tanggal_terbit}</td><td>${inv.total}</td><td>${inv.status}</td></tr>`;
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
              <button onClick={() => setPageView("list")} className="p-2.5 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
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
              onClick={() => { setMainTab("Tagihan"); setPageView("list"); }}
              id="tab-tagihan"
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${mainTab === "Tagihan" ? "bg-[#1E5C58] text-white shadow-md shadow-teal-700/20" : "bg-transparent text-gray-400 hover:bg-gray-50"
                }`}
            >
              <FileText size={16} /> Tagihan
            </button>
            <button
              onClick={() => { setMainTab("Pembayaran"); setPageView("list"); }}
              id="tab-pembayaran"
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${mainTab === "Pembayaran" ? "bg-[#1E5C58] text-white shadow-md shadow-teal-700/20" : "bg-transparent text-gray-400 hover:bg-gray-50"
                }`}
            >
              <CreditCard size={16} /> Pembayaran
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {pageView === "buat-tagihan" || pageView === "edit-tagihan" ? (
            <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
              <BuatTagihanForm
                key={pageView}
                initialData={pageView === "edit-tagihan" && editingInvoice ? editingInvoice : undefined}
                onBack={() => setPageView("list")}
                onSave={handleSaveInvoice}
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
              <div className="flex items-center gap-1 px-4 pt-4 overflow-x-auto border-b border-gray-100">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                    id={`status-tab-${tab.toLowerCase().replace(/ /g, "-")}`}
                    className={`cursor-pointer whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === tab ? "border-[#2B7A75] text-[#1E5C58] font-bold" : "border-transparent text-gray-400 hover:text-[#2B7A75]"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 overflow-x-auto no-scrollbar">
                <div className="relative shrink-0">
                  <select
                    id="filter-tipe"
                    value={tipe}
                    onChange={(e) => { setTipe(e.target.value); setCurrentPage(1); }}
                    className="appearance-none pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                  >
                    <option>Tipe</option>
                    <option>Bulanan</option>
                    <option>Paket Durasi</option>
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <div className="relative shrink-0">
                  <select
                    id="filter-tahun"
                    value={tahun}
                    onChange={(e) => { setTahun(e.target.value); setCurrentPage(1); }}
                    className="appearance-none pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                  >
                    <option>Tahun</option>
                    <option>2025</option>
                    <option>2026</option>
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <div className="relative shrink-0">
                  <select
                    id="filter-bulan"
                    value={bulan}
                    onChange={(e) => { setBulan(e.target.value); setCurrentPage(1); }}
                    className="appearance-none pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                  >
                    <option>Bulan</option>
                    {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <div className="flex items-center gap-2.5 ml-auto shrink-0 whitespace-nowrap">
                  <div className="relative w-[240px]">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      id="search-invoice"
                      type="text"
                      placeholder="Cari anak, orang tua, invoice"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all"
                    />
                  </div>

                  <button id="btn-export" onClick={handleExport} className="cursor-pointer flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    <Download size={15} /> Export
                  </button>
                  <button id="btn-buat-tagihan" onClick={() => { setEditingInvoice(null); setPageView("buat-tagihan"); }} className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-[#1E5C58] text-white rounded-xl text-sm font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors">
                    <Plus size={15} /> Buat tagihan
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
                  <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr className="border-gray-100 border-y bg-gray-50/60">
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[16%]">No. Invoice</th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[18%]">Anak</th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[16%]">Periode</th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[14%]">Total</th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[16%]">Tanggal Terbit</th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[12%]">Status</th>
                          <th className="px-6 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[8%]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <Filter size={36} className="text-gray-300" strokeWidth={1.5} />
                                <p className="text-sm font-semibold text-gray-400">Tidak Ada Data Yang Ditemukan</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          invoices.map((inv) => (
                            <tr key={inv.id} className="transition-colors border-b border-gray-100 hover:bg-teal-50/20 group">
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-bold text-[#1E5C58] text-xs">{inv.no_invoice}</p>
                                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{inv.tipe}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-sm font-bold text-gray-800">{inv.anak}</p>
                                  <span className="mt-1 inline-flex max-w-[160px] truncate rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                                    Wali: {inv.wali}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
                                  <Calendar size={14} className="text-[#2B7A75] shrink-0" />
                                  <span>{inv.periode}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-extrabold text-gray-800">{formatRupiah(inv.total)}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                                  <Clock size={14} className="text-gray-300 shrink-0" />
                                  <span>{inv.tanggal_terbit}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={inv.status} />
                              </td>
                              <ActionDropdown
                                item={inv}
                                openDropdownId={openDropdownId}
                                setOpenDropdownId={setOpenDropdownId}
                                onPengembalian={setPengembalianInvoice}
                                onCatatBayar={setCatatBayarInvoice}
                                onLihatDetail={setLihatDetailInvoice}
                                onLihatBukti={(url) => setSelectedBuktiUrl(url)}
                                onEdit={(i) => { setEditingInvoice(i); setPageView("edit-tagihan"); }}
                                onCetakInvoice={setCetakInvoiceData}
                                onHapus={handleDeleteInvoice}
                              />
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-gray-100 bg-[#F4F9F8]/60">
                    <div className="px-6 py-5 border-r border-gray-100">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Jumlah Tagihan</p>
                      <p className="text-lg font-extrabold text-[#1E5C58]">{summary.jumlah_tagihan}</p>
                    </div>
                    <div className="px-6 py-5 border-r border-gray-100">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Belum Dibayar</p>
                      <p className="text-lg font-extrabold text-[#1E5C58]">{formatRupiah(summary.total_belum_dibayar)}</p>
                    </div>
                    <div className="px-6 py-5 border-r border-gray-100">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Periode Berakhir</p>
                      <p className="text-lg font-extrabold text-[#1E5C58]">{summary.periode_berakhir} tagihan</p>
                    </div>
                    <div className="px-6 py-5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Potongan Berikutnya</p>
                      <p className="text-lg font-extrabold text-[#1E5C58]">{formatRupiah(summary.potongan_berikutnya)}</p>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
                      <p className="text-sm text-gray-500">
                        Menampilkan Halaman <span className="font-semibold text-gray-800">{currentPage}</span> dari <span className="font-semibold text-gray-800">{totalPages}</span> ({totalData} data)
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-gray-700 px-2">
                          Halaman {currentPage} dari {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <TabPembayaran
              onBuatTagihan={(anak, wali, childId, guardianId) => {
                setEditingInvoice(null);
                setPageView("buat-tagihan");
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
          onRefresh={fetchInvoicesData}
        />
      )}

      {catatBayarInvoice && (
        <CatatBayarModal
          invoice={catatBayarInvoice}
          onClose={() => setCatatBayarInvoice(null)}
          onRefresh={fetchInvoicesData}
        />
      )}

      {lihatDetailInvoice && (
        <LihatDetailModal
          invoice={lihatDetailInvoice}
          onClose={() => setLihatDetailInvoice(null)}
          onLihatBukti={(url) => setSelectedBuktiUrl(url)}
          onCetakInvoice={() => {
            setLihatDetailInvoice(null);
            setCetakInvoiceData(lihatDetailInvoice);
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
