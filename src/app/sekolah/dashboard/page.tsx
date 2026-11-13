"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Baby,
  Users,
  CheckCircle2,
  Download,
  Calendar,
  FileText,
  ArrowRight,
  PieChart as PieChartIcon,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getSchoolDashboard } from "@/lib/api/dashboardSekolah";
import { getSchoolStudents, SchoolStudentItem, downloadSchoolAssessmentReport } from "@/lib/api/laporanAsesmenSekolah";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

export default function SekolahDashboardPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // 1. Query Data Statistik Dasbor Sekolah (GET /api/v1/school/dashboard)
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: queryKeys.school.dashboard,
    queryFn: getSchoolDashboard,
  });

  // 2. Query Siswa Terbaru Sekolah (GET /api/v1/school/students?per_page=3)
  const { data: recentStudentsData, isLoading: loadingRecent } = useQuery({
    queryKey: queryKeys.school.students({ per_page: 3 }),
    queryFn: () => getSchoolStudents({ per_page: 3 }),
  });

  const recentItems = Array.isArray(recentStudentsData?.items) ? recentStudentsData.items : [];

  // Handler Unduh Laporan Asesmen (GET /school/students/{child}/assessment-report)
  const handleDownloadReport = async (childId: string, studentName: string) => {
    setDownloadingId(childId);
    try {
      await downloadSchoolAssessmentReport(childId, studentName);
      showSuccessToast(`Laporan asesmen ${studentName} berhasil diunduh.`, "Unduhan Selesai");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Gagal mengunduh laporan asesmen";
      showErrorToast(msg, "Gagal Mengunduh");
    } finally {
      setDownloadingId(null);
    }
  };

  // Loading State Utama
  if (loadingStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-3">
        <div className="w-9 h-9 border-3 border-teal-100 border-t-[#1E5C58] rounded-full animate-spin" />
        <p className="text-xs font-medium animate-pulse">Memuat data dasbor sekolah...</p>
      </div>
    );
  }

  // Kalkulasi data Donut Chart & Card Belum Diunduh (Opsi 1: Status Dokumen & Unduhan)
  const totalStudents = stats?.total_students ?? 0;
  const assessmentAvailable = stats?.students_with_assessment ?? 0;
  // Jika backend kelak menyediakan metrik unduhan, langsung otomatis terbaca secara reaktif
  const sudahDiunduh = (stats as any)?.students_downloaded ?? (stats as any)?.downloaded_assessments_count ?? 0;
  const belumDiunduh = Math.max(0, assessmentAvailable - sudahDiunduh);
  const belumDikirimAdmin = Math.max(0, totalStudents - assessmentAvailable);
  const denominator = totalStudents > 0 ? totalStudents : 1;

  const chartData = [
    {
      name: "Sudah diunduh",
      value: sudahDiunduh,
      count: sudahDiunduh,
      percentage: (sudahDiunduh / denominator) * 100,
      color: "#38A3A5",
    },
    {
      name: "Belum diunduh",
      value: belumDiunduh,
      count: belumDiunduh,
      percentage: (belumDiunduh / denominator) * 100,
      color: "#FFB703",
    },
    {
      name: "Belum dikirim admin",
      value: belumDikirimAdmin,
      count: belumDikirimAdmin,
      percentage: (belumDikirimAdmin / denominator) * 100,
      color: "#F472B6",
    },
  ];

  const hasChartData = totalStudents > 0;

  // Custom label di dalam irisan lingkaran
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, payload } = props;
    if (!payload?.percentage || payload.percentage === 0) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const radians = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * radians);
    const y = cy + radius * Math.sin(-midAngle * radians);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        style={{ pointerEvents: "none" }}
      >
        {`${Number(payload.percentage).toFixed(0)}%`}
      </text>
    );
  };

  const currentDateFormatted = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden selection:bg-[#2B7A75] selection:text-white bg-transparent w-full">
      {/* Decorative Background Ambient Blur Orbs */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-[#b8e8db30] rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#68b2a015] rounded-full blur-[100px] pointer-events-none z-0" />

      <main className="relative z-10 p-4 mx-auto space-y-6 sm:p-6 md:p-8 max-w-7xl">
        {/* ================= HERO BANNER ================= */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-linear-to-br from-[#1E5C58] via-[#245D56] to-[#2B7A75] text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-teal-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          {/* Visual Ambient Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 transform rounded-full pointer-events-none bg-white/10 blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-10 w-40 h-40 bg-[#A2E4D3]/15 rounded-full blur-2xl transform translate-y-1/2 pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Selamat Datang, {stats?.school_name || "Sekolah"}!
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-white/85 sm:text-sm">
              Pantau data anak dari sekolah Anda dan unduh laporan asesmen yang dikirim oleh admin Puspa.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Link
              href="/sekolah/laporan_asesmen"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#1E5C58] hover:bg-teal-50 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 group cursor-pointer"
            >
              <span>Lihat Laporan Asesmen</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>

        {/* ================= 3 STATS CARDS ================= */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Card 1: Total Anak Terdaftar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -3 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-[0_4px_20px_rgba(30,92,88,0.04)] hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4 group"
            >
              <div>
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  TOTAL ANAK TERDAFTAR
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#1E5C58] tracking-tight">
                    {stats?.total_students ?? 0}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    Dari {stats?.school_name || "-"}
                  </span>
                </div>
              </div>

              <div className="w-13 h-13 rounded-2xl bg-[#E6F8F4] text-[#1E5C58] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                <Baby className="w-6 h-6 text-[#1E5C58]" />
              </div>
            </motion.div>

            {/* Card 2: Asesmen Tersedia */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -3 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-[0_4px_20px_rgba(30,92,88,0.04)] hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4 group"
            >
              <div>
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  ASESMEN TERSEDIA
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#1E5C58] tracking-tight">
                    {stats?.students_with_assessment ?? 0}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    Siswa telah diasesmen
                  </span>
                </div>
              </div>

              <div className="w-13 h-13 rounded-2xl bg-[#FEF6EE] text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                <CheckCircle2 className="w-6 h-6 text-amber-600" />
              </div>
            </motion.div>

            {/* Card 3: Belum Diunduh (Siap Diunduh) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ y: -3 }}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-[0_4px_20px_rgba(30,92,88,0.04)] hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4 group"
            >
              <div>
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  BELUM DIUNDUH
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#1E5C58] tracking-tight">
                    {belumDiunduh}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    Siap diunduh
                  </span>
                </div>
              </div>

              <div className="w-13 h-13 rounded-2xl bg-[#EEF4FF] text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
            </motion.div>
          </div>

          {/* Date Timestamp Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="flex items-center justify-end gap-1.5 text-xs text-gray-400 font-medium px-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Data per {currentDateFormatted}</span>
          </motion.div>
        </div>

        {/* ================= BOTTOM ROW (2 CARDS) ================= */}
        <div className="grid items-stretch grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Card: Asesmen Terbaru dari Admin (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-teal-50/80 shadow-[0_4px_20px_rgba(30,92,88,0.04)] hover:shadow-[0_10px_30px_rgba(30,92,88,0.08)] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E6F3F0] text-[#2B7A75] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#1E5C58]">
                    Asesmen Terbaru dari Admin
                  </h3>
                </div>
                <Link
                  href="/sekolah/laporan_asesmen"
                  className="text-xs font-semibold text-gray-400 hover:text-[#1E5C58] transition-colors"
                >
                  Lihat semua
                </Link>
              </div>

              {/* List Siswa Terdaftar */}
              <div className="mt-2 divide-y divide-gray-50">
                {loadingRecent ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
                    <div className="w-6 h-6 border-2 border-teal-100 border-t-[#1E5C58] rounded-full animate-spin" />
                    <span className="text-xs">Memuat daftar siswa terbaru...</span>
                  </div>
                ) : recentItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#1E5C58] flex items-center justify-center mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">Belum Ada Siswa Terdaftar</p>
                    <p className="max-w-xs mt-1 text-xs text-gray-400">
                      Siswa dari sekolah Anda yang terdaftar di Puspa akan tampil di sini.
                    </p>
                  </div>
                ) : (
                  recentItems.map((student: SchoolStudentItem, index: number) => {
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
                    const statusText = student.assessment_status
                      ? `Asesmen: ${student.assessment_status}`
                      : student.observation_status
                        ? `Observasi: ${student.observation_status}`
                        : "Terdaftar";

                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.35 + index * 0.08 }}
                        className="py-3.5 px-3 -mx-3 rounded-2xl flex items-center justify-between gap-4 group hover:bg-[#F4F9F8]/70 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${initialBg} group-hover:scale-105 transition-transform duration-200`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#1E5C58] transition-colors">
                              {student.child_name}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                              {student.age ? `${student.age} Tahun • ` : ""}{statusText}
                            </p>
                          </div>
                        </div>

                        {/* Tombol Unduh Laporan Asesmen: Hanya bisa diklik jika anak sudah selesai asesmen */}
                        {hasAssessment ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadReport(student.id, student.child_name)}
                            disabled={downloadingId === student.id}
                            className="cursor-pointer px-3.5 py-1.5 rounded-xl border border-blue-200/90 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-all duration-200 active:scale-95 shrink-0 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Unduh Laporan Asesmen (Dapat diunduh berkali-kali tanpa batas)"
                          >
                            {downloadingId === student.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                <span>Mengunduh...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 text-blue-600" />
                                <span>Unduh Laporan</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-3.5 py-1.5 rounded-xl border border-gray-200/80 bg-gray-100/70 text-gray-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed shrink-0 opacity-50"
                            title="Laporan belum tersedia: Siswa belum melakukan asesmen"
                          >
                            <Download className="w-3.5 h-3.5 text-gray-400" />
                            <span>Unduh Laporan</span>
                          </button>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Card: Status Asesmen (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-teal-50/80 shadow-[0_4px_20px_rgba(30,92,88,0.04)] hover:shadow-[0_10px_30px_rgba(30,92,88,0.08)] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div>
                <h3 className="text-base font-bold text-[#1E5C58]">
                  Status Asesmen
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Berdasarkan seluruh anak terdaftar
                </p>
              </div>

              {/* Chart container */}
              <div className="relative flex flex-col items-center justify-center p-4 mt-4 border rounded-2xl border-gray-100/60 bg-gray-50/50">
                <div className="h-[220px] w-full">
                  {hasChartData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          innerRadius={50}
                          paddingAngle={4}
                          stroke="none"
                          label={renderLabel}
                          labelLine={false}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              className="outline-none"
                              style={{
                                opacity:
                                  activeIndex === null || activeIndex === index
                                    ? 1
                                    : 0.6,
                                transform:
                                  activeIndex === index ? "scale(1.05)" : "scale(1)",
                                transformOrigin: "center",
                                transition: "all 150ms ease",
                              }}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 20px -5px rgba(0,0,0,0.1)",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                          itemStyle={{ color: "#1E5C58" }}
                          formatter={(value: any, name: any, props: any) => [
                            `${value} anak (${props?.payload?.percentage?.toFixed(1) ?? 0}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                      <PieChartIcon className="w-8 h-8 mb-1 text-gray-300 opacity-60" />
                      <p className="text-xs font-semibold text-gray-500">Belum ada data status asesmen</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Legend Items (2 columns grid matching previous design) */}
            <div className="grid grid-cols-2 px-1 mt-4 gap-x-2 gap-y-3">
              {chartData.map((entry, index) => (
                <div
                  key={entry.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() =>
                    setActiveIndex(activeIndex === index ? null : index)
                  }
                  className={`group flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-all duration-150 ${activeIndex === index
                    ? "translate-x-1 bg-teal-50 shadow-xs"
                    : "hover:bg-teal-50/50"
                    }`}
                >
                  <div
                    className={`h-3.5 w-3.5 shrink-0 rounded-full shadow-xs transition-all duration-150 ${activeIndex === index ? "scale-150" : "group-hover:scale-125"
                      }`}
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-bold leading-tight text-gray-700 line-clamp-1">
                      {entry.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-gray-400 mt-0.5">
                      {entry.percentage.toFixed(1)}% ({entry.count || 0} Anak)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
