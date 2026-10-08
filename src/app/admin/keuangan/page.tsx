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

// ── Types ──────────────────────────────────────────────────────────────────────
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
  tipe: InvoiceType;
  periode: string;
  total: number;
  tanggal_terbit: string;
  status: InvoiceStatus;
}

interface TerapiRow {
  id: string;
  jenis: string;
  jumlah_sesi: number | "";
  harga_sesi: number | "";
}

// ── Dummy Data ────────────────────────────────────────────────────────────────
const dummyInvoices: Invoice[] = [
  {
    id: "1",
    no_invoice: "INV/2025/11/0000",
    anak: "Kenzo",
    wali: "Ibu Rina Wulandari",
    tipe: "Bulanan",
    periode: "November 2025",
    total: 1200000,
    tanggal_terbit: "28 Nov 2025",
    status: "LUNAS",
  },
  {
    id: "2",
    no_invoice: "INV/2026/08/0001",
    anak: "Alya",
    wali: "Bpk. Andi Pratama",
    tipe: "Bulanan",
    periode: "Agustus 2026",
    total: 1200000,
    tanggal_terbit: "25 Agu 2026",
    status: "DIKEMBALIKAN",
  },
  {
    id: "3",
    no_invoice: "INV/2026/08/0002",
    anak: "Raka",
    wali: "Bpk. Andi Pratama",
    tipe: "Bulanan",
    periode: "Agustus 2026",
    total: 700000,
    tanggal_terbit: "25 Agu 2026",
    status: "PERIODE BERIKUTNYA",
  },
  {
    id: "4",
    no_invoice: "INV/2026/09/0003",
    anak: "Zahra",
    wali: "Ibu Siti Nurhaliza",
    tipe: "Bulanan",
    periode: "September 2026",
    total: 1600000,
    tanggal_terbit: "25 Sep 2026",
    status: "LUNAS",
  },
  {
    id: "5",
    no_invoice: "INV/2026/09/0004",
    anak: "Kenzo",
    wali: "Ibu Rina Wulandari",
    tipe: "Bulanan",
    periode: "September 2026",
    total: 1900000,
    tanggal_terbit: "25 Sep 2026",
    status: "BELUM DIBAYAR",
  },
  {
    id: "6",
    no_invoice: "INV/2026/PKT/0005",
    anak: "Zahra",
    wali: "Ibu Siti Nurhaliza",
    tipe: "Paket Durasi",
    periode: "1 Okt 2026 – 31 Mar 2027 (181 hari)",
    total: 9600000,
    tanggal_terbit: "28 Sep 2026",
    status: "LUNAS",
  },
  {
    id: "7",
    no_invoice: "INV/2026/09/0006",
    anak: "Raka",
    wali: "Bpk. Andi Pratama",
    tipe: "Bulanan",
    periode: "September 2026",
    total: 525000,
    tanggal_terbit: "26 Sep 2026",
    status: "BELUM DIBAYAR",
  },
  {
    id: "8",
    no_invoice: "INV/2026/08/0007",
    anak: "Kenzo",
    wali: "Ibu Rina Wulandari",
    tipe: "Bulanan",
    periode: "Agustus 2026",
    total: 1200000,
    tanggal_terbit: "25 Agu 2026",
    status: "PERIODE BERIKUTNYA",
  },
];

const DUMMY_WALI = [
  "Ibu Rina Wulandari",
  "Bpk. Andi Pratama",
  "Ibu Siti Nurhaliza",
  "Bpk. Teguh Santoso",
  "Ibu Dewi Lestari",
  "Bpk. Hendra Wijaya",
];

const DUMMY_ANAK: Record<string, string[]> = {
  "Ibu Rina Wulandari": ["Kenzo"],
  "Bpk. Andi Pratama": ["Alya", "Raka"],
  "Ibu Siti Nurhaliza": ["Zahra"],
  "Bpk. Teguh Santoso": ["Bima"],
  "Ibu Dewi Lestari": ["Naufal"],
  "Bpk. Hendra Wijaya": ["Queenza"],
};

