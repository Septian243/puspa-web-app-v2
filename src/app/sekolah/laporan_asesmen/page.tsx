"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Eye,
  Download,
  Sparkles,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import FormDetailProfilAnak from "@/components/form/FormDetailProfilAnak";
import {
  LaporanAsesmenSekolah,
  getDaftarLaporanAsesmenSekolah,
  unduhLaporanAsesmenSekolah,
} from "@/lib/api/laporanAsesmenSekolah";

export default function LaporanAsesmenPage() {
  const [laporanList, setLaporanList] = useState<LaporanAsesmenSekolah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State untuk modal detail anak
  const [selectedAnak, setSelectedAnak] = useState<LaporanAsesmenSekolah | null>(
    null
  );

  useEffect(() => {
    const list = getDaftarLaporanAsesmenSekolah();
    setLaporanList(list);
    setLoading(false);
  }, []);

  // Filter list berdasarkan pencarian nama anak atau orangtua
  const filteredList = useMemo(() => {
    if (!laporanList || laporanList.length === 0) return [];
    if (!searchTerm.trim()) return laporanList;

    const term = searchTerm.toLowerCase();
    return laporanList.filter(
      (item) =>
        item.namaAnak.toLowerCase().includes(term) ||
        item.namaOrangTua.toLowerCase().includes(term) ||
        item.tanggalLahir.toLowerCase().includes(term) ||
        item.teleponOrangTua.includes(term)
    );
  }, [laporanList, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const currentList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handler unduh asesmen
  const handleDownload = (item: LaporanAsesmenSekolah) => {
    if (item.statusAsesmen !== "tersedia") {
      toast.error("Laporan asesmen belum tersedia dari admin Puspa.");
      return;
    }

    toast.success(`Mengunduh hasil asesmen untuk ${item.namaAnak}...`, {
      icon: "📄",
    });

    if (!item.statusUnduh) {
      const updated = unduhLaporanAsesmenSekolah(item.id);
      setLaporanList(updated);

      if (selectedAnak && selectedAnak.id === item.id) {
        setSelectedAnak({ ...selectedAnak, statusUnduh: true });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-3">
        <div className="w-9 h-9 border-3 border-teal-100 border-t-[#1E5C58] rounded-full animate-spin" />
        <p className="text-xs font-medium animate-pulse">Memuat laporan asesmen...</p>
      </div>
    );
  }

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
            <p className="text-xs text-gray-500 font-medium mt-1">
              Lihat data anak dan unduh hasil asesmen yang dikirim oleh admin Puspa.
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
            <table className="w-full text-left border-collapse min-w-[700px]">
              {/* Header Kolom */}
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="pb-4 px-3 font-extrabold w-14 text-center">NO</th>
                  <th className="pb-4 px-4 font-extrabold">INFORMASI PASIEN</th>
                  <th className="pb-4 px-4 font-extrabold">USIA / TGL LAHIR</th>
                  <th className="pb-4 px-4 font-extrabold">ORANGTUA / WALI</th>
                  <th className="pb-4 px-4 font-extrabold text-center w-28">AKSI</th>
                </tr>
              </thead>

              {/* Data Rows */}
              <tbody className="divide-y divide-gray-100/80 text-xs">
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                      Tidak ada data anak yang sesuai dengan pencarian &quot;{searchTerm}&quot;
                    </td>
                  </tr>
                ) : (
                  currentList.map((item, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#F4F9F8]/60 transition-colors group"
                      >
                        {/* NO */}
                        <td className="py-4 px-3 font-semibold text-gray-500 text-center">
                          {rowNumber}
                        </td>

                        {/* INFORMASI PASIEN */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${item.initialBg}`}
                            >
                              {item.initial}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm group-hover:text-[#1E5C58] transition-colors">
                                {item.namaAnak}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                {item.jenisKelamin}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* USIA / TGL LAHIR */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{item.usia}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {item.tanggalLahir}
                          </p>
                        </td>

                        {/* ORANGTUA / WALI */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-gray-800 text-xs">
                            {item.namaOrangTua}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{item.teleponOrangTua}</span>
                          </div>
                        </td>

                        {/* AKSI */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Tombol Detail (Eye) */}
                            <button
                              type="button"
                              onClick={() => setSelectedAnak(item)}
                              title="Lihat Detail Anak"
                              className="cursor-pointer w-9 h-9 rounded-xl bg-[#E6F3F0] hover:bg-[#D3ECE6] text-[#2B7A75] flex items-center justify-center transition-all active:scale-95 shadow-xs"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Tombol Unduh Asesmen (Hanya icon Download) */}
                            {item.statusAsesmen === "tersedia" ? (
                              <button
                                type="button"
                                onClick={() => handleDownload(item)}
                                title="Unduh Asesmen"
                                className="cursor-pointer w-9 h-9 rounded-xl bg-[#245D56] hover:bg-[#1B4B45] text-white flex items-center justify-center transition-all active:scale-95 shadow-xs shrink-0"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                title="Belum tersedia"
                                className="w-9 h-9 rounded-xl bg-gray-100/90 text-gray-400 border border-gray-200/50 flex items-center justify-center cursor-not-allowed shrink-0"
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
          {filteredList.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-6 mt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
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
                disabled={currentPage === totalPages}
                className="cursor-pointer px-3.5 py-1.5 rounded-xl border border-gray-200/90 bg-white hover:bg-gray-50 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </main>

      {/* ================= MODAL DETAIL PROFIL ANAK (COMPONENT FORM) ================= */}
      <FormDetailProfilAnak
        open={Boolean(selectedAnak)}
        onClose={() => setSelectedAnak(null)}
        anak={selectedAnak}
      />
    </div>
  );
}
