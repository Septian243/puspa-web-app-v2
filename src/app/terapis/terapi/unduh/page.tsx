"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Download, ChevronDown, Check } from "lucide-react";
import { useTherapistProfile } from "@/context/ProfileTerapisContext";

// Dummy Data
const dummyPreviewData = [
  { id: 1, anak: "Zefanya Lidia", tanggal: "2026-05-07", jam: "09.05", diagnosis: "Sensory Integration Disorder" },
  { id: 2, anak: "Zefanya Lidia", tanggal: "2026-05-14", jam: "09.10", diagnosis: "Sensory Integration Disorder" },
  { id: 3, anak: "Zefanya Lidia", tanggal: "2026-05-21", jam: "09.05", diagnosis: "Sensory Integration Disorder" },
  { id: 4, anak: "Rayhan", tanggal: "2026-09-04", jam: "08.50", diagnosis: "Keterlambatan bicara dan fokus" },
  { id: 5, anak: "Rayhan", tanggal: "2026-09-11", jam: "08.55", diagnosis: "Keterlambatan bicara dan fokus" },
  { id: 6, anak: "Rayhan", tanggal: "2026-09-18", jam: "08.55", diagnosis: "Keterlambatan bicara dan fokus" },
  { id: 7, anak: "Alya", tanggal: "2026-10-01", jam: "10.00", diagnosis: "Sensory Processing Issue" },
  { id: 8, anak: "Bagas", tanggal: "2026-10-02", jam: "11.00", diagnosis: "Speech Delay" },
  { id: 9, anak: "Lutfy", tanggal: "2026-10-03", jam: "08.30", diagnosis: "ADHD" },
  { id: 10, anak: "Putra Pratama", tanggal: "2026-10-04", jam: "13.00", diagnosis: "Fine Motor Delay" },
];

type PeriodeType = "Harian" | "Mingguan" | "Bulanan" | "Custom";

const rekapInputClass =
  "w-full px-4 py-2.5 bg-white border border-teal-100 rounded-xl text-sm text-gray-700 font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-xs font-semibold text-gray-500">{children}</div>;
}