const DUMMY_POTONGAN: PotonganData[] = [
  { id: "1", anak: "Kenzo", wali: "Ibu Rina Wulandari", jumlah: 300000 },
  { id: "2", anak: "Naufal", wali: "Ibu Dewi Lestari", jumlah: 450000 },
  { id: "3", anak: "Queenza", wali: "Bpk. Hendra Wijaya", jumlah: 400000 },
  { id: "4", anak: "Alya", wali: "Bpk. Andi Pratama", jumlah: 500000 },
  { id: "5", anak: "Zahra", wali: "Ibu Siti Nurhaliza", jumlah: 350000 },
  { id: "6", anak: "Bima", wali: "Bpk. Teguh Santoso", jumlah: 260000 },
];
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

  const c = config[status];
  return (
    <span className={`inline-flex items-center text-xs ${c.className}`}>
      <span style={{ whiteSpace: "pre-line" }}>{c.label}</span>
    </span>
  );
}


// ── Pengembalian Dana Modal ───────────────────────────────────────────────────
// Dummy sesi per invoice: asumsikan 1 baris terapi Wicara 8 sesi
function getPengembalianSesi(inv: Invoice) {
  const totalSesi = 8;
  const hargaPerSesi = Math.round(inv.total / totalSesi);
  return { jenis: "Terapi Wicara", totalSesi, hargaPerSesi };
}

