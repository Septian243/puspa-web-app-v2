"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Eye,
  Download,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getSchoolStudents, SchoolStudentItem } from "@/lib/api/laporanAsesmenSekolah";
import FormDetailProfilAnak from "@/components/form/FormDetailProfilAnak";
import { showErrorToast } from "@/lib/toast";

function formatUsia(birthDateStr: string | null | undefined, fallbackAge?: number | null): string {
  if (!birthDateStr) {
    return fallbackAge != null ? `${fallbackAge} Tahun` : "-";
  }

  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) {
    return fallbackAge != null ? `${fallbackAge} Tahun` : "-";
  }

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return "-";

  if (years === 0) {
    return `${months} Bulan`;
  }

  if (months === 0) {
    return `${years} Tahun`;
  }

  return `${years} Tahun ${months} Bulan`;
}

function formatTanggalLahir(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function renderStatusBadge(assessmentStatus?: string | null, observationStatus?: string | null) {
  const asm = assessmentStatus?.toLowerCase();
  const obs = observationStatus?.toLowerCase();

  if (asm === "completed" || asm === "selesai") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-[#1E5C58] border border-teal-200/70 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1E5C58]" />
        Selesai Asesmen
      </span>
    );
  }

  if (asm === "scheduled" || asm === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
        Jadwal Asesmen
      </span>
    );
  }

  if (obs === "completed" || obs === "selesai") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Tahap Observasi
      </span>
    );
  }

  if (obs === "scheduled" || obs === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50/80 text-amber-800 border border-amber-200/60 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Jadwal Observasi
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200/60 shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Menunggu Observasi
    </span>
  );
}

