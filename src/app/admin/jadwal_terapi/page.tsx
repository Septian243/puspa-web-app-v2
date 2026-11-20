"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSchedules, deleteSchedule, getTherapists, createSchedule, getChildren, updateSchedule } from "@/lib/api/jadwal_terapi";
import { showSuccessToast, handleApiError } from "@/lib/toast";

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
  noRekam?: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  terapis: string;
  status: StatusPasien;
  terapiType: TerapiType;
  periodeAwal: string;
  periodeAkhir: string;
  totalMeetings: number;
}

// =======================
// Dummy data (frontend only)
// =======================
const DUMMY_DATA: JadwalTerapi[] = [];

const TERAPI_TABS: TerapiType[] = [
  "PLB (Paedagog)",
  "Terapi Okupasi",
  "Terapi Wicara",
  "Fisioterapi",
];

const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function mapTerapiNameToSection(name: string): string {
  if (name.includes("Paedagog") || name.includes("PLB")) return "paedagog";
  if (name.includes("Okupasi")) return "okupasi";
  if (name.includes("Wicara")) return "wicara";
  if (name.includes("Fisio")) return "fisio";
  return "";
}

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
  allData: JadwalTerapi[];
}

const TERAPI_TAMBAHAN_OPTIONS = [
  "PLB (Paedagog)",
  "Terapi Okupasi",
  "Terapi Wicara",
  "Fisioterapi",
];