function FilterChip({ label, onRemove, disabled = false }: { label: string; onRemove?: () => void; disabled?: boolean }) {
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

function FilterMultiSelect({
  label,
  selectedValues,
  onChange,
  allLabel,
  options,
}: {
  label: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  allLabel: string;
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

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  let displayText = "";
  if (selectedValues.length === 0) {
    displayText = "";
  } else if (selectedValues.length === 1) {
    displayText = selectedValues[0];
  } else {
    displayText = `${selectedValues[0]} (+${selectedValues.length - 1} lainnya)`;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <FieldLabel>{label}</FieldLabel>
      <div
        className={`${rekapInputClass} relative flex items-center pr-11 cursor-text`}
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
          value={isOpen ? search : displayText}
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
          placeholder={
            isOpen
              ? selectedValues.length > 0
                ? `${selectedValues.length} dipilih - cari...`
                : `Cari ${label.toLowerCase()}...`
              : allLabel
          }
          aria-label={`Pilih ${label.toLowerCase()}`}
          className="w-full p-0 text-sm text-gray-700 bg-transparent border-0 outline-none placeholder:text-gray-500 font-medium cursor-text"
        />
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
          aria-label={isOpen ? `Tutup pilihan ${label.toLowerCase()}` : `Buka pilihan ${label.toLowerCase()}`}
          className="absolute right-0 flex items-center justify-center h-full pr-3 cursor-pointer"
        >
          {selectedValues.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#2B7A75] rounded-full mr-1 shrink-0">
              {selectedValues.length}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-700 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-2 flex flex-col max-h-[240px] overflow-hidden bg-white border border-gray-100 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.12)]">
          <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-[#F4F9F8]/60">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange([])}
              className={`text-xs font-bold transition-colors cursor-pointer ${
                selectedValues.length === 0
                  ? "text-[#1E5C58]"
                  : "text-gray-500 hover:text-[#1E5C58]"
              }`}
            >
              {allLabel}
            </button>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange([])}
                className="text-[11px] text-red-500 hover:text-red-700 font-bold cursor-pointer"
              >
                Hapus Pilihan ({selectedValues.length})
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleOption(option)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-teal-50/70 font-bold text-[#1E5C58]"
                      : "text-gray-700 hover:bg-gray-50 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? "bg-[#2B7A75] border-[#2B7A75] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className="truncate">{option}</span>
                  </div>
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-4 text-xs text-center text-gray-400">Data tidak ditemukan.</p>
            )}
          </div>

          <div className="shrink-0 flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50 text-xs">
            <span className="text-gray-400 font-medium text-[11px]">
              {selectedValues.length === 0
                ? "Semua dipilih"
                : `${selectedValues.length} dari ${options.length} dipilih`}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setIsOpen(false);
                setSearch("");
              }}
              className="text-[#2B7A75] hover:text-[#1E5C58] font-bold text-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnduhHasilPage() {
  const router = useRouter();
  const { profile } = useTherapistProfile();

  const therapistName = profile?.therapist_name || "Memuat...";
  const therapistSection = profile?.therapist_section || "Memuat...";

  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [selectedAnak, setSelectedAnak] = useState<string[]>([]);
  const [periode, setPeriode] = useState<PeriodeType>("Bulanan");

  // Custom period states
  const [hari, setHari] = useState("");
  const [minggu, setMinggu] = useState("");
  const [bulan, setBulan] = useState(currentMonthStr);
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const anakOptions = useMemo(() => [...new Set(dummyPreviewData.map((r) => r.anak))].sort(), []);

  const handleReset = () => {
    setSelectedAnak([]);
    setPeriode("Bulanan");
    setHari("");
    setMinggu("");
    setBulan(currentMonthStr);
    setDari("");
    setSampai("");
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  function formatBulan(bulanStr: string) {
    if (!bulanStr) return "";
    const [yyyy, mm] = bulanStr.split("-");
    return `${monthNames[Number(mm) - 1]} ${yyyy}`;
  }

  const activeChips: { key: string; label: string; onRemove?: () => void; disabled?: boolean }[] = [];

  activeChips.push({ key: "terapis", label: therapistName, disabled: true });
  activeChips.push({ key: "section", label: therapistSection, disabled: true });

  selectedAnak.forEach((nama) => {
    activeChips.push({
      key: `anak-${nama}`,
      label: `Anak: ${nama}`,
      onRemove: () => setSelectedAnak((prev) => prev.filter((a) => a !== nama)),
    });
  });

  let labelPeriode = "";
  if (periode === "Harian" && hari) labelPeriode = `${hari}`;
  if (periode === "Mingguan" && minggu) labelPeriode = `${minggu}`;
  if (periode === "Bulanan" && bulan) labelPeriode = formatBulan(bulan);
  if (periode === "Custom" && (dari || sampai)) labelPeriode = `${dari || "..."} - ${sampai || "..."}`;

  if (labelPeriode) {
    activeChips.push({
      key: "periode",
      label: labelPeriode,
      onRemove: () => {
        setHari(""); setMinggu(""); setBulan(""); setDari(""); setSampai("");
      }
    });
  }

  const filteredData = useMemo(() => {
    return dummyPreviewData.filter((row) => {
      if (selectedAnak.length > 0 && !selectedAnak.includes(row.anak)) {
        return false;
      }
      if (periode === "Harian" && hari) return row.tanggal === hari;
      if (periode === "Bulanan" && bulan) return row.tanggal.startsWith(bulan);
      if (periode === "Custom") {
        if (dari && row.tanggal < dari) return false;
        if (sampai && row.tanggal > sampai) return false;
      }
      return true;
    });
  }, [selectedAnak, periode, hari, bulan, dari, sampai]);

  const handleExport = (type: "excel" | "pdf") => {
    console.log(`Export ${type}`, {
      anak: selectedAnak,
      terapis: therapistName,
      jenisTerapi: therapistSection,
      periode,
      total: filteredData.length,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Unduh Hasil SOAP</h1>
          <p className="mt-1 text-sm text-gray-500">Pilih anak, periode, dan format file untuk mengunduh catatan SOAP Anda.</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-[#1E5C58] text-white text-sm font-bold rounded-xl hover:bg-[#1E5C58]/90 transition-colors shadow-sm shrink-0 cursor-pointer"
        >
          Kembali
        </button>
      </div>

      {/* ── Main Card ── */}
      <div className="bg-white rounded-2xl border border-teal-50 overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">

        {/* ── Filter ── */}
        <div className="p-6 space-y-6">
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FilterMultiSelect
                label="Anak"
                selectedValues={selectedAnak}
                onChange={setSelectedAnak}
                allLabel="Semua anak"
                options={anakOptions}
              />

              <div>
                <FieldLabel>Terapis</FieldLabel>
                <input
                  type="text"
                  readOnly
                  value={therapistName}
                  className={`${rekapInputClass} bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed`}
                />
              </div>

              <div>
                <FieldLabel>Jenis Terapi</FieldLabel>
                <input
                  type="text"
                  readOnly
                  value={therapistSection}
                  className={`${rekapInputClass} bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed`}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-extrabold tracking-wider text-gray-400 uppercase">Periode</p>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Segmented control */}
              <div className="flex p-1 bg-[#F4F9F8] border border-teal-50 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
                {(["Harian", "Mingguan", "Bulanan", "Custom"] as PeriodeType[]).map((opt) => {
                  const isActive = periode === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPeriode(opt)}
                      className={`cursor-pointer flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm transition-all ${isActive
                        ? "bg-[#1E5C58] text-white font-bold shadow-sm"
                        : "text-gray-400 font-semibold hover:text-[#2B7A75]"
                        }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Inputs */}
              <div className="flex-1">
                {periode === "Harian" && (
                  <div>
                    <FieldLabel>Tanggal</FieldLabel>
                    <input type="date" value={hari} onChange={(e) => setHari(e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
                  </div>
                )}
                {periode === "Mingguan" && (
                  <div>
                    <FieldLabel>Minggu</FieldLabel>
                    <input type="week" value={minggu} onChange={(e) => setMinggu(e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
                  </div>
                )}
                {periode === "Bulanan" && (
                  <div>
                    <FieldLabel>Bulan</FieldLabel>
                    <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
                  </div>
                )}
                {periode === "Custom" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Dari</FieldLabel>
                      <input type="date" value={dari} max={sampai || undefined} onChange={(e) => setDari(e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
                    </div>
                    <div>
                      <FieldLabel>Sampai</FieldLabel>
                      <input type="date" value={sampai} min={dari || undefined} onChange={(e) => setSampai(e.target.value)} className={`${rekapInputClass} cursor-pointer`} />
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
              <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} disabled={chip.disabled} />
            ))}

            {activeChips.length === 0 && (
              <span className="text-sm font-medium text-gray-400">Belum ada filter</span>
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
          <p className="text-xs font-semibold text-gray-500">
            Mengekspor data SOAP mencakup kolom: <span className="font-bold text-[#1E5C58]">S, O, A, P, L, A Lanjutan, P Lanjutan.</span>
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleExport("excel")}
              disabled={filteredData.length === 0}
              className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#2B7A75] rounded-xl shadow-sm hover:bg-[#1E5C58] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" strokeWidth={2.5} />
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              disabled={filteredData.length === 0}
              className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#2B7A75] bg-white border border-[#D5EAE6] rounded-xl shadow-sm hover:bg-teal-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" strokeWidth={2.5} />
              Export PDF
            </button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-between gap-3 px-6 py-4">
            <h3 className="text-sm font-extrabold text-[#1E5C58]">
              Preview (10 baris pertama)
            </h3>
            <span className="px-3 py-1 text-[11px] font-bold text-[#1E5C58] bg-teal-50 border border-teal-100 rounded-full">
              Total: {filteredData.length} data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[#F4F9F8] border-b border-teal-50">
                  {["Anak", "Terapis", "Jenis Terapi", "Tanggal", "Jam", "Diagnosis"].map((h) => (
                    <th key={h} className="px-6 py-3 text-[10px] font-extrabold text-[#1E5C58] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.slice(0, 10).map((row) => (
                  <tr key={row.id} className="hover:bg-[#F4F9F8]/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{row.anak}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#1E5C58]">{therapistName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 text-[11px] font-bold text-[#1E5C58] bg-teal-50 rounded-md border border-teal-100">
                        {therapistSection}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{row.tanggal}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-400">{row.jam}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">{row.diagnosis}</td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-sm text-center text-gray-400">
                      Data tidak ditemukan sesuai filter.
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
