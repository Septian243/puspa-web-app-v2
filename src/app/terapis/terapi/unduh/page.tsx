"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Download, ChevronDown, Check, Loader2, ArrowLeft } from "lucide-react";
import { useTherapistProfile } from "@/context/ProfileTerapisContext";
import {
  getExportFilterOptions,
  downloadExportTherapySoapPdf,
  getTherapySessions,
  getTherapySoapBySession,
  ExportFilterOptions,
  ExportTherapySoapFilters,
} from "@/lib/api/terapiTerapis";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

export interface ExportSoapRecord {
  id: string;
  therapy_session_id?: string;
  performed_at?: string;
  performed_date?: string;
  performed_date_formatted?: string;
  performed_time?: string;
  session_number?: number;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  child_name?: string;
  medical_record_number?: string;
  child_age?: number | null;
  child_birth_date?: string;
  child_birth_date_formatted?: string;
  child_gender?: string;
  child_address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_type?: string;
  relationship_with_child?: string;
  therapy_type?: string;
  therapy_type_label?: string;
  therapist_name?: string;
  therapy_diagnosis?: string;
  interventions?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  implementation?: string;
  advanced_assessment?: string;
  advanced_plan?: string;
}

type PeriodeType = "Harian" | "Mingguan" | "Bulanan" | "Custom";

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getCurrentWeekString(): string {
  const now = new Date();
  const target = new Date(now.valueOf());
  const dayNr = (now.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = new Date(firstThursday).getFullYear();
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

const rekapInputClass =
  "w-full px-4 py-2.5 bg-white border border-teal-100 rounded-xl text-sm text-gray-700 font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-xs font-semibold text-gray-500">{children}</div>;
}

function FilterChip({
  label,
  onRemove,
  disabled = false,
}: {
  label: string;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-bold text-[#1E5C58] bg-teal-50 border border-teal-100 rounded-full">
      {label}
      {!disabled && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Hapus filter ${label}`}
          className="cursor-pointer flex items-center justify-center w-4 h-4 rounded-full text-[#2B7A75] hover:bg-teal-100 transition-colors"
        >
          <X className="w-3 h-3" strokeWidth={3} />
        </button>
      )}
    </span>
  );
}

function FilterSingleSelect({
  label,
  value,
  onChange,
  placeholder = "Pilih anak...",
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className="relative">
      <FieldLabel>{label}</FieldLabel>
      <div
        className={`${rekapInputClass} relative flex items-center pr-11 cursor-text ${!value ? "border-teal-200" : ""
          }`}
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : value}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              setSearch("");
            }
          }}
          placeholder={isOpen ? "Cari nama anak / no RM..." : placeholder}
          aria-label={`Pilih ${label.toLowerCase()}`}
          className="w-full p-0 text-sm font-medium text-gray-700 bg-transparent border-0 outline-none placeholder:text-gray-400 cursor-text"
        />

        {value && !isOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setSearch("");
            }}
            aria-label="Hapus pilihan anak"
            className="absolute flex items-center justify-center p-1 text-gray-400 transition-colors rounded-full cursor-pointer right-8 hover:text-red-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            if (isOpen) {
              setIsOpen(false);
              setSearch("");
            } else {
              setIsOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
          aria-label={
            isOpen
              ? `Tutup pilihan ${label.toLowerCase()}`
              : `Buka pilihan ${label.toLowerCase()}`
          }
          className="absolute right-0 flex items-center justify-center h-full pr-3 cursor-pointer"
        >
          <ChevronDown
            className={`w-4 h-4 text-gray-700 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-2 flex flex-col max-h-[240px] overflow-hidden bg-white border border-gray-100 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.12)]">
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.map((option) => {
              const isSelected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center justify-between cursor-pointer ${isSelected
                    ? "bg-teal-50/70 font-bold text-[#1E5C58]"
                    : "text-gray-700 hover:bg-gray-50 font-medium"
                    }`}
                >
                  <span className="truncate">{option}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#2B7A75]" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-4 text-xs text-center text-gray-400">
                Data anak tidak ditemukan.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnduhHasilPage() {
  const router = useRouter();
  const { profile } = useTherapistProfile();

  const [filterOptions, setFilterOptions] = useState<ExportFilterOptions | null>(null);
  const [exportRecords, setExportRecords] = useState<ExportSoapRecord[]>([]);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const therapistName =
    filterOptions?.therapist_name || profile?.therapist_name || "Memuat...";
  const therapistSection =
    filterOptions?.therapy_type_label || profile?.therapist_section || "Memuat...";

  const currentMonthStr = getCurrentMonthString();

  const [selectedAnak, setSelectedAnak] = useState<string>("");
  const [periode, setPeriode] = useState<PeriodeType>("Bulanan");

  // Custom period states
  const [hari, setHari] = useState(getTodayDateString());
  const [minggu, setMinggu] = useState(getCurrentWeekString());
  const [bulan, setBulan] = useState(currentMonthStr);
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const handlePeriodeChange = (opt: PeriodeType) => {
    setPeriode(opt);
    if (opt === "Harian" && !hari) {
      setHari(getTodayDateString());
    } else if (opt === "Mingguan" && !minggu) {
      setMinggu(getCurrentWeekString());
    } else if (opt === "Bulanan" && !bulan) {
      setBulan(currentMonthStr);
    }
  };

  // Load filter options on mount
  useEffect(() => {
    let isMounted = true;
    getExportFilterOptions().then((opts) => {
      if (isMounted && opts) {
        setFilterOptions(opts);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Mapping children from filter options
  const { anakOptions, childNameToId } = useMemo(() => {
    if (!filterOptions?.children || filterOptions.children.length === 0) {
      return { anakOptions: [], childNameToId: {} };
    }

    const mapping: Record<string, string> = {};
    const options: string[] = [];

    filterOptions.children.forEach((c) => {
      const rm = c.medical_record_number || (c as any).no_rm || "-";
      const label = `${c.child_name} (${rm})`;
      mapping[label] = c.id;
      mapping[c.child_name] = c.id;
      options.push(label);
    });

    options.sort();
    return { anakOptions: options, childNameToId: mapping };
  }, [filterOptions]);

  // Fetch completed therapy sessions with SOAP for preview table (Opsi A)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingData(true);

    async function loadPreview() {
      try {
        if (!selectedAnak) {
          if (isMounted) {
            setExportRecords([]);
            setTotalFilteredCount(0);
            setIsLoadingData(false);
          }
          return;
        }

        const res = await getTherapySessions({
          status: "completed",
          my_sessions: true,
          per_page: 50,
        });

        if (!isMounted) return;

        let sessions = res.items || [];

        // Filter by selected child
        const selectedId = childNameToId[selectedAnak];
        if (selectedId) {
          sessions = sessions.filter(
            (s) => s.child_id && s.child_id === selectedId
          );
        } else {
          sessions = [];
        }

        // Filter by period
        if (periode === "Harian" && hari) {
          sessions = sessions.filter((s) => s.session_date === hari);
        } else if (periode === "Mingguan" && minggu) {
          const parts = minggu.split("-W");
          if (parts.length === 2) {
            const yr = parseInt(parts[0], 10);
            sessions = sessions.filter((s) => {
              if (!s.session_date) return false;
              const d = new Date(s.session_date);
              return d.getFullYear() === yr;
            });
          }
        } else if (periode === "Bulanan" && bulan) {
          sessions = sessions.filter(
            (s) => s.session_date && s.session_date.startsWith(bulan)
          );
        } else if (periode === "Custom") {
          if (dari) {
            sessions = sessions.filter(
              (s) => s.session_date && s.session_date >= dari
            );
          }
          if (sampai) {
            sessions = sessions.filter(
              (s) => s.session_date && s.session_date <= sampai
            );
          }
        }

        // Fetch detail SOAP for top 10 items to display real diagnosis
        const top10 = sessions.slice(0, 10);
        const mappedRecords = await Promise.all(
          top10.map(async (s) => {
            const soap = await getTherapySoapBySession(s.id);
            return {
              id: s.id,
              child_name: s.child_name,
              therapist_name: s.therapist_name || therapistName,
              therapy_type_label: s.therapy_type_label || therapistSection,
              performed_date_formatted: s.session_date_formatted,
              performed_date: s.session_date,
              performed_time: `${s.start_time} – ${s.end_time}`,
              therapy_diagnosis: soap?.therapy_diagnosis || s.notes || "—",
            } as ExportSoapRecord;
          })
        );

        if (isMounted) {
          setTotalFilteredCount(sessions.length);
          setExportRecords(mappedRecords);
          setIsLoadingData(false);
        }
      } catch (err) {
        console.error("Gagal memuat preview data SOAP:", err);
        if (isMounted) {
          setExportRecords([]);
          setTotalFilteredCount(0);
          setIsLoadingData(false);
        }
      }
    }

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [selectedAnak, periode, hari, minggu, bulan, dari, sampai, childNameToId, therapistName, therapistSection]);

  const handleExportPdf = async () => {
    if (isExporting) return;
    if (!selectedAnak) {
      showErrorToast("Silakan pilih anak / pasien terlebih dahulu untuk mengunduh SOAP.");
      return;
    }
    setIsExporting(true);

    try {
      const apiFilters: ExportTherapySoapFilters = {};

      const selectedId = childNameToId[selectedAnak];
      if (selectedId) {
        apiFilters.child_id = selectedId;
      }

      if (periode === "Harian") {
        apiFilters.period_type = "daily";
        if (hari) apiFilters.date = hari;
      } else if (periode === "Mingguan") {
        apiFilters.period_type = "weekly";
        if (minggu) {
          const parts = minggu.split("-W");
          if (parts.length === 2) {
            apiFilters.year = parseInt(parts[0], 10);
            apiFilters.week = parseInt(parts[1], 10);
          }
        }
      } else if (periode === "Bulanan") {
        apiFilters.period_type = "monthly";
        if (bulan) {
          const parts = bulan.split("-");
          if (parts.length === 2) {
            apiFilters.year = parseInt(parts[0], 10);
            apiFilters.month = parseInt(parts[1], 10);
          }
        }
      } else if (periode === "Custom") {
        apiFilters.period_type = "custom";
        if (dari) apiFilters.date_from = dari;
        if (sampai) apiFilters.date_to = sampai;
      }

      const res = await downloadExportTherapySoapPdf(apiFilters);
      if (res.success) {
        showSuccessToast("Laporan SOAP PDF berhasil diunduh!", "Berhasil Unduh");
      } else {
        showErrorToast(res.error || "Gagal mengunduh laporan SOAP.");
      }
    } catch (err: any) {
      showErrorToast(err?.message || "Terjadi kesalahan saat mengunduh SOAP.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setSelectedAnak("");
    setPeriode("Bulanan");
    setHari(getTodayDateString());
    setMinggu(getCurrentWeekString());
    setBulan(currentMonthStr);
    setDari("");
    setSampai("");
  };

  const monthNames = [
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

  function formatBulan(bulanStr: string) {
    if (!bulanStr) return "";
    const [yyyy, mm] = bulanStr.split("-");
    return `${monthNames[Number(mm) - 1]} ${yyyy}`;
  }

  const activeChips: {
    key: string;
    label: string;
    onRemove?: () => void;
    disabled?: boolean;
  }[] = [];

  activeChips.push({ key: "terapis", label: therapistName, disabled: true });
  activeChips.push({ key: "section", label: therapistSection, disabled: true });

  if (selectedAnak) {
    activeChips.push({
      key: `anak-${selectedAnak}`,
      label: `Anak: ${selectedAnak}`,
      onRemove: () => setSelectedAnak(""),
    });
  }

  let labelPeriode = "";
  if (periode === "Harian" && hari) labelPeriode = `${hari}`;
  if (periode === "Mingguan" && minggu) labelPeriode = `${minggu}`;
  if (periode === "Bulanan" && bulan) labelPeriode = formatBulan(bulan);
  if (periode === "Custom" && (dari || sampai))
    labelPeriode = `${dari || "..."} - ${sampai || "..."}`;

  if (labelPeriode) {
    activeChips.push({
      key: "periode",
      label: labelPeriode,
      onRemove: () => {
        setHari("");
        setMinggu("");
        setBulan("");
        setDari("");
        setSampai("");
      },
    });
  }

  return (
    <div className="p-6 md:p-8 space-y-6 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Unduh Hasil SOAP</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pilih anak, periode, dan format file untuk mengunduh catatan SOAP Anda.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-[#1E5C58] text-white text-sm font-bold rounded-xl hover:bg-[#1E5C58]/90 transition-colors shadow-sm shrink-0 cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>

      {/* ── Main Card ── */}
      <div className="bg-white rounded-2xl border border-teal-50 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        {/* ── Filter ── */}
        <div className="p-6 space-y-6">
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FilterSingleSelect
                label="Anak / Pasien"
                value={selectedAnak}
                onChange={setSelectedAnak}
                placeholder="Pilih anak..."
                options={anakOptions}
              />

              <div>
                <FieldLabel>Terapis</FieldLabel>
                <input
                  type="text"
                  readOnly
                  value={therapistName}
                  className={`${rekapInputClass} bg-gray-50 text-gray-500 border-gray-100 cursor-not-allowed`}
                />
              </div>

              <div>
                <FieldLabel>Jenis Terapi</FieldLabel>
                <input
                  type="text"
                  readOnly
                  value={therapistSection}
                  className={`${rekapInputClass} bg-gray-50 text-gray-500 border-gray-100 cursor-not-allowed`}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-extrabold tracking-wider text-gray-400 uppercase">
              Periode
            </p>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Segmented control */}
              <div className="flex p-1 bg-[#F4F9F8] border border-teal-50 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
                {(["Harian", "Mingguan", "Bulanan", "Custom"] as PeriodeType[]).map(
                  (opt) => {
                    const isActive = periode === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handlePeriodeChange(opt)}
                        className={`cursor-pointer flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm transition-all ${isActive
                          ? "bg-[#1E5C58] text-white font-bold shadow-sm"
                          : "text-gray-400 font-semibold hover:text-[#2B7A75]"
                          }`}
                      >
                        {opt}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Dynamic Inputs */}
              <div className="flex-1">
                {periode === "Harian" && (
                  <div>
                    <FieldLabel>Tanggal</FieldLabel>
                    <input
                      type="date"
                      value={hari}
                      onChange={(e) => setHari(e.target.value)}
                      className={`${rekapInputClass} cursor-pointer`}
                    />
                  </div>
                )}
                {periode === "Mingguan" && (
                  <div>
                    <FieldLabel>Minggu</FieldLabel>
                    <input
                      type="week"
                      value={minggu}
                      onChange={(e) => setMinggu(e.target.value)}
                      className={`${rekapInputClass} cursor-pointer`}
                    />
                  </div>
                )}
                {periode === "Bulanan" && (
                  <div>
                    <FieldLabel>Bulan</FieldLabel>
                    <input
                      type="month"
                      value={bulan}
                      onChange={(e) => setBulan(e.target.value)}
                      className={`${rekapInputClass} cursor-pointer`}
                    />
                  </div>
                )}
                {periode === "Custom" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Dari</FieldLabel>
                      <input
                        type="date"
                        value={dari}
                        max={sampai || undefined}
                        onChange={(e) => setDari(e.target.value)}
                        className={`${rekapInputClass} cursor-pointer`}
                      />
                    </div>
                    <div>
                      <FieldLabel>Sampai</FieldLabel>
                      <input
                        type="date"
                        value={sampai}
                        min={dari || undefined}
                        onChange={(e) => setSampai(e.target.value)}
                        className={`${rekapInputClass} cursor-pointer`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter Aktif ── */}
        <div className="flex flex-col justify-between gap-3 px-6 py-3 border-t border-gray-100 sm:flex-row sm:items-center bg-gray-50/30">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-gray-400">Aktif:</span>

            {activeChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                onRemove={chip.onRemove}
                disabled={chip.disabled}
              />
            ))}

            {activeChips.length === 0 && (
              <span className="text-sm font-medium text-gray-400">
                Belum ada filter
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm font-bold text-red-500 transition-colors cursor-pointer hover:text-red-600 shrink-0"
          >
            Reset
          </button>
        </div>

        {/* ── Export ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-[#F4F9F8]/50">
          <div>
            <p className="text-xs font-semibold text-gray-500">
              Mengekspor data SOAP mencakup kolom:{" "}
              <span className="font-bold text-[#1E5C58]">
                S, O, A, P, I, A Lanjutan, P Lanjutan.
              </span>
            </p>
            {!selectedAnak && (
              <p className="text-[11px] font-bold text-amber-600 mt-1">
                * Pilih anak / pasien terlebih dahulu untuk mengunduh laporan SOAP.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled
              title="Fitur Export Excel untuk catatan SOAP saat ini dipending karena backend belum mendukung"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2B7A75] px-6 py-2.5 text-sm font-bold text-white shadow-xs opacity-50 cursor-not-allowed"
            >
              <Download className="w-4 h-4" strokeWidth={2.5} />
              <span>Export Excel (.xlsx)</span>
              <span className="rounded-md bg-white/20 border border-white/30 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                Pending
              </span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting || !selectedAnak}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#1E5C58] hover:bg-[#1E5C58]/90 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengekspor PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" strokeWidth={2.5} />
                  <span>Export PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-between gap-3 px-6 py-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#1E5C58]">
                Preview (10 baris pertama)
              </h3>
              {isLoadingData && (
                <span className="inline-flex items-center gap-1 text-xs text-[#1E5C58]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat...
                </span>
              )}
            </div>
            <span className="px-3 py-1 text-[11px] font-bold text-[#1E5C58] bg-teal-50 border border-teal-100 rounded-full">
              Total: {totalFilteredCount} data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[#F4F9F8] border-b border-teal-50">
                  {["Anak", "Terapis", "Jenis Terapi", "Tanggal", "Jam", "Diagnosis"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {exportRecords.slice(0, 10).map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#F4F9F8]/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">
                      {row.child_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#1E5C58]">
                      {row.therapist_name || therapistName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-bold text-[#1E5C58] bg-teal-50 rounded-md border border-teal-100">
                        {row.therapy_type_label || therapistSection}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">
                      {row.performed_date_formatted || row.performed_date || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-400">
                      {row.performed_time || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                      {row.therapy_diagnosis || "—"}
                    </td>
                  </tr>
                ))}
                {!isLoadingData && exportRecords.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-sm text-center text-gray-400"
                    >
                      {!selectedAnak
                        ? "Silakan pilih anak / pasien terlebih dahulu untuk menampilkan catatan SOAP."
                        : "Data catatan SOAP tidak ditemukan sesuai filter di atas."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
