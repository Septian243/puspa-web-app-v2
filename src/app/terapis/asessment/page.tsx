/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, Suspense, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Play, 
  Clock, 
  Search, 
  Calendar, 
  ClipboardList, 
  Settings 
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAssessments } from "@/lib/api/asesment";
import { useTherapistProfile } from "@/context/ProfileTerapisContext";

// --- INTERFACES ---
type TerapiTab =
  | "PLB (Paedagog)"
  | "Terapi Okupasi"
  | "Terapi Wicara"
  | "Fisioterapi";

type StatusFilter = "Terjadwal" | "Selesai";
type ScheduleScope = "mine" | "all";

const mapSectionToTab = (section?: string): TerapiTab => {
  switch ((section || "").toLowerCase()) {
    case "okupasi":
      return "Terapi Okupasi";
    case "wicara":
      return "Terapi Wicara";
    case "fisio":
      return "Fisioterapi";
    default:
      return "PLB (Paedagog)";
  }
};

interface Assessment {
  id: number;
  assessment_id: number;
  child_id: string;
  child_name: string;
  guardian_name: string;
  guardian_phone: string;
  type: string;
  administrator: string;
  assessor: string | null;
  therapist_id?: string | null;
  scheduled_date?: string;
  scheduled_time?: string;
  completed_at?: string; 
  status: string;
}

// --- KOMPONEN UTAMA (Wrapper dengan Suspense) ---
export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F8FBFB] text-[#1E5C58]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#81B7A9] border-t-transparent"></div>
          <p className="text-sm font-semibold">Memuat Halaman Asesmen...</p>
        </div>
      </div>
    }>
      <AssessmentContent />
    </Suspense>
  );
}

