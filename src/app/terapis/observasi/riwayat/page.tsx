/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Settings, 
  Clock, 
  Eye, 
  Search, 
  Calendar, 
  ClipboardList 
} from "lucide-react";
import { getObservations } from "@/lib/api/observasiSubmit";
import { handleApiError } from "@/lib/api-error";
import { useTherapistProfile } from "@/context/ProfileTerapisContext";

// ==================== Interface ====================
interface Anak {
  observation_id: string;
  nama: string;
  orangTua: string;
  telepon: string;
  observer: string;
  therapist_id?: string | null;
  kategoriUsia: string;
  tglObservasi: string;
  waktu: string;
  child_age: string;
}

// ==================== Parsing usia & Kategori ====================
function parseAgeYears(childAge?: string): number | null {
  if (!childAge) return null;
  const match = childAge.match(/(\d+)\s*Tahun/i);
  if (match) return parseInt(match[1], 10);
  const num = parseInt(childAge, 10);
  return isNaN(num) ? null : num;
}

const matchRiwayatCategory = (d: Anak, categoryIdx: number): boolean => {
  const cat = String(d.kategoriUsia || "").toLowerCase().trim();
  const years = parseAgeYears(d.child_age);

  switch (categoryIdx) {
    case 0: // Usia 0-5 Tahun (Balita)
      if (cat === "balita") return true;
      if (years !== null) return years >= 0 && years <= 5;
      return false;
    case 1: // Usia 6-12 Tahun (Anak-anak)
      if (cat === "anak-anak" || cat === "anak") return true;
      if (years !== null) return years >= 6 && years <= 12;
      return false;
    case 2: // Usia 13-17 Tahun (Remaja)
      if (cat === "remaja") return true;
      if (years !== null) return years >= 13 && years <= 17;
      return false;
    case 3: // Usia 17+ Tahun (Lainnya)
      if (cat === "lainya" || cat === "lainnya" || cat === "dewasa") return true;
      if (years !== null) return years > 17;
      return false;
    default:
      return false;
  }
};

const kategoriTitles = [
  "Usia 0–5 Tahun",
  "Usia 6–12 Tahun",
  "Usia 13–17 Tahun",
  "Usia 17+ Tahun",
];