export default function LaporanAsesmenPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.school.students({
      search: debouncedSearch.trim() || undefined,
      page: currentPage,
      per_page: 10,
    }),
    queryFn: () =>
      getSchoolStudents({
        search: debouncedSearch.trim() || undefined,
        page: currentPage,
        per_page: 10,
      }),
    placeholderData: (previousData) => previousData,
  });

  const studentList = Array.isArray(data?.items) ? data.items : [];
  const meta = data?.meta || { current_page: 1, last_page: 1, total: 0, per_page: 10 };
  const totalPages = Math.max(1, meta.last_page);

  // Handler unduh asesmen (Pending Backend)
  const handlePendingDownload = (studentName: string) => {
    showErrorToast(
      `Fitur unduh laporan asesmen untuk ${studentName} berstatus Pending (Menunggu dukungan endpoint backend). Nantinya laporan ini dapat diunduh berkali-kali tanpa batas.`,
      "Pending Backend"
    );
  };

  return (
    <div className="relative overflow-hidden selection:bg-[#2B7A75] selection:text-white bg-transparent w-full">
      {/* Background Ambient Blur Orbs */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-[#b8e8db30] rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#68b2a015] rounded-full blur-[100px] pointer-events-none z-0" />

      <main className="relative z-10 p-4 mx-auto space-y-6 sm:p-6 md:p-8 max-w-7xl">
        {/* ================= HEADER & SEARCH BAR ================= */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Title & Description */}
          <div>
            <div className="flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-[#1E5C58]" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E5C58] tracking-tight">
                Laporan Asesmen
              </h1>
            </div>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Lihat data anak dan pantau status asesmen yang dilakukan oleh tim Puspa.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama anak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200/90 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-700 font-medium placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-100 focus:border-[#1E5C58] shadow-xs transition-all"
            />
          </div>
        </motion.div>

        {/* ================= TABLE CARD ================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl p-4 sm:p-6 md:p-7 border border-teal-50/80 shadow-[0_4px_20px_rgba(30,92,88,0.04)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              {/* Header Kolom */}
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="px-3 pb-4 font-extrabold text-center w-14">NO</th>
                  <th className="px-4 pb-4 font-extrabold">INFORMASI PASIEN</th>
                  <th className="px-4 pb-4 font-extrabold">USIA / TGL LAHIR</th>
                  <th className="px-4 pb-4 font-extrabold">STATUS TAHAPAN</th>
                  <th className="px-4 pb-4 font-extrabold">ORANGTUA / WALI</th>
                  <th className="px-4 pb-4 font-extrabold text-center w-28">AKSI</th>
                </tr>
              </thead>

              {/* Data Rows */}
              <tbody className="text-xs divide-y divide-gray-100/80">
                {isLoading && studentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 font-medium text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-7 h-7 border-2 border-teal-100 border-t-[#1E5C58] rounded-full animate-spin" />
                        <span>Memuat data siswa...</span>
                      </div>
                    </td>
                  </tr>
                ) : studentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 font-medium text-center text-gray-400">
                      {debouncedSearch
                        ? `Tidak ada data siswa yang sesuai dengan pencarian "${debouncedSearch}"`
                        : "Belum ada data siswa terdaftar pada sekolah Anda."}
                    </td>
                  </tr>
                ) : (
                  studentList.map((student: SchoolStudentItem, index: number) => {
                    const rowNumber = (currentPage - 1) * 10 + index + 1;
                    const isFemale = student.child_gender?.toLowerCase() === "perempuan";
                    const initial = student.child_name ? student.child_name.charAt(0).toUpperCase() : "S";
                    const initialBg = isFemale
                      ? "bg-rose-100 text-rose-600"
                      : "bg-blue-100 text-blue-600";
                    const hasAssessment = Boolean(
                      student.assessment_status &&
                      (student.assessment_status.toLowerCase() === "completed" ||
                        student.assessment_status.toLowerCase() === "selesai")
                    );

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-[#F4F9F8]/60 transition-colors group"
                      >
                        {/* NO */}
                        <td className="px-3 py-4 font-semibold text-center text-gray-500">
                          {rowNumber}
                        </td>

                        {/* INFORMASI PASIEN */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${initialBg}`}
                            >
                              {initial}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm group-hover:text-[#1E5C58] transition-colors">
                                {student.child_name}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                {student.child_gender || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* USIA / TGL LAHIR */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-extrabold text-[#1E5C58] text-xs sm:text-sm">
                              <Activity className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={2.2} />
                              <span>{formatUsia(student.child_birth_date, student.age)}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                              {formatTanggalLahir(student.child_birth_date)}
                            </p>
                          </div>
                        </td>

                        {/* STATUS TAHAPAN */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {renderStatusBadge(student.assessment_status, student.observation_status)}
                        </td>

                        {/* ORANGTUA / WALI (Belum didukung di list backend -> '-') */}
                        <td className="px-4 py-4 font-medium text-gray-400">
                          -
                        </td>

                        {/* AKSI */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Tombol Detail (Eye) - Teal Theme */}
                            <button
                              type="button"
                              onClick={() => setSelectedChildId(student.id)}
                              title="Lihat Detail Profil Anak"
                              className="cursor-pointer w-9 h-9 rounded-xl border border-teal-200/90 bg-[#E6F8F4] hover:bg-[#D3ECE6] text-[#1E5C58] flex items-center justify-center transition-all active:scale-95 shadow-xs"
                            >
                              <Eye className="w-4 h-4 text-[#1E5C58]" />
                            </button>

                            {/* Tombol Unduh Asesmen: Hanya bisa diklik jika anak sudah selesai asesmen */}
                            {hasAssessment ? (
                              <button
                                type="button"
                                onClick={() => handlePendingDownload(student.child_name)}
                                title="Unduh Laporan Asesmen (Dapat diunduh berkali-kali tanpa batas • Status: Menunggu endpoint backend)"
                                className="flex items-center justify-center transition-all border shadow-xs cursor-pointer w-9 h-9 rounded-xl border-blue-200/90 bg-blue-50/80 hover:bg-blue-100 text-blue-700 active:scale-95 shrink-0"
                              >
                                <Download className="w-4 h-4 text-blue-600" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                title="Laporan belum tersedia: Siswa belum melakukan asesmen"
                                className="flex items-center justify-center transition-all border shadow-xs w-9 h-9 rounded-xl border-gray-200/70 bg-gray-100/60 text-gray-400 cursor-not-allowed shrink-0 opacity-50"
                              >
                                <Download className="w-4 h-4 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ================= PAGINATION ================= */}
          {meta.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 pt-6 mt-2 border-t border-gray-100 sm:flex-row">
              <span className="text-xs font-medium text-gray-400">
                Menampilkan {studentList.length} dari {meta.total} siswa
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="cursor-pointer px-3.5 py-1.5 rounded-xl border border-gray-200/90 bg-white hover:bg-gray-50 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                >
                  Prev
                </button>

                <div className="px-4 py-1.5 rounded-xl bg-[#245D56] text-white text-xs font-black shadow-xs">
                  {currentPage} / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  className="cursor-pointer px-3.5 py-1.5 rounded-xl border border-gray-200/90 bg-white hover:bg-gray-50 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* ================= MODAL DETAIL PROFIL SISWA ================= */}
      <FormDetailProfilAnak
        isOpen={Boolean(selectedChildId)}
        open={Boolean(selectedChildId)}
        childId={selectedChildId}
        onClose={() => setSelectedChildId(null)}
      />
    </div>
  );
}