function PengembalianDanaModal({
  invoice,
  lunasInvoices,
  onClose,
}: {
  invoice: Invoice;
  lunasInvoices: Invoice[];
  onClose: () => void;
}) {
  const [selectedInvId, setSelectedInvId] = useState(invoice.id);
  const selectedInv = lunasInvoices.find((i) => i.id === selectedInvId) ?? invoice;
  const { jenis, totalSesi, hargaPerSesi } = getPengembalianSesi(selectedInv);

  const [modeSisi, setModeSisi] = useState<"dikembalikan" | "catat">("dikembalikan");
  const [kehadiran, setKehadiran] = useState(totalSesi);
  const sisaSesi = Math.max(0, totalSesi - kehadiran);
  const nilaiSisaSesi = sisaSesi * hargaPerSesi;

  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(todayStr);
  const [metodePengembalian, setMetodePengembalian] = useState("Transfer bank");
  const [noResi, setNoResi] = useState("");
  const [fileName, setFileName] = useState("Tidak ada File yang dipilih");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        />

        {/* Modal panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[460px] max-h-full rounded-2xl bg-white shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-extrabold text-[#1E5C58]">Pengembalian dana</h2>
            <button
              onClick={onClose}
              className="cursor-pointer text-sm font-bold text-[#2B7A75] hover:text-[#1E5C58] transition-colors"
            >
              Tutup
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">

            {/* Tagihan (sudah dibayar) */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">
                Tagihan (sudah dibayar)
              </label>
              <div className="relative">
                <select
                  id="pengembalian-select-invoice"
                  value={selectedInvId}
                  onChange={(e) => {
                    setSelectedInvId(e.target.value);
                    const inv = lunasInvoices.find((i) => i.id === e.target.value);
                    if (inv) setKehadiran(getPengembalianSesi(inv).totalSesi);
                  }}
                  className={selectCls}
                >
                  {lunasInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.no_invoice} – {inv.anak} ({inv.periode})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                />
              </div>
            </div>

            {/* Kehadiran selama periode */}
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Kehadiran selama periode</p>
              <div className="h-px bg-gradient-to-r from-[#2B7A75]/60 to-transparent mb-3" />
              <div className="flex items-center gap-3">
                <span className="flex-1 text-sm font-semibold text-gray-700">{jenis}</span>
                <input
                  id="pengembalian-kehadiran"
                  type="number"
                  min={0}
                  max={totalSesi}
                  value={kehadiran}
                  onChange={(e) =>
                    setKehadiran(Math.min(totalSesi, Math.max(0, Number(e.target.value))))
                  }
                  className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]"
                />
                <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                  dari {totalSesi} sesi
                </span>
              </div>
            </div>

            {/* Nilai sisa & Tanggal */}
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

            {/* Toggle sisa sesi */}
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Sisa sesi mau diapakan?</p>
              <div className="flex overflow-hidden border border-gray-200 rounded-xl">
                <button
                  id="mode-dikembalikan"
                  type="button"
                  onClick={() => setModeSisi("dikembalikan")}
                  className={`flex-1 px-3 py-2.5 text-xs font-bold transition-all ${modeSisi === "dikembalikan"
                    ? "bg-[#1E5C58] text-white shadow-sm"
                    : "bg-[#F4F9F8] text-gray-500 hover:text-[#2B7A75]"
                    }`}
                >
                  Dikembalikan ke orang tua
                </button>
                <button
                  id="mode-catat"
                  type="button"
                  onClick={() => setModeSisi("catat")}
                  className={`flex-1 px-3 py-2.5 text-xs font-bold transition-all ${modeSisi === "catat"
                    ? "bg-[#1E5C58] text-white shadow-sm"
                    : "bg-[#F4F9F8] text-gray-500 hover:text-[#2B7A75]"
                    }`}
                >
                  Catat ke periode setelahnya
                </button>
              </div>
            </div>

            {/* Conditional body */}
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
                      <label className="block mb-1.5 text-xs font-bold text-gray-500">
                        Metode pengembalian
                      </label>
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
                        <ChevronDown
                          size={14}
                          className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-bold text-gray-500">
                        No. resi
                      </label>
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

                  {/* Upload bukti */}
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-gray-500">
                      Upload bukti pengembalian{" "}
                      <span className="font-normal text-gray-300 normal-case">
                        (bukti transfer / kwitansi, opsional)
                      </span>
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
                        onChange={(e) =>
                          setFileName(
                            e.target.files?.[0]?.name ?? "Tidak ada File yang dipilih"
                          )
                        }
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

          {/* Bottom summary + CTA */}
          <div className="px-6 pt-4 pb-6 space-y-3 border-t border-gray-100 shrink-0">
            {/* Invoice info row */}
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

            {/* Sesi tidak terpakai */}
            <div className="flex items-center justify-between py-3 border-t border-gray-200 border-dashed">
              <span className="text-sm font-extrabold text-[#1E5C58]">Sesi tidak terpakai</span>
              <span className="text-sm font-extrabold text-[#1E5C58]">{sisaSesi} sesi</span>
            </div>

            {/* CTA */}
            <button
              id="btn-catat-pengembalian"
              type="button"
              onClick={onClose}
              className="cursor-pointer w-full py-3 bg-[#1E5C58] text-white rounded-xl text-sm font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors"
            >
              {modeSisi === "dikembalikan"
                ? "Catat pengembalian dana"
                : "Catat ke periode setelahnya"}
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
}: {
  item: Invoice;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  onPengembalian: (inv: Invoice) => void;
}) {
  const isOpen = openDropdownId === item.id;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, openUpward: false });
  const MENU_WIDTH = 192;
  const MENU_HEIGHT_ESTIMATE = 210;

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

  // Shared style classes
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
        <ChevronDown
          size={12}
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
                  {/* ── LUNAS → Pengembalian Dana (teal highlight) ── */}
                  {item.status === "LUNAS" && (
                    <button
                      onClick={() => {
                        setOpenDropdownId(null);
                        onPengembalian(item);
                      }}
                      className={primaryItemClass}
                    >
                      Pengembalian dana
                    </button>
                  )}

                  {/* ── BELUM DIBAYAR → Catat Bayar (teal highlight) ── */}
                  {item.status === "BELUM DIBAYAR" && (
                    <button
                      onClick={() => setOpenDropdownId(null)}
                      className={primaryItemClass}
                    >
                      Catat bayar
                    </button>
                  )}

                  {/* ── Menu standar — muncul di semua status ── */}
                  <button
                    onClick={() => setOpenDropdownId(null)}
                    className={normalItemClass}
                  >
                    Lihat detail
                  </button>

                  <button
                    onClick={() => setOpenDropdownId(null)}
                    className={normalItemClass}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setOpenDropdownId(null)}
                    className={normalItemClass}
                  >
                    Cetak invoice
                  </button>

                  {/* ── Hapus — merah, selalu paling bawah ── */}
                  <button
                    onClick={() => setOpenDropdownId(null)}
                    className={dangerItemClass}
                  >
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


