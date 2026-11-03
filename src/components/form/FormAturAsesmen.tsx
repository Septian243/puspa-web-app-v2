"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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

export interface PetugasOption {
  id?: string | number;
  name: string;
}

interface FormAturAsesmenProps {
  onClose: () => void;
  onSave?: (
    date: string,
    time: string,
    petugas?: string,
    petugasId?: string | number
  ) => void | Promise<void>;
  initialDate?: string;
  initialTime?: string;
  initialPetugas?: string;
  petugasList?: PetugasOption[];
  pasienName?: string;
  title?: string;
}

export default function FormAturAsesmen({
  onClose,
  onSave,
  initialDate = "",
  initialTime = "",
  initialPetugas = "",
  petugasList,
  pasienName,
  title,
}: FormAturAsesmenProps) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);

  // State untuk Petugas
  const [selectedPetugas, setSelectedPetugas] = useState<PetugasOption | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialPetugas || "");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<PetugasOption[]>(
    petugasList && petugasList.length > 0 ? petugasList : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPetugas, setIsLoadingPetugas] = useState(false);

  // Tutup dropdown saat klik di luar
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Ambil daftar petugas dari backend
  useEffect(() => {
    if (petugasList && petugasList.length > 0) {
      setOptions(petugasList);
      return;
    }

    let isMounted = true;
    async function fetchPetugas() {
      setIsLoadingPetugas(true);
      try {
        const res = await getTherapists();
        if (isMounted && Array.isArray(res) && res.length > 0) {
          const mapped: PetugasOption[] = res
            .map((t: { therapist_id?: string; id?: string; therapist_name?: string; name?: string }) => ({
              id: t.therapist_id || t.id,
              name: t.therapist_name || t.name || "",
            }))
            .filter((t: { name: string }) => Boolean(t.name));

          setOptions(mapped);
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

  // Sinkronisasi data awal saat edit jadwal
  useEffect(() => {
    setDate(initialDate);
    setTime(initialTime);
    if (initialPetugas) {
      setSearchTerm(initialPetugas);
      const matched = options.find(
        (o) => o.name.toLowerCase() === initialPetugas.toLowerCase()
      );
      if (matched) {
        setSelectedPetugas(matched);
      } else {
        setSelectedPetugas({ id: "", name: initialPetugas });
      }
    } else {
      setSearchTerm("");
      setSelectedPetugas(null);
    }
    setIsSearching(false);
  }, [initialDate, initialTime, initialPetugas, options]);

  // Filter opsi secara real-time saat pengguna mengetik
  const filteredOptions = useMemo(() => {
    // Jika tidak sedang mengetik pencarian (misal klik chevron untuk scroll semua) atau search term kosong
    if (!isSearching || !searchTerm.trim()) {
      return options;
    }

    const query = searchTerm.trim().toLowerCase();
    const matches = options.filter((opt) =>
      opt.name.toLowerCase().includes(query)
    );

    // Prioritaskan nama yang diawali kata kunci yang diketik
    return matches.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(query);
      const bStarts = b.name.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [options, searchTerm, isSearching]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;

    if (!date || !time) {
      handleApiError(null, "Tanggal dan Waktu tidak boleh kosong!");
      return;
    }

    const finalName = selectedPetugas?.name || searchTerm.trim();
    if (!finalName) {
      handleApiError(null, "Petugas tidak boleh kosong!");
      return;
    }

    setIsSubmitting(true);
    try {
      const matched =
        selectedPetugas ||
        options.find(
          (o) => o.name.toLowerCase() === finalName.toLowerCase()
        );
      await onSave(date, time, finalName, matched?.id);
      onClose();
    } catch (err) {
      console.error("onSave error:", err);
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
            <div className="space-y-4">
              {/* Field Tanggal */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#2B7A75]" /> Tanggal
                  Pelaksanaan
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] outline-none transition-all font-medium text-gray-700"
                />
              </div>

              {/* Field Waktu */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#2B7A75]" /> Waktu (Jam)
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] outline-none transition-all font-medium text-gray-700"
                />
              </div>

              {/* Field Petugas (Kosong Awal, Dropdown ke Bawah, Scrollable, Searchable Real-time) */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#2B7A75]" /> Petugas
                </label>
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
                        (opt) => opt.name.toLowerCase() === val.trim().toLowerCase()
                      );
                      setSelectedPetugas(directMatch || null);
                    }}
                    onClick={() => {
                      setIsOpen(true);
                    }}
                    onFocus={() => {
                      setIsOpen(true);
                    }}
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

                  {/* Actions kanan (Clear button + Chevron down) */}
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
                          if (next) {
                            setIsSearching(false);
                          }
                          return next;
                        });
                      }}
                      className="cursor-pointer p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      tabIndex={-1}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#2B7A75]" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dropdown Menu di Bawah & Scrollable */}
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
                              opt.name.toLowerCase() === selectedPetugas?.name.toLowerCase();
                            return (
                              <div
                                key={opt.id || opt.name}
                                onClick={() => {
                                  setSelectedPetugas(opt);
                                  setSearchTerm(opt.name);
                                  setIsSearching(false);
                                  setIsOpen(false);
                                }}
                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between font-medium ${
                                  isSelected
                                    ? "bg-teal-50 text-[#1E5C58] font-bold"
                                    : "text-gray-700 hover:bg-[#F4F9F8] hover:text-[#2B7A75]"
                                }`}
                              >
                                <span className="truncate">{opt.name}</span>
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
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end mt-8 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm shadow-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
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