function PeriodeDateField({
  value,
  onChange,
  isError,
  placeholder = "dd/mm/yyyy",
}: {
  value: string;
  onChange: (val: string) => void;
  isError?: boolean;
  placeholder?: string;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDisplay = (val: string) => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  };

  const handleOpenPicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === "function") {
        try {
          dateInputRef.current.showPicker();
        } catch {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="relative flex items-center flex-1">
      <input
        type="text"
        readOnly
        value={formatDisplay(value)}
        onClick={handleOpenPicker}
        placeholder={placeholder}
        className={`w-full px-2 py-2.5 pr-7 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 bg-white cursor-pointer transition-colors ${isError ? "border-red-500 bg-red-50" : "border-gray-200"
          }`}
      />
      <CalendarDays
        onClick={handleOpenPicker}
        className="w-3.5 h-3.5 text-gray-400 absolute right-2 pointer-events-none"
      />
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

function TambahJadwalModal({ open, onClose, terapiType, onSubmit, allData }: TambahJadwalModalProps) {
  const [noRekam, setNoRekam] = useState("");
  const [namaAnak, setNamaAnak] = useState("");
  const [namaOrangtua, setNamaOrangtua] = useState("");
  const [periodeAwal, setPeriodeAwal] = useState("");
  const [periodeAkhir, setPeriodeAkhir] = useState("");
  const [showAnakDropdown, setShowAnakDropdown] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [childrenList, setChildrenList] = useState<{ id: string; name: string; rm: string; guardian?: string }[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [therapistsBySection, setTherapistsBySection] = useState<Record<string, { id: string; name: string }[]>>({});

  useEffect(() => {
    if (open) {
      setHasSubmitted(false);
      setWarningMessage("");
      setNoRekam("");
      setNamaAnak("");
      setNamaOrangtua("");
      setPeriodeAwal("");
      setPeriodeAkhir("");
      setSelectedTerapi([]);
      setScheduleMap({});
      setSelectedChildId("");
      setShowAnakDropdown(false);

      getChildren(true).then((res) => {
        if (Array.isArray(res)) {
          setChildrenList(
            res.map((c: any) => {
              let childRm = (c.medical_record_number && c.medical_record_number !== "-")
                ? c.medical_record_number
                : (c.no_rekam_medis && c.no_rekam_medis !== "-" ? c.no_rekam_medis : "");
              if (!childRm && typeof window !== "undefined" && (c.child_id || c.id)) {
                try {
                  const cached = localStorage.getItem(`puspa_child_rm_${c.child_id || c.id}`);
                  if (cached) childRm = cached;
                } catch { }
              }
              return {
                id: c.child_id || c.id || "",
                name: c.child_name || c.name || "",
                rm: childRm || "",
                guardian: c.guardian_name || c.parent_name || c.father_name || c.mother_name || "",
              };
            })
          );
        }
      });
      getTherapists().then((res) => {
        if (Array.isArray(res)) {
          const map: Record<string, { id: string; name: string }[]> = {};
          res.forEach((t: { therapist_id?: string; id?: string; therapist_name?: string; name?: string; therapist_section?: string }) => {
            const sec = t.therapist_section || "";
            if (!map[sec]) map[sec] = [];
            map[sec].push({
              id: t.therapist_id || t.id || "",
              name: t.therapist_name || t.name || "",
            });
          });
          setTherapistsBySection(map);
        }
      });
    }
  }, [open]);

  // Options for Nama Anak dropdown (Smart Search)
  const anakOptions = useMemo(() => {
    const list: { name: string; rm: string; guardian: string; id: string }[] = [];
    const seen = new Set<string>();

    childrenList.forEach((c) => {
      const key = `${c.name}_${c.id}`.toLowerCase();
      if (c.name && !seen.has(key)) {
        seen.add(key);
        list.push({ name: c.name, rm: c.rm || "", guardian: c.guardian || "", id: c.id });
      }
    });

    allData.forEach((d) => {
      if (d.namaAnak && d.namaAnak !== "-" && !seen.has(d.namaAnak.toLowerCase())) {
        seen.add(d.namaAnak.toLowerCase());
        list.push({ name: d.namaAnak, rm: d.noRekam && d.noRekam !== "-" ? d.noRekam : "", guardian: d.namaWali || "", id: "" });
      }
    });

    return list;
  }, [childrenList, allData]);

  // Filtered anak options for Smart Search (search by child name, No. RM, or guardian)
  const filteredAnak = useMemo(() => {
    const q = namaAnak.trim().toLowerCase();
    if (!q) return anakOptions;
    return anakOptions.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.rm && item.rm.toLowerCase().includes(q)) ||
        (item.guardian && item.guardian.toLowerCase().includes(q))
    );
  }, [anakOptions, namaAnak]);

  // Check if selected child already has an official No. RM
  const selectedChild = useMemo(() => {
    if (selectedChildId) {
      return childrenList.find((c) => c.id === selectedChildId);
    }
    if (namaAnak) {
      return childrenList.find((c) => c.name.toLowerCase() === namaAnak.toLowerCase().trim());
    }
    return undefined;
  }, [childrenList, selectedChildId, namaAnak]);

  const isRmLocked = Boolean(selectedChild?.rm && selectedChild.rm.trim() !== "" && selectedChild.rm !== "-");

  // Check if manually inputted No. RM is already used by another child
  const duplicateRmOwner = useMemo(() => {
    const clean = noRekam.trim().toLowerCase();
    if (!clean || isRmLocked) return null;
    const currentId = selectedChild?.id || selectedChildId;
    const currentName = selectedChild?.name?.toLowerCase() || namaAnak.trim().toLowerCase();

    // Check against childrenList
    const matchChild = childrenList.find(
      (c) => c.rm && c.rm.trim().toLowerCase() === clean && (!currentId || c.id !== currentId) && c.name.toLowerCase() !== currentName
    );
    if (matchChild) return matchChild.name;

    // Check against allData
    const matchData = allData.find(
      (d) =>
        d.noRekam &&
        d.noRekam !== "-" &&
        d.noRekam.trim().toLowerCase() === clean &&
        d.namaAnak.toLowerCase() !== currentName
    );
    if (matchData) return matchData.namaAnak;

    return null;
  }, [noRekam, isRmLocked, selectedChild, selectedChildId, namaAnak, childrenList, allData]);

  const handleSelectChild = (item: { id: string; name: string; rm: string; guardian: string }) => {
    setSelectedChildId(item.id);
    setNamaAnak(item.name);
    setNamaOrangtua(item.guardian || "");
    if (item.rm && item.rm !== "-") {
      setNoRekam(item.rm);
    } else {
      setNoRekam("");
    }
    setShowAnakDropdown(false);
  };

  const handleClearChild = () => {
    setSelectedChildId("");
    setNamaAnak("");
    setNamaOrangtua("");
    setNoRekam("");
    setShowAnakDropdown(false);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    setWarningMessage("");

    // 1. Validasi Nama Anak
    if (!namaAnak.trim()) {
      setWarningMessage("Nama anak wajib diisi terlebih dahulu!");
      return;
    }

    const matchedChild = childrenList.find(
      (c) =>
        c.id === selectedChildId ||
        c.name.toLowerCase() === namaAnak.trim().toLowerCase() ||
        (noRekam && c.rm && c.rm.toLowerCase() === noRekam.trim().toLowerCase())
    );
    const targetChildId = matchedChild?.id || selectedChildId;

    if (!targetChildId) {
      setWarningMessage("Pasien anak belum terdaftar dalam sistem. Silakan pilih anak dari daftar pencarian!");
      return;
    }

    // 2. Validasi No. Rekam Medis (wajib jika anak belum memiliki RM resmi)
    if (!isRmLocked) {
      if (!noRekam.trim()) {
        setWarningMessage("Nomor Rekam Medis (RM) wajib diisi terlebih dahulu untuk pasien baru!");
        return;
      }
      if (duplicateRmOwner) {
        setWarningMessage(`Nomor Rekam Medis "${noRekam.trim()}" sudah terpakai oleh pasien ${duplicateRmOwner}! Silakan gunakan nomor RM yang berbeda.`);
        return;
      }
    }

    // 3. Validasi Checklist Terapi
    if (selectedTerapi.length === 0) {
      setWarningMessage("Silakan pilih minimal satu jenis terapi!");
      return;
    }

    // 4. Validasi Tanggal Periode
    if (!periodeAwal) {
      setWarningMessage("Tanggal periode awal wajib diisi!");
      return;
    }
    if (!periodeAkhir) {
      setWarningMessage("Tanggal periode akhir wajib diisi!");
      return;
    }
    if (periodeAwal > periodeAkhir) {
      setWarningMessage("Tanggal periode awal tidak boleh melebihi tanggal periode akhir!");
      return;
    }

    // 5. Validasi Baris Jadwal Terapi
    for (const terapiName of selectedTerapi) {
      const sectionKey = mapTerapiNameToSection(terapiName);
      const rows = scheduleMap[terapiName] || [];
      const sectionTherapists = therapistsBySection[sectionKey] || [];

      if (rows.length === 0) {
        setWarningMessage(`Silakan tambahkan jadwal untuk terapi ${terapiName}!`);
        return;
      }

      for (const r of rows) {
        if (!r.terapis) {
          setWarningMessage(`Silakan pilih terapis untuk terapi ${terapiName}!`);
          return;
        }
        if (!r.pertemuan || Number(r.pertemuan) <= 0) {
          setWarningMessage(`Jumlah pertemuan untuk terapi ${terapiName} minimal 1 kali!`);
          return;
        }
        if (!r.hari) {
          setWarningMessage(`Silakan pilih hari untuk terapi ${terapiName}!`);
          return;
        }
        if (!r.jamMulai) {
          setWarningMessage(`Jam mulai untuk terapi ${terapiName} wajib diisi!`);
          return;
        }
        if (!r.jamSelesai) {
          setWarningMessage(`Jam selesai untuk terapi ${terapiName} wajib diisi!`);
          return;
        }
        if (r.jamMulai >= r.jamSelesai) {
          setWarningMessage(`Jam mulai harus lebih awal dari jam selesai pada terapi ${terapiName}!`);
          return;
        }

        const matchedTherapist = sectionTherapists.find((t) => t.name === r.terapis);
        if (!matchedTherapist) {
          setWarningMessage(`Terapis ${r.terapis} tidak ditemukan untuk bidang ${terapiName}!`);
          return;
        }
      }
    }

    const dayNumMap: Record<string, number> = {
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6,
      Minggu: 7,
    };

    const finalRm = noRekam.trim().toUpperCase();

    try {
      for (const terapiName of selectedTerapi) {
        const sectionKey = mapTerapiNameToSection(terapiName);
        const rows = scheduleMap[terapiName] || [];
        const sectionTherapists = therapistsBySection[sectionKey] || [];

        for (const r of rows) {
          const matchedTherapist = sectionTherapists.find((t) => t.name === r.terapis);
          if (!matchedTherapist) continue;

          await createSchedule({
            child_id: targetChildId,
            therapist_id: matchedTherapist.id,
            therapy_type: sectionKey,
            day_of_week: dayNumMap[r.hari] || 1,
            start_time: r.jamMulai,
            end_time: r.jamSelesai,
            total_meetings: Number(r.pertemuan),
            period_start: periodeAwal,
            period_end: periodeAkhir,
            status: "aktif",
            medical_record_number: finalRm || undefined,
          });
        }
      }

      if (finalRm && typeof window !== "undefined" && targetChildId) {
        try {
          localStorage.setItem(`puspa_child_rm_${targetChildId}`, finalRm);
        } catch { }
      }

      setNoRekam(""); setNamaAnak(""); setNamaOrangtua(""); setPeriodeAwal(""); setPeriodeAkhir("");
      setSelectedTerapi([]); setScheduleMap({}); setSelectedChildId(""); setHasSubmitted(false); setWarningMessage("");
      showSuccessToast("Jadwal terapi berhasil ditambahkan!");
      onSubmit({ namaAnak, namaWali: namaOrangtua, noRekam: finalRm || "-", hari: "", jamMulai: "", jamSelesai: "", terapis: "", status: "Aktif", periodeAwal, periodeAkhir, totalMeetings: 4 });
      onClose();
    } catch (err: any) {
      console.error("CREATE SCHEDULE ERROR:", err);
      handleApiError(err, "Gagal menambahkan jadwal. Pastikan data terapis dan tanggal valid.");
    }
  };

  const handleClose = () => {
    setNoRekam(""); setNamaAnak(""); setNamaOrangtua(""); setPeriodeAwal(""); setPeriodeAkhir("");
    setSelectedTerapi([]); setScheduleMap({}); setHasSubmitted(false); setWarningMessage("");
    setShowAnakDropdown(false); setSelectedChildId("");
    onClose();
  };

  const getInputCls = (isError: boolean) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] focus:border-teal-300 text-gray-700 placeholder-gray-300 transition-colors ${isError ? "border-red-500 bg-red-50" : "border-gray-200"}`;
  const getSelectCls = (isError: boolean) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] focus:border-teal-300 text-gray-700 bg-white transition-colors appearance-none ${isError ? "border-red-500 bg-red-50" : "border-gray-200"}`;
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
                <div className="flex items-center justify-center rounded-lg w-9 h-9 bg-white/15">
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
              <div className="flex-1 p-5 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  {/* Grid Input Utama: Kolom Kiri (RM & Terapi) | Kolom Kanan (Anak, Orang Tua, Periode) */}
                  <div className="grid items-start grid-cols-2 gap-3">
                    {/* Kolom Kiri: No. Rekam Medis & Checklist Terapi */}
                    <div className="flex flex-col gap-3">
                      {/* No. Rekam Medis */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className={labelCls}>
                            No. Rekam Medis {!isRmLocked && <span className="text-red-500">*</span>}
                          </label>
                          {isRmLocked && (
                            <span className="text-[10px] text-[#2B7A75] bg-teal-50 border border-teal-100/80 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                              <Lock size={10} /> Terkunci Resmi
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={noRekam}
                            readOnly={isRmLocked}
                            onChange={(e) => {
                              if (!isRmLocked) {
                                setNoRekam(e.target.value.toUpperCase());
                                if (warningMessage) setWarningMessage("");
                              }
                            }}
                            placeholder={isRmLocked ? noRekam : "RM-000001"}
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-700 transition-colors uppercase ${isRmLocked
                                ? "bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed font-semibold pr-8"
                                : getInputCls((hasSubmitted && !noRekam.trim()) || Boolean(duplicateRmOwner))
                              }`}
                          />
                          {isRmLocked && (
                            <div className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
                              <Lock size={14} />
                            </div>
                          )}
                        </div>
                        {isRmLocked ? (
                          <p className="text-[10px] text-[#2B7A75] mt-1 font-medium">
                            No. RM resmi terdaftar & terkunci.
                          </p>
                        ) : duplicateRmOwner ? (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} className="shrink-0" /> Nomor RM sudah digunakan oleh pasien {duplicateRmOwner}!
                          </p>
                        ) : hasSubmitted && !noRekam.trim() ? (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} className="shrink-0" /> Nomor RM wajib diisi terlebih dahulu!
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400 mt-1">
                            Input manual untuk jadwal perdana.
                          </p>
                        )}
                      </div>

                      {/* Checklist Terapi */}
                      <div>
                        <label className={labelCls}>
                          Terapi <span className="text-red-500">*</span>
                        </label>
                        <div className={`border rounded-lg p-2.5 space-y-2 transition-colors ${hasSubmitted && selectedTerapi.length === 0 ? "border-red-500 bg-red-50/50" : "border-gray-200 bg-gray-50/50"}`}>
                          {TERAPI_TAMBAHAN_OPTIONS.map((name) => {
                            const checked = selectedTerapi.includes(name);
                            const label = name.replace("PLB (Paedagog)", "Paedagog").replace("Terapi ", "");
                            return (
                              <label key={name} className="flex items-center gap-2.5 cursor-pointer group">
                                <div
                                  onClick={() => {
                                    toggleTerapi(name);
                                    if (warningMessage) setWarningMessage("");
                                  }}
                                  className={`w-4.5 h-4.5 w-[18px] h-[18px] shrink-0 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${checked
                                      ? "bg-[#1E5C58] border-[#1E5C58]"
                                      : "border-gray-300 bg-white group-hover:border-[#2B7A75]"
                                    }`}
                                >
                                  {checked && (
                                    <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                                  )}
                                </div>
                                <span
                                  onClick={() => {
                                    toggleTerapi(name);
                                    if (warningMessage) setWarningMessage("");
                                  }}
                                  className={`text-sm font-medium transition-colors ${checked ? "text-[#1E5C58] font-semibold" : "text-gray-600"
                                    }`}
                                >
                                  {label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        {hasSubmitted && selectedTerapi.length === 0 && (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} className="shrink-0" /> Pilih minimal satu tipe terapi!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Kolom Kanan: Nama Anak, Orang Tua, Periode */}
                    <div className="flex flex-col gap-3">
                      {/* Nama Anak dengan Smart Search Dropdown */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className={labelCls}>
                            Nama Anak <span className="text-red-500">*</span>
                          </label>
                          {selectedChildId && (
                            <button
                              type="button"
                              onClick={handleClearChild}
                              className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
                            >
                              <X size={11} /> Ganti Pasien
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={namaAnak}
                            onChange={(e) => {
                              setNamaAnak(e.target.value);
                              setSelectedChildId("");
                              setShowAnakDropdown(true);
                              if (warningMessage) setWarningMessage("");
                            }}
                            onFocus={() => setShowAnakDropdown(true)}
                            onBlur={() => setTimeout(() => setShowAnakDropdown(false), 250)}
                            placeholder="Cari nama anak atau No. RM..."
                            className={`${getInputCls(hasSubmitted && !namaAnak.trim())} pr-8`}
                          />
                          {namaAnak ? (
                            <button
                              type="button"
                              onClick={handleClearChild}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          ) : (
                            <div className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
                              <ChevronDown size={14} />
                            </div>
                          )}
                        </div>
                        {hasSubmitted && !namaAnak.trim() ? (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} className="shrink-0" /> Nama anak wajib diisi terlebih dahulu!
                          </p>
                        ) : null}
                        {showAnakDropdown && (
                          <ul className="absolute z-30 w-full py-1 mt-1 overflow-y-auto bg-white border border-gray-200 divide-y shadow-xl rounded-xl max-h-56 divide-gray-50">
                            {filteredAnak.map((item) => (
                              <li
                                key={item.id || item.name}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectChild(item);
                                  if (warningMessage) setWarningMessage("");
                                }}
                                className="px-3.5 py-2.5 cursor-pointer hover:bg-teal-50/80 transition-colors group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-sm text-gray-800 group-hover:text-[#1E5C58]">
                                    {item.name}
                                  </span>
                                  {item.rm && item.rm !== "-" ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-teal-50 text-[#1E5C58] px-2 py-0.5 rounded-md font-bold border border-teal-200/60 shrink-0">
                                      <Lock size={9} /> {item.rm}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded font-medium shrink-0">
                                      Belum ada RM
                                    </span>
                                  )}
                                </div>
                                {item.guardian && (
                                  <div className="text-[11px] text-gray-400 mt-0.5">
                                    Wali: <span className="text-gray-600">{item.guardian}</span>
                                  </div>
                                )}
                              </li>
                            ))}
                            {filteredAnak.length === 0 && (
                              <li className="px-3 py-3 text-xs text-center text-gray-400">
                                Tidak ditemukan pasien dengan nama atau No. RM tersebut
                              </li>
                            )}
                          </ul>
                        )}
                      </div>

                      {/* Kolom Orang Tua (Auto-fill Read-Only) */}
                      <div className="relative">
                        <label className={labelCls}>Orang Tua</label>
                        <input
                          type="text"
                          readOnly
                          value={namaOrangtua}
                          placeholder={namaAnak ? "Tidak ada data orang tua" : "Otomatis terisi setelah memilih anak"}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 cursor-not-allowed font-medium transition-colors"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          Otomatis terisi sesuai data keluarga pasien anak.
                        </p>
                      </div>

                      {/* Kolom Periode */}
                      <div>
                        <label className={labelCls}>
                          Periode <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <PeriodeDateField
                            value={periodeAwal}
                            onChange={(val) => {
                              setPeriodeAwal(val);
                              if (warningMessage) setWarningMessage("");
                            }}
                            isError={hasSubmitted && (!periodeAwal || (Boolean(periodeAkhir) && periodeAwal > periodeAkhir))}
                            placeholder="dd/mm/yyyy"
                          />
                          <span className="text-sm text-gray-400">–</span>
                          <PeriodeDateField
                            value={periodeAkhir}
                            onChange={(val) => {
                              setPeriodeAkhir(val);
                              if (warningMessage) setWarningMessage("");
                            }}
                            isError={hasSubmitted && (!periodeAkhir || (Boolean(periodeAwal) && periodeAwal > periodeAkhir))}
                            placeholder="dd/mm/yyyy"
                          />
                        </div>
                        {hasSubmitted && (!periodeAwal || !periodeAkhir) ? (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} className="shrink-0" /> Periode awal dan akhir wajib diisi!
                          </p>
                        ) : hasSubmitted && periodeAwal && periodeAkhir && periodeAwal > periodeAkhir ? (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} className="shrink-0" /> Periode awal tidak boleh melebihi periode akhir!
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic sections per selected terapi */}
                <div className="flex flex-col mt-4">
                  <AnimatePresence>
                    {selectedTerapi.map((terapiName) => {
                      const rows = scheduleMap[terapiName] || [];
                      const label = terapiName.replace("PLB (Paedagog)", "Paedagog").replace("Terapi ", "");
                      return (
                        <motion.div
                          key={terapiName}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mb-4 overflow-hidden border border-gray-200 rounded-xl">
                            {/* Section header */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                                <span className="text-sm font-bold text-gray-700">{terapiName}</span>
                              </div>
                              <span className="text-xs font-medium text-gray-400">{rows.length} jadwal</span>
                            </div>

                            {/* Rows */}
                            <div className="p-3 space-y-3">
                              {rows.map((row, idx) => (
                                <div key={idx} className="p-3 space-y-2 bg-white border border-gray-100 rounded-lg">
                                  {/* Baris atas: Terapis | Pertemuan */}
                                  <div className="grid items-end grid-cols-2 gap-2">
                                    <div>
                                      <label className={labelCls}>
                                        Terapis <span className="text-red-500">*</span>
                                      </label>
                                      <div className="relative">
                                        <select
                                          value={row.terapis}
                                          onChange={(e) => {
                                            updateRow(terapiName, idx, "terapis", e.target.value);
                                            if (warningMessage) setWarningMessage("");
                                          }}
                                          className={getSelectCls(hasSubmitted && !row.terapis) + " pr-7"}
                                        >
                                          <option value="">Pilih...</option>
                                          {(therapistsBySection[mapTerapiNameToSection(terapiName)] || []).map((t) => (
                                            <option key={t.id || t.name} value={t.name}>
                                              {t.name}
                                            </option>
                                          ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className={labelCls}>
                                        Pertemuan <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={row.pertemuan || ""}
                                        placeholder="Contoh: 4"
                                        onChange={(e) => {
                                          updateRow(terapiName, idx, "pertemuan", parseInt(e.target.value) || 0);
                                          if (warningMessage) setWarningMessage("");
                                        }}
                                        className={`w-full px-2 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 text-center ${hasSubmitted && (!row.pertemuan || row.pertemuan <= 0)
                                            ? "border-red-500 bg-red-50"
                                            : "border-gray-200"
                                          }`}
                                      />
                                    </div>
                                  </div>
                                  {/* Baris bawah: Hari | Jam */}
                                  <div className="grid items-end grid-cols-2 gap-2">
                                    <div>
                                      <label className={labelCls}>
                                        Hari <span className="text-red-500">*</span>
                                      </label>
                                      <div className="relative">
                                        <select
                                          value={row.hari}
                                          onChange={(e) => {
                                            updateRow(terapiName, idx, "hari", e.target.value);
                                            if (warningMessage) setWarningMessage("");
                                          }}
                                          className={getSelectCls(hasSubmitted && !row.hari) + " pr-7"}
                                        >
                                          {HARI_ORDER.map((h) => <option key={h}>{h}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className={labelCls}>
                                        Jam <span className="text-red-500">*</span>
                                      </label>
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="time"
                                          value={row.jamMulai}
                                          onChange={(e) => {
                                            updateRow(terapiName, idx, "jamMulai", e.target.value);
                                            if (warningMessage) setWarningMessage("");
                                          }}
                                          className={`flex-1 px-2 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 ${hasSubmitted && (!row.jamMulai || (Boolean(row.jamSelesai) && row.jamMulai >= row.jamSelesai))
                                              ? "border-red-500 bg-red-50"
                                              : "border-gray-200"
                                            }`}
                                        />
                                        <span className="text-xs text-gray-300 shrink-0">–</span>
                                        <input
                                          type="time"
                                          value={row.jamSelesai}
                                          onChange={(e) => {
                                            updateRow(terapiName, idx, "jamSelesai", e.target.value);
                                            if (warningMessage) setWarningMessage("");
                                          }}
                                          className={`flex-1 px-2 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#81B7A9] text-gray-700 ${hasSubmitted && (!row.jamSelesai || (Boolean(row.jamMulai) && row.jamMulai >= row.jamSelesai))
                                              ? "border-red-500 bg-red-50"
                                              : "border-gray-200"
                                            }`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  {hasSubmitted && (!row.terapis || !row.pertemuan || row.pertemuan <= 0 || !row.hari || !row.jamMulai || !row.jamSelesai || row.jamMulai >= row.jamSelesai) && (
                                    <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 pt-1">
                                      <AlertTriangle size={10} />
                                      {!row.terapis
                                        ? "Terapis wajib dipilih!"
                                        : !row.pertemuan || row.pertemuan <= 0
                                          ? "Pertemuan minimal 1 kali!"
                                          : !row.hari
                                            ? "Hari wajib dipilih!"
                                            : !row.jamMulai || !row.jamSelesai
                                              ? "Jam mulai & jam selesai wajib diisi!"
                                              : "Jam mulai harus lebih awal dari jam selesai!"}
                                    </p>
                                  )}
                                  {/* Hapus — hanya jika >1 row */}
                                  {rows.length > 1 && (
                                    <div className="flex justify-end pt-1">
                                      <button
                                        type="button"
                                        onClick={() => removeRow(terapiName, idx)}
                                        className="flex items-center gap-1 text-xs font-bold text-red-500 transition-colors cursor-pointer hover:text-red-700"
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
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Empty state hint */}
                  <AnimatePresence>
                    {selectedTerapi.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col items-center justify-center py-8 mb-4 text-center text-gray-400 border-2 border-gray-200 border-dashed rounded-xl">
                          <CalendarCheck className="w-8 h-8 mb-2 opacity-30" />
                          <p className="text-sm font-medium">Pilih terapi di atas untuk menampilkan form jadwal</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="px-5 pb-2">
                <div className="bg-[#1E5C58] rounded-3xl px-6 py-4 flex items-center justify-between shadow-md">
                  <p className="text-sm font-bold tracking-wide text-white">Total Pertemuan Keseluruhan</p>
                  <p className="text-2xl font-extrabold text-white">
                    {totalPertemuan} <span className="text-sm font-medium text-white/80">kali pertemuan</span>
                  </p>
                </div>
                {warningMessage && (
                  <div className="flex items-center gap-2 p-3 mt-3 text-xs font-semibold text-red-700 border border-red-200 bg-red-50 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{warningMessage}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 bg-white border-t border-gray-100 shrink-0">
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
                <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl">
                  <Eye className="w-6 h-6 text-white/90" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-wide text-white">Detail Penjadwalan</h2>
                  <p className="text-sm text-white/70 mt-0.5">Informasi lengkap jadwal terapi {item.namaAnak}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6 overflow-y-auto p-7">
              {/* Top Grid */}
              <div className="grid grid-cols-2 px-2 gap-y-6 gap-x-4">
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-400">No. Rekam Medis</p>
                  <p className="text-sm font-extrabold text-gray-800">
                    {item.noRekam && item.noRekam !== "-" ? item.noRekam : "Belum ada No. RM"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-400">Nama Anak</p>
                  <p className="text-sm font-extrabold text-gray-800">{item.namaAnak}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-400">Wali</p>
                  <p className="text-sm font-extrabold text-gray-800">{item.namaWali}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-400">Status</p>
                  <div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${item.status === 'Aktif' ? 'bg-[#EAF4F2] text-[#2B7A75]' :
                        item.status === 'Non Aktif' ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                      }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-400">Periode</p>
                  <p className="text-sm font-extrabold text-gray-800">
                    {item.periodeAwal && item.periodeAkhir ? `${item.periodeAwal} – ${item.periodeAkhir}` : "Periode Aktif"}
                  </p>
                </div>
              </div>

              {/* Terapi Card */}
              <div className="p-6 border border-gray-100 bg-gray-50/50 rounded-2xl">
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
                      {item.totalMeetings || 12}
                    </div>
                  </div>
                </div>
              </div>

              {/* Terapi Lain Card */}
              {otherTherapies.length > 0 && (
                <div className="p-6 border border-gray-100 bg-gray-50/50 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1E5C58]" />
                      <span className="text-sm font-extrabold text-[#1E5C58]">Terapi Lain</span>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-full shadow-sm">
                      {otherTherapies.length} terapi
                    </span>
                  </div>
                  <div className="space-y-3">
                    {otherTherapies.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl">
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
                  {item.totalMeetings || 12} <span className="text-sm font-medium text-white/80">kali pertemuan</span>
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
  const [noRekam, setNoRekam] = useState("");
  const [periodeAwal, setPeriodeAwal] = useState("2025-01-01");
  const [periodeAkhir, setPeriodeAkhir] = useState("2025-06-01");
  const [therapistsBySection, setTherapistsBySection] = useState<Record<string, { id: string; name: string }[]>>({});

  useEffect(() => {
    if (open) {
      getTherapists().then((res) => {
        if (Array.isArray(res)) {
          const map: Record<string, { id: string; name: string }[]> = {};
          res.forEach((t: { therapist_id?: string; id?: string; therapist_name?: string; name?: string; therapist_section?: string }) => {
            const sec = t.therapist_section || "";
            if (!map[sec]) map[sec] = [];
            map[sec].push({
              id: t.therapist_id || t.id || "",
              name: t.therapist_name || t.name || "",
            });
          });
          setTherapistsBySection(map);
        }
      });
    }
  }, [open]);

  const [selectedTerapi, setSelectedTerapi] = useState<string[]>([]);
  const [scheduleMap, setScheduleMap] = useState<Record<string, JadwalRow[]>>({});

  useEffect(() => {
    if (item) {
      setForm({ ...item });
      setNoRekam(item.noRekam && item.noRekam !== "-" ? item.noRekam : "-");
      setPeriodeAwal(item.periodeAwal || "2025-01-01");
      setPeriodeAkhir(item.periodeAkhir || "2025-06-01");
      setSelectedTerapi([item.terapiType]);
      setScheduleMap({
        [item.terapiType]: [
          { terapis: item.terapis, hari: item.hari, jamMulai: item.jamMulai, jamSelesai: item.jamSelesai, pertemuan: item.totalMeetings || 12 },
        ],
      });
    } else {
      setNoRekam("");
      setSelectedTerapi([]);
      setScheduleMap({});
    }
  }, [item]);

  if (!form) return null;



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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !item) return;

    const dayNumMap: Record<string, number> = {
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6,
      Minggu: 7,
    };
    const statusMap: Record<string, string> = {
      Aktif: "aktif",
      "Non Aktif": "non_aktif",
      Selesai: "selesai",
    };

    const firstTerapi = selectedTerapi[0] || item.terapiType;
    const sectionKey = mapTerapiNameToSection(firstTerapi);
    const firstRow = scheduleMap[firstTerapi]?.[0];

    const sectionTherapists = therapistsBySection[sectionKey] || [];
    const matchedTherapist = firstRow?.terapis ? sectionTherapists.find((t) => t.name === firstRow.terapis) : null;

    try {
      const payload: any = {
        therapy_type: sectionKey,
        status: statusMap[form.status] || "aktif",
      };

      if (matchedTherapist) payload.therapist_id = matchedTherapist.id;
      if (firstRow?.hari) payload.day_of_week = dayNumMap[firstRow.hari] || 1;
      if (firstRow?.jamMulai) payload.start_time = firstRow.jamMulai;
      if (firstRow?.jamSelesai) payload.end_time = firstRow.jamSelesai;
      if (firstRow?.pertemuan) payload.total_meetings = Number(firstRow.pertemuan);
      if (periodeAwal) payload.period_start = periodeAwal;
      if (periodeAkhir) payload.period_end = periodeAkhir;

      await updateSchedule(String(item.id), payload);

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
      showSuccessToast("Jadwal terapi berhasil diperbarui!");
      onClose();
    } catch (err: any) {
      console.error("UPDATE SCHEDULE ERROR:", err);
      handleApiError(err, "Gagal memperbarui jadwal terapi.");
    }
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
                <div className="flex items-center justify-center rounded-lg w-9 h-9 bg-white/15">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Edit Penjadwalan</h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    Perbarui jadwal terapi {form.terapiType} untuk {form.namaAnak}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white transition-colors rounded-xl bg-white/10 hover:bg-white/20">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 p-5 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  {/* Row 1: No Rekam Medis + Nama Anak + Status */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls}>No. Rekam Medis</label>
                        <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                          <Lock size={10} /> Terkunci
                        </span>
                      </div>
                      <input
                        type="text"
                        value={noRekam}
                        readOnly
                        disabled
                        className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed font-medium"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls}>Nama Anak</label>
                        <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                          <Lock size={10} /> Terkunci
                        </span>
                      </div>
                      <input
                        type="text"
                        name="namaAnak"
                        value={form.namaAnak}
                        readOnly
                        disabled
                        className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed font-medium"
                      />
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
                  <div className="grid items-start grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>
                        Terapi <span className="text-[10px] font-normal text-gray-400">(Tidak dapat diubah)</span>
                      </label>
                      <div className="border border-gray-200 rounded-lg p-2.5 space-y-2 bg-gray-50/70 select-none">
                        {TERAPI_TAMBAHAN_OPTIONS.map((name) => {
                          const checked = selectedTerapi.includes(name);
                          const label = name.replace("PLB (Paedagog)", "Paedagog").replace("Terapi ", "");
                          return (
                            <div
                              key={name}
                              className={`flex items-center gap-2.5 cursor-not-allowed ${checked ? "opacity-100" : "opacity-40"
                                }`}
                              title={checked ? "Jenis terapi jadwal ini" : "Jenis terapi tidak dapat diubah pada saat edit jadwal"}
                            >
                              <div
                                className={`w-[18px] h-[18px] shrink-0 rounded border-2 flex items-center justify-center transition-all cursor-not-allowed ${checked
                                    ? "bg-[#1E5C58] border-[#1E5C58]"
                                    : "border-gray-300 bg-gray-100"
                                  }`}
                              >
                                {checked && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                              </div>
                              <span
                                className={`text-sm font-medium cursor-not-allowed ${checked ? "text-[#1E5C58] font-semibold" : "text-gray-400"
                                  }`}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Periode</label>
                      <div className="flex items-center gap-1.5">
                        <PeriodeDateField
                          value={periodeAwal}
                          onChange={setPeriodeAwal}
                          placeholder="dd/mm/yyyy"
                        />
                        <span className="text-sm text-gray-400">–</span>
                        <PeriodeDateField
                          value={periodeAkhir}
                          onChange={setPeriodeAkhir}
                          placeholder="dd/mm/yyyy"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic sections per selected terapi */}
                <div className="flex flex-col mt-4">
                  <AnimatePresence>
                    {selectedTerapi.map((terapiName) => {
                      const rows = scheduleMap[terapiName] || [];
                      const label = terapiName.replace("PLB (Paedagog)", "Paedagog").replace("Terapi ", "");
                      return (
                        <motion.div
                          key={terapiName}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mb-4 overflow-hidden border border-gray-200 rounded-xl">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#2B7A75]" />
                                <span className="text-sm font-bold text-gray-700">{terapiName}</span>
                              </div>
                              <span className="text-xs font-medium text-gray-400">{rows.length} jadwal</span>
                            </div>

                            <div className="p-3 space-y-3">
                              {rows.map((row, idx) => (
                                <div key={idx} className="p-3 space-y-2 bg-white border border-gray-100 rounded-lg">
                                  {/* Baris atas: Terapis | Pertemuan */}
                                  <div className="grid items-end grid-cols-2 gap-2">
                                    <div>
                                      <label className={labelCls}>Terapis</label>
                                      <div className="relative">
                                        <select
                                          value={row.terapis}
                                          onChange={(e) => updateRow(terapiName, idx, "terapis", e.target.value)}
                                          className={selectCls + " pr-7"}
                                        >
                                          <option value="">Pilih...</option>
                                          {(therapistsBySection[mapTerapiNameToSection(terapiName)] || []).map((t) => (
                                            <option key={t.id || t.name} value={t.name}>
                                              {t.name}
                                            </option>
                                          ))}
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
                                  <div className="grid items-end grid-cols-2 gap-2">
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
                                        <span className="text-xs text-gray-300 shrink-0">–</span>
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
                                        className="flex items-center gap-1 text-xs font-bold text-red-500 transition-colors cursor-pointer hover:text-red-700"
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
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Empty state hint */}
                  <AnimatePresence>
                    {selectedTerapi.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col items-center justify-center py-8 mb-4 text-center text-gray-400 border-2 border-gray-200 border-dashed rounded-xl">
                          <CalendarCheck className="w-8 h-8 mb-2 opacity-30" />
                          <p className="text-sm font-medium">Pilih terapi di atas untuk menampilkan form jadwal</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="px-5 pb-2">
                <div className="bg-[#1E5C58] rounded-3xl px-6 py-4 flex items-center justify-between shadow-md">
                  <p className="text-sm font-bold tracking-wide text-white">Total Pertemuan Keseluruhan</p>
                  <p className="text-2xl font-extrabold text-white">
                    {totalPertemuan} <span className="text-sm font-medium text-white/80">kali pertemuan</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 bg-white border-t border-gray-100 shrink-0">
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
            className="w-full max-w-sm overflow-hidden bg-white shadow-2xl rounded-3xl shadow-teal-900/10"
          >
            <div className="p-8 text-center">
              <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-red-50">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 scale-125 rounded-full bg-red-100/50 opacity-20"
                />
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1E5C58] mb-2 tracking-tight">
                Hapus Jadwal Terapi?
              </h3>
              <p className="px-2 mb-1 text-sm font-medium leading-relaxed text-gray-500">
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

  const [data, setData] = useState<JadwalTerapi[]>(DUMMY_DATA);
  const [loading, setLoading] = useState(false);
  const [apiMeta, setApiMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  const tabCacheRef = useRef<Record<string, { items: JadwalTerapi[]; meta: any }>>({});
  const activeRequestIdRef = useRef(0);

  // Invalidate cache on mutations (add/edit/delete)
  useEffect(() => {
    tabCacheRef.current = {};
  }, [refreshKey]);

  useEffect(() => {
    const tabToType: Record<string, string> = {
      "PLB (Paedagog)": "paedagog",
      "Terapi Okupasi": "okupasi",
      "Terapi Wicara": "wicara",
      "Fisioterapi": "fisio",
    };
    const statusMap: Record<string, string> = {
      "Aktif": "aktif",
      "Non Aktif": "non_aktif",
      "Selesai": "selesai",
    };

    const sectionKey = tabToType[activeTab] || "paedagog";
    const cacheKey = `${sectionKey}_${filterStatus}_${search}_${filterDate}_${currentPage}`;

    // Cek cache: jika ada, render instan 0ms tanpa menunggu network
    if (tabCacheRef.current[cacheKey]) {
      setData(tabCacheRef.current[cacheKey].items);
      setApiMeta(tabCacheRef.current[cacheKey].meta);
      setLoading(false);
    } else {
      // Jika belum di-cache, segera set loading & kosongkan data agar data tab sebelumnya tidak 'menggantung'
      setData([]);
      setLoading(true);
    }

    const currentRequestId = ++activeRequestIdRef.current;

    async function loadApiData() {
      const filters: any = {
        page: currentPage,
        per_page: ITEMS_PER_PAGE,
        therapy_type: sectionKey,
      };
      if (filterStatus !== "Semua") filters.status = statusMap[filterStatus];
      if (search) filters.search = search;
      if (filterDate) {
        const d = new Date(filterDate);
        const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
        filters.day_of_week = dayOfWeek;
      }

      try {
        const res = await getSchedules(filters);
        // Abaikan jika user sudah berganti tab/filter lain (anti race condition)
        if (currentRequestId !== activeRequestIdRef.current) {
          return;
        }

        let mapped: JadwalTerapi[] = [];
        if (res.items) {
          mapped = res.items.map((item: any, idx: number) => {
            let rm = item.medical_record_number;
            if ((!rm || rm === "-") && typeof window !== "undefined" && item.child_id) {
              try {
                const cachedRm = localStorage.getItem(`puspa_child_rm_${item.child_id}`);
                if (cachedRm) rm = cachedRm;
              } catch { }
            }
            return {
              id: item.id || idx + 1,
              namaAnak: item.child_name || "-",
              namaWali: item.guardian_name || "-",
              noRekam: rm || "-",
              hari: item.day_name || "Senin",
              jamMulai: item.start_time || "15.00",
              jamSelesai: item.end_time || "16.00",
              terapis: item.therapist_name || "-",
              status: (item.status === "aktif" ? "Aktif" : item.status === "selesai" ? "Selesai" : "Non Aktif") as StatusPasien,
              terapiType: activeTab,
              periodeAwal: item.period_start || "2026-10-01",
              periodeAkhir: item.period_end || "2026-11-01",
              totalMeetings: Number(item.total_meetings) || 12,
            };
          });
        }

        const meta = res.meta || { current_page: 1, last_page: 1, total: mapped.length };

        // Simpan ke cache
        tabCacheRef.current[cacheKey] = { items: mapped, meta };

        setData(mapped);
        setApiMeta(meta);
      } catch (err) {
        console.error("Error loading schedules:", err);
      } finally {
        if (currentRequestId === activeRequestIdRef.current) {
          setLoading(false);
        }
      }
    }

    loadApiData();
  }, [activeTab, filterStatus, search, filterDate, currentPage, refreshKey]);

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

  const totalPages = apiMeta.last_page || 1;
  const paginatedData = data;

  const handleTambah = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleHapus = async () => {
    if (!hapusItem) return;
    try {
      await deleteSchedule(String(hapusItem.id));
      setHapusItem(null);
      showSuccessToast("Jadwal terapi berhasil dihapus!");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      console.error("DELETE SCHEDULE ERROR:", err);
      handleApiError(err, "Gagal menghapus jadwal terapi.");
    }
  };

  return (
    <>
      <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
        <div className="flex flex-col flex-1 w-full px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-7 h-7 text-[#2B7A75]" />
              Jadwal Terapi Anak
            </h1>
            <p className="mt-1 text-sm text-gray-500">
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
                      if (activeTab !== tab) {
                        setActiveTab(tab);
                        setCurrentPage(1);
                      }
                    }}
                    className={`cursor-pointer px-4 py-2.5 text-sm font-semibold rounded-xl text-center transition-all duration-300 ${isActive
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Kiri: Date picker + Reset Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="cursor-pointer px-4 py-2.5 border border-teal-100 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-[0_2px_8px_rgba(30,92,88,0.02)] hover:border-teal-200 transition-colors"
                  />
                </div>
                {(filterDate || filterStatus !== "Semua" || search) && (
                  <button
                    onClick={() => {
                      setFilterDate("");
                      setFilterStatus("Semua");
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="cursor-pointer px-3 py-2.5 text-xs font-bold text-teal-800 bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200/60 rounded-xl transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Kanan: Search + Tambah Jadwal */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#81B7A9] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama anak / orangtua..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
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
                    onClick={() => {
                      setFilterStatus(isActive ? "Semua" : value);
                      setCurrentPage(1);
                    }}
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
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}|${filterStatus}|${filterDate}|${search}|${currentPage}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-teal-50 overflow-hidden"
              >
                {loading ? (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                              Informasi Pasien
                            </th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                              Jadwal Terapi
                            </th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                              Terapis
                            </th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                              Status Pasien
                            </th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-400 uppercase">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i} className="border-b border-gray-50 animate-pulse">
                              <td className="px-6 py-4">
                                <div className="w-32 h-4 mb-2 bg-gray-200 rounded"></div>
                                <div className="w-20 h-3 bg-gray-100 rounded"></div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="h-4 mb-2 bg-gray-200 rounded w-28"></div>
                                <div className="w-24 h-3 bg-gray-100 rounded"></div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="w-16 h-6 bg-gray-100 rounded-full"></div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="w-16 h-5 mx-auto bg-gray-100 rounded"></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 space-y-3 md:hidden">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 space-y-3 border border-gray-100 bg-gray-50/70 rounded-2xl animate-pulse">
                          <div className="w-32 h-4 bg-gray-200 rounded"></div>
                          <div className="h-16 bg-gray-100 rounded-xl"></div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : paginatedData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-20 text-center">
                    <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-teal-50">
                      <CalendarCheck className="w-10 h-10 text-[#2B7A75] opacity-40" />
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-gray-700">Belum Ada Jadwal</h3>
                    <p className="max-w-xs text-sm text-gray-400">
                      Tidak ditemukan jadwal terapi untuk filter yang dipilih.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                              Informasi Pasien
                            </th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                              Jadwal Terapi
                            </th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                              Terapis
                            </th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                              Status Pasien
                            </th>
                            <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-400 uppercase">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((item, idx) => (
                            <tr
                              key={item.id}
                              className="border-b border-gray-50 last:border-0 hover:bg-[#F4F9F8]/50 transition-colors group"
                            >
                              {/* Informasi Pasien */}
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-sm font-bold text-gray-800">{item.namaAnak}</p>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">
                                      Wali: {item.namaWali}
                                    </span>
                                    {item.noRekam && item.noRekam !== "-" && (
                                      <span className="inline-block px-2 py-0.5 bg-teal-50 text-[#1E5C58] border border-teal-100/60 text-[10px] font-bold rounded-md">
                                        No. RM: {item.noRekam}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Jadwal Terapi */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                  <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                                  {item.hari}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  Pukul {item.jamMulai} – {item.jamSelesai}
                                </div>
                              </td>

                              {/* Terapis */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-[#2B7A75] font-semibold">
                                  <UserRound className="w-4 h-4 shrink-0" />
                                  {item.terapis}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4">
                                <StatusBadge status={item.status} />
                              </td>

                              {/* Aksi */}
                              <td className="px-6 py-4">
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
                                    className="text-gray-400 transition-colors cursor-pointer hover:text-amber-500"
                                  >
                                    <Pencil size={16} strokeWidth={2} />
                                  </button>
                                  <button
                                    id={`btn-hapus-${item.id}`}
                                    onClick={() => setHapusItem(item)}
                                    title="Hapus"
                                    className="text-gray-400 transition-colors cursor-pointer hover:text-red-500"
                                  >
                                    <Trash2 size={16} strokeWidth={2} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="p-4 space-y-3 md:hidden">
                      {paginatedData.map((item, idx) => (
                        <div
                          key={item.id}
                          className="bg-[#F4F9F8]/40 border border-teal-50 rounded-2xl p-4 shadow-xs"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-bold text-gray-800">{item.namaAnak}</p>
                              <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">
                                Wali: {item.namaWali}
                              </span>
                            </div>
                            <StatusBadge status={item.status} />
                          </div>

                          <div className="grid grid-cols-2 gap-2 p-3 mb-3 border bg-white/60 rounded-xl border-white/60">
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
                              className="text-gray-400 transition-colors cursor-pointer hover:text-amber-500"
                            >
                              <Pencil size={16} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => setHapusItem(item)}
                              title="Hapus"
                              className="text-gray-400 transition-colors cursor-pointer hover:text-red-500"
                            >
                              <Trash2 size={16} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer info */}
                    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-gray-50">
                      <p className="text-xs font-medium text-gray-400">
                        Menampilkan <span className="font-bold text-[#2B7A75]">{paginatedData.length}</span> dari <span className="font-bold text-[#2B7A75]">{apiMeta.total || paginatedData.length}</span> rekam jadwal{" "}
                        <span className="font-semibold text-gray-600">{activeTab}</span>
                        {filterStatus !== "Semua" && (
                          <> &mdash; Status: <span className="font-bold text-gray-600">{filterStatus}</span></>
                        )}
                      </p>

                      {(apiMeta.last_page > 1 || totalPages > 1) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="cursor-pointer px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Prev
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: apiMeta.last_page || totalPages }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${currentPage === i + 1
                                    ? "bg-[#2B7A75] text-white"
                                    : "text-gray-500 hover:bg-gray-100"
                                  }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(apiMeta.last_page || totalPages, p + 1))}
                            disabled={currentPage === (apiMeta.last_page || totalPages)}
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
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Modals */}
      <TambahJadwalModal
        open={showTambah}
        onClose={() => setShowTambah(false)}
        terapiType={activeTab}
        onSubmit={handleTambah}
        allData={data}
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