// ── Tab types ─────────────────────────────────────────────────────────────────
type TabKey = "Semua" | "Belum dibayar" | "Berjalan" | "Periode berakhir" | "Selesai";
type MainTab = "Tagihan" | "Pembayaran";
type PageView = "list" | "buat-tagihan";

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
                        {formatRupiah(row.harga_sesi)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                        {formatRupiah(row.jumlah_sesi * row.harga_sesi)}
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
// ─────────────────────────────────────────────────────────────────────────────
// ── Helper: hitung durasi paket ──────────────────────────────────────────────
function hitungDurasiPaket(mulai: string, selesai: string) {
  if (!mulai || !selesai) return null;
  const d1 = new Date(mulai);
  const d2 = new Date(selesai);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 <= d1) return null;
  const hari = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  const bulan =
    (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  const minggu = Math.floor(hari / 7);
  return { hari, bulan, minggu };
}

function BuatTagihanForm({ onBack, onSave }: { onBack: () => void; onSave: (inv: Invoice) => void }) {
  const [tipeTagihan, setTipeTagihan] = useState<"Bulanan" | "Paket Durasi">("Bulanan");
  const [selectedWali, setSelectedWali] = useState("");
  const [selectedAnak, setSelectedAnak] = useState("");
  const [periode, setPeriode] = useState("");

  // Paket Durasi fields
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");

  // Terapi rows
  const [terapiRows, setTerapiRows] = useState<TerapiRow[]>([
    { id: genId(), jenis: "", jumlah_sesi: "", harga_sesi: "" },
  ]);

  // Harga & Pembayaran
  const [potongan, setPotongan] = useState<number | "">("");
  const [catatan, setCatatan] = useState("");

  // Pratinjau modal
  const [showPratinjau, setShowPratinjau] = useState(false);
  const noInvoicePreview = useRef(
    `INV/${new Date().getFullYear()}/PKT/${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`
  ).current;

  // Untuk Paket Durasi, subtotal tiap baris = harga_sesi saja (bukan × sesi)
  const isPaket = tipeTagihan === "Paket Durasi";
  const rowSubtotal = (row: TerapiRow) =>
    isPaket ? (Number(row.harga_sesi) || 0) : (Number(row.jumlah_sesi) || 0) * (Number(row.harga_sesi) || 0);
  const totalSeharusnya = terapiRows.reduce((sum, r) => sum + rowSubtotal(r), 0);
  const totalBayar = Math.max(0, totalSeharusnya - (Number(potongan) || 0));

  // Durasi paket (hanya untuk Paket Durasi)
  const durasiPaket = isPaket ? hitungDurasiPaket(tanggalMulai, tanggalSelesai) : null;

  // Build periode label for pratinjau
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

  const handleWaliChange = (wali: string) => {
    setSelectedWali(wali);
    setSelectedAnak(DUMMY_ANAK[wali]?.[0] ?? "");
  };

  // Saat ganti tipe, jangan ubah isi baris (biarkan kosong / manual)
  const handleTipeChange = (tipe: "Bulanan" | "Paket Durasi") => {
    setTipeTagihan(tipe);
  };

  const updateTerapiRow = (id: string, field: keyof TerapiRow, value: string | number) => {
    setTerapiRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const addTerapiRow = () => {
    setTerapiRows((rows) => [
      ...rows,
      { id: genId(), jenis: "", jumlah_sesi: "", harga_sesi: "" },
    ]);
  };

  const removeTerapiRow = (id: string) => {
    setTerapiRows((rows) => rows.filter((r) => r.id !== id));
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all";

  const selectClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all cursor-pointer appearance-none";

  const handleSimpan = () => {
    const newInvoice: Invoice = {
      id: genId(),
      no_invoice: noInvoicePreview,
      anak: selectedAnak,
      wali: selectedWali,
      tipe: tipeTagihan,
      periode: periodeLabel,
      total: totalBayar,
      tanggal_terbit: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: "BELUM DIBAYAR"
    };
    onSave(newInvoice);
  };

  return (
    <motion.div
      key="buat-tagihan"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
    >
      {/* Toolbar: pratinjau */}
      <div className="flex items-center justify-end px-4 py-3 border-b border-gray-100">
        <button
          id="btn-pratinjau-invoice"
          onClick={() => setShowPratinjau(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors border border-gray-200 cursor-pointer rounded-xl hover:bg-gray-50"
        >
          <Printer size={15} />
          Pratinjau invoice
        </button>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-5 sm:p-6">

        {/* ── Section 1: Siapa yang ditagih ── */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E5C58] text-white text-xs font-extrabold shrink-0">
              1
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Penerima Tagihan</h2>
          </div>

          <div className="p-5 space-y-5">
            {/* Tipe tagihan */}
            <div>
              <label className="block mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                Tipe tagihan
              </label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-[#F4F9F8]">
                {(["Bulanan", "Paket Durasi"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTipeChange(t)}
                    id={`tipe-${t.toLowerCase().replace(" ", "-")}`}
                    className={`flex-1 px-6 py-2.5 text-sm font-bold transition-all ${tipeTagihan === t
                      ? "bg-[#1E5C58] text-white shadow-sm"
                      : "text-gray-500 hover:text-[#2B7A75]"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Orang tua / wali & Anak */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-500">
                  Orang tua / wali
                </label>
                <div className="relative">
                  <select
                    id="select-wali"
                    value={selectedWali}
                    onChange={(e) => handleWaliChange(e.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>Pilih Orang Tua / Wali</option>
                    {DUMMY_WALI.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-gray-500">
                  Anak
                </label>
                <div className="relative">
                  <select
                    id="select-anak"
                    value={selectedAnak}
                    onChange={(e) => setSelectedAnak(e.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>Pilih Anak</option>
                    {(DUMMY_ANAK[selectedWali] ?? []).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                  />
                </div>
              </div>
            </div>

            {/* Periode */}
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
                    onChange={(e) => setPeriode(e.target.value)}
                    className={`${inputClass} cursor-pointer pr-10 ${!periode ? "text-transparent" : ""}`}
                  />
                  {!periode && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                      mm/yyyy
                    </span>
                  )}
                  <Calendar
                    size={16}
                    className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-gray-500">
                    Tanggal mulai
                  </label>
                  <div className="relative">
                    <input
                      id="input-tanggal-mulai"
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className={`${inputClass} cursor-pointer pr-10 ${!tanggalMulai ? "text-transparent" : ""}`}
                    />
                    {!tanggalMulai && (
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                        dd/mm/yyyy
                      </span>
                    )}
                    <Calendar
                      size={16}
                      className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-gray-500">
                    Tanggal berakhir
                  </label>
                  <div className="relative">
                    <input
                      id="input-tanggal-selesai"
                      type="date"
                      value={tanggalSelesai}
                      min={tanggalMulai || undefined}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className={`${inputClass} cursor-pointer pr-10 ${!tanggalSelesai ? "text-transparent" : ""}`}
                    />
                    {!tanggalSelesai && (
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                        dd/mm/yyyy
                      </span>
                    )}
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

        {/* ── Section 2: Terapi & jumlah sesi ── */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E5C58] text-white text-xs font-extrabold shrink-0">
              2
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Terapi & Jumlah Sesi</h2>
          </div>

          <div className="p-5 space-y-3">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                Jenis terapi
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                Jumlah sesi
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                {isPaket ? "Harga paket" : "Harga / sesi"}
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                Subtotal
              </span>
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
                  {/* Jenis terapi */}
                  <div className="relative">
                    <select
                      id={`jenis-terapi-${idx}`}
                      value={row.jenis}
                      onChange={(e) => updateTerapiRow(row.id, "jenis", e.target.value)}
                      className={selectClass}
                    >
                      <option value="" disabled>Pilih Jenis Terapi</option>
                      {JENIS_TERAPI_OPTIONS.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                    />
                  </div>

                  {/* Jumlah sesi */}
                  <input
                    id={`jumlah-sesi-${idx}`}
                    type="number"
                    min={1}
                    value={row.jumlah_sesi}
                    placeholder="Jumlah sesi"
                    onChange={(e) =>
                      updateTerapiRow(row.id, "jumlah_sesi", e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className={inputClass}
                  />

                  {/* Harga / sesi atau Harga paket */}
                  <input
                    id={`harga-sesi-${idx}`}
                    type="number"
                    min={0}
                    value={row.harga_sesi}
                    placeholder={isPaket ? "Harga paket" : "Harga/sesi"}
                    onChange={(e) =>
                      updateTerapiRow(row.id, "harga_sesi", e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className={inputClass}
                  />

                  {/* Subtotal */}
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-gray-800 whitespace-nowrap">
                      {formatRupiah(rowSubtotal(row))}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeTerapiRow(row.id)}
                      disabled={terapiRows.length === 1}
                      className="text-red-400 transition-colors cursor-pointer hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                      title="Hapus baris"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Tambah terapi button */}
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
                  {isPaket
                    ? "Harga paket tetap untuk seluruh durasi. Jumlah sesi default 1 sesi per minggu dan bisa diubah."
                    : "Subtotal = jumlah sesi × harga per sesi. Kehadiran dicatat di akhir periode saat penyelesaian sisa sesi."}
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

        {/* ── Section 3: Harga & pembayaran ── */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E5C58] text-white text-xs font-extrabold shrink-0">
              3
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Pembayaran</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Potongan */}
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
              {potongan !== "" && Number(potongan) > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Info size={13} className="text-[#2B7A75] shrink-0" />
                  <p className="text-xs font-semibold text-[#2B7A75]">
                    Potongan terisi otomatis dari sisa sesi periode sebelumnya:{" "}
                    <span className="font-extrabold">{formatRupiah(Number(potongan))}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Catatan */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500">
                Catatan
              </label>
              <input
                id="input-catatan"
                type="text"
                placeholder="Mis. 1 sesi pengganti"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              {/* Total seharusnya */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-700">
                  {formatRupiah(totalSeharusnya)}
                </span>
              </div>

              {/* Potongan row */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Potongan</span>
                <span className="font-semibold text-red-500">
                  - {formatRupiah(Number(potongan) || 0)}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#1E5C58]">
                    Total
                  </span>
                  <span className="text-lg font-extrabold text-[#1E5C58]">
                    {formatRupiah(totalBayar)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-3 pb-2">
          <button
            id="btn-simpan-tagihan"
            type="button"
            onClick={handleSimpan}
            className="cursor-pointer px-6 py-2.5 bg-[#1E5C58] text-white rounded-xl text-sm font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors"
          >
            Simpan tagihan
          </button>
          <button
            id="btn-cetak-invoice"
            type="button"
            className="cursor-pointer px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cetak invoice
          </button>
        </div>
      </div>
      {/* Pratinjau Invoice Modal */}
      {showPratinjau && (
        <PratinjauInvoiceModal
          data={{
            wali: selectedWali,
            anak: selectedAnak,
            tipeTagihan,
            periode: periodeLabel,
            tanggalTerbit: new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            noInvoice: noInvoicePreview,
            rows: terapiRows,
            potongan,
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
  const [invoices, setInvoices] = useState<Invoice[]>(dummyInvoices);
  const [mainTab, setMainTab] = useState<MainTab>("Tagihan");
  const [pageView, setPageView] = useState<PageView>("list");
  const [activeTab, setActiveTab] = useState<TabKey>("Semua");
  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState("Tipe");
  const [tahun, setTahun] = useState("Tahun");
  const [bulan, setBulan] = useState("Bulan");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [pengembalianInvoice, setPengembalianInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const lunasInvoices = invoices.filter((i) => i.status === "LUNAS");

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, tipe, tahun, bulan]);

  // Filtered invoices
  const filtered = invoices.filter((inv) => {
    const matchSearch =
      search === "" ||
      inv.anak.toLowerCase().includes(search.toLowerCase()) ||
      inv.wali.toLowerCase().includes(search.toLowerCase()) ||
      inv.no_invoice.toLowerCase().includes(search.toLowerCase());

    const matchTipe = tipe === "Tipe" || inv.tipe === tipe;

    // Filter tahun: cocokkan string tahun di periode atau tanggal_terbit
    const matchTahun =
      tahun === "Tahun" ||
      inv.periode.includes(tahun) ||
      inv.tanggal_terbit.includes(tahun);

    // Filter bulan: cocokkan nama bulan di field periode
    const matchBulan =
      bulan === "Bulan" ||
      inv.periode.toLowerCase().includes(bulan.toLowerCase());

    const matchTab =
      activeTab === "Semua" ||
      (activeTab === "Belum dibayar" && inv.status === "BELUM DIBAYAR") ||
      // Berjalan = Paket Durasi yang sudah LUNAS (paket masih berjalan)
      (activeTab === "Berjalan" &&
        inv.tipe === "Paket Durasi" &&
        inv.status === "LUNAS") ||
      // Periode berakhir = tagihan LUNAS dari tipe Bulanan (periode sudah selesai/berakhir)
      (activeTab === "Periode berakhir" &&
        inv.tipe === "Bulanan" &&
        inv.status === "LUNAS") ||
      // Selesai = DIKEMBALIKAN atau PERIODE BERIKUTNYA (sisa sesi dilanjutkan/dikembalikan)
      (activeTab === "Selesai" &&
        (inv.status === "DIKEMBALIKAN" ||
          inv.status === "PERIODE BERIKUTNYA"));

    return matchSearch && matchTipe && matchTahun && matchBulan && matchTab;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Summary stats — jumlah tagihan dari filtered, belum dibayar & potongan global
  const jumlahTagihan = filtered.length;
  const totalBelumDibayar = invoices
    .filter((i) => i.status === "BELUM DIBAYAR")
    .reduce((sum, i) => sum + i.total, 0);
  const periodeBerikutnya = invoices.filter(
    (i) => i.status === "PERIODE BERIKUTNYA"
  ).length;
  // Potongan berikutnya: nilai tetap Rp 300.000 (sesuai gambar referensi — potongan sisa sesi)
  const potonganBerikutnya = 300000;

  const handleExport = () => {
    const headers = [
      "No. invoice",
      "Tipe",
      "Anak",
      "Orang tua",
      "Periode",
      "Tanggal terbit",
      "Total layanan",
      "Potongan",
      "Potongan dari sisa sesi sebelumnya",
      "Total tagihan",
      "Dibayar",
      "Pengembalian",
      "Periode berikutnya",
      "Status"
    ];

    const getStatusText = (s: string) => {
      if (s === "LUNAS") return "Lunas";
      if (s === "BELUM DIBAYAR") return "Belum dibayar";
      if (s === "PERIODE BERIKUTNYA") return "Periode berikutnya";
      if (s === "DIKEMBALIKAN") return "Dikembalikan";
      return s;
    };

    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
    `;

    filtered.forEach((inv) => {
      const totalLayanan = inv.total;
      const potongan = 0;
      const potonganSisa = inv.id === "7" ? 175000 : 0;
      const totalTagihan = totalLayanan - potongan - potonganSisa;

      const isLunasOrSemacamnya = ["LUNAS", "DIKEMBALIKAN", "PERIODE BERIKUTNYA"].includes(inv.status);
      const dibayar = isLunasOrSemacamnya ? totalTagihan : 0;

      const pengembalian = inv.status === "DIKEMBALIKAN" ? 150000 : 0;
      const periodeBerikutnya = inv.status === "PERIODE BERIKUTNYA" ? (inv.id === "8" ? 300000 : 175000) : 0;

      tableHtml += `
        <tr>
          <td>${inv.no_invoice}</td>
          <td>${inv.tipe}</td>
          <td>${inv.anak}</td>
          <td>${inv.wali}</td>
          <td>${inv.periode}</td>
          <td>${inv.tanggal_terbit}</td>
          <td>${totalLayanan}</td>
          <td>${potongan}</td>
          <td>${potonganSisa}</td>
          <td>${totalTagihan}</td>
          <td>${dibayar}</td>
          <td>${pengembalian}</td>
          <td>${periodeBerikutnya}</td>
          <td>${getStatusText(inv.status)}</td>
        </tr>
      `;
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
  };

  return (
    <>
      <div className="min-h-screen bg-[#F8FAFA] p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          {pageView === "buat-tagihan" ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPageView("list")}
                className="p-2.5 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight">
                  Buat Tagihan Baru
                </h1>
                <p className="text-sm font-medium text-gray-400">
                  Buat tagihan untuk anak berdasarkan sesi terapi.
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

        {/* Main Tab (Tagihan / Pembayaran) */}
        {pageView !== "buat-tagihan" && (
          <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] p-2 mb-6 flex gap-2">
            <button
              onClick={() => {
                setMainTab("Tagihan");
                setPageView("list");
              }}
              id="tab-tagihan"
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${mainTab === "Tagihan"
                ? "bg-[#1E5C58] text-white shadow-md shadow-teal-700/20"
                : "bg-transparent text-gray-400 hover:bg-gray-50"
                }`}
            >
              <FileText size={16} />
              Tagihan
            </button>
            <button
              onClick={() => {
                setMainTab("Pembayaran");
                setPageView("list");
              }}
              id="tab-pembayaran"
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${mainTab === "Pembayaran"
                ? "bg-[#1E5C58] text-white shadow-md shadow-teal-700/20"
                : "bg-transparent text-gray-400 hover:bg-gray-50"
                }`}
            >
              <CreditCard size={16} />
              Pembayaran
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── FORM BUAT TAGIHAN ── */}
          {pageView === "buat-tagihan" ? (
            <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
              <BuatTagihanForm
                key="buat-tagihan"
                onBack={() => setPageView("list")}
                onSave={(newInv) => {
                  setInvoices([newInv, ...invoices]);
                  setPageView("list");
                }}
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
              <div className="flex items-center gap-1 px-4 pt-4 overflow-x-auto border-b border-gray-100">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    id={`status-tab-${tab.toLowerCase().replace(/ /g, "-")}`}
                    className={`cursor-pointer whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === tab
                      ? "border-[#2B7A75] text-[#1E5C58] font-bold"
                      : "border-transparent text-gray-400 hover:text-[#2B7A75]"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Filters Bar */}
              <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 overflow-x-auto no-scrollbar">
                {/* Semua tipe */}
                <div className="relative shrink-0">
                  <select
                    id="filter-tipe"
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value)}
                    className="appearance-none pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                  >
                    <option>Tipe</option>
                    <option>Bulanan</option>
                    <option>Paket Durasi</option>
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Semua tahun */}
                <div className="relative shrink-0">
                  <select
                    id="filter-tahun"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="appearance-none pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                  >
                    <option>Tahun</option>
                    <option>2025</option>
                    <option>2026</option>
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Semua bulan */}
                <div className="relative shrink-0">
                  <select
                    id="filter-bulan"
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="appearance-none pl-3.5 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                  >
                    <option>Bulan</option>
                    {[
                      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
                    ].map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Group Search Box, Export & Buat tagihan on the right */}
                <div className="flex items-center gap-2.5 ml-auto shrink-0 whitespace-nowrap">
                  {/* Search box — fixed width */}
                  <div className="relative w-[240px]">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                    />
                    <input
                      id="search-invoice"
                      type="text"
                      placeholder="Cari anak, orang tua, invoice"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all"
                    />
                  </div>

                  <button
                    id="btn-export"
                    onClick={handleExport}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Download size={15} />
                    Export
                  </button>
                  <button
                    id="btn-buat-tagihan"
                    onClick={() => setPageView("buat-tagihan")}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-[#1E5C58] text-white rounded-xl text-sm font-bold hover:bg-[#174d49] shadow-sm shadow-teal-700/20 transition-colors"
                  >
                    <Plus size={15} />
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
                  <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr className="border-gray-100 border-y bg-gray-50/60">
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[16%]">
                            No. Invoice
                          </th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[18%]">
                            Anak
                          </th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[16%]">
                            Periode
                          </th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[14%]">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[16%]">
                            Tanggal Terbit
                          </th>
                          <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[12%]">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-gray-400 w-[8%]">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <Filter size={36} className="text-gray-300" strokeWidth={1.5} />
                                <p className="text-sm font-semibold text-gray-400">
                                  Tidak Ada Data Yang Ditemukan
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedData.map((inv, idx) => (
                            <tr
                              key={inv.id}
                              className="transition-colors border-b border-gray-100 hover:bg-teal-50/20 group"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-bold text-[#1E5C58] text-xs">
                                    {inv.no_invoice}
                                  </p>
                                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                    {inv.tipe}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-sm font-bold text-gray-800">
                                    {inv.anak}
                                  </p>
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
                                <p className="text-sm font-extrabold text-gray-800">
                                  {formatRupiah(inv.total)}
                                </p>
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
                              />
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  {filtered.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-gray-100 bg-[#F4F9F8]/60">
                      {/* Jumlah Tagihan */}
                      <div className="px-6 py-5 border-r border-gray-100">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Jumlah Tagihan</p>
                        <p className="text-lg font-extrabold text-[#1E5C58]">{jumlahTagihan}</p>
                      </div>
                      {/* Belum Dibayar */}
                      <div className="px-6 py-5 border-r border-gray-100">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Belum Dibayar</p>
                        <p className="text-lg font-extrabold text-[#1E5C58]">
                          {formatRupiah(totalBelumDibayar)}
                        </p>
                      </div>
                      {/* Periode Berakhir */}
                      <div className="px-6 py-5 border-r border-gray-100">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Periode Berakhir</p>
                        <p className="text-lg font-extrabold text-[#1E5C58]">{periodeBerikutnya} tagihan</p>
                      </div>
                      {/* Potongan Berikutnya */}
                      <div className="px-6 py-5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Potongan Berikutnya</p>
                        <p className="text-lg font-extrabold text-[#1E5C58]">{formatRupiah(potonganBerikutnya)}</p>
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
                      <p className="text-sm text-gray-500">
                        Menampilkan <span className="font-semibold text-gray-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga{" "}
                        <span className="font-semibold text-gray-800">
                          {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                        </span>{" "}
                        dari <span className="font-semibold text-gray-800">{filtered.length}</span> data
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
              data={DUMMY_POTONGAN}
              onBuatTagihan={(anak, wali) => {
                setPageView("buat-tagihan");
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modal Pengembalian Dana */}
      {pengembalianInvoice && (
        <PengembalianDanaModal
          invoice={pengembalianInvoice}
          lunasInvoices={lunasInvoices}
          onClose={() => setPengembalianInvoice(null)}
        />
      )}
    </>
  );
}
