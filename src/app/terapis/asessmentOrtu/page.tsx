/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Search,
  Calendar,
  ClipboardList,
  Settings
} from "lucide-react";
import { getPendingParents, getCompletedParents } from "@/lib/api/asesmentParent";

type StatusFilter = "Terjadwal" | "Selesai";

interface Patient {
  assessment_id: number;
  child_name: string;
  guardian_name: string;
  guardian_phone: string;
  types: string[] | string;
  admin_name: string;
  scheduled_date?: string;
  scheduled_time?: string;
  parent_completed_time?: string;
}

export default function AssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const [activeFilter, setActiveFilter] = useState<StatusFilter>(
    statusParam === "Selesai" ? "Selesai" : "Terjadwal"
  );

  useEffect(() => {
    if (statusParam === "Selesai") {
      setActiveFilter("Selesai");
    } else if (statusParam === "Terjadwal") {
      setActiveFilter("Terjadwal");
    }
  }, [statusParam]);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const [searchName, setSearchName] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    try {
      const data =
        activeFilter === "Terjadwal"
          ? await getPendingParents(dateFilter, searchName)
          : await getCompletedParents(dateFilter, searchName);
      setPatients(data || []);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData();
      setPage(1);
    }, 300);
    return () => clearTimeout(delay);
  }, [activeFilter, searchName, dateFilter]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdownIndex(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(patients.length / itemsPerPage);
  const paginatedData = patients.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const handleNext = () => page < totalPages && setPage(page + 1);
  const handlePrev = () => page > 1 && setPage(page - 1);

  return (
    <div className="p-6 md:p-8 space-y-8 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">

      {/* ================= FILTERS ================= */}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative w-full sm:w-64">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#81B7A9]" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-[0_2px_8px_rgba(30,92,88,0.02)] hover:border-teal-200 transition-colors"
          />
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#81B7A9]" />
          <input
            type="text"
            placeholder="Cari nama pasien..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-[0_2px_8px_rgba(30,92,88,0.02)] hover:border-teal-200 transition-colors"
          />
        </div>
      </div>

      {/* ================= STATUS FILTER ================= */}
      <div className="flex border-b border-teal-100/50">
        {(["Terjadwal", "Selesai"] as StatusFilter[]).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setOpenDropdownIndex(null);
              }}
              className={`cursor-pointer pb-3 px-6 text-sm font-bold transition-all relative ${isActive ? "text-[#1E5C58]" : "text-gray-400 hover:text-gray-600"
                }`}
            >
              <span>{filter === "Terjadwal" ? "Belum Selesai" : "Selesai"}</span>
              {isActive && (
                <motion.div
                  layoutId="activeStatusLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E5C58]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TABLE LIST ================= */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-[#81B7A9] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Memuat data asesmen...</span>
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-teal-50/60 shadow-[0_4px_24px_rgba(30,92,88,0.03)] flex flex-col items-center justify-center gap-3 text-gray-400">
          <ClipboardList className="w-10 h-10 text-gray-300" />
          <span className="text-sm font-medium">Tidak ada data asesmen</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeFilter}|${dateFilter}|${searchName}|${page}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 md:p-8 border border-teal-50/60 shadow-[0_4px_24px_rgba(30,92,88,0.03)] hover:shadow-[0_8px_32px_rgba(30,92,88,0.06)] transition-shadow duration-300"
          >
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="font-semibold text-gray-400 border-b border-gray-100">
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Nama Pasien</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Nama Orangtua</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase">Telepon</th>
                    <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider min-w-[220px]">Tipe Assessment</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left uppercase">Administrator</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase">Waktu</th>
                    <th className={`py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider ${activeFilter === "Terjadwal" ? "hidden" : ""}`}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((row, index) => (
                    <tr key={row.assessment_id} className="hover:bg-[#EAF4F2]/20 transition-colors">
                      <td className="px-4 py-4 font-bold text-gray-700">{row.child_name}</td>
                      <td className="px-4 py-4 font-medium text-gray-600">{row.guardian_name}</td>
                      <td className="px-4 py-4 font-mono text-xs text-center text-gray-600">{row.guardian_phone}</td>
                      <td className="px-4 py-4 font-medium text-gray-600">
                        {Array.isArray(row.types) ? (
                          row.types.map((type: string, i: number) => (
                            <div key={i} className="leading-relaxed flex items-center gap-1.5 text-xs text-[#1E5C58] bg-teal-50/50 px-2 py-0.5 rounded-md w-fit mb-1 font-semibold border border-teal-100/30">
                              <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                              {type}
                            </div>
                          ))
                        ) : typeof row.types === "string" ? (
                          row.types.split(",").map((type: string, i: number) => (
                            <div key={i} className="leading-relaxed flex items-center gap-1.5 text-xs text-[#1E5C58] bg-teal-50/50 px-2 py-0.5 rounded-md w-fit mb-1 font-semibold border border-teal-100/30">
                              <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                              {type.trim()}
                            </div>
                          ))
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-600">{row.admin_name}</td>
                      <td className="px-4 py-4 font-medium text-center text-gray-500">{row.scheduled_date}</td>
                      <td className="px-4 py-4 font-medium text-center text-gray-500">
                        {activeFilter === "Selesai"
                          ? row.parent_completed_time ?? "-"
                          : row.scheduled_time ?? "-"}
                      </td>
                      <td className={`py-4 px-4 text-center relative ${activeFilter === "Terjadwal" ? "hidden" : ""}`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setOpenDropdownIndex(openDropdownIndex === index ? null : index);
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

                        {openDropdownIndex === index && dropdownPosition && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="fixed z-[9999] mt-2 w-56 rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-teal-50/80 overflow-hidden py-1 text-[#1E5C58]"
                            style={{
                              top: dropdownPosition.top,
                              left: dropdownPosition.left,
                            }}
                          >
                            {[
                              { label: "Data Umum", route: "umumRiwayat", type: "umum_parent" },
                              { label: "Data Fisioterapi", route: "fisioterapiRiwayat", type: "fisio_parent" },
                              { label: "Data Terapi Okupasi", route: "okupasiRiwayat", type: "okupasi_parent" },
                              { label: "Data Terapi Wicara", route: "wicaraRiwayat", type: "wicara_parent" },
                              { label: "Data Paedagog", route: "paedagogRiwayat", type: "paedagog_parent" },
                            ].map((item, i) => (
                              <button
                                key={i}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                                onClick={() => {
                                  setOpenDropdownIndex(null);
                                  router.push(
                                    `/terapis/riwayat/${item.route}?assessment_id=${row.assessment_id}&type=${item.type}`
                                  );
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block space-y-4 lg:hidden">
              {paginatedData.map((row, index) => (
                <div
                  key={row.assessment_id}
                  className="bg-[#F4F9F8]/40 border border-teal-50 rounded-2xl p-4 space-y-3 shadow-xs text-left"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#1E5C58]">{row.child_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Wali: {row.guardian_name}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Array.isArray(row.types) ? (
                      row.types.map((type: string, i: number) => (
                        <span key={i} className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50/50 text-[#1E5C58] border border-teal-100/30">
                          {type}
                        </span>
                      ))
                    ) : typeof row.types === "string" ? (
                      row.types.split(",").map((type: string, i: number) => (
                        <span key={i} className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50/50 text-[#1E5C58] border border-teal-100/30">
                          {type.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-medium text-gray-500 border-t border-teal-50/50">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">WhatsApp</span>
                      <span className="font-mono text-gray-600">{row.guardian_phone || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Administrator</span>
                      <span className="text-gray-600">{row.admin_name || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Tanggal</span>
                      <span>{row.scheduled_date || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Waktu</span>
                      <span>
                        {activeFilter === "Selesai"
                          ? row.parent_completed_time ?? "-"
                          : row.scheduled_time ?? "-"}
                      </span>
                    </div>
                  </div>

                  {activeFilter === "Selesai" && (
                    <div className="pt-3 space-y-2 border-t border-teal-50/50">
                      <button
                        onClick={() => setExpandedCardId(expandedCardId === row.assessment_id ? null : row.assessment_id)}
                        className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-teal-100 rounded-lg text-[#1E5C58] bg-white hover:bg-teal-50/20 text-xs font-semibold transition-colors"
                      >
                        <Settings size={14} />
                        <span>{expandedCardId === row.assessment_id ? "Tutup Menu Aksi" : "Pilih Menu Aksi"}</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${expandedCardId === row.assessment_id ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {expandedCardId === row.assessment_id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-2 space-y-1 overflow-hidden bg-white border border-teal-50/60 rounded-xl"
                          >
                            {[
                              { label: "Data Umum", route: "umumRiwayat", type: "umum_parent" },
                              { label: "Data Fisioterapi", route: "fisioterapiRiwayat", type: "fisio_parent" },
                              { label: "Data Terapi Okupasi", route: "okupasiRiwayat", type: "okupasi_parent" },
                              { label: "Data Terapi Wicara", route: "wicaraRiwayat", type: "wicara_parent" },
                              { label: "Data Paedagog", route: "paedagogRiwayat", type: "paedagog_parent" },
                            ].map((item, i) => (
                              <button
                                key={i}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-[#F4F9F8] hover:text-[#1E5C58] rounded-lg transition-colors"
                                onClick={() => {
                                  setExpandedCardId(null);
                                  router.push(
                                    `/terapis/riwayat/${item.route}?assessment_id=${row.assessment_id}&type=${item.type}`
                                  );
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ================= PAGINATION ================= */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4 mt-6 border-t border-gray-100">
                <button
                  disabled={page === 1}
                  onClick={handlePrev}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${page === 1
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
                  disabled={page === totalPages || totalPages === 0}
                  onClick={handleNext}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${page === totalPages || totalPages === 0
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