// --- SUB-KOMPONEN KONTEN ---
function AssessmentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useTherapistProfile();

  const urlType = params.get("type");
  const urlStatus = params.get("status");

  const [activeTab, setActiveTab] = useState<TerapiTab>(() => {
    if (urlType) {
      switch (urlType) {
        case "okupasi":
          return "Terapi Okupasi";
        case "wicara":
          return "Terapi Wicara";
        case "fisio":
          return "Fisioterapi";
        default:
          return "PLB (Paedagog)";
      }
    }
    // Baca cache localStorage agar saat pertama render sudah tepat sesuai spesialisasi akun
    if (typeof window !== "undefined") {
      try {
        const cachedUser = localStorage.getItem("user");
        if (cachedUser) {
          const u = JSON.parse(cachedUser);
          const sec = u?.therapist?.therapist_section || u?.section;
          if (sec) return mapSectionToTab(sec);
        }
      } catch {}
    }
    return "PLB (Paedagog)";
  });

  const [activeFilter, setActiveFilter] = useState<StatusFilter>(
    urlStatus === "completed" ? "Selesai" : "Terjadwal"
  );
  const [scheduleScope, setScheduleScope] = useState<ScheduleScope>("mine");
  const profileApplied = useRef(Boolean(urlType));
  const activeRequestIdRef = useRef(0);

  const [dateFilter, setDateFilter] = useState("");
  const [searchName, setSearchName] = useState("");
  
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const mappedStatus = activeFilter === "Terjadwal" ? "scheduled" : "completed";

  const getType = () => {
    switch (activeTab) {
      case "Terapi Okupasi":
        return "okupasi";
      case "Terapi Wicara":
        return "wicara";
      case "Fisioterapi":
        return "fisio";
      default:
        return "paedagog";
    }
  };

  const isMySpecialtyTab = useMemo(() => {
    if (!profile?.therapist_section) return false;
    return profile.therapist_section.toLowerCase() === getType().toLowerCase();
  }, [profile?.therapist_section, activeTab]);

  // Auto-tab ke bidang spesialisasi terapis saat profile pertama kali siap
  useEffect(() => {
    if (profile?.therapist_section && !profileApplied.current) {
      if (!urlType) {
        const targetTab = mapSectionToTab(profile.therapist_section);
        setActiveTab(targetTab);
        setScheduleScope("mine");
      } else {
        const isSpecialty = profile.therapist_section.toLowerCase() === getType().toLowerCase();
        setScheduleScope(isSpecialty ? "mine" : "all");
      }
      profileApplied.current = true;
    }
  }, [profile, urlType]);

  const handleTabChange = (tab: TerapiTab) => {
    if (tab === activeTab) return;
    // 1. Batalkan semua request sebelumnya
    activeRequestIdRef.current++;
    // 2. Kosongkan data sebelumnya seketika dan aktifkan loading
    setAssessments([]);
    setLoading(true);
    setPage(1);

    setActiveTab(tab);
    const tabType =
      tab === "Terapi Okupasi"
        ? "okupasi"
        : tab === "Terapi Wicara"
        ? "wicara"
        : tab === "Fisioterapi"
        ? "fisio"
        : "paedagog";

    if (profile?.therapist_section && profile.therapist_section.toLowerCase() === tabType) {
      setScheduleScope("mine");
    } else {
      setScheduleScope("all");
    }
  };

  const handleStatusChange = (filter: StatusFilter) => {
    if (filter === activeFilter) return;
    activeRequestIdRef.current++;
    setAssessments([]);
    setLoading(true);
    setPage(1);
    setActiveFilter(filter);
    setOpenDropdown(null);
  };

  const handleScopeChange = (scope: ScheduleScope) => {
    if (scope === scheduleScope) return;
    activeRequestIdRef.current++;
    setAssessments([]);
    setLoading(true);
    setPage(1);
    setScheduleScope(scope);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const currentType = getType();
    if (urlType !== currentType || urlStatus !== mappedStatus) {
      router.replace(`?type=${currentType}&status=${mappedStatus}`);
    }
  }, [activeFilter, activeTab, urlType, urlStatus, mappedStatus]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, activeFilter, dateFilter, searchName, scheduleScope]);

  useEffect(() => {
    // Jika urlType belum ada dan profile masih dimuat, tunggu profile siap agar tidak salah fetch Paedagog
    if (!urlType && !profile && !profileApplied.current) {
      return;
    }

    const requestId = ++activeRequestIdRef.current;
    const currentExpectedType = getType();
    setLoading(true);

    const runFetch = async () => {
      try {
        const useMineFilter = isMySpecialtyTab && scheduleScope === "mine";
        let data = await getAssessments(
          currentExpectedType,
          mappedStatus,
          dateFilter || undefined,
          searchName,
          useMineFilter
        );

        // Abaikan jika request ini sudah usang karena tab telah berpindah
        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        if (Array.isArray(data)) {
          // 1. Verifikasi tipe: pastikan data benar-benar sesuai dengan tab yang sedang aktif
          data = data.filter((item) => {
            const typesStr = Array.isArray(item.type)
              ? item.type.join(" ").toLowerCase()
              : String(item.type || "").toLowerCase();
            return typesStr.includes(currentExpectedType.toLowerCase());
          });

          // 2. Filter defensif "Jadwalku"
          if (useMineFilter && profile?.therapist_id) {
            data = data.filter((item) => {
              if (item.therapist_id) {
                return String(item.therapist_id) === String(profile.therapist_id);
              }
              return true;
            });
          }

          // 3. Filter search name
          if (searchName.trim()) {
            const lower = searchName.toLowerCase();
            data = data.filter((item) =>
              String(item.child_name || "").toLowerCase().includes(lower)
            );
          }

          setAssessments(data);
        } else {
          setAssessments([]);
        }
      } catch (err) {
        if (requestId !== activeRequestIdRef.current) return;
        console.error("❌ Error fetching assessments:", err);
        setAssessments([]);
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setLoading(false);
          setOpenDropdown(null);
        }
      }
    };

    runFetch();
  }, [activeTab, activeFilter, dateFilter, searchName, scheduleScope, isMySpecialtyTab, profile?.therapist_id, urlType, profile]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdown(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const canFillAssessment = (item: Assessment) => {
    if (!isMySpecialtyTab) return false;
    if (!item.therapist_id || !profile?.therapist_id) return false;
    return String(item.therapist_id) === String(profile.therapist_id);
  };

  const handleStartAssessment = (item: Assessment) => {
    if (!canFillAssessment(item)) return;
    const type = getType();
    router.push(
      `/terapis/asessment/${type}Asesment?assessment_id=${item.assessment_id}&status=${mappedStatus}`
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(assessments.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    return assessments.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );
  }, [assessments, page]);

  return (
    <div className="p-6 md:p-8 space-y-8 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">


      {/* ================= TAB TERAPI ================= */}
      <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2 p-1.5 bg-[#EAF4F2]/50 border border-teal-50/50 rounded-2xl w-full lg:w-fit">
        {(
          [
            "PLB (Paedagog)",
            "Terapi Okupasi",
            "Terapi Wicara",
            "Fisioterapi",
          ] as TerapiTab[]
        ).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`cursor-pointer px-3 py-2.5 lg:px-4 text-[11px] lg:text-sm font-semibold rounded-xl text-center transition-all duration-300 w-full lg:w-auto ${
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

      {/* ================= FILTERS ================= */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
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
            placeholder="Cari nama anak..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81B7A9] shadow-[0_2px_8px_rgba(30,92,88,0.02)] hover:border-teal-200 transition-colors"
          />
        </div>
      </div>

      {/* ================= STATUS & SCOPE FILTER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-teal-100/50 pb-2">
        {/* Status Tabs */}
        <div className="flex">
          {(["Terjadwal", "Selesai"] as StatusFilter[]).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => handleStatusChange(filter)}
                className={`cursor-pointer pb-3 px-6 text-sm font-bold transition-all relative ${
                  isActive ? "text-[#1E5C58]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <span>{filter}</span>
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

        {/* Schedule Scope Filter */}
        <div className="flex items-center gap-2">
          {isMySpecialtyTab ? (
            <div className="flex items-center gap-1.5 p-1 bg-[#EAF4F2]/50 border border-teal-50 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleScopeChange("mine")}
                className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all ${
                  scheduleScope === "mine"
                    ? "bg-[#1E5C58] text-white shadow-xs"
                    : "text-[#1E5C58]/70 hover:text-[#1E5C58]"
                }`}
              >
                Jadwalku
              </button>
              <button
                type="button"
                onClick={() => handleScopeChange("all")}
                className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all ${
                  scheduleScope === "all"
                    ? "bg-[#1E5C58] text-white shadow-xs"
                    : "text-[#1E5C58]/70 hover:text-[#1E5C58]"
                }`}
              >
                Semua Jadwal
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
              Mode Lihat Saja (Bidang Lain)
            </span>
          )}
        </div>
      </div>

      {/* ================= TABLE LIST ================= */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
          <div className="w-8 h-8 border-4 border-[#81B7A9] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Memuat data asesmen...</span>
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-teal-50/60 shadow-[0_4px_24px_rgba(30,92,88,0.03)] flex flex-col items-center justify-center gap-3 text-gray-400">
          <ClipboardList className="w-10 h-10 text-gray-300" />
          <span className="text-sm font-medium">Tidak ada data asesmen</span>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            key={`${activeTab}|${activeFilter}|${dateFilter}|${searchName}|${scheduleScope}|${page}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 md:p-8 border border-teal-50/60 shadow-[0_4px_24px_rgba(30,92,88,0.03)] hover:shadow-[0_8px_32px_rgba(30,92,88,0.06)] transition-shadow duration-300"
          >
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                    <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider">Nama Pasien</th>
                    <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider">Nama Orang Tua</th>
                    <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider">Telepon</th>
                    <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider">Tipe Assessment</th>
                    <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider">Assessor</th>
                    <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider">Tanggal Asesmen</th>
                    <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider">Waktu</th>
                    <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((item) => (
                    <tr key={item.assessment_id} className="hover:bg-[#EAF4F2]/20 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-700">{item.child_name}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{item.guardian_name}</td>
                      <td className="py-4 px-4 text-center text-gray-600 font-mono text-xs">{item.guardian_phone}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{item.type}</td>
                      <td className="py-4 px-4 text-gray-600 font-medium">
                        {item.assessor ? (
                          <span className="font-semibold text-gray-700">{item.assessor}</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Belum ditugaskan
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-500 font-medium">{item.scheduled_date}</td>
                      <td className="py-4 px-4 text-center text-gray-500 font-medium">
                        {activeFilter === "Selesai" ? item.completed_at : item.scheduled_time}
                      </td>
                      <td className="py-4 px-4 text-center relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setOpenDropdown(openDropdown === item.assessment_id ? null : item.assessment_id);
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

                        {openDropdown === item.assessment_id && dropdownPosition && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="fixed z-[9999] mt-2 w-48 rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-teal-50/80 overflow-hidden py-1 text-[#1E5C58]"
                            style={{
                              top: dropdownPosition.top,
                              left: dropdownPosition.left,
                            }}
                          >
                            {activeFilter === "Terjadwal" ? (
                              <>
                                {canFillAssessment(item) && (
                                  <button
                                    onClick={() => handleStartAssessment(item)}
                                    className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                                  >
                                    <Play size={16} className="mr-2 text-[#81B7A9]" />
                                    Mulai
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/terapis/asessment/detailAsesment?assessment_id=${item.assessment_id}&type=${getType()}&status=${mappedStatus}`
                                    )
                                  }
                                  className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                                >
                                  <Clock size={16} className="mr-2 text-[#81B7A9]" />
                                  Detail
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/terapis/asessment/${getType()}Riwayat?assessment_id=${item.assessment_id}&status=${mappedStatus}`
                                  )
                                }
                                className="cursor-pointer flex items-center w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-teal-50/30 hover:text-[#1E5C58] transition-colors"
                              >
                                <Clock size={16} className="mr-2 text-[#81B7A9]" />
                                Riwayat Jawaban
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              {paginatedData.map((item) => (
                <div
                  key={item.assessment_id}
                  className="bg-[#F4F9F8]/40 border border-teal-50 rounded-2xl p-4 space-y-3 shadow-xs text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-[#1E5C58]">{item.child_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Wali: {item.guardian_name}</p>
                    </div>
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF4F2] text-[#1E5C58] border border-teal-100">
                      {item.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-teal-50/50 text-gray-500 font-medium">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">WhatsApp</span>
                      <span className="font-mono text-gray-600">{item.guardian_phone || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Assessor</span>
                      <span className="text-gray-700 font-semibold">
                        {item.assessor || "Belum ditugaskan"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Tanggal</span>
                      <span>{item.scheduled_date || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase">Waktu</span>
                      <span>
                        {activeFilter === "Selesai" ? item.completed_at : item.scheduled_time}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-teal-50/50">
                    {activeFilter === "Terjadwal" ? (
                      <>
                        {canFillAssessment(item) && (
                          <button
                            onClick={() => handleStartAssessment(item)}
                            className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-[#1E5C58] hover:bg-[#2E8B83] text-white text-xs font-semibold py-2 rounded-lg shadow-sm"
                          >
                            <Play size={14} />
                            Mulai
                          </button>
                        )}
                        <button
                          onClick={() =>
                            router.push(
                              `/terapis/asessment/detailAsesment?assessment_id=${item.assessment_id}&type=${getType()}&status=${mappedStatus}`
                            )
                          }
                          className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-white border border-teal-100 text-[#1E5C58] hover:bg-teal-50/20 text-xs font-semibold py-2 rounded-lg"
                        >
                          <Clock size={14} />
                          Detail
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          router.push(
                            `/terapis/asessment/${getType()}Riwayat?assessment_id=${item.assessment_id}&status=${mappedStatus}`
                          )
                        }
                        className="cursor-pointer w-full flex items-center justify-center gap-1.5 bg-[#1E5C58] hover:bg-[#2E8B83] text-white text-xs font-semibold py-2 rounded-lg shadow-sm"
                      >
                        <Clock size={14} />
                        Riwayat Jawaban
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ================= PAGINATION ================= */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-4 border-t border-gray-100">
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