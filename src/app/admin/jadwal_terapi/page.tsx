"use client";

import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Search as SearchIcon,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Clock,
  UserRound,
  X,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// =======================
// Types
// =======================
type TerapiType = "PLB (Paedagog)" | "Terapi Okupasi" | "Terapi Wicara" | "Fisioterapi";
type StatusPasien = "Aktif" | "Non Aktif" | "Selesai";
type FilterStatus = "Aktif" | "Non Aktif" | "Selesai" | "Semua";

interface JadwalTerapi {
  id: number;
  namaAnak: string;
  namaWali: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  terapis: string;
  status: StatusPasien;
  terapiType: TerapiType;
  periodeAwal: string;
  periodeAkhir: string;
}

// =======================
// Dummy data (frontend only)
// =======================
const DUMMY_DATA: JadwalTerapi[] = [
  {
    id: 1,
    namaAnak: "Rayhan",
    namaWali: "Devi Ema",
    hari: "Senin",
    jamMulai: "15.41",
    jamSelesai: "15.42",
    terapis: "Alief Arifun",
    status: "Aktif",
    terapiType: "PLB (Paedagog)",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
  {
    id: 2,
    namaAnak: "Shofiya",
    namaWali: "Fiyafiya",
    hari: "Selasa",
    jamMulai: "15.27",
    jamSelesai: "15.32",
    terapis: "Alief Arifun",
    status: "Selesai",
    terapiType: "PLB (Paedagog)",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
  {
    id: 3,
    namaAnak: "Lutfy",
    namaWali: "Zaini",
    hari: "Selasa",
    jamMulai: "16.51",
    jamSelesai: "17.04",
    terapis: "Alief Arifun",
    status: "Non Aktif",
    terapiType: "PLB (Paedagog)",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
  {
    id: 4,
    namaAnak: "Zamzam",
    namaWali: "Annisan Nur Qoriah",
    hari: "Rabu",
    jamMulai: "11.36",
    jamSelesai: "13.33",
    terapis: "Nindya Zahri",
    status: "Aktif",
    terapiType: "PLB (Paedagog)",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
  {
    id: 5,
    namaAnak: "Aisyah",
    namaWali: "Budi Santoso",
    hari: "Senin",
    jamMulai: "08.00",
    jamSelesai: "09.00",
    terapis: "Nindya Zahri",
    status: "Aktif",
    terapiType: "Terapi Okupasi",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
  {
    id: 6,
    namaAnak: "Fajar",
    namaWali: "Siti Rahma",
    hari: "Kamis",
    jamMulai: "10.00",
    jamSelesai: "11.00",
    terapis: "Dewi Lestari",
    status: "Non Aktif",
    terapiType: "Terapi Okupasi",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
  {
    id: 7,
    namaAnak: "Nabila",
    namaWali: "Ahmad Fauzi",
    hari: "Jumat",
    jamMulai: "13.00",
    jamSelesai: "14.00",
    terapis: "Dewi Lestari",
    status: "Selesai",
    terapiType: "Terapi Wicara",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
  {
    id: 8,
    namaAnak: "Ridho",
    namaWali: "Nur Hidayah",
    hari: "Rabu",
    jamMulai: "09.30",
    jamSelesai: "10.30",
    terapis: "Rina Wulandari",
    status: "Aktif",
    terapiType: "Terapi Wicara",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
  {
    id: 9,
    namaAnak: "Zahra",
    namaWali: "Hasan Basri",
    hari: "Senin",
    jamMulai: "14.00",
    jamSelesai: "15.00",
    terapis: "Rina Wulandari",
    status: "Aktif",
    terapiType: "Fisioterapi",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
  {
    id: 10,
    namaAnak: "Kevin",
    namaWali: "Tri Wahyuni",
    hari: "Kamis",
    jamMulai: "11.00",
    jamSelesai: "12.00",
    terapis: "Budi Setiawan",
    status: "Non Aktif",
    terapiType: "Fisioterapi",
    periodeAwal: "2025-01-01",
    periodeAkhir: "2025-06-01",
  },
];

const TERAPI_TABS: TerapiType[] = [
  "PLB (Paedagog)",
  "Terapi Okupasi",
  "Terapi Wicara",
  "Fisioterapi",
];

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function StatusBadge({ status }: { status: StatusPasien }) {
  const colorMap: Record<StatusPasien, string> = {
    Aktif: "text-emerald-600",
    "Non Aktif": "text-orange-500",
    Selesai: "text-blue-500",
  };
  return (
    <span className={`text-xs font-bold uppercase tracking-wider ${colorMap[status]}`}>
      {status}
    </span>
  );
}

// =======================
// Tambah Jadwal Modal
// =======================
interface JadwalRow {
  terapis: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  pertemuan: number;
}

interface TerapiTambahan {
  id: number;
  terapiType: string;
  terapis: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  pertemuan: number;
}

interface TambahJadwalModalProps {
  open: boolean;
  onClose: () => void;
  terapiType: TerapiType;
  onSubmit: (data: Omit<JadwalTerapi, "id" | "terapiType">) => void;
}

const TERAPI_TAMBAHAN_OPTIONS = [
  "PLB (Paedagog)",
  "Terapi Okupasi",
  "Terapi Wicara",
  "Fisioterapi",
];

function TambahJadwalModal({ open, onClose, terapiType, onSubmit }: TambahJadwalModalProps) {
  const [noRekam, setNoRekam] = useState("");
  const [namaAnak, setNamaAnak] = useState("");
  const [periodeAwal, setPeriodeAwal] = useState("");
  const [periodeAkhir, setPeriodeAkhir] = useState("");

  // Checklist: set of selected therapy names
  const [selectedTerapi, setSelectedTerapi] = useState<string[]>([]);

  // Per-therapy schedule rows: Record<terapiName, JadwalRow[]>
  const [scheduleMap, setScheduleMap] = useState<Record<string, JadwalRow[]>>({});

  const toggleTerapi = (name: string) => {
    if (selectedTerapi.includes(name)) {
      // uncheck → remove from selected & scheduleMap
      setSelectedTerapi((prev) => prev.filter((t) => t !== name));
      setScheduleMap((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } else {
      // check → add with one default row
      setSelectedTerapi((prev) => [...prev, name]);
      setScheduleMap((prev) => ({
        ...prev,
        [name]: [{ terapis: "", hari: "Senin", jamMulai: "", jamSelesai: "", pertemuan: 0 }],
      }));
    }
  };

  const addRowForTerapi = (terapiName: string) => {
    setScheduleMap((prev) => ({
      ...prev,
      [terapiName]: [
        ...(prev[terapiName] || []),
        { terapis: "", hari: "Senin", jamMulai: "", jamSelesai: "", pertemuan: 0 },
      ],
    }));
  };

  const updateRow = (terapiName: string, idx: number, field: keyof JadwalRow, val: string | number) => {
    setScheduleMap((prev) => ({
      ...prev,
      [terapiName]: prev[terapiName].map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
    }));
  };

  const removeRow = (terapiName: string, idx: number) => {
    setScheduleMap((prev) => ({
      ...prev,
      [terapiName]: prev[terapiName].filter((_, i) => i !== idx),
    }));
  };

  const totalPertemuan = Object.values(scheduleMap)
    .flat()
    .reduce((s, r) => s + (r.pertemuan || 0), 0);

  const handleAutoHitung = () => {
    if (!periodeAwal || totalPertemuan <= 0) return;
    const d = new Date(periodeAwal);
    let count = 0;
    while (count < totalPertemuan) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
      if (count < totalPertemuan) d.setDate(d.getDate() + 1);
    }
    setPeriodeAkhir(d.toISOString().split("T")[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const firstTerapi = selectedTerapi[0];
    const firstRow = scheduleMap[firstTerapi]?.[0];
    if (firstRow) {
      onSubmit({
        namaAnak,
        namaWali: "",
        hari: firstRow.hari,
        jamMulai: firstRow.jamMulai,
        jamSelesai: firstRow.jamSelesai,
        terapis: firstRow.terapis,
        status: "Aktif",
        periodeAwal: periodeAwal || "2025-01-01",
        periodeAkhir: periodeAkhir || "2025-06-01",
      });
    }
    // reset
    setNoRekam(""); setNamaAnak(""); setPeriodeAwal(""); setPeriodeAkhir("");
    setSelectedTerapi([]); setScheduleMap({});
    onClose();
  };

  const handleClose = () => {
    setNoRekam(""); setNamaAnak(""); setPeriodeAwal(""); setPeriodeAkhir("");
    setSelectedTerapi([]); setScheduleMap({});
    onClose();
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] focus:border-teal-300 text-gray-700 placeholder-gray-300 transition-colors";
  const selectCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] focus:border-teal-300 text-gray-700 bg-white transition-colors appearance-none";
  const labelCls = "block text-xs font-semibold text-gray-500 mb-1";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="bg-[#1E5C58] px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Input Penjadwalan</h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    Atur jadwal terapi untuk pasien anak
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 p-5 space-y-4">

                {/* Row 1: No Rekam Medis + Nama Anak */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>No. Rekam Medis</label>
                    <input type="text" value={noRekam}
                      onChange={(e) => setNoRekam(e.target.value)}
                      placeholder="RM-000123" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Anak</label>
                    <input type="text" required value={namaAnak}
                      onChange={(e) => setNamaAnak(e.target.value)}
                      placeholder="Nama lengkap anak" className={inputCls} />
                  </div>
                </div>

                {/* Row 2: Checklist Terapi + Periode */}
                <div className="grid grid-cols-2 gap-3 items-start">
                  <div>
                    <label className={labelCls}>Terapi</label>
                    <div className="border border-gray-200 rounded-lg p-2.5 space-y-2 bg-gray-50/50">
                      {TERAPI_TAMBAHAN_OPTIONS.map((name) => {
                        const checked = selectedTerapi.includes(name);
                        const label = name.replace("PLB (Paedagog)", "Paedagog").replace("Terapi ", "");
                        return (
                          <label key={name} className="flex items-center gap-2.5 cursor-pointer group">
                            <div
                              onClick={() => toggleTerapi(name)}
                              className={`w-4.5 h-4.5 w-[18px] h-[18px] shrink-0 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                                checked
                                  ? "bg-[#1E5C58] border-[#1E5C58]"
                                  : "border-gray-300 bg-white group-hover:border-[#2B7A75]"
                              }`}
                            >
                              {checked && (
                                <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                              )}
                            </div>
                            <span
                              onClick={() => toggleTerapi(name)}
                              className={`text-sm font-medium transition-colors ${
                                checked ? "text-[#1E5C58] font-semibold" : "text-gray-600"
                              }`}
                            >
                              {label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Periode</label>
                    <div className="flex items-center gap-1.5">
                      <input type="date" value={periodeAwal}
                        onChange={(e) => setPeriodeAwal(e.target.value)}
                        className="flex-1 px-2 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 transition-colors" />
                      <span className="text-gray-400 text-sm">–</span>
                      <input type="date" value={periodeAkhir}
                        onChange={(e) => setPeriodeAkhir(e.target.value)}
                        className="flex-1 px-2 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Dynamic sections per selected terapi */}
                <AnimatePresence mode="popLayout">
                  {selectedTerapi.map((terapiName) => {
                    const rows = scheduleMap[terapiName] || [];
                    const label = terapiName.replace("PLB (Paedagog)", "Paedagog").replace("Terapi ", "");
                    return (
                      <motion.div
                        key={terapiName}
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        {/* Section header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                            <span className="text-sm font-bold text-gray-700">{terapiName}</span>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">{rows.length} jadwal</span>
                        </div>

                        {/* Rows */}
                        <div className="p-3 space-y-3">
                          {rows.map((row, idx) => (
                            <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-white space-y-2">
                              {/* Baris atas: Terapis | Pertemuan */}
                              <div className="grid grid-cols-2 gap-2 items-end">
                                <div>
                                  <label className={labelCls}>Terapis</label>
                                  <div className="relative">
                                    <select
                                      value={row.terapis}
                                      onChange={(e) => updateRow(terapiName, idx, "terapis", e.target.value)}
                                      className={selectCls + " pr-7"}
                                    >
                                      <option value="">Pilih...</option>
                                      <option>Alief Arifun</option>
                                      <option>Siti Nurhaliza</option>
                                      <option>Ahmad Fauzi</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                  </div>
                                </div>
                                <div>
                                  <label className={labelCls}>Pertemuan</label>
                                  <input type="number" min={0} value={row.pertemuan}
                                    onChange={(e) => updateRow(terapiName, idx, "pertemuan", parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 text-center" />
                                </div>
                              </div>
                              {/* Baris bawah: Hari | Jam */}
                              <div className="grid grid-cols-2 gap-2 items-end">
                                <div>
                                  <label className={labelCls}>Hari</label>
                                  <div className="relative">
                                    <select
                                      value={row.hari}
                                      onChange={(e) => updateRow(terapiName, idx, "hari", e.target.value)}
                                      className={selectCls + " pr-7"}
                                    >
                                      {HARI_ORDER.map((h) => <option key={h}>{h}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                  </div>
                                </div>
                                <div>
                                  <label className={labelCls}>Jam</label>
                                  <div className="flex items-center gap-1.5">
                                    <input type="time" value={row.jamMulai}
                                      onChange={(e) => updateRow(terapiName, idx, "jamMulai", e.target.value)}
                                      className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700" />
                                    <span className="text-gray-300 text-xs shrink-0">–</span>
                                    <input type="time" value={row.jamSelesai}
                                      onChange={(e) => updateRow(terapiName, idx, "jamSelesai", e.target.value)}
                                      className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700" />
                                  </div>
                                </div>
                              </div>
                               {/* Hapus — hanya jika >1 row */}
                               {rows.length > 1 && (
                                 <div className="flex justify-end pt-1">
                                   <button
                                     type="button"
                                     onClick={() => removeRow(terapiName, idx)}
                                     className="cursor-pointer text-xs text-red-500 font-bold hover:text-red-700 flex items-center gap-1 transition-colors"
                                   >
                                     <X size={13} /> Hapus
                                   </button>
                                 </div>
                               )}
                            </div>
                          ))}

                          {/* Tambah Jadwal button */}
                          <button
                            type="button"
                            onClick={() => addRowForTerapi(terapiName)}
                            className="cursor-pointer w-fit flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-[#2B7A75]/40 text-[#2B7A75] text-xs font-bold rounded-lg hover:border-[#2B7A75] hover:bg-teal-50/30 transition-colors"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            Tambah Jadwal
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Empty state hint */}
                {selectedTerapi.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    <CalendarCheck className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm font-medium">Pilih terapi di atas untuk menampilkan form jadwal</p>
                  </div>
                )}
              </div>

              <div className="px-5 pb-2">
                <div className="bg-[#1E5C58] rounded-3xl px-6 py-4 flex items-center justify-between shadow-md">
                  <p className="text-sm font-bold text-white tracking-wide">Total Pertemuan Keseluruhan</p>
                  <p className="text-2xl font-extrabold text-white">
                    {totalPertemuan} <span className="text-sm font-medium text-white/80">kali pertemuan</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-white">
                <button type="button" onClick={handleClose}
                  className="cursor-pointer px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit"
                  className="cursor-pointer px-7 py-2.5 bg-[#1E5C58] hover:bg-[#163F3C] text-white rounded-lg text-sm font-bold shadow-md shadow-teal-900/20 transition-all active:scale-95">
                  Selesai
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}



// =======================
// Detail Modal
// =======================
function DetailModal({
  open,
  item,
  allData,
  onClose,
}: {
  open: boolean;
  item: JadwalTerapi | null;
  allData: JadwalTerapi[];
  onClose: () => void;
}) {
  const otherTherapies = item
    ? allData.filter((d) => d.namaAnak === item.namaAnak && d.id !== item.id)
    : [];

  return (
    <AnimatePresence>
      {open && item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-[#1E5C58] px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                   <Eye className="w-6 h-6 text-white/90" />
                 </div>
                 <div>
                   <h2 className="text-xl font-extrabold text-white tracking-wide">Detail Penjadwalan</h2>
                   <p className="text-sm text-white/70 mt-0.5">Informasi lengkap jadwal terapi {item.namaAnak}</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-7 overflow-y-auto space-y-6">
              {/* Top Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 px-2">
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-2">No. Rekam Medis</p>
                  <p className="text-sm font-extrabold text-gray-800">RM-{String(item.id).padStart(5, '0')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-2">Nama Anak</p>
                  <p className="text-sm font-extrabold text-gray-800">{item.namaAnak}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-2">Wali</p>
                  <p className="text-sm font-extrabold text-gray-800">{item.namaWali}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-2">Status</p>
                  <div>
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                       item.status === 'Aktif' ? 'bg-[#EAF4F2] text-[#2B7A75]' :
                       item.status === 'Non Aktif' ? 'bg-orange-100 text-orange-600' :
                       'bg-blue-100 text-blue-600'
                     }`}>
                       {item.status}
                     </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-2">Periode</p>
                  <p className="text-sm font-extrabold text-gray-800">01 Jan 2025 – 01 Jun 2025</p>
                </div>
              </div>

              {/* Terapi Card */}
              <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1E5C58]" />
                    <span className="text-sm font-extrabold text-[#1E5C58]">
                      {item.terapiType.startsWith("Terapi") || item.terapiType.startsWith("Fisio") ? item.terapiType : `Terapi ${item.terapiType}`}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#1E5C58] bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">1 jadwal</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <p className="text-[11px] font-bold text-gray-500 mb-2">Terapis</p>
                    <div className="w-full px-4 py-3 bg-white border border-[#1E5C58]/30 rounded-xl text-sm font-bold text-gray-800">
                      {item.terapis}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[11px] font-bold text-gray-500 mb-2">Hari</p>
                    <div className="w-full px-4 py-3 bg-white border border-[#1E5C58]/30 rounded-xl text-sm font-bold text-gray-800">
                      {item.hari}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[11px] font-bold text-gray-500 mb-2">Jam</p>
                    <div className="w-full px-4 py-3 bg-white border border-[#1E5C58]/30 rounded-xl text-sm font-bold text-gray-800">
                      {item.jamMulai} – {item.jamSelesai}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[11px] font-bold text-gray-500 mb-2">Pertemuan</p>
                    <div className="w-full px-4 py-3 bg-white border border-[#1E5C58]/30 rounded-xl text-sm font-bold text-gray-800">
                      12
                    </div>
                  </div>
                </div>
              </div>

              {/* Terapi Lain Card */}
              {otherTherapies.length > 0 && (
                <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1E5C58]" />
                      <span className="text-sm font-extrabold text-[#1E5C58]">Terapi Lain</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                      {otherTherapies.length} terapi
                    </span>
                  </div>
                  <div className="space-y-3">
                    {otherTherapies.map((t) => (
                      <div key={t.id} className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{t.terapiType}</p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">Terapis: {t.terapis}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-700">{t.hari}</p>
                          <p className="text-xs font-medium text-[#2B7A75] mt-0.5">{t.jamMulai} – {t.jamSelesai}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Green Box */}
              <div className="bg-[#1E5C58] rounded-3xl p-6 flex items-center justify-between shadow-xl shadow-[#1E5C58]/10">
                <p className="text-sm font-semibold text-white/90">Total Pertemuan Keseluruhan</p>
                <p className="text-2xl font-extrabold text-white">
                  12 <span className="text-sm font-medium text-white/80">kali pertemuan</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// =======================
// Edit Modal
// =======================
function EditModal({
  open,
  item,
  onClose,
  onSubmit,
}: {
  open: boolean;
  item: JadwalTerapi | null;
  onClose: () => void;
  onSubmit: (data: JadwalTerapi) => void;
}) {
  const [form, setForm] = useState<JadwalTerapi | null>(null);
  const [noRekam, setNoRekam] = useState("RM-000123");
  const [periodeAwal, setPeriodeAwal] = useState("2025-01-01");
  const [periodeAkhir, setPeriodeAkhir] = useState("2025-06-01");

  const [selectedTerapi, setSelectedTerapi] = useState<string[]>([]);
  const [scheduleMap, setScheduleMap] = useState<Record<string, JadwalRow[]>>({});

  useEffect(() => {
    if (item) {
      setForm({ ...item });
      setPeriodeAwal(item.periodeAwal || "2025-01-01");
      setPeriodeAkhir(item.periodeAkhir || "2025-06-01");
      setSelectedTerapi([item.terapiType]);
      setScheduleMap({
        [item.terapiType]: [
          { terapis: item.terapis, hari: item.hari, jamMulai: item.jamMulai, jamSelesai: item.jamSelesai, pertemuan: 12 },
        ],
      });
    } else {
      setSelectedTerapi([]);
      setScheduleMap({});
    }
  }, [item]);

  if (!form) return null;

  const toggleTerapi = (name: string) => {
    if (selectedTerapi.includes(name)) {
      setSelectedTerapi((prev) => prev.filter((t) => t !== name));
      setScheduleMap((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } else {
      setSelectedTerapi((prev) => [...prev, name]);
      setScheduleMap((prev) => ({
        ...prev,
        [name]: [{ terapis: "", hari: "Senin", jamMulai: "", jamSelesai: "", pertemuan: 0 }],
      }));
    }
  };

  const addRowForTerapi = (terapiName: string) => {
    setScheduleMap((prev) => ({
      ...prev,
      [terapiName]: [
        ...(prev[terapiName] || []),
        { terapis: "", hari: "Senin", jamMulai: "", jamSelesai: "", pertemuan: 0 },
      ],
    }));
  };

  const updateRow = (terapiName: string, idx: number, field: keyof JadwalRow, val: string | number) => {
    setScheduleMap((prev) => ({
      ...prev,
      [terapiName]: prev[terapiName].map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
    }));
  };

  const removeRow = (terapiName: string, idx: number) => {
    setScheduleMap((prev) => ({
      ...prev,
      [terapiName]: prev[terapiName].filter((_, i) => i !== idx),
    }));
  };

  const totalPertemuan = Object.values(scheduleMap)
    .flat()
    .reduce((s, r) => s + (r.pertemuan || 0), 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form) {
      const firstTerapi = selectedTerapi[0];
      const firstRow = scheduleMap[firstTerapi]?.[0];
      if (firstRow) {
        onSubmit({
          ...form,
          terapiType: firstTerapi as TerapiType,
          hari: firstRow.hari,
          jamMulai: firstRow.jamMulai,
          jamSelesai: firstRow.jamSelesai,
          terapis: firstRow.terapis,
          periodeAwal: periodeAwal,
          periodeAkhir: periodeAkhir,
        });
      }
    }
    onClose();
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] focus:border-teal-300 text-gray-700 placeholder-gray-300 transition-colors";
  const selectCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] focus:border-teal-300 text-gray-700 bg-white transition-colors appearance-none";
  const labelCls = "block text-xs font-semibold text-gray-500 mb-1";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="bg-[#1E5C58] px-6 py-4 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Edit Penjadwalan</h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    Perbarui jadwal terapi {form.terapiType} untuk {form.namaAnak}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Row 1: No Rekam Medis + Nama Anak + Status */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>No. Rekam Medis</label>
                    <input type="text" value={noRekam} onChange={(e) => setNoRekam(e.target.value)} placeholder="RM-000123" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Anak</label>
                    <input type="text" name="namaAnak" required value={form.namaAnak} onChange={handleChange} placeholder="Nama lengkap anak" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <div className="relative">
                      <select name="status" value={form.status} onChange={handleChange} className={selectCls + " pr-7"}>
                        <option value="Aktif">Aktif</option>
                        <option value="Non Aktif">Non Aktif</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 2: Checklist Terapi + Periode */}
                <div className="grid grid-cols-2 gap-3 items-start">
                  <div>
                    <label className={labelCls}>Terapi</label>
                    <div className="border border-gray-200 rounded-lg p-2.5 space-y-2 bg-gray-50/50">
                      {TERAPI_TAMBAHAN_OPTIONS.map((name) => {
                        const checked = selectedTerapi.includes(name);
                        const label = name.replace("PLB (Paedagog)", "Paedagog").replace("Terapi ", "");
                        return (
                          <label key={name} className="flex items-center gap-2.5 cursor-pointer group">
                            <div
                              onClick={() => toggleTerapi(name)}
                              className={`w-[18px] h-[18px] shrink-0 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${checked ? "bg-[#1E5C58] border-[#1E5C58]" : "border-gray-300 bg-white group-hover:border-[#2B7A75]"}`}
                            >
                              {checked && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                            <span
                              onClick={() => toggleTerapi(name)}
                              className={`text-sm font-medium transition-colors cursor-pointer ${checked ? "text-[#1E5C58] font-semibold" : "text-gray-600"}`}
                            >
                              {label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Periode</label>
                    <div className="flex items-center gap-1.5">
                      <input type="date" value={periodeAwal} onChange={(e) => setPeriodeAwal(e.target.value)} className="flex-1 px-2 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 transition-colors" />
                      <span className="text-gray-400 text-sm">–</span>
                      <input type="date" value={periodeAkhir} onChange={(e) => setPeriodeAkhir(e.target.value)} className="flex-1 px-2 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Dynamic sections per selected terapi */}
                <AnimatePresence mode="popLayout">
                  {selectedTerapi.map((terapiName) => {
                    const rows = scheduleMap[terapiName] || [];
                    const label = terapiName.replace("PLB (Paedagog)", "Paedagog").replace("Terapi ", "");
                    return (
                      <motion.div
                        key={terapiName}
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                            <span className="text-sm font-bold text-gray-700">{terapiName}</span>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">{rows.length} jadwal</span>
                        </div>

                        <div className="p-3 space-y-3">
                          {rows.map((row, idx) => (
                            <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-white space-y-2">
                              {/* Baris atas: Terapis | Pertemuan */}
                              <div className="grid grid-cols-2 gap-2 items-end">
                                <div>
                                  <label className={labelCls}>Terapis</label>
                                  <div className="relative">
                                    <select
                                      value={row.terapis}
                                      onChange={(e) => updateRow(terapiName, idx, "terapis", e.target.value)}
                                      className={selectCls + " pr-7"}
                                    >
                                      <option value="">Pilih...</option>
                                      <option>Alief Arifun</option>
                                      <option>Siti Nurhaliza</option>
                                      <option>Ahmad Fauzi</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                  </div>
                                </div>
                                <div>
                                  <label className={labelCls}>Pertemuan</label>
                                  <input type="number" min={0} value={row.pertemuan}
                                    onChange={(e) => updateRow(terapiName, idx, "pertemuan", parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 text-center" />
                                </div>
                              </div>
                              {/* Baris bawah: Hari | Jam */}
                              <div className="grid grid-cols-2 gap-2 items-end">
                                <div>
                                  <label className={labelCls}>Hari</label>
                                  <div className="relative">
                                    <select
                                      value={row.hari}
                                      onChange={(e) => updateRow(terapiName, idx, "hari", e.target.value)}
                                      className={selectCls + " pr-7"}
                                    >
                                      {HARI_ORDER.map((h) => <option key={h}>{h}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                  </div>
                                </div>
                                <div>
                                  <label className={labelCls}>Jam</label>
                                  <div className="flex items-center gap-1.5">
                                    <input type="time" value={row.jamMulai}
                                      onChange={(e) => updateRow(terapiName, idx, "jamMulai", e.target.value)}
                                      className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700" />
                                    <span className="text-gray-300 text-xs shrink-0">–</span>
                                    <input type="time" value={row.jamSelesai}
                                      onChange={(e) => updateRow(terapiName, idx, "jamSelesai", e.target.value)}
                                      className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700" />
                                  </div>
                                </div>
                              </div>
                               {/* Hapus — hanya jika >1 row */}
                               {rows.length > 1 && (
                                 <div className="flex justify-end pt-1">
                                   <button
                                     type="button"
                                     onClick={() => removeRow(terapiName, idx)}
                                     className="cursor-pointer text-xs text-red-500 font-bold hover:text-red-700 flex items-center gap-1 transition-colors"
                                   >
                                     <X size={13} /> Hapus
                                   </button>
                                 </div>
                               )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addRowForTerapi(terapiName)}
                            className="cursor-pointer w-fit flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-[#2B7A75]/40 text-[#2B7A75] text-xs font-bold rounded-lg hover:border-[#2B7A75] hover:bg-teal-50/30 transition-colors"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            Tambah Jadwal
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Empty state hint */}
                {selectedTerapi.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    <CalendarCheck className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm font-medium">Pilih terapi di atas untuk menampilkan form jadwal</p>
                  </div>
                )}
              </div>

              <div className="px-5 pb-2">
                <div className="bg-[#1E5C58] rounded-3xl px-6 py-4 flex items-center justify-between shadow-md">
                  <p className="text-sm font-bold text-white tracking-wide">Total Pertemuan Keseluruhan</p>
                  <p className="text-2xl font-extrabold text-white">
                    {totalPertemuan} <span className="text-sm font-medium text-white/80">kali pertemuan</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-white">
                <button type="button" onClick={onClose} className="cursor-pointer px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit" className="cursor-pointer px-7 py-2.5 bg-[#1E5C58] hover:bg-[#163F3C] text-white rounded-lg text-sm font-bold shadow-md shadow-teal-900/20 transition-all active:scale-95">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// =======================
// Hapus Confirm Modal
// =======================
function HapusModal({
  open,
  item,
  onClose,
  onConfirm,
}: {
  open: boolean;
  item: JadwalTerapi | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl shadow-2xl shadow-teal-900/10 w-full max-w-sm overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-red-100/50 rounded-full scale-125 opacity-20"
                />
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1E5C58] mb-2 tracking-tight">
                Hapus Jadwal Terapi?
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-1 px-2">
                Anda akan menghapus jadwal terapi untuk
              </p>
              <p className="text-sm font-extrabold text-[#1E5C58] mb-6">
                {item.namaAnak} ({item.hari}, {item.jamMulai}–{item.jamSelesai})
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onConfirm}
                  className="cursor-pointer w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-red-500/20 active:scale-95"
                >
                  Ya, Hapus Sekarang
                </button>
                <button
                  onClick={onClose}
                  className="cursor-pointer w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm transition-all border border-gray-100 active:scale-95"
                >
                  Batal
                </button>
              </div>
            </div>
            <div className="h-1.5 w-full bg-linear-to-r from-red-500/10 via-red-500 to-red-500/10" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// =======================
// Main Page
// =======================
export default function JadwalTerapiPage() {
  const [activeTab, setActiveTab] = useState<TerapiType>("PLB (Paedagog)");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterStatus, search, filterDate]);

  const [data, setData] = useState<JadwalTerapi[]>(DUMMY_DATA);

  // Modal states
  const [showTambah, setShowTambah] = useState(false);
  const [detailItem, setDetailItem] = useState<JadwalTerapi | null>(null);
  const [editItem, setEditItem] = useState<JadwalTerapi | null>(null);
  const [hapusItem, setHapusItem] = useState<JadwalTerapi | null>(null);

  const FILTER_BUTTONS: { label: string; value: FilterStatus }[] = [
    { label: "Aktif", value: "Aktif" },
    { label: "Non Aktif", value: "Non Aktif" },
    { label: "Selesai", value: "Selesai" },
  ];

  const filtered = data.filter((item) => {
    const matchTerapi = item.terapiType === activeTab;
    const matchStatus = filterStatus === "Semua" || item.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      item.namaAnak.toLowerCase().includes(q) ||
      item.namaWali.toLowerCase().includes(q);
      
    let matchDate = true;
    if (filterDate) {
      const d = new Date(filterDate);
      const hariMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const hariFromDate = hariMap[d.getDay()];
      
      const pAwal = new Date(item.periodeAwal || "2025-01-01");
      const pAkhir = new Date(item.periodeAkhir || "2025-06-01");
      
      const isWithinPeriode = d >= pAwal && d <= pAkhir;
      matchDate = item.hari === hariFromDate && isWithinPeriode;
    }

    return matchTerapi && matchStatus && matchSearch && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleTambah = (form: Omit<JadwalTerapi, "id" | "terapiType">) => {
    const newItem: JadwalTerapi = {
      ...form,
      id: Date.now(),
      terapiType: activeTab,
    };
    setData((prev) => [...prev, newItem]);
  };

  const handleEdit = (updated: JadwalTerapi) => {
    setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleHapus = () => {
    if (!hapusItem) return;
    setData((prev) => prev.filter((item) => item.id !== hapusItem.id));
    setHapusItem(null);
  };

  return (
    <>
      <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
        <div className="flex flex-col flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-7 h-7 text-[#2B7A75]" />
              Jadwal Terapi Anak
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Kelola antrean dan penjadwalan prosedur terapi pasien.
            </p>
          </div>

          <main className="space-y-4">
            {/* ROW 1: Terapi Tabs */}
            <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-1.5 p-1.5 bg-[#EAF4F2]/50 border border-teal-50/50 rounded-2xl w-fit">
              {TERAPI_TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    id={`tab-${tab.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => {
                      setActiveTab(tab);
                      setFilterStatus("Semua");
                      setSearch("");
                    }}
                    className={`cursor-pointer px-4 py-2.5 text-sm font-semibold rounded-xl text-center transition-all duration-300 ${
                      isActive
                        ? "bg-[#1E5C58] text-white shadow-sm"
                        : "text-[#1E5C58]/80 hover:bg-white/60 hover:text-[#1E5C58]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* ROW 2: Date (kiri) | Search + Tambah Jadwal (kanan) */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Kiri: Date picker */}
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker()}
                  className="cursor-pointer pl-10 pr-4 py-2.5 border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-[0_2px_8px_rgba(30,92,88,0.02)] hover:border-teal-200 transition-colors [&::-webkit-calendar-picker-indicator]:hidden"
                />
              </div>

              {/* Kanan: Search + Tambah Jadwal */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#81B7A9] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama anak / orangtua..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2.5 border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-[0_2px_8px_rgba(30,92,88,0.02)] hover:border-teal-200 transition-colors"
                  />
                </div>
                <button
                  id="btn-tambah-jadwal-terapi"
                  onClick={() => setShowTambah(true)}
                  className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-[#2B7A75] hover:bg-[#1E5C58] text-white text-sm font-bold rounded-xl shadow-md shadow-teal-500/20 transition-all active:scale-95 shrink-0"
                >
                  <Plus size={17} strokeWidth={2.5} />
                  Tambah Jadwal
                </button>
              </div>
            </div>



            {/* ROW 3: Status filter — underline tab style */}
            <div className="flex items-center gap-0 border-b border-gray-200">
              {FILTER_BUTTONS.map(({ label, value }) => {
                const isActive = filterStatus === value;
                return (
                  <button
                    key={value}
                    id={`filter-status-${value.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => setFilterStatus(isActive ? "Semua" : value)}
                    className={`cursor-pointer relative px-5 py-3 text-sm font-bold transition-colors duration-200
                      ${isActive ? "text-[#1E5C58]" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {label}
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterStatus"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2B7A75] rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Table Card */}

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-teal-50 overflow-hidden"
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                    <CalendarCheck className="w-10 h-10 text-[#2B7A75] opacity-40" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">Belum Ada Jadwal</h3>
                  <p className="text-gray-400 text-sm max-w-xs">
                    Tidak ditemukan jadwal terapi untuk filter yang dipilih.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Informasi Pasien
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Jadwal Terapi
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Terapis
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Status Pasien
                          </th>
                          <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {paginatedData.map((item, idx) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.15, delay: idx * 0.04 }}
                              className="border-b border-gray-50 last:border-0 hover:bg-[#F4F9F8]/50 transition-colors group"
                            >
                              {/* Informasi Pasien */}
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-bold text-gray-800 text-sm">{item.namaAnak}</p>
                                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">
                                    Wali: {item.namaWali}
                                  </span>
                                </div>
                              </td>

                              {/* Jadwal Terapi */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                                  <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                                  {item.hari}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  Pukul {item.jamMulai} – {item.jamSelesai}
                                </div>
                              </td>

                              {/* Terapis */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2 text-sm text-[#2B7A75] font-semibold">
                                  <UserRound className="w-4 h-4 shrink-0" />
                                  {item.terapis}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-4 px-6">
                                <StatusBadge status={item.status} />
                              </td>

                              {/* Aksi */}
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    id={`btn-detail-${item.id}`}
                                    onClick={() => setDetailItem(item)}
                                    title="Lihat Detail"
                                    className="cursor-pointer text-gray-400 hover:text-[#2B7A75] transition-colors"
                                  >
                                    <Eye size={16} strokeWidth={2} />
                                  </button>
                                  <button
                                    id={`btn-edit-${item.id}`}
                                    onClick={() => setEditItem(item)}
                                    title="Edit"
                                    className="cursor-pointer text-gray-400 hover:text-amber-500 transition-colors"
                                  >
                                    <Pencil size={16} strokeWidth={2} />
                                  </button>
                                  <button
                                    id={`btn-hapus-${item.id}`}
                                    onClick={() => setHapusItem(item)}
                                    title="Hapus"
                                    className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={16} strokeWidth={2} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden p-4 space-y-3">
                    {paginatedData.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#F4F9F8]/40 border border-teal-50 rounded-2xl p-4 shadow-xs"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{item.namaAnak}</p>
                            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">
                              Wali: {item.namaWali}
                            </span>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>

                        <div className="bg-white/60 rounded-xl p-3 border border-white/60 grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Jadwal</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                              <CalendarDays className="w-3 h-3 text-teal-500" />
                              {item.hari}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 ml-4 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {item.jamMulai}–{item.jamSelesai}
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Terapis</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B7A75]">
                              <UserRound className="w-3 h-3" />
                              <span className="truncate">{item.terapis}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={() => setDetailItem(item)}
                            title="Lihat Detail"
                            className="cursor-pointer text-gray-400 hover:text-[#2B7A75] transition-colors"
                          >
                            <Eye size={16} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => setEditItem(item)}
                            title="Edit"
                            className="cursor-pointer text-gray-400 hover:text-amber-500 transition-colors"
                          >
                            <Pencil size={16} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => setHapusItem(item)}
                            title="Hapus"
                            className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer info */}
                  <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between flex-wrap gap-4">
                    <p className="text-xs text-gray-400 font-medium">
                      Menampilkan <span className="font-bold text-[#2B7A75]">{paginatedData.length}</span> dari <span className="font-bold text-[#2B7A75]">{filtered.length}</span> rekam jadwal{" "}
                      <span className="font-semibold text-gray-600">{activeTab}</span>
                      {filterStatus !== "Semua" && (
                        <> &mdash; Status: <span className="font-bold text-gray-600">{filterStatus}</span></>
                      )}
                    </p>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="cursor-pointer px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Prev
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                                currentPage === i + 1
                                  ? "bg-[#2B7A75] text-white"
                                  : "text-gray-500 hover:bg-gray-100"
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="cursor-pointer px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <TambahJadwalModal
        open={showTambah}
        onClose={() => setShowTambah(false)}
        terapiType={activeTab}
        onSubmit={handleTambah}
      />
      <DetailModal
        open={!!detailItem}
        item={detailItem}
        allData={data}
        onClose={() => setDetailItem(null)}
      />
      <EditModal
        open={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
      />
      <HapusModal
        open={!!hapusItem}
        item={hapusItem}
        onClose={() => setHapusItem(null)}
        onConfirm={handleHapus}
      />
    </>
  );
}
