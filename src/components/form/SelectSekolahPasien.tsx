"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, School, X, ChevronDown, Check, PenLine, Sparkles } from "lucide-react";
import { getDaftarSekolah, getSchools, Sekolah } from "@/lib/api/data_sekolah";

interface SelectSekolahPasienProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  theme?: "teal" | "amber";
  label?: string;
  required?: boolean;
}

export default function SelectSekolahPasien({
  value,
  onChange,
  error,
  theme = "teal",
  label = "Sekolah (Opsional)",
  required = false,
}: SelectSekolahPasienProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [schools, setSchools] = useState<Sekolah[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ambil daftar sekolah sistem dan sinkronkan mode awal
  useEffect(() => {
    const list = getDaftarSekolah();
    if (list.length > 0) {
      setSchools(list);
    }

    getSchools()
      .then((liveList) => {
        if (Array.isArray(liveList) && liveList.length > 0) {
          setSchools(liveList);
        }
      })
      .catch((err) => {
        console.warn("Gagal fetch live schools di SelectSekolahPasien:", err);
      });

    if (value && value !== "Belum bersekolah") {
      const isKnown = list.some(
        (s) => s.nama.toLowerCase() === value.toLowerCase()
      );
      if (!isKnown) {
        setIsManual(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      getSchools().then((s) => setSchools(s)).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const groupedSchools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = schools.filter((s) => {
      if (!query) return true;
      return (
        s.nama.toLowerCase().includes(query) ||
        s.jenjang.toLowerCase().includes(query)
      );
    });

    const groups: Record<string, Sekolah[]> = {
      PAUD: [],
      TK: [],
      SD: [],
      SMP: [],
      SMA: [],
    };

    filtered.forEach((school) => {
      const jenjangUpper = (school.jenjang || "").toUpperCase();
      if (jenjangUpper.includes("PAUD") || school.nama.toUpperCase().startsWith("PAUD")) {
        groups.PAUD.push(school);
      } else if (jenjangUpper.includes("TK") || school.nama.toUpperCase().startsWith("TK")) {
        groups.TK.push(school);
      } else if (
        jenjangUpper.includes("SD") ||
        jenjangUpper.includes("MI ") ||
        school.nama.toUpperCase().startsWith("SD") ||
        school.nama.toUpperCase().startsWith("MI ")
      ) {
        groups.SD.push(school);
      } else if (
        jenjangUpper.includes("SMP") ||
        jenjangUpper.includes("MTS") ||
        school.nama.toUpperCase().startsWith("SMP") ||
        school.nama.toUpperCase().startsWith("MTS")
      ) {
        groups.SMP.push(school);
      } else if (
        jenjangUpper.includes("SMA") ||
        jenjangUpper.includes("SMK") ||
        jenjangUpper.includes("MA ") ||
        school.nama.toUpperCase().startsWith("SMA") ||
        school.nama.toUpperCase().startsWith("SMK")
      ) {
        groups.SMA.push(school);
      } else {
        if (!groups["LAINNYA"]) groups["LAINNYA"] = [];
        groups["LAINNYA"].push(school);
      }
    });

    return groups;
  }, [schools, searchQuery]);

  const hasExactMatch = useMemo(() => {
    if (!searchQuery.trim()) return false;
    return schools.some(
      (s) => s.nama.toLowerCase() === searchQuery.trim().toLowerCase()
    );
  }, [schools, searchQuery]);

  // Handler memilih dari dropdown
  const handleSelectSchool = (schoolName: string) => {
    onChange(schoolName);
    setIsManual(false);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Handler memilih input manual
  const handleSwitchToManual = (initialValue?: string) => {
    setIsManual(true);
    setIsOpen(false);
    if (initialValue) {
      onChange(initialValue);
    }
    setSearchQuery("");
  };

  // Styling dinamis berdasarkan theme (teal vs amber)
  const isTeal = theme === "teal";
  const focusBorderColor = isTeal
    ? "focus:border-[#2B7A75] focus:ring-[#2B7A75]/20"
    : "focus:border-amber-500 focus:ring-amber-500/20";
  const labelColor = isTeal ? "text-gray-600" : "text-amber-700/80";

  return (
    <div className="relative" ref={containerRef}>
      {/* Label & Toggle Switch */}
      <div className="flex items-center justify-between mb-1">
        <label className={`text-xs font-semibold ${labelColor} block`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => {
            setIsManual(!isManual);
            setIsOpen(false);
          }}
          className="text-[11px] font-semibold text-[#E77926] hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          {isManual ? (
            <>
              <School className="w-3 h-3" />
              <span>Pilih dari Sistem</span>
            </>
          ) : (
            <>
              <PenLine className="w-3 h-3" />
              <span>Ketik Manual</span>
            </>
          )}
        </button>
      </div>

      {/* Field Input / Trigger */}
      {isManual ? (
        // Mode Manual: Input teks bebas murni tanpa tombol daftar
        <div className="relative">
          <input
            type="text"
            placeholder="Ketik nama sekolah manual..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full p-2.5 pl-9 pr-9 bg-gray-50 border rounded-xl outline-none text-sm transition-all focus:ring-2 ${error ? "border-red-300" : "border-gray-200"
              } ${focusBorderColor}`}
          />
          <PenLine className="absolute w-4 h-4 text-gray-400 pointer-events-none left-3 top-3" />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-3 top-3 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full cursor-pointer transition-colors"
              title="Hapus teks"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        // Mode Dropdown Sistem
        <div className="relative">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full p-2.5 pl-9 pr-3 bg-gray-50 border rounded-xl outline-none text-sm transition-all cursor-pointer flex items-center justify-between select-none ${error
              ? "border-red-300"
              : isOpen
                ? "border-[#F2A33A] ring-2 ring-[#F2A33A]/20"
                : "border-gray-200"
              }`}
          >
            <School className="absolute w-4 h-4 text-gray-400 pointer-events-none left-3 top-3" />
            <span
              className={`truncate text-sm mr-2 ${value ? "text-gray-800 font-medium" : "text-gray-400"
                }`}
            >
              {value || "Pilih atau cari sekolah..."}
            </span>

            {/* Kontainer Aksi Kanan (Clear & Chevron sejajar berdampingan, tidak menumpuk) */}
            <div className="flex items-center gap-1 shrink-0">
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                  }}
                  className="p-1 text-gray-400 transition-colors rounded-full cursor-pointer hover:text-gray-600 hover:bg-gray-200/50"
                  title="Hapus pilihan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#E77926]" : ""
                  }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* POPUP DROPDOWN MENU (Sesuai Desain Gambar) */}
      {isOpen && !isManual && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[150] bg-white rounded-2xl border-[1.5px] border-[#F2A33A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar Input */}
          <div className="p-3 border-b border-gray-100 flex items-center gap-2.5 bg-white sticky top-0 z-10">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari sekolah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List Kategori & Sekolah (Scrollable) */}
          <div className="px-3 py-2 space-y-3 overflow-y-auto max-h-72">
            {/* Opsi Cepat: Gunakan Teks Pencarian sebagai Manual jika belum cocok dengan sekolah terdaftar */}
            {searchQuery.trim() && !hasExactMatch && (
              <div className="pb-2 border-b border-amber-100">
                <button
                  type="button"
                  onClick={() => handleSwitchToManual(searchQuery.trim())}
                  className="w-full text-left p-2.5 bg-amber-50/80 hover:bg-amber-100/90 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-between border border-amber-200 transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-[#E77926] shrink-0" />
                    <span>Gunakan <strong>&ldquo;{searchQuery}&rdquo;</strong> (Ketik Manual)</span>
                  </span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-amber-200 text-amber-700 shrink-0">
                    Pilih
                  </span>
                </button>
              </div>
            )}

            {/* Render Setiap Kategori Jenjang */}
            {(["PAUD", "TK", "SD", "SMP", "SMA"] as const).map((jenjangKey) => {
              const list = groupedSchools[jenjangKey] || [];
              if (list.length === 0) return null;

              return (
                <div key={jenjangKey} className="space-y-1">
                  <div className="text-[11px] font-bold text-[#E77926] uppercase tracking-wider px-2 pt-1">
                    {jenjangKey}
                  </div>
                  <div className="space-y-0.5">
                    {list.map((item) => {
                      const isSelected =
                        value?.toLowerCase() === item.nama.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => handleSelectSchool(item.nama)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-between ${isSelected
                            ? "bg-[#FDF1CB] text-gray-900 font-semibold"
                            : "text-gray-800 hover:bg-[#FEF6DD]"
                            }`}
                        >
                          <span className="truncate">{item.nama}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Kategori LAINNYA */}
            <div className="pt-1 space-y-1 border-t border-gray-100">
              <div className="text-[11px] font-bold text-[#E77926] uppercase tracking-wider px-2 pt-1">
                LAINNYA
              </div>
              <div className="space-y-0.5">
                {/* Belum bersekolah */}
                <button
                  type="button"
                  onClick={() => handleSelectSchool("Belum bersekolah")}
                  className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-between ${value === "Belum bersekolah"
                    ? "bg-[#FDF1CB] text-gray-900 font-semibold"
                    : "text-gray-800 hover:bg-[#FEF6DD]"
                    }`}
                >
                  <span>Belum bersekolah</span>
                  {value === "Belum bersekolah" && (
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                </button>

                {/* Ketik Manual (Sekolah Belum Terdaftar) */}
                <button
                  type="button"
                  onClick={() => handleSwitchToManual()}
                  className="w-full text-left px-3 py-2 text-sm rounded-xl text-gray-800 hover:bg-[#FEF6DD] transition-colors cursor-pointer flex items-center gap-2 group"
                >
                  <PenLine className="w-3.5 h-3.5 text-[#E77926]" />
                  <span>Ketik Manual (Sekolah belum terdaftar di sistem)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

