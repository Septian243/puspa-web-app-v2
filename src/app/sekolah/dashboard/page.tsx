"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Baby,
  Users,
  CheckCircle2,
  Download,
  Calendar,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import {
  getDashboardSekolahData,
  saveDashboardSekolahData,
  SekolahDashboardData,
} from "@/lib/api/dashboardSekolah";
import {
  LaporanAsesmenSekolah,
  unduhLaporanAsesmenSekolah,
} from "@/lib/api/laporanAsesmenSekolah";

export default function SekolahDashboardPage() {
  const [data, setData] = useState<SekolahDashboardData | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadData = () => {
      const initialData = getDashboardSekolahData();
      setData(initialData);
    };
    loadData();

    window.addEventListener("sekolah_profile_updated", loadData);
    window.addEventListener("sekolah_asesmen_updated", loadData);
    return () => {
      window.removeEventListener("sekolah_profile_updated", loadData);
      window.removeEventListener("sekolah_asesmen_updated", loadData);
    };
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-3">
        <div className="w-9 h-9 border-3 border-teal-100 border-t-[#1E5C58] rounded-full animate-spin" />
        <p className="text-xs font-medium animate-pulse">Memuat data dasbor sekolah...</p>
      </div>
    );
  }

  // Handler simulasi unduh laporan asesmen
  const handleDownload = (item: LaporanAsesmenSekolah) => {
    toast.success(`Mengunduh laporan asesmen ${item.namaAnak}...`, {
      icon: "📄",
    });

    if (!item.statusUnduh) {
      unduhLaporanAsesmenSekolah(item.id);
      setData(getDashboardSekolahData());
    }
  };

  // Persiapan data Donut Chart (konsep seperti PasienChart)
  const totalAnak = data.totalAnak > 0 ? data.totalAnak : 1;
  const chartData = [
    {
      name: "Sudah diunduh",
      value: data.sudahDiunduh,
      count: data.sudahDiunduh,
      percentage: (data.sudahDiunduh / totalAnak) * 100,
      color: "#38A3A5",
    },
    {
      name: "Belum diunduh",
      value: data.belumDiunduh,
      count: data.belumDiunduh,
      percentage: (data.belumDiunduh / totalAnak) * 100,
      color: "#FFB703",
    },
    {
      name: "Belum dikirim admin",
      value: data.belumDikirimAdmin,
      count: data.belumDikirimAdmin,
      percentage: (data.belumDikirimAdmin / totalAnak) * 100,
      color: "#F472B6",
    },
  ];

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
              Selamat Datang, {data.namaSekolah}!
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-white/85 sm:text-sm">
              Pantau data anak dari sekolah Anda dan unduh laporan asesmen yang
              dikirim oleh admin Puspa.
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
            {/* Card 1: Total Anak */}
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
                    {data.totalAnak}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    Dari {data.namaSekolah}
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
                    {data.asesmenTersedia}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    Dikirim oleh admin
                  </span>
                </div>
              </div>

              <div className="w-13 h-13 rounded-2xl bg-[#FEF6EE] text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                <CheckCircle2 className="w-6 h-6 text-amber-600" />
              </div>
            </motion.div>

            {/* Card 3: Belum Diunduh */}
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
                    {data.belumDiunduh}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
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
            <span>Data per {data.tanggalData}</span>
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

              {/* List Asesmen with hover animations */}
              <div className="mt-2 divide-y divide-gray-50">
                {data.asesmenTerbaru.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + index * 0.08 }}
                    className="py-3.5 px-3 -mx-3 rounded-2xl flex items-center justify-between gap-4 group hover:bg-[#F4F9F8]/70 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${item.initialBg} group-hover:scale-105 transition-transform duration-200`}
                      >
                        {item.initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#1E5C58] transition-colors">
                          {item.namaAnak}
                        </p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          Dikirim {item.tanggalKirim}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className={`cursor-pointer px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all duration-200 active:scale-95 shrink-0 ${item.statusUnduh
                          ? "border-teal-200 bg-teal-50/60 text-[#1E5C58] hover:bg-teal-100/80 shadow-xs"
                          : "border-teal-200/90 bg-[#F4F9F8] hover:bg-[#1E5C58] text-[#1E5C58] hover:text-white hover:border-[#1E5C58] shadow-xs"
                        }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{item.statusUnduh ? "Unduh Ulang" : "Unduh Asesmen"}</span>
                    </button>
                  </motion.div>
                ))}
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

              {/* Chart container matching PasienChart concept */}
              <div className="relative flex flex-col items-center justify-center p-4 mt-4 border rounded-2xl border-gray-100/60 bg-gray-50/50">
                <div className="h-[220px] w-full">
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
                </div>
              </div>
            </div>

            {/* Legend Items (2 columns grid matching screenshot) */}
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