// ==================== Komponen Utama ====================
export default function RiwayatObservasiPage() {
  const router = useRouter();
  const { profile } = useTherapistProfile();

  const [activeKategori, setActiveKategori] = useState(0);
  const [data, setData] = useState<Anak[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  // Filter
  const [searchName, setSearchName] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // ==================== Fetch Data ====================
  const fetchObservasi = async () => {
    try {
      setLoading(true);

      const result = await getObservations("completed");

      const mapped: Anak[] =
        result?.map((item: any) => {
          const [dd, mm, yyyy] = item.scheduled_date?.split("/") || ["-", "-", "-"];
          const tglObservasi = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;

          return {
            observation_id: item.observation_id?.toString() || "-",
            nama: item.child_name || "-",
            orangTua: item.guardian_name || "-",
            telepon: item.guardian_phone || "-",
            observer: item.observer || "-",
            therapist_id: item.therapist_id?.toString() || null,
            kategoriUsia: item.age_category || "-",
            child_age: item.child_age || "-",
            tglObservasi,
            waktu: item.time || "-",
          };
        }) || [];

      setData(mapped);
    } catch (err) {
      console.error(err);
      handleApiError(err, "Gagal mengambil riwayat observasi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservasi();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdown(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const isProfileLoading = !profile?.therapist_id;
  const isPageLoading = loading || isProfileLoading;

  const handleCategoryChange = (idx: number) => {
    if (idx === activeKategori) return;
    setActiveKategori(idx);
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [searchName, filterDate]);

  // ==================== Filtering ====================
  const filtered = useMemo(() => {
    if (!profile?.therapist_id) return [];
    return data
      .filter((d) => Boolean(d.therapist_id && String(d.therapist_id) === String(profile.therapist_id)))
      .filter((d) => matchRiwayatCategory(d, activeKategori))
      .filter((d) => (searchName ? d.nama.toLowerCase().includes(searchName.toLowerCase()) : true))
      .filter((d) => (filterDate ? d.tglObservasi === filterDate : true));
  }, [data, activeKategori, searchName, filterDate, profile?.therapist_id]);

  // ==================== Pagination Logic ====================
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const handleRiwayatJawaban = (id: string) => {
    router.push(`/terapis/riwayat-hasil?id=${id}`);
  };

  const handleLihatHasil = (id: string) => {
    router.push(`/terapis/hasil-observasi?id=${id}`);
  };

  // ==================== UI ====================
  return (
    <div className="p-6 md:p-8 space-y-8 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">
      {/* ================= SEARCH, FILTER & ACTION ================= */}
      <div className="flex flex-col items-start justify-between w-full gap-4 md:flex-row md:items-center">
        <div className="flex flex-col items-center w-full gap-4 sm:flex-row md:w-auto">
          {/* Calendar Input */}
          <div className="relative w-full sm:w-64">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#81B7A9]" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-[0_2px_8px_rgba(30,92,88,0.02)] hover:border-teal-200 transition-colors"
            />
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#81B7A9]" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Cari nama anak atau nama orang tua..."
              className="w-full pl-10 pr-4 py-2.5 border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-[0_2px_8px_rgba(30,92,88,0.02)] hover:border-teal-200 transition-colors"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => router.push("/terapis/observasi")}
          className="cursor-pointer inline-flex items-center gap-2 bg-[#1E5C58] hover:bg-[#2E8B83] text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all duration-300 shadow-sm shrink-0 w-full md:w-auto justify-center md:justify-start"
        >
          <span>Kembali</span>
        </button>
      </div>

      {/* ================= CATEGORY NAVIGATION ================= */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#EAF4F2]/50 border border-teal-50/50 rounded-xl w-fit">
        {kategoriTitles.map((title, idx) => {
          const isActive = activeKategori === idx;
          return (
            <button
              key={idx}
              onClick={() => handleCategoryChange(idx)}
              className={`cursor-pointer px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-[#1E5C58] text-white shadow-sm"
                  : "text-[#1E5C58]/80 hover:bg-white/60 hover:text-[#1E5C58]"
              }`}
            >
              {title}
            </button>
          );
        })}
      </div>

      {/* ================= TABLE LIST ================= */}
      {isPageLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-[#81B7A9] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Memuat riwayat observasi...</span>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            key={`${activeKategori}|${filterDate}|${searchName}|${page}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl p-6 md:p-8 border border-teal-50/60 shadow-[0_4px_24px_rgba(30,92,88,0.03)] hover:shadow-[0_8px_32px_rgba(30,92,88,0.06)] transition-shadow duration-300"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="font-semibold text-gray-400 border-b border-gray-100">
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Nama Anak</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Orang Tua</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase">Telepon</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Observer</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase">Waktu</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((d, index) => (
                      <tr key={d.observation_id ?? `row-${index}`} className="hover:bg-[#EAF4F2]/20 transition-colors">
                        <td className="px-4 py-4 font-bold text-gray-700">{d.nama}</td>
                        <td className="px-4 py-4 font-medium text-gray-600">{d.orangTua}</td>
                        <td className="px-4 py-4 font-mono text-xs text-center text-gray-600">{d.telepon}</td>
                        <td className="px-4 py-4 font-medium text-gray-600">{d.observer}</td>
                        <td className="px-4 py-4 font-medium text-center text-gray-500">{d.tglObservasi}</td>
                        <td className="px-4 py-4 font-medium text-center text-gray-500">{d.waktu}</td>
                        <td className="relative px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setOpenDropdown(openDropdown === d.observation_id ? null : d.observation_id);
                              setDropdownPosition({
                                top: rect.bottom + 6 + window.scrollY,
                                left: rect.left - 120 + window.scrollX,
                              });
                            }}
                            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-100 rounded-lg text-[#1E5C58] hover:bg-teal-50/40 text-xs font-semibold transition-colors"
                          >
                            <Settings size={14} />
                            <span>Aksi</span>
                            <ChevronDown size={12} />
                          </button>

                          {openDropdown === d.observation_id && dropdownPosition && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="fixed z-[9999] mt-2 w-48 rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-teal-50/80 overflow-hidden py-1 text-[#1E5C58]"
                              style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                              }}
                            >
                              <button
                                onClick={() => handleRiwayatJawaban(d.observation_id)}
                                className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                              >
                                <Clock size={16} className="mr-2 text-[#81B7A9]" />
                                Riwayat Jawaban
                              </button>

                              <button
                                onClick={() => handleLihatHasil(d.observation_id)}
                                className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                              >
                                <Eye size={16} className="mr-2 text-[#81B7A9]" />
                                Lihat Hasil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList className="w-8 h-8 text-gray-300" />
                          <span className="text-sm font-medium">Tidak ada data riwayat observasi</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ================= PAGINATION ================= */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    page === 1
                      ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                      : "bg-white border-teal-100 hover:bg-teal-50/20 text-[#1E5C58]"
                  }`}
                >
                  Sebelumnya
                </button>
                <span className="text-xs font-bold text-gray-500">
                  Halaman {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    page === totalPages
                      ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                      : "bg-white border-teal-100 hover:bg-teal-50/20 text-[#1E5C58]"
                  }`}
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
