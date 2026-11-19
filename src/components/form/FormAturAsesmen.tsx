"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  X,
  CheckCircle2,
  User,
  ChevronDown,
} from "lucide-react";

import { handleApiError } from "@/lib/api-error";
import { getTherapists } from "@/lib/api/jadwal_terapi";
import {
  getObservationTherapistOptions,
  parseTherapistOptionsByBidang,
} from "@/lib/api/jadwal_observasi";
import { getAssessmentTherapistOptions } from "@/lib/api/jadwal_asessment";

export interface PetugasOption {
  id?: string | number;
  name: string;
  section?: string;
  role?: string;
}

// Bidang definitions for asesmen mode
export const BIDANG_LIST = [
  { key: "wicara", label: "Wicara", color: "#22C55E", section: "wicara" },
  { key: "paedagog", label: "Paedagog", color: "#EAB308", section: "paedagog" },
  { key: "fisio", label: "Fisio", color: "#14B8A6", section: "fisio" },
  { key: "okupasi", label: "Okupasi", color: "#EC4899", section: "okupasi" },
] as const;

export type BidangKey = (typeof BIDANG_LIST)[number]["key"];

/**
 * Normalisasi string bidang ke bentuk standar (wicara | paedagog | fisio | okupasi).
 * Mendukung variasi seperti: "fisioterapi", "okupasi", "terapi okupasi", "paedagogik", "plb", dll.
 */
export function normalizeBidangKey(raw?: string | null): BidangKey | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (s === "fisio" || s.includes("fisio") || s.includes("physio")) return "fisio";
  if (s === "okupasi" || s.includes("okupasi") || s.includes("occupat") || s === "ot") return "okupasi";
  if (s === "wicara" || s.includes("wicara") || s.includes("speech") || s === "tw") return "wicara";
  if (
    s === "paedagog" ||
    s.includes("paedagog") ||
    s.includes("pedagog") ||
    s.includes("plb")
  )
    return "paedagog";
  return null;
}

// Remove "umum" from the BidangKey union since it's not in BIDANG_LIST anymore

interface FormAturAsesmenProps {
  onClose: () => void;
  onSave?: (
    date: string,
    time: string,
    petugas?: string,
    petugasId?: string | number,
    petugasByBidang?: Record<string, string>,
    therapists?: Array<{ assessment_detail_id: number; therapist_id: string | number }>
  ) => void | Promise<void>;
  initialDate?: string;
  initialTime?: string;
  initialPetugas?: string;
  initialPetugasId?: string | number;
  /** Pre-fill per-bidang assessor by name. Key = bidang key (wicara/paedagog/fisio/okupasi), value = assessor name */
  initialPetugasByBidang?: Partial<Record<string, string>>;
  /** If provided, only show these bidang keys in asesmen mode (e.g. ["wicara","fisio"]) */
  allowedBidang?: string[];
  petugasList?: PetugasOption[];
  /** Opsi terapis yang tervalidasi sebagai assessor per bidang dari backend therapist-options */
  bidangTherapistOptions?: Partial<Record<BidangKey, PetugasOption[]>>;
  /** Data mentah dari endpoint /observations/{id}/therapist-options */
  therapistOptionsRaw?: any[];
  /** ID Observasi untuk mengambil therapist-options dari backend jika belum disediakan */
  observationId?: number | string;
  /** ID Assessment untuk mengambil therapist-options dari backend jika belum disediakan */
  assessmentId?: number | string;
  pasienName?: string;
  title?: string;
  /** Jika diisi, tampilkan banner peringatan di dalam modal dan nonaktifkan tombol simpan */
  warningMessage?: string;
}

// ─────────────────────────────────────────────────────────
// Sub-component: single searchable combobox per bidang
// ─────────────────────────────────────────────────────────
interface BidangComboboxProps {
  bidangLabel: string;
  color: string;
  options: PetugasOption[];
  isLoading: boolean;
  selected: PetugasOption | null;
  onSelect: (opt: PetugasOption | null) => void;
}

