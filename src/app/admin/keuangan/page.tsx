"use client";

import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  jumlah_sesi: number;
  harga_sesi: number;
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
];

const DUMMY_ANAK: Record<string, string[]> = {
  "Ibu Rina Wulandari": ["Kenzo"],
  "Bpk. Andi Pratama": ["Alya", "Raka"],
  "Ibu Siti Nurhaliza": ["Zahra"],
  "Bpk. Teguh Santoso": ["Bima"],
};

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
    { label: string; className: string; icon: React.ReactNode }
  > = {
    LUNAS: {
      label: "LUNAS",
      className: "text-emerald-600 font-extrabold",
      icon: <CheckCircle2 size={13} className="text-emerald-500" />,
    },
    "BELUM DIBAYAR": {
      label: "BELUM DIBAYAR",
      className: "text-red-500 font-extrabold",
      icon: <AlertCircle size={13} className="text-red-400" />,
    },
    "PERIODE BERIKUTNYA": {
      label: "PERIODE BERIKUTNYA",
      className: "text-orange-500 font-extrabold",
      icon: <Clock size={13} className="text-orange-400" />,
    },
    DIKEMBALIKAN: {
      label: "DIKEMBALIKAN",
      className: "text-blue-500 font-extrabold",
      icon: <RotateCcw size={13} className="text-blue-400" />,
    },
    BERJALAN: {
      label: "BERJALAN",
      className: "text-teal-600 font-extrabold",
      icon: <CheckCircle2 size={13} className="text-teal-500" />,
    },
  };

  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ── Action Dropdown ───────────────────────────────────────────────────────────
