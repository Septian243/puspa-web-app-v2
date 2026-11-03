"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArchiveRestore,
  Check,
  ChevronDown,
  Clock,
  Download,
  Loader2,
  X,
} from "lucide-react";
import {
  getExportFilterOptions,
  downloadExportTherapySoapPdf,
  ExportFilterOptions,
  ExportTherapySoapFilters,
} from "@/lib/api/terapiTerapis";
import { getSchedules, ScheduleItem } from "@/lib/api/jadwal_terapi";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

type Period = "Harian" | "Mingguan" | "Bulanan" | "Custom";

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

function MultiSelect({
  label,
  values,
  options,
  onChange,
  isLoading = false,
  placeholder,
}: {
  label: string;
  values: string[];
  options: string[];
  onChange: (value: string[]) => void;
  isLoading?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  const text =
    values.length === 0
      ? ""
      : values.length === 1
        ? values[0]
        : `${values[0]} (+${values.length - 1} lainnya)`;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <label className="mb-1.5 block text-xs font-bold text-gray-500">
        {label}
      </label>
      <div className="relative flex items-center rounded-xl border border-teal-100 bg-white px-4 py-2.5 pr-11 text-sm font-medium text-gray-700 shadow-sm focus-within:border-[#2B7A75] focus-within:ring-2 focus-within:ring-[#2B7A75]/20">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : text}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setSearch("");
            }
          }}
          placeholder={
            isLoading
              ? "Memuat data..."
              : open
                ? values.length
                  ? `${values.length} dipilih - cari...`
                  : `Cari ${label.toLowerCase()}...`
                : placeholder || `Semua ${label.toLowerCase()}`
          }
          aria-label={`Pilih ${label.toLowerCase()}`}
          className="w-full p-0 text-sm bg-transparent outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (open) {
              setOpen(false);
              setSearch("");
            } else {
              setOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
          className="absolute right-0 flex items-center h-full pr-3 cursor-pointer"
          aria-label={`${open ? "Tutup" : "Buka"} pilihan ${label.toLowerCase()}`}
        >
          {values.length > 0 && (
            <span className="mr-1 rounded-full bg-[#2B7A75] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {values.length}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 flex max-h-[250px] flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-[#F4F9F8]/60 px-3 py-2">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange([])}
              className="text-xs font-bold text-[#1E5C58] cursor-pointer hover:underline"
            >
              Semua {label.toLowerCase()}
            </button>
            {values.length > 0 && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onChange([])}
                className="text-[11px] font-bold text-red-500 cursor-pointer hover:underline"
              >
                Hapus Pilihan ({values.length})
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
            {filteredOptions.map((option) => {
              const selected = values.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    onChange(
                      selected
                        ? values.filter((item) => item !== option)
                        : [...values, option]
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm cursor-pointer ${selected
                    ? "bg-teal-50/70 font-bold text-[#1E5C58]"
                    : "font-medium text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected
                        ? "border-[#2B7A75] bg-[#2B7A75]"
                        : "border-gray-300 bg-white"
                        }`}
                    >
                      {selected && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </span>
                    <span className="truncate">{option}</span>
                  </span>
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-4 text-xs text-center text-gray-400">
                {isLoading ? "Memuat data..." : "Data tidak ditemukan."}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50/50 px-3 py-2 text-[11px] font-medium text-gray-400">
            <span>
              {values.length === 0
                ? "Semua dipilih"
                : `${values.length} dari ${options.length} dipilih`}
            </span>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setOpen(false);
                setSearch("");
              }}
              className="font-bold text-[#2B7A75] cursor-pointer hover:underline"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SingleSelect({
  label,
  value,
  onChange,
  options,
  isLoading = false,
  placeholder = "Pilih anak...",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  isLoading?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <label className="mb-1.5 block text-xs font-bold text-gray-500">
        {label}
      </label>
      <div className="relative flex items-center rounded-xl border border-teal-100 bg-white px-4 py-2.5 pr-11 text-sm font-medium text-gray-700 shadow-sm focus-within:border-[#2B7A75] focus-within:ring-2 focus-within:ring-[#2B7A75]/20">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setSearch("");
            }
          }}
          placeholder={
            isLoading
              ? "Memuat data..."
              : open
                ? "Cari nama anak / no RM..."
                : placeholder
          }
          aria-label={`Pilih ${label.toLowerCase()}`}
          className="w-full p-0 text-sm bg-transparent outline-none placeholder:text-gray-400"
        />

        {value && !open && (
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
          onClick={() => {
            if (open) {
              setOpen(false);
              setSearch("");
            } else {
              setOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }
          }}
          className="absolute right-0 flex items-center h-full pr-3 cursor-pointer"
          aria-label={`${open ? "Tutup" : "Buka"} pilihan ${label.toLowerCase()}`}
        >
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 flex max-h-[250px] flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
            {filteredOptions.map((option) => {
              const isSelected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm cursor-pointer ${isSelected
                    ? "bg-teal-50/70 font-bold text-[#1E5C58]"
                    : "font-medium text-gray-700 hover:bg-gray-50"
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
                {isLoading ? "Memuat data..." : "Data tidak ditemukan."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUnduhSoapPage() {
  const [filterOptions, setFilterOptions] = useState<ExportFilterOptions | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [therapists, setTherapists] = useState<string[]>([]);
  const [therapies, setTherapies] = useState<string[]>([]);
  const [period, setPeriod] = useState<Period>("Bulanan");

  const [date, setDate] = useState(getTodayDateString());
  const [week, setWeek] = useState(getCurrentWeekString());
  const [month, setMonth] = useState(getCurrentMonthString());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    if (newPeriod === "Harian" && !date) {
      setDate(getTodayDateString());
    } else if (newPeriod === "Mingguan" && !week) {
      setWeek(getCurrentWeekString());
    } else if (newPeriod === "Bulanan" && !month) {
      setMonth(getCurrentMonthString());
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  // Fetch filter options and schedules on mount for 3-way cascading relations
  useEffect(() => {
    let isMounted = true;
    setIsLoadingOptions(true);

    Promise.all([
      getExportFilterOptions(),
      getSchedules({ per_page: 500 }).catch((err) => {
        console.error("Gagal memuat jadwal untuk relasi filter unduh SOAP:", err);
        return { items: [] };
      }),
    ])
      .then(([opts, schRes]) => {
        if (isMounted) {
          if (opts) {
            setFilterOptions(opts);
          }
          if (schRes && Array.isArray(schRes.items)) {
            setSchedules(schRes.items);
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Relasi Jadwal: Memetakan hubungan Anak <-> Jenis Terapi <-> Terapis
  const relations = useMemo(() => {
    const childTherapies = new Map<string, Set<string>>();
    const childTherapists = new Map<string, Set<string>>();
    const therapistChildren = new Map<string, Set<string>>();
    const therapyChildren = new Map<string, Set<string>>();

    schedules.forEach((sch) => {
      const cId = sch.child_id ? String(sch.child_id) : "";
      const tId = sch.therapist_id ? String(sch.therapist_id) : "";
      let type = sch.therapy_type ? String(sch.therapy_type).toLowerCase() : "";
      if (type.includes("okupasi")) type = "okupasi";
      else if (type.includes("wicara")) type = "wicara";
      else if (type.includes("paedagog") || type.includes("plb")) type = "paedagog";
      else if (type.includes("fisio")) type = "fisio";

      if (cId) {
        if (type) {
          if (!childTherapies.has(cId)) childTherapies.set(cId, new Set());
          childTherapies.get(cId)!.add(type);

          if (!therapyChildren.has(type)) therapyChildren.set(type, new Set());
          therapyChildren.get(type)!.add(cId);
        }
        if (tId) {
          if (!childTherapists.has(cId)) childTherapists.set(cId, new Set());
          childTherapists.get(cId)!.add(tId);

          if (!therapistChildren.has(tId)) therapistChildren.set(tId, new Set());
          therapistChildren.get(tId)!.add(cId);
        }
      }
    });

    return {
      childTherapies,
      childTherapists,
      therapistChildren,
      therapyChildren,
    };
  }, [schedules]);

  // Mapping options for Anak / Pasien (murni dari filterOptions dengan No RM)
  const { childOptions, childNameToId } = useMemo(() => {
    if (!filterOptions?.children?.length) {
      return { childOptions: [], childNameToId: {} };
    }

    const scheduleRmMap = new Map<string, string>();
    schedules.forEach((sch) => {
      const cId = sch.child_id ? String(sch.child_id) : "";
      const rm = sch.medical_record_number;
      if (cId && rm && rm !== "-" && !scheduleRmMap.has(cId)) {
        scheduleRmMap.set(cId, rm);
      }
    });

    const mapping: Record<string, string> = {};
    const options: string[] = [];
    filterOptions.children.forEach((c) => {
      const rm =
        c.medical_record_number ||
        (c as any).no_rm ||
        scheduleRmMap.get(String(c.id));

      const label = rm
        ? `${c.child_name} (${rm})`
        : `${c.child_name} (${c.medical_record_number || "-"})`;

      mapping[label] = c.id;
      mapping[c.child_name] = c.id;
      if (rm) {
        mapping[`${c.child_name} (${rm})`] = c.id;
      }
      options.push(label);
    });
    options.sort((a, b) => a.localeCompare("id-ID"));
    return { childOptions: options, childNameToId: mapping };
  }, [filterOptions, schedules]);

  // Mapping options for Terapis (includes lookup for therapy_type)
  const {
    therapistOptions,
    therapistNameToId,
    therapistNameToType,
    therapistNameToTypeLabel,
  } = useMemo(() => {
    if (!filterOptions?.therapists?.length) {
      return {
        therapistOptions: [],
        therapistNameToId: {},
        therapistNameToType: {},
        therapistNameToTypeLabel: {},
      };
    }
    const mappingId: Record<string, string> = {};
    const mappingType: Record<string, string> = {};
    const mappingTypeLabel: Record<string, string> = {};
    const options: string[] = [];

    filterOptions.therapists.forEach((t) => {
      const label = t.therapist_name;
      mappingId[label] = t.id;
      mappingType[label] = t.therapy_type;
      mappingTypeLabel[label] = t.therapy_type_label || "";
      options.push(label);
    });
    options.sort((a, b) => a.localeCompare("id-ID"));
    return {
      therapistOptions: options,
      therapistNameToId: mappingId,
      therapistNameToType: mappingType,
      therapistNameToTypeLabel: mappingTypeLabel,
    };
  }, [filterOptions]);

  // Mapping options for Jenis Terapi
  const { therapyOptions, therapyLabelToValue } = useMemo(() => {
    const list = filterOptions?.therapy_types?.length
      ? filterOptions.therapy_types
      : [
        { value: "okupasi", label: "Terapi Okupasi" },
        { value: "wicara", label: "Terapi Wicara" },
        { value: "paedagog", label: "Terapi Paedagogik" },
        { value: "fisio", label: "Terapi Fisio" },
      ];
    const mapping: Record<string, string> = {};
    const options: string[] = [];
    list.forEach((item) => {
      mapping[item.label] = item.value;
      mapping[item.value] = item.value;
      options.push(item.label);
    });
    return { therapyOptions: options, therapyLabelToValue: mapping };
  }, [filterOptions]);

  const availableChildOptions = useMemo(() => {
    if (!childOptions.length) return [];

    const hasTherapyFilter = therapies.length > 0;
    const hasTherapistFilter = therapists.length > 0;

    if (!hasTherapyFilter && !hasTherapistFilter) {
      return childOptions;
    }

    const selectedTherapyValues = therapies
      .map((th) => therapyLabelToValue[th])
      .filter(Boolean);
    const selectedTherapistIds = therapists
      .map((t) => therapistNameToId[t])
      .filter(Boolean);

    return childOptions.filter((childLabel) => {
      const cId = childNameToId[childLabel];
      if (!cId) return false;

      if (hasTherapyFilter) {
        const childTypes = relations.childTherapies.get(cId);
        if (childTypes && childTypes.size > 0) {
          const matchesTherapy = selectedTherapyValues.some((val) => childTypes.has(val));
          if (!matchesTherapy) return false;
        }
      }

      if (hasTherapistFilter) {
        const childTherapists = relations.childTherapists.get(cId);
        if (childTherapists && childTherapists.size > 0) {
          const matchesTherapist = selectedTherapistIds.some((tId) => childTherapists.has(tId));
          if (!matchesTherapist) return false;
        }
      }

      return true;
    });
  }, [
    childOptions,
    childNameToId,
    therapies,
    therapyLabelToValue,
    therapists,
    therapistNameToId,
    relations,
  ]);

  const availableTherapyOptions = useMemo(() => {
    if (!therapyOptions.length) return [];

    if (selectedChildren.length === 0) {
      return therapyOptions;
    }

    const allowedTypes = new Set<string>();
    selectedChildren.forEach((childLabel) => {
      const cId = childNameToId[childLabel];
      if (cId && relations.childTherapies.has(cId)) {
        relations.childTherapies.get(cId)!.forEach((t) => allowedTypes.add(t));
      }
    });

    if (allowedTypes.size === 0) {
      return therapyOptions;
    }

    return therapyOptions.filter((label) => {
      const val = therapyLabelToValue[label];
      return val && allowedTypes.has(val);
    });
  }, [therapyOptions, selectedChildren, childNameToId, relations, therapyLabelToValue]);

  const availableTherapistOptions = useMemo(() => {
    if (!therapistOptions.length) return [];

    let filtered = therapistOptions;

    if (therapies.length > 0) {
      const selectedTherapyValues = therapies
        .map((th) => therapyLabelToValue[th])
        .filter(Boolean);

      filtered = filtered.filter((thLabel) => {
        const thType = therapistNameToType[thLabel];
        return thType && selectedTherapyValues.includes(thType);
      });
    }

    if (selectedChildren.length > 0) {
      const allowedTherapists = new Set<string>();
      selectedChildren.forEach((childLabel) => {
        const cId = childNameToId[childLabel];
        if (cId && relations.childTherapists.has(cId)) {
          relations.childTherapists.get(cId)!.forEach((tId) => allowedTherapists.add(tId));
        }
      });

      if (allowedTherapists.size > 0) {
        filtered = filtered.filter((thLabel) => {
          const tId = therapistNameToId[thLabel];
          return tId && allowedTherapists.has(tId);
        });
      }
    }

    return filtered;
  }, [
    therapistOptions,
    therapies,
    therapyLabelToValue,
    therapistNameToType,
    selectedChildren,
    childNameToId,
    therapistNameToId,
    relations,
  ]);


  const handleChildrenChange = (newChildren: string[]) => {
    setSelectedChildren(newChildren);

    if (newChildren.length > 0) {
      const allAllowedTypes = new Set<string>();
      const allAllowedTherapists = new Set<string>();

      newChildren.forEach((childLabel) => {
        const cId = childNameToId[childLabel];
        if (cId) {
          relations.childTherapies.get(cId)?.forEach((t) => allAllowedTypes.add(t));
          relations.childTherapists.get(cId)?.forEach((tId) => allAllowedTherapists.add(tId));
        }
      });

      if (allAllowedTypes.size > 0 && therapies.length > 0) {
        setTherapies((current) =>
          current.filter((thLabel) => {
            const val = therapyLabelToValue[thLabel];
            return val && allAllowedTypes.has(val);
          })
        );
      }

      if (allAllowedTherapists.size > 0 && therapists.length > 0) {
        setTherapists((current) =>
          current.filter((thLabel) => {
            const tId = therapistNameToId[thLabel];
            return tId && allAllowedTherapists.has(tId);
          })
        );
      }
    }
  };

  const handleTherapiesChange = (newTherapies: string[]) => {
    setTherapies(newTherapies);

    if (newTherapies.length > 0) {
      const selectedTherapyValues = newTherapies
        .map((th) => therapyLabelToValue[th])
        .filter(Boolean);

      setTherapists((current) =>
        current.filter((thLabel) => {
          const thType = therapistNameToType[thLabel];
          return thType && selectedTherapyValues.includes(thType);
        })
      );

      if (selectedChildren.length > 0) {
        setSelectedChildren((current) =>
          current.filter((childLabel) => {
            const cId = childNameToId[childLabel];
            if (!cId || !relations.childTherapies.has(cId)) return true;
            const childTypes = relations.childTherapies.get(cId)!;
            if (childTypes.size === 0) return true;
            return selectedTherapyValues.some((v) => childTypes.has(v));
          })
        );
      }
    } else {
      // Jika filter jenis terapi dihapus semua isinya, maka filter terapis juga ikut terhapus
      setTherapists([]);
    }
  };

  const handleTherapistsChange = (newTherapists: string[]) => {
    setTherapists(newTherapists);

    if (newTherapists.length > 0) {
      const neededTherapyLabels = new Set<string>();
      newTherapists.forEach((thLabel) => {
        const typeLabel = therapistNameToTypeLabel[thLabel];
        if (typeLabel) {
          neededTherapyLabels.add(typeLabel);
        }
      });

      if (neededTherapyLabels.size > 0) {
        setTherapies(Array.from(neededTherapyLabels));
      }

      if (selectedChildren.length > 0) {
        const selectedTherapistIds = newTherapists
          .map((th) => therapistNameToId[th])
          .filter(Boolean);

        setSelectedChildren((current) =>
          current.filter((childLabel) => {
            const cId = childNameToId[childLabel];
            if (!cId || !relations.childTherapists.has(cId)) return true;
            const childTherapistIds = relations.childTherapists.get(cId)!;
            if (childTherapistIds.size === 0) return true;
            return selectedTherapistIds.some((tId) => childTherapistIds.has(tId));
          })
        );
      }
    } else {
      // Jika filter terapis dihapus semua isinya, maka filter jenis terapi juga ikut terhapus
      setTherapies([]);
    }
  };

  const reset = () => {
    setSelectedChildren([]);
    setTherapists([]);
    setTherapies([]);
    setPeriod("Bulanan");
    setDate(getTodayDateString());
    setWeek(getCurrentWeekString());
    setMonth(getCurrentMonthString());
    setFrom("");
    setTo("");
  };

  const canExport = selectedChildren.length > 0 || therapists.length > 0;

  const handleExportPdf = async () => {
    if (isExporting) return;
    if (!canExport) {
      showErrorToast("Silakan pilih anak atau terapis terlebih dahulu untuk mengunduh PDF.");
      return;
    }
    setIsExporting(true);

    try {
      const apiFilters: ExportTherapySoapFilters = {};

      // Filter by child_id
      if (selectedChildren.length === 1) {
        const selectedChildId = childNameToId[selectedChildren[0]];
        if (selectedChildId) {
          apiFilters.child_id = selectedChildId;
        }
      } else if (selectedChildren.length > 1) {
        const selectedChildIds = selectedChildren
          .map((c) => childNameToId[c])
          .filter(Boolean);
        if (selectedChildIds.length > 0) {
          apiFilters.child_id = selectedChildIds;
        }
      }

      // Filter by therapist_id
      if (therapists.length === 1) {
        const thId = therapistNameToId[therapists[0]];
        if (thId) {
          apiFilters.therapist_id = thId;
        }
      } else if (therapists.length > 1) {
        const thIds = therapists.map((t) => therapistNameToId[t]).filter(Boolean);
        if (thIds.length > 0) {
          apiFilters.therapist_id = thIds.join(",");
        }
      }

      // Filter by therapy_type (if 1 therapy type selected)
      if (therapies.length === 1) {
        const thType = therapyLabelToValue[therapies[0]];
        if (thType) {
          apiFilters.therapy_type = thType;
        }
      }

      // Filter by period
      if (period === "Harian") {
        apiFilters.period_type = "daily";
        if (date) apiFilters.date = date;
      } else if (period === "Mingguan") {
        apiFilters.period_type = "weekly";
        if (week) {
          const parts = week.split("-W");
          if (parts.length === 2) {
            apiFilters.year = parseInt(parts[0], 10);
            apiFilters.week = parseInt(parts[1], 10);
          }
        }
      } else if (period === "Bulanan") {
        apiFilters.period_type = "monthly";
        if (month) {
          const parts = month.split("-");
          if (parts.length === 2) {
            apiFilters.year = parseInt(parts[0], 10);
            apiFilters.month = parseInt(parts[1], 10);
          }
        }
      } else if (period === "Custom") {
        apiFilters.period_type = "custom";
        if (from) apiFilters.date_from = from;
        if (to) apiFilters.date_to = to;
      }

      const res = await downloadExportTherapySoapPdf(apiFilters);
      if (res.success) {
        showSuccessToast(
          "Laporan SOAP PDF berhasil diunduh!",
          "Berhasil Unduh"
        );
      } else {
        showErrorToast(res.error || "Gagal mengunduh laporan PDF.");
      }
    } catch (err: any) {
      showErrorToast(
        err?.message || "Terjadi kesalahan saat mengunduh laporan PDF."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const periodLabel =
    period === "Harian"
      ? date
      : period === "Bulanan"
        ? month
        : period === "Custom"
          ? `${from || "..."} - ${to || "..."}`
          : week;

  const activeFilters = [
    ...selectedChildren.map((item) => ({
      label: `Anak: ${item}`,
      remove: () => {
        const updated = selectedChildren.filter((value) => value !== item);
        handleChildrenChange(updated);
      },
    })),
    ...therapies.map((item) => ({
      label: `Jenis: ${item}`,
      remove: () => {
        const updated = therapies.filter((value) => value !== item);
        handleTherapiesChange(updated);
      },
    })),
    ...therapists.map((item) => ({
      label: `Terapis: ${item}`,
      remove: () => {
        const updated = therapists.filter((value) => value !== item);
        handleTherapistsChange(updated);
      },
    })),
    ...(periodLabel
      ? [
        {
          label: `Periode: ${periodLabel}`,
          remove: () => {
            setDate("");
            setWeek("");
            setMonth("");
            setFrom("");
            setTo("");
          },
        },
      ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#F8FBFB] p-5 text-[#1E5C58] sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <ArchiveRestore className="h-7 w-7" />
            <span>Unduh Rekap SOAP Terapi</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Pilih anak, terapis, dan periode untuk mengunduh rekap catatan SOAP
            terapi.
          </p>
        </div>
      </div>

      {/* Main Filter Card */}
      <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-teal-50">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MultiSelect
              label="Anak / Pasien"
              values={selectedChildren}
              options={availableChildOptions}
              onChange={handleChildrenChange}
              isLoading={isLoadingOptions}
              placeholder={
                therapies.length > 0 || therapists.length > 0
                  ? `Pilih anak (${availableChildOptions.length} tersedia)...`
                  : "Pilih anak / pasien..."
              }
            />
            <MultiSelect
              label="Jenis Terapi"
              values={therapies}
              options={availableTherapyOptions}
              onChange={handleTherapiesChange}
              isLoading={isLoadingOptions}
              placeholder={
                selectedChildren.length === 1
                  ? `Terapi ${selectedChildren[0].split(" ")[0]}...`
                  : undefined
              }
            />
            <MultiSelect
              label="Terapis"
              values={therapists}
              options={availableTherapistOptions}
              onChange={handleTherapistsChange}
              isLoading={isLoadingOptions}
              placeholder={
                selectedChildren.length === 1
                  ? `Terapis ${selectedChildren[0].split(" ")[0]}...`
                  : therapies.length > 0
                    ? `Terapis ${therapies.join(", ")}...`
                    : undefined
              }
            />
          </div>

          <div>
            <p className="mb-3 text-xs font-extrabold tracking-wider text-gray-400 uppercase">
              Periode
            </p>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex overflow-x-auto rounded-xl border border-teal-50 bg-[#F4F9F8] p-1">
                {(["Harian", "Mingguan", "Bulanan", "Custom"] as Period[]).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePeriodChange(item)}
                      className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${period === item
                        ? "bg-[#1E5C58] text-white shadow-sm"
                        : "text-gray-400 hover:text-[#2B7A75]"
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <div className="flex-1">
                {period === "Harian" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm outline-none focus:border-[#2B7A75] focus:ring-2 focus:ring-[#2B7A75]/20 bg-white"
                    />
                  </div>
                )}
                {period === "Mingguan" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                      Minggu
                    </label>
                    <input
                      type="week"
                      value={week}
                      onChange={(event) => setWeek(event.target.value)}
                      className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm outline-none focus:border-[#2B7A75] focus:ring-2 focus:ring-[#2B7A75]/20 bg-white"
                    />
                  </div>
                )}
                {period === "Bulanan" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                      Bulan
                    </label>
                    <input
                      type="month"
                      value={month}
                      onChange={(event) => setMonth(event.target.value)}
                      className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm outline-none focus:border-[#2B7A75] focus:ring-2 focus:ring-[#2B7A75]/20 bg-white"
                    />
                  </div>
                )}
                {period === "Custom" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                        Dari
                      </label>
                      <input
                        type="date"
                        value={from}
                        max={to || undefined}
                        onChange={(event) => setFrom(event.target.value)}
                        className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm outline-none focus:border-[#2B7A75] focus:ring-2 focus:ring-[#2B7A75]/20 bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                        Sampai
                      </label>
                      <input
                        type="date"
                        value={to}
                        min={from || undefined}
                        onChange={(event) => setTo(event.target.value)}
                        className="w-full rounded-xl border border-teal-100 px-4 py-2.5 text-sm outline-none focus:border-[#2B7A75] focus:ring-2 focus:ring-[#2B7A75]/20 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        <div className="flex flex-col justify-between gap-3 px-6 py-3 border-t border-gray-100 bg-gray-50/40 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="mr-1 text-sm font-bold text-gray-400">Aktif:</span>
            {activeFilters.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50 pl-3 pr-1.5 py-1 font-bold text-[#1E5C58]"
              >
                {item.label}
                <button
                  type="button"
                  onClick={item.remove}
                  aria-label={`Hapus filter ${item.label}`}
                  className="rounded-full p-0.5 hover:bg-teal-100 cursor-pointer text-[#2B7A75]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {activeFilters.length === 0 && (
              <span className="text-sm font-medium text-gray-400">
                Belum ada filter
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={reset}
            className="self-start text-sm font-bold text-red-500 cursor-pointer hover:underline sm:self-auto"
          >
            Reset
          </button>
        </div>

        {/* Action / Export PDF Bar */}
        <div className="flex flex-col justify-between gap-3 border-t border-gray-100 bg-[#F4F9F8]/50 px-6 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold text-gray-500">
              Mengekspor data SOAP mencakup kolom:{" "}
              <b className="text-[#1E5C58]">S, O, A, P.</b>
            </p>
            {!canExport && (
              <p className="text-[11px] font-bold text-amber-600 mt-1">
                * Pilih anak atau terapis terlebih dahulu untuk mengunduh laporan PDF.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting || !canExport}
              title={
                canExport
                  ? "Unduh rekap catatan SOAP dalam format PDF"
                  : "Pilih anak atau terapis terlebih dahulu"
              }
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-5 py-2.5 text-sm font-bold text-[#1E5C58] hover:bg-teal-50 shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#1E5C58]" />
                  <span>Mengekspor...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Section (Disabled / Pending State) */}
        <div className="border-t border-gray-100 bg-gray-50/20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-extrabold text-[#1E5C58]">
                Preview (10 baris pertama)
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                <Clock className="w-3 h-3 text-amber-600" />
                Pending
              </span>
            </div>
            <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-500">
              Pratinjau Dinonaktifkan
            </span>
          </div>

          <div className="overflow-x-auto opacity-70">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-teal-50 bg-[#F4F9F8]">
                  {["Anak", "Jenis Terapi", "Terapis", "Tanggal", "Jam", "Diagnosis"].map(
                    (title) => (
                      <th
                        key={title}
                        className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[#1E5C58]"
                      >
                        {title}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center bg-gray-50/40">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto text-gray-500">
                      <div className="flex items-center justify-center w-10 h-10 border rounded-full bg-amber-50 border-amber-200 text-amber-700">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-sm font-bold text-gray-700">
                        Pratinjau Data Sesi Ditunda (Pending)
                      </p>
                      <p className="text-xs leading-relaxed text-gray-500">
                        Tabel pratinjau dinonaktifkan sementara menunggu akses endpoint sesi terapi untuk akun Administrator. Anda tetap dapat langsung mengekspor berkas rekap SOAP lengkap sesuai filter di atas melalui tombol{" "}
                        <span className="font-bold text-[#1E5C58]">Export PDF</span>.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