function BidangCombobox({
  bidangLabel,
  color,
  options,
  isLoading,
  selected,
  onSelect,
}: BidangComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync display value when selected changes externally
  useEffect(() => {
    if (!isSearching) {
      const displayName = selected?.name || "";
      // Cegah menampilkan ULID mentah di kotak pencarian/input
      if (/^[0-9A-Za-z]{20,30}$/.test(displayName.trim())) {
        setSearchTerm("");
      } else {
        setSearchTerm(displayName);
      }
    }
  }, [selected, isSearching]);

  const filteredOptions = useMemo(() => {
    if (!isSearching || !searchTerm.trim()) return options;
    const q = searchTerm.trim().toLowerCase();
    const matches = options.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.section && o.section.toLowerCase().includes(q)) ||
        (o.role && o.role.toLowerCase().includes(q))
    );
    return matches.sort((a, b) => {
      const aS = a.name.toLowerCase().startsWith(q);
      const bS = b.name.toLowerCase().startsWith(q);
      if (aS && !bS) return -1;
      if (!aS && bS) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [options, searchTerm, isSearching]);

  const handleSelect = (opt: PetugasOption) => {
    onSelect(opt);
    setSearchTerm(opt.name);
    setIsSearching(false);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm("");
    setIsSearching(false);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsSearching(false);
        inputRef.current?.focus();
      }
      return next;
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Bidang label with colored dot */}
      <div className="flex items-center gap-2 w-24 shrink-0">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-semibold text-gray-700">{bidangLabel}</span>
      </div>

      {/* Combobox */}
      <div className="relative flex-1" ref={containerRef}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Pilih petugas"
          value={searchTerm}
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            setIsSearching(true);
            setIsOpen(true);
            const direct = options.find(
              (o) => o.name.toLowerCase() === val.trim().toLowerCase()
            );
            onSelect(direct || null);
          }}
          onClick={() => setIsOpen(true)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (isOpen && filteredOptions.length > 0) {
                e.preventDefault();
                handleSelect(filteredOptions[0]);
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
              setIsSearching(false);
            }
          }}
          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 pr-14 text-sm focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400 cursor-text"
        />

        {/* Right-side actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="cursor-pointer p-1 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              title="Hapus"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleOpen}
            className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 transition-colors"
            tabIndex={-1}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#2B7A75]" : ""
                }`}
            />
          </button>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.13 }}
              className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-44 overflow-y-auto dropdown-scroll py-1"
            >
              {isLoading && options.length === 0 ? (
                <div className="px-4 py-3 text-xs text-gray-400 text-center animate-pulse">
                  Memuat...
                </div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSel =
                    selected !== null &&
                    opt.name.toLowerCase() === selected?.name.toLowerCase();
                  return (
                    <div
                      key={opt.id ?? opt.name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(opt);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between font-medium ${isSel
                        ? "bg-teal-50 text-[#1E5C58] font-bold"
                        : "text-gray-700 hover:bg-[#F4F9F8] hover:text-[#2B7A75]"
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="truncate">{opt.name}</span>
                        {(opt.section || opt.role) && (
                          <span className="text-[10px] font-semibold text-gray-400 capitalize shrink-0">
                            · {opt.section || opt.role}
                          </span>
                        )}
                      </div>
                      {isSel && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2B7A75] shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-xs text-gray-400 text-center font-medium">
                  {options.length === 0
                    ? "Belum ada terapis asesor terverifikasi untuk bidang ini"
                    : `"${searchTerm}" tidak ditemukan`}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Date & Time helpers for HTML5 <input type="date|time">
// ─────────────────────────────────────────────────────────
function formatToInputDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === "-" || dateStr.trim() === "") return "";
  const trimmed = dateStr.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // ISO with timestamp: YYYY-MM-DDTHH:mm:ss... or YYYY-MM-DD HH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}[T\s]/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // YYYY/MM/DD
  const ymd = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Text like "14 April 2026"
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
}

function formatToInputTime(timeStr?: string | null): string {
  if (!timeStr || timeStr === "-" || timeStr.trim() === "") return "";
  const trimmed = timeStr.trim();

  // Match HH:mm:ss or HH:mm or HH.mm
  const match = trimmed.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    const [, h, m] = match;
    return `${h.padStart(2, "0")}:${m}`;
  }

  return "";
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
export default function FormAturAsesmen({
  onClose,
  onSave,
  initialDate = "",
  initialTime = "",
  initialPetugas = "",
  initialPetugasId,
  initialPetugasByBidang,
  allowedBidang,
  petugasList,
  bidangTherapistOptions,
  therapistOptionsRaw,
  observationId,
  assessmentId,
  pasienName,
  title,
  warningMessage,
}: FormAturAsesmenProps) {
  const [date, setDate] = useState(() => formatToInputDate(initialDate));
  const [time, setTime] = useState(() => formatToInputTime(initialTime));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine mode: "asesmen" shows per-bidang, "observasi" shows single
  const isAsesmenMode = !title || title.toLowerCase().includes("asesmen");

  // ── Assessor-filtered mode ─────────────────────────────────────────────────
  // Mode terfilter asesor aktif jika:
  // - Ada observationId (tab "selesai" di Jadwal Observasi)
  // - Ada assessmentId (menu Jadwal Asesmen)
  // - Sedang dalam mode asesmen (isAsesmenMode = true)
  // ──────────────────────────────────────────────────────────────────────────
  const isAssessorFilteredMode =
    Boolean(observationId) || Boolean(assessmentId) || isAsesmenMode;

  // Simpan data mentah therapist-options dari backend
  const [rawOptions, setRawOptions] = useState<any[]>(() =>
    Array.isArray(therapistOptionsRaw) ? therapistOptionsRaw : []
  );

  useEffect(() => {
    if (Array.isArray(therapistOptionsRaw)) {
      setRawOptions(therapistOptionsRaw);
    }
  }, [therapistOptionsRaw]);

  // Simpan daftar assessor tervalidasi per bidang dari API
  const [assessorOptions, setAssessorOptions] = useState<
    Partial<Record<BidangKey, PetugasOption[]>>
  >(() => bidangTherapistOptions || {});
  const [isLoadingAssessorOptions, setIsLoadingAssessorOptions] = useState(
    () =>
      (Boolean(observationId) || Boolean(assessmentId)) &&
      (!bidangTherapistOptions || Object.keys(bidangTherapistOptions).length === 0)
  );

  // Sync jika bidangTherapistOptions dari parent berubah
  useEffect(() => {
    if (bidangTherapistOptions && Object.keys(bidangTherapistOptions).length > 0) {
      setAssessorOptions((prev) => ({ ...prev, ...bidangTherapistOptions }));
      setIsLoadingAssessorOptions(false);
    }
  }, [bidangTherapistOptions]);

  // Fetch assessor options langsung dari API saat mount jika belum ada
  useEffect(() => {
    if (!observationId && !assessmentId) {
      return;
    }

    // Jika parent sudah mengoper opsi terapis / raw options, jangan fetch ulang
    if (
      (bidangTherapistOptions && Object.keys(bidangTherapistOptions).length > 0) ||
      (therapistOptionsRaw && therapistOptionsRaw.length > 0)
    ) {
      setIsLoadingAssessorOptions(false);
      return;
    }

    let cancelled = false;
    setIsLoadingAssessorOptions(true);

    const fetcher = observationId
      ? getObservationTherapistOptions(observationId)
      : getAssessmentTherapistOptions(assessmentId!);

    fetcher
      .then((raw) => {
        if (cancelled) return;
        if (Array.isArray(raw)) {
          setRawOptions(raw);
        }
        const parsed = parseTherapistOptionsByBidang(raw);
        if (parsed && Object.keys(parsed).length > 0) {
          setAssessorOptions(parsed);
        }
      })
      .catch((err) => {
        console.warn("[FormAturAsesmen] Gagal fetch therapist-options:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAssessorOptions(false);
      });

    return () => { cancelled = true; };
  }, [observationId, assessmentId, bidangTherapistOptions]);

  // Map bidangKey -> assessment_detail_id dari rawOptions backend
  const detailIdByBidang = useMemo(() => {
    const map: Record<string, number> = {};
    if (Array.isArray(rawOptions)) {
      for (const opt of rawOptions) {
        const normKey = normalizeBidangKey(opt.type) || (opt.type || "").toLowerCase().trim();
        const dId = opt.assessment_detail_id ?? opt.id;
        if (normKey && dId && !isNaN(Number(dId))) {
          map[normKey] = Number(dId);
        }
      }
    }
    return map;
  }, [rawOptions]);

  // Filter BIDANG_LIST to only allowed bidang when prop is provided
  const activeBidangList = useMemo(() => {
    if (!isAsesmenMode) return BIDANG_LIST;
    if (allowedBidang && allowedBidang.length > 0) {
      const normalizedAllowed = new Set(
        allowedBidang
          .map((b) => normalizeBidangKey(b))
          .filter((k): k is BidangKey => k !== null)
      );
      if (normalizedAllowed.size > 0) {
        const filtered = BIDANG_LIST.filter((b) => normalizedAllowed.has(b.key));
        if (filtered.length > 0) return filtered;
      }
    }
    // Also check if initialPetugasByBidang has any recognized keys
    if (initialPetugasByBidang) {
      const keys = Object.keys(initialPetugasByBidang)
        .map((k) => normalizeBidangKey(k))
        .filter((k): k is BidangKey => k !== null);
      if (keys.length > 0) {
        const keySet = new Set(keys);
        const filtered = BIDANG_LIST.filter((b) => keySet.has(b.key));
        if (filtered.length > 0) return filtered;
      }
    }
    return BIDANG_LIST;
  }, [isAsesmenMode, allowedBidang, initialPetugasByBidang]);

  // ── Single-petugas state (observasi mode) ──
  const [selectedPetugas, setSelectedPetugas] = useState<PetugasOption | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialPetugas || "");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<PetugasOption[]>(
    petugasList && petugasList.length > 0 ? petugasList : []
  );
  const [isLoadingPetugas, setIsLoadingPetugas] = useState(false);

  // Keep options in sync if petugasList prop changes
  useEffect(() => {
    if (petugasList && petugasList.length > 0) {
      setOptions(petugasList);
    }
  }, [petugasList]);

  // ── Per-bidang state (asesmen mode) ──
  const [allTherapists, setAllTherapists] = useState<PetugasOption[]>([]);
  const [selectedByBidang, setSelectedByBidang] = useState<
    Record<BidangKey, PetugasOption | null>
  >(() => {
    const initial: Record<BidangKey, PetugasOption | null> = {
      wicara: null,
      paedagog: null,
      fisio: null,
      okupasi: null,
    };
    if (initialPetugasByBidang) {
      for (const [rawKey, nameVal] of Object.entries(initialPetugasByBidang)) {
        const normKey = normalizeBidangKey(rawKey);
        if (normKey && nameVal && nameVal !== "-") {
          let cleanName = "";
          let id = "";
          if (nameVal.includes(":")) {
            id = nameVal.slice(0, nameVal.indexOf(":")).trim();
            cleanName = nameVal.slice(nameVal.indexOf(":") + 1).trim();
          } else if (/^[0-9A-Za-z]{20,30}$/.test(nameVal.trim())) {
            id = nameVal.trim();
          } else {
            cleanName = nameVal.trim();
          }
          if (cleanName && !/^[0-9A-Za-z]{20,30}$/.test(cleanName)) {
            initial[normKey] = { id: id || "", name: cleanName };
          } else if (id) {
            initial[normKey] = { id, name: "" };
          }
        }
      }
    }
    return initial;
  });

  // Close single dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch therapists once
  useEffect(() => {
    if (petugasList && petugasList.length > 0) {
      setOptions(petugasList);
      setAllTherapists(petugasList);
      return;
    }

    let isMounted = true;
    async function fetchPetugas() {
      setIsLoadingPetugas(true);
      try {
        const res = await getTherapists();
        if (isMounted && Array.isArray(res) && res.length > 0) {
          const mapped: PetugasOption[] = res
            .map(
              (t: {
                therapist_id?: string;
                id?: string;
                therapist_name?: string;
                name?: string;
                therapist_section?: string;
                section?: string;
              }) => ({
                id: t.therapist_id || t.id,
                name: t.therapist_name || t.name || "",
                section: t.therapist_section || t.section || "",
              })
            )
            .filter((t: PetugasOption) => Boolean(t.name));

          setOptions(mapped);
          setAllTherapists(mapped);
        }
      } catch (err) {
        console.error("Gagal memuat daftar petugas:", err);
      } finally {
        if (isMounted) setIsLoadingPetugas(false);
      }
    }

    fetchPetugas();
    return () => {
      isMounted = false;
    };
  }, [petugasList]);

  // Sync initial values on edit
  useEffect(() => {
    if (initialDate) setDate(formatToInputDate(initialDate));
    if (initialTime) setTime(formatToInputTime(initialTime));

    if (options.length > 0) {
      let matched: PetugasOption | undefined;
      if (initialPetugasId) {
        matched = options.find((o) => String(o.id) === String(initialPetugasId));
      }
      if (!matched && initialPetugas && initialPetugas !== "-") {
        matched = options.find(
          (o) => o.name.toLowerCase() === initialPetugas.toLowerCase()
        );
      }

      if (matched) {
        setSearchTerm(matched.name);
        setSelectedPetugas(matched);
      } else if (initialPetugas && initialPetugas !== "-" && isNaN(Number(initialPetugas))) {
        setSearchTerm(initialPetugas);
        setSelectedPetugas({ id: initialPetugasId || "", name: initialPetugas });
      } else {
        setSearchTerm("");
        setSelectedPetugas(null);
      }
    } else {
      if (initialPetugas && initialPetugas !== "-") {
        setSearchTerm(initialPetugas);
        setSelectedPetugas({ id: initialPetugasId || "", name: initialPetugas });
      }
    }
    setIsSearching(false);
  }, [initialDate, initialTime, initialPetugas, initialPetugasId, options]);

  // Build per-bidang option lists
  const optionsByBidang = useMemo(() => {
    const result: Record<BidangKey, PetugasOption[]> = {
      wicara: [],
      paedagog: [],
      fisio: [],
      okupasi: [],
    };

    for (const key of ["wicara", "paedagog", "fisio", "okupasi"] as BidangKey[]) {
      if (isAssessorFilteredMode) {
          // MODE TERFILTER (tab "selesai" / asesmen):
          // HANYA tampilkan assessor tervalidasi dari backend therapist-options
          const matchedRaw = Array.isArray(rawOptions)
            ? rawOptions.find(
              (opt) => (normalizeBidangKey(opt.type) || (opt.type || "").toLowerCase().trim()) === key
            )
            : null;

          if (matchedRaw && Array.isArray(matchedRaw.therapists) && matchedRaw.therapists.length > 0) {
            result[key] = matchedRaw.therapists.map((t: any) => ({
              id: t.therapist_id || t.id,
              name: t.therapist_name || t.name || "",
              section: key,
              role: t.role || "asesor",
            }));
          } else if (key in assessorOptions && Array.isArray(assessorOptions[key]) && assessorOptions[key]!.length > 0) {
            result[key] = assessorOptions[key]!;
          } else {
            // 2. Fallback cerdas: HANYA ambil terapis yang tervalidasi sebagai ASESOR (role === 'asesor')
            // Bukan semua terapis! Hanya terapis yang role-nya asesor di bidang tersebut.
            const matchingAssessors = allTherapists.filter((t) => {
              const normSec = normalizeBidangKey(t.section);
              const isAsesorRole =
                (t.role || "").toLowerCase().includes("asesor") ||
                (t.role || "").toLowerCase().includes("assessor");
              return normSec === key && isAsesorRole;
            });
            if (matchingAssessors.length > 0) {
              result[key] = matchingAssessors;
            }
          }
        } else {
          // MODE NORMAL (tab bukan "selesai"): tampilkan semua terapis berdasarkan section
          for (const t of allTherapists) {
            if (normalizeBidangKey(t.section) === key) result[key].push(t);
          }
          if (result[key].length === 0 && allTherapists.length > 0) {
            result[key] = allTherapists;
          }
        }
      }

      return result;
}, [allTherapists, assessorOptions, isAssessorFilteredMode, rawOptions]);

// Pre-fill per-bidang selections when therapists are loaded or initialPetugasByBidang changes
useEffect(() => {
  if (!initialPetugasByBidang) return;

  const updates: Partial<Record<BidangKey, PetugasOption | null>> = {};

  for (const [rawKey, nameVal] of Object.entries(initialPetugasByBidang)) {
    const normKey = normalizeBidangKey(rawKey);
    if (!normKey || !nameVal || nameVal === "-") continue;

    let idPart = "";
    let namePart = "";
    if (nameVal.includes(":")) {
      idPart = nameVal.slice(0, nameVal.indexOf(":")).trim();
      namePart = nameVal.slice(nameVal.indexOf(":") + 1).trim();
    } else if (/^[0-9A-Za-z]{20,30}$/.test(nameVal.trim())) {
      idPart = nameVal.trim();
    } else {
      namePart = nameVal.trim();
    }

    // Cari di optionsByBidang bidang terkait terlebih dahulu (daftar asesor resmi), lalu allTherapists
    const specificOpts = optionsByBidang[normKey] || [];
    const combined = [...specificOpts, ...allTherapists];

    let matched: PetugasOption | undefined;
    // 1. Cocokkan berdasarkan ID (termasuk ULID)
    if (idPart) {
      matched = combined.find((t) => String(t.id) === String(idPart));
    }
    // 2. Cocokkan berdasarkan nama jika belum ditemukan
    if (!matched && namePart && !/^[0-9A-Za-z]{20,30}$/.test(namePart)) {
      const lowerName = namePart.toLowerCase();
      matched = combined.find((t) => t.name.toLowerCase() === lowerName);
    }

    if (matched) {
      updates[normKey] = matched;
    } else if (namePart && !/^[0-9A-Za-z]{20,30}$/.test(namePart)) {
      updates[normKey] = { id: idPart || "", name: namePart };
    }
  }

  if (Object.keys(updates).length > 0) {
    setSelectedByBidang((prev) => ({ ...prev, ...updates }));
  }
}, [initialPetugasByBidang, allTherapists, optionsByBidang]);

// Filter options (single mode)
const filteredOptions = useMemo(() => {
  if (!isSearching || !searchTerm.trim()) return options;
  const query = searchTerm.trim().toLowerCase();
  const matches = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(query) ||
      (opt.section && opt.section.toLowerCase().includes(query)) ||
      (opt.role && opt.role.toLowerCase().includes(query))
  );
  return matches.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(query);
    const bStarts = b.name.toLowerCase().startsWith(query);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.localeCompare(b.name);
  });
}, [options, searchTerm, isSearching]);

const handleSelectBidang = useCallback(
  (key: BidangKey, opt: PetugasOption | null) => {
    setSelectedByBidang((prev) => ({ ...prev, [key]: opt }));
  },
  []
);

const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!onSave) return;

  if (!date || !time) {
    handleApiError(null, "Tanggal dan Waktu tidak boleh kosong!");
    return;
  }

  if (isAsesmenMode) {
    const unselectedBidang = activeBidangList.filter((b) => {
      const opt = selectedByBidang[b.key];
      return !opt || (!opt.id && !opt.name);
    });

    if (unselectedBidang.length > 0) {
      const labels = unselectedBidang.map((b) => b.label).join(", ");
      handleApiError(null, `Mohon pilih petugas asesor untuk bidang: ${labels}`);
      return;
    }
  }

  setIsSubmitting(true);
  try {
    if (isAsesmenMode) {
      // Collect all selected petugas per bidang
      const selectedEntries = activeBidangList.map((b) => selectedByBidang[b.key]).filter(
        Boolean
      ) as PetugasOption[];

      // Build per-bidang map { bidangKey: "id:name" }
      const byBidang: Record<string, string> = {};
      // Build array therapists: [{ assessment_detail_id, therapist_id }] dari opsi backend
      const therapistsPayload: Array<{ assessment_detail_id: number; therapist_id: string | number }> = [];

      for (const b of activeBidangList) {
        const opt = selectedByBidang[b.key];
        const detailId = detailIdByBidang[b.key];

        if (opt && (opt.id || opt.name)) {
          const hasCleanName = opt.name && !/^[0-9A-Za-z]{20,30}$/.test(opt.name.trim());
          const tId = opt.id || (/^[0-9A-Za-z]{20,30}$/.test(opt.name.trim()) ? opt.name.trim() : "");
          const tName = hasCleanName ? opt.name.trim() : "";
          if (tId && tName) {
            byBidang[b.key] = `${tId}:${tName}`;
          } else if (tId) {
            byBidang[b.key] = String(tId);
          } else if (tName) {
            byBidang[b.key] = tName;
          }

          if (detailId) {
            therapistsPayload.push({
              assessment_detail_id: Number(detailId),
              therapist_id: tId || opt.name.trim(),
            });
          }
        }
      }

      // Join names as comma-separated for the petugas field
      const names = selectedEntries.map((p) => p.name).join(", ");
      const firstId = selectedEntries[0]?.id;
      await onSave(
        date,
        time,
        names || undefined,
        firstId,
        Object.keys(byBidang).length > 0 ? byBidang : undefined,
        therapistsPayload
      );
    } else {
      // Single petugas mode
      const finalName = selectedPetugas?.name || searchTerm.trim();
      if (!finalName) {
        handleApiError(null, "Petugas tidak boleh kosong!");
        setIsSubmitting(false);
        return;
      }
      const matched =
        selectedPetugas ||
        options.find(
          (o) => o.name.toLowerCase() === finalName.toLowerCase()
        );
      await onSave(date, time, finalName, matched?.id);
    }
    onClose();
  } catch (err) {
    console.warn("onSave error:", err);
  } finally {
    setIsSubmitting(false);
  }
};

const defaultTitle = pasienName
  ? `Atur Jadwal Asesmen untuk ${pasienName}`
  : "Atur Jadwal Asesmen";

return (
  <AnimatePresence>
    <div className="fixed inset-0 flex items-center justify-center bg-[#1E5C58]/20 backdrop-blur-sm z-50 p-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
              .dropdown-scroll::-webkit-scrollbar { width: 5px; }
              .dropdown-scroll::-webkit-scrollbar-track { background: transparent; }
              .dropdown-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
              .dropdown-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `,
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col relative"
      >
        {/* Header */}
        <div className="bg-linear-to-br from-[#2B7A75] to-[#1E5C58] p-5 text-white relative overflow-hidden rounded-t-3xl shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />

          <button
            onClick={onClose}
            type="button"
            className="cursor-pointer absolute right-4 top-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 pr-6">
            <h2 className="text-lg font-bold leading-tight drop-shadow-sm">
              {title || defaultTitle}
            </h2>
            {pasienName && (
              <p className="text-sm font-semibold text-teal-100/90 mt-1 line-clamp-1">
                Pasien: {pasienName}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6">
          {/* ── Warning banner jika data assessment belum ada di backend ── */}
          {warningMessage && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="mt-0.5 text-amber-500 text-lg leading-none">⚠️</span>
              <p className="text-sm text-amber-800 leading-snug">{warningMessage}</p>
            </div>
          )}
          {/* ── Tanggal + Waktu row ── */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Tanggal */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-[#2B7A75]" />
                Tanggal
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] outline-none transition-all font-medium text-gray-700"
              />
            </div>

            {/* Waktu */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#2B7A75]" />
                Waktu (Jam)
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] outline-none transition-all font-medium text-gray-700"
              />
            </div>
          </div>

          {/* ── PETUGAS section ── */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#2B7A75]" /> Petugas
            </label>

            {isAsesmenMode ? (
              /* Per-bidang comboboxes */
              <div className="space-y-3">
                {activeBidangList.map((b) => (
                  <BidangCombobox
                    key={b.key}
                    bidangLabel={b.label}
                    color={b.color}
                    options={optionsByBidang[b.key]}
                    isLoading={isAssessorFilteredMode ? isLoadingAssessorOptions : isLoadingPetugas}
                    selected={selectedByBidang[b.key]}
                    onSelect={(opt) => handleSelectBidang(b.key, opt)}
                  />
                ))}
              </div>
            ) : (
              /* Single petugas combobox (observasi mode) */
              <div className="relative" ref={dropdownRef}>
                <input
                  ref={inputRef}
                  type="text"
                  required
                  placeholder="Pilih Petugas"
                  value={searchTerm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchTerm(val);
                    setIsSearching(true);
                    setIsOpen(true);
                    const directMatch = options.find(
                      (opt) =>
                        opt.name.toLowerCase() === val.trim().toLowerCase()
                    );
                    setSelectedPetugas(directMatch || null);
                  }}
                  onClick={() => setIsOpen(true)}
                  onFocus={() => setIsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (isOpen && filteredOptions.length > 0) {
                        e.preventDefault();
                        const first = filteredOptions[0];
                        setSelectedPetugas(first);
                        setSearchTerm(first.name);
                        setIsSearching(false);
                        setIsOpen(false);
                      }
                    } else if (e.key === "Escape") {
                      setIsOpen(false);
                    }
                  }}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 pr-16 text-sm focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] outline-none transition-all font-medium text-gray-700 cursor-text placeholder:text-gray-400"
                />

                {/* Actions kanan */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm("");
                        setSelectedPetugas(null);
                        setIsSearching(false);
                        setIsOpen(true);
                        inputRef.current?.focus();
                      }}
                      className="cursor-pointer p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Hapus"
                      tabIndex={-1}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen((prev) => {
                        const next = !prev;
                        if (next) setIsSearching(false);
                        return next;
                      });
                    }}
                    className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    tabIndex={-1}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#2B7A75]" : ""
                        }`}
                    />
                  </button>
                </div>

                {/* Dropdown */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto dropdown-scroll py-1.5 divide-y divide-gray-50"
                    >
                      {isLoadingPetugas && options.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-gray-400 text-center font-medium animate-pulse">
                          Memuat daftar petugas...
                        </div>
                      ) : filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => {
                          const isSelected =
                            Boolean(selectedPetugas) &&
                            opt.name.toLowerCase() ===
                            selectedPetugas?.name.toLowerCase();
                          return (
                            <div
                              key={opt.id || opt.name}
                              onClick={() => {
                                setSelectedPetugas(opt);
                                setSearchTerm(opt.name);
                                setIsSearching(false);
                                setIsOpen(false);
                              }}
                              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between font-medium ${isSelected
                                ? "bg-teal-50 text-[#1E5C58] font-bold"
                                : "text-gray-700 hover:bg-[#F4F9F8] hover:text-[#2B7A75]"
                                }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className="truncate font-semibold text-gray-800">{opt.name}</span>
                                {(opt.section || opt.role) && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#2B7A75] border border-teal-100/80 capitalize shrink-0">
                                    {opt.section || opt.role}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#2B7A75] shrink-0 ml-2" />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-xs text-gray-400 text-center font-medium">
                          {options.length === 0
                            ? "Tidak ada data petugas"
                            : `Petugas "${searchTerm}" tidak ditemukan`}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Info Peran / Spesialisasi Petugas Terpilih */}
                {selectedPetugas && (selectedPetugas.section || selectedPetugas.role) && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50/70 border border-teal-100 text-xs">
                    <span className="text-gray-500 font-medium">Peran / Spesialisasi:</span>
                    <span className="font-bold text-[#1E5C58] capitalize">
                      {selectedPetugas.section || selectedPetugas.role}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 justify-end mt-7 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm shadow-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!warningMessage}
              className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2B7A75] text-white font-bold text-sm hover:bg-[#1E5C58] shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Simpan Jadwal
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  </AnimatePresence>
);
}