function ActionDropdown({
  item,
  openDropdownId,
  setOpenDropdownId,
}: {
  item: Invoice;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}) {
  const isOpen = openDropdownId === item.id;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, openUpward: false });
  const MENU_WIDTH = 180;
  const MENU_HEIGHT_ESTIMATE = 120;

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

  return (
    <td className="px-6 py-4 text-right">
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
                  <button
                    onClick={() => setOpenDropdownId(null)}
                    className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors border-b border-gray-100"
                  >
                    <FileText size={14} className="mr-2 text-[#2B7A75]" />
                    Lihat Detail
                  </button>
                  <button
                    onClick={() => setOpenDropdownId(null)}
                    className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors border-b border-gray-100"
                  >
                    <CreditCard size={14} className="mr-2 text-[#2B7A75]" />
                    Catat Pembayaran
                  </button>
                  <button
                    onClick={() => setOpenDropdownId(null)}
                    className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                  >
                    <Download size={14} className="mr-2 text-[#2B7A75]" />
                    Download PDF
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
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden"
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
                <p className="text-lg font-extrabold text-gray-900 leading-tight">Puspa</p>
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5 text-sm">
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
            <div className="rounded-xl overflow-hidden border border-gray-100 mb-4">
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

              <div className="flex justify-between items-center">
                <span className="text-sm font-extrabold text-gray-800">Total tagihan</span>
                <span className="text-base font-extrabold text-[#1E5C58]">
                  {formatRupiah(data.totalBayar)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm text-gray-500">Status</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-extrabold">
                  Belum dibayar
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 flex items-end justify-between">
              <div className="text-[11px] text-gray-400 leading-relaxed">
                <p>Pembayaran dilakukan di awal periode.</p>
                <p>Rek. BCA 000-000-0000 a.n. Puspa</p>
              </div>
              <div className="text-right">
                <div className="w-24 border-t border-gray-400 mb-1" />
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
function BuatTagihanForm({ onBack }: { onBack: () => void }) {
  const [tipeTagihan, setTipeTagihan] = useState<"Bulanan" | "Paket Durasi">("Bulanan");
  const [selectedWali, setSelectedWali] = useState(DUMMY_WALI[0]);
  const [selectedAnak, setSelectedAnak] = useState(DUMMY_ANAK[DUMMY_WALI[0]][0]);
  const [periode, setPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Paket Durasi fields
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");

  // Terapi rows
  const [terapiRows, setTerapiRows] = useState<TerapiRow[]>([
    { id: genId(), jenis: "Terapi Wicara", jumlah_sesi: 8, harga_sesi: 150000 },
  ]);

  // Harga & Pembayaran
  const [potongan, setPotongan] = useState(300000);
  const [catatan, setCatatan] = useState("");

  // Pratinjau modal
  const [showPratinjau, setShowPratinjau] = useState(false);
  const noInvoicePreview = useRef(
    `INV/${new Date().getFullYear()}/PKT/${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`
  ).current;
  const totalSeharusnya = terapiRows.reduce(
    (sum, r) => sum + r.jumlah_sesi * r.harga_sesi,
    0
  );
  const totalBayar = Math.max(0, totalSeharusnya - potongan);

  // Build periode label for pratinjau
  const periodeLabel = tipeTagihan === "Bulanan"
    ? (() => {
        if (!periode) return "—";
        const [y, m] = periode.split("-");
        const names = ["Januari","Februari","Maret","April","Mei","Juni",
          "Juli","Agustus","September","Oktober","November","Desember"];
        return `${names[parseInt(m, 10) - 1]} ${y}`;
      })()
    : tanggalMulai && tanggalSelesai
      ? `${tanggalMulai} – ${tanggalSelesai}`
      : "—";

  const handleWaliChange = (wali: string) => {
    setSelectedWali(wali);
    setSelectedAnak(DUMMY_ANAK[wali]?.[0] ?? "");
  };

  const updateTerapiRow = (id: string, field: keyof TerapiRow, value: string | number) => {
    setTerapiRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const addTerapiRow = () => {
    setTerapiRows((rows) => [
      ...rows,
      { id: genId(), jenis: "Terapi Wicara", jumlah_sesi: 1, harga_sesi: 0 },
    ]);
  };

  const removeTerapiRow = (id: string) => {
    setTerapiRows((rows) => rows.filter((r) => r.id !== id));
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all";

  const selectClass =
    "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all cursor-pointer appearance-none";

  return (
    <motion.div
      key="buat-tagihan"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
    >
      {/* Toolbar: kembali & pratinjau */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={onBack}
          id="btn-kembali-tagihan"
          className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold text-[#2B7A75] hover:text-[#1E5C58] transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Tagihan
        </button>
        <button
          id="btn-pratinjau-invoice"
          onClick={() => setShowPratinjau(true)}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Printer size={15} />
          Pratinjau invoice
        </button>
      </div>

      {/* Form Content */}
      <div className="p-4 sm:p-6 space-y-5">

        {/* ── Section 1: Siapa yang ditagih ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E5C58] text-white text-xs font-extrabold shrink-0">
              1
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Siapa yang ditagih</h2>
          </div>

          <div className="p-5 space-y-5">
            {/* Tipe tagihan */}
            <div>
              <label className="block mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Tipe tagihan
              </label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-[#F4F9F8]">
                {(["Bulanan", "Paket Durasi"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipeTagihan(t)}
                    id={`tipe-${t.toLowerCase().replace(" ", "-")}`}
                    className={`flex-1 px-6 py-2.5 text-sm font-bold transition-all ${
                      tipeTagihan === t
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {DUMMY_WALI.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                    {(DUMMY_ANAK[selectedWali] ?? []).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                    className={`${inputClass} cursor-pointer pr-10`}
                  />
                  <Calendar
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className={`${inputClass} cursor-pointer pr-10`}
                    />
                    <Calendar
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-gray-500">
                    Tanggal selesai
                  </label>
                  <div className="relative">
                    <input
                      id="input-tanggal-selesai"
                      type="date"
                      value={tanggalSelesai}
                      min={tanggalMulai || undefined}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className={`${inputClass} cursor-pointer pr-10`}
                    />
                    <Calendar
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: Terapi & jumlah sesi ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E5C58] text-white text-xs font-extrabold shrink-0">
              2
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Terapi & jumlah sesi</h2>
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
                Harga / sesi
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
                      {JENIS_TERAPI_OPTIONS.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>

                  {/* Jumlah sesi */}
                  <input
                    id={`jumlah-sesi-${idx}`}
                    type="number"
                    min={1}
                    value={row.jumlah_sesi}
                    onChange={(e) =>
                      updateTerapiRow(row.id, "jumlah_sesi", Number(e.target.value))
                    }
                    className={inputClass}
                  />

                  {/* Harga / sesi */}
                  <input
                    id={`harga-sesi-${idx}`}
                    type="number"
                    min={0}
                    value={row.harga_sesi}
                    onChange={(e) =>
                      updateTerapiRow(row.id, "harga_sesi", Number(e.target.value))
                    }
                    className={inputClass}
                  />

                  {/* Subtotal */}
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-gray-800 whitespace-nowrap">
                      {formatRupiah(row.jumlah_sesi * row.harga_sesi)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeTerapiRow(row.id)}
                      disabled={terapiRows.length === 1}
                      className="cursor-pointer text-red-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
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

            {/* Info note */}
            <p className="text-[11px] text-[#2B7A75] font-medium leading-relaxed pt-1">
              Subtotal = jumlah sesi × harga per sesi. Kehadiran dicatat di akhir periode
              saat penyelesaian sisa sesi.
            </p>
          </div>
        </div>

        {/* ── Section 3: Harga & pembayaran ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1E5C58] text-white text-xs font-extrabold shrink-0">
              3
            </div>
            <h2 className="text-sm font-extrabold text-gray-800">Harga & pembayaran</h2>
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
              {potongan > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Info size={13} className="text-[#2B7A75] shrink-0" />
                  <p className="text-xs font-semibold text-[#2B7A75]">
                    Potongan terisi otomatis dari sisa sesi periode sebelumnya:{" "}
                    <span className="font-extrabold">{formatRupiah(potongan)}</span>
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
                <span className="text-gray-500 font-medium">Total seharusnya</span>
                <span className="font-semibold text-gray-700">
                  {formatRupiah(totalSeharusnya)}
                </span>
              </div>

              {/* Potongan row */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Potongan</span>
                <span className="font-semibold text-red-500">
                  - {formatRupiah(potongan)}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#1E5C58]">
                    Total yang harus dibayar
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
  const [mainTab, setMainTab] = useState<MainTab>("Tagihan");
  const [pageView, setPageView] = useState<PageView>("list");
  const [activeTab, setActiveTab] = useState<TabKey>("Semua");
  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState("Semua tipe");
  const [tahun, setTahun] = useState("Semua tahun");
  const [bulan, setBulan] = useState("Semua bulan");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Filtered invoices
  const filtered = dummyInvoices.filter((inv) => {
    const matchSearch =
      search === "" ||
      inv.anak.toLowerCase().includes(search.toLowerCase()) ||
      inv.wali.toLowerCase().includes(search.toLowerCase()) ||
      inv.no_invoice.toLowerCase().includes(search.toLowerCase());

    const matchTipe = tipe === "Semua tipe" || inv.tipe === tipe;

    const matchTab =
      activeTab === "Semua" ||
      (activeTab === "Belum dibayar" && inv.status === "BELUM DIBAYAR") ||
      (activeTab === "Berjalan" && inv.status === "BERJALAN") ||
      (activeTab === "Periode berakhir" && inv.status === "PERIODE BERIKUTNYA") ||
      (activeTab === "Selesai" &&
        (inv.status === "LUNAS" || inv.status === "DIKEMBALIKAN"));

    return matchSearch && matchTipe && matchTab;
  });

  // Summary stats
  const totalTagihan = dummyInvoices.length;
  const belumDibayar = dummyInvoices
    .filter((i) => i.status === "BELUM DIBAYAR")
    .reduce((sum, i) => sum + i.total, 0);
  const periodeBerikutnya = dummyInvoices.filter(
    (i) => i.status === "PERIODE BERIKUTNYA"
  ).length;
  const potonganBerikutnya = dummyInvoices
    .filter((i) => i.status === "PERIODE BERIKUTNYA")
    .reduce((sum, i) => sum + i.total * 0.1, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFA] p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-2xl bg-[#2B7A75]/10">
            <Wallet size={22} className="text-[#2B7A75]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight">
              Manajemen Keuangan
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              Kelola tagihan, catat pembayaran, dan pantau riwayat keuangan klinik.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Main Tab (Tagihan / Pembayaran) */}
        <div className="flex gap-3 p-4 border-b border-gray-100">
          <button
            onClick={() => {
              setMainTab("Tagihan");
              setPageView("list");
            }}
            id="tab-tagihan"
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              mainTab === "Tagihan"
                ? "bg-[#1E5C58] text-white shadow-md shadow-teal-700/20"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
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
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              mainTab === "Pembayaran"
                ? "bg-[#1E5C58] text-white shadow-md shadow-teal-700/20"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            }`}
          >
            <CreditCard size={16} />
            Pembayaran
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ── FORM BUAT TAGIHAN ── */}
          {pageView === "buat-tagihan" ? (
            <BuatTagihanForm key="buat-tagihan" onBack={() => setPageView("list")} />
          ) : mainTab === "Tagihan" ? (
            <motion.div
              key="tagihan-list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Status Tabs */}
              <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    id={`status-tab-${tab.toLowerCase().replace(/ /g, "-")}`}
                    className={`cursor-pointer whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                      activeTab === tab
                        ? "border-[#2B7A75] text-[#1E5C58] font-bold"
                        : "border-transparent text-gray-400 hover:text-[#2B7A75]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <div className="ml-auto flex gap-1 pb-1 shrink-0">
                  <button className="p-1.5 text-gray-300 hover:text-[#2B7A75] transition-colors">
                    <ChevronUp size={16} />
                  </button>
                  <button className="p-1.5 text-gray-300 hover:text-[#2B7A75] transition-colors">
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-3 px-4 py-4">
                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    id="search-invoice"
                    type="text"
                    placeholder="Cari anak, orang tua, atau no. invoice"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all"
                  />
                </div>

                <select
                  id="filter-tipe"
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                >
                  <option>Semua tipe</option>
                  <option>Bulanan</option>
                  <option>Paket Durasi</option>
                </select>

                <select
                  id="filter-tahun"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                >
                  <option>Semua tahun</option>
                  <option>2025</option>
                  <option>2026</option>
                </select>

                <select
                  id="filter-bulan"
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] cursor-pointer transition-all"
                >
                  <option>Semua bulan</option>
                  {[
                    "Januari","Februari","Maret","April","Mei","Juni",
                    "Juli","Agustus","September","Oktober","November","Desember",
                  ].map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    id="btn-export"
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

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-gray-100 bg-gray-50/60">
                      <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        No. Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Anak
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Periode
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Tanggal Terbit
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 rounded-2xl bg-gray-50">
                                <Wallet size={28} className="text-gray-300" />
                              </div>
                              <p className="text-sm font-semibold text-gray-400">
                                Tidak ada tagihan ditemukan
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((inv, idx) => (
                          <motion.tr
                            key={inv.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b border-gray-100 hover:bg-teal-50/20 transition-colors group"
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
                                <p className="font-bold text-gray-800 text-sm">
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
                              <p className="font-extrabold text-gray-800 text-sm">
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
                            />
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-gray-100 bg-[#F4F9F8]/60">
                {[
                  { label: "JUMLAH TAGIHAN", value: totalTagihan.toString() },
                  { label: "BELUM DIBAYAR", value: formatRupiah(belumDibayar) },
                  { label: "PERIODE BERAKHIR", value: `${periodeBerikutnya} tagihan` },
                  { label: "POTONGAN BERIKUTNYA", value: formatRupiah(potonganBerikutnya) },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`px-6 py-5 ${i < 3 ? "border-r border-gray-100" : ""}`}
                  >
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-lg font-extrabold text-[#1E5C58]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pembayaran"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="p-5 rounded-3xl bg-teal-50 mb-5">
                <CreditCard size={32} className="text-[#2B7A75]" />
              </div>
              <h3 className="text-base font-extrabold text-[#1E5C58] mb-2">
                Riwayat Pembayaran
              </h3>
              <p className="text-sm text-gray-400 font-medium max-w-sm">
                Fitur pencatatan dan riwayat pembayaran akan segera tersedia.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
