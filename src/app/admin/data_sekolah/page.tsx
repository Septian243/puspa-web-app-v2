"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Eye,
  Filter,
  Users,
  Mail,
  Phone,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";
import { DUMMY_SEKOLAH, Sekolah } from "@/lib/api/data_sekolah";
import FormSekolah, { FormSekolahState } from "@/components/form/FormSekolah";
import FormDetailSekolah from "@/components/form/FormDetailSekolah";
import FormHapusSekolah from "@/components/form/FormHapusSekolah";

const STORAGE_KEY = "puspa_data_sekolah_dummy";

export default function DataSekolahPage() {
  const [dataSekolah, setDataSekolah] = useState<Sekolah[]>(DUMMY_SEKOLAH);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showTambah, setShowTambah] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showHapus, setShowHapus] = useState(false);
  const [selectedSekolah, setSelectedSekolah] = useState<Sekolah | null>(null);
  const itemsPerPage = 10;

  // Inisialisasi dan sinkronisasi dengan localStorage agar CRUD dummy bersifat fungsional & persisten
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map((item: Sekolah) =>
            item.status?.toLowerCase() === "belum terverifikasi"
              ? { ...item, status: "Tidak Terverifikasi" }
              : item,
          );
          setDataSekolah(normalized);
          return;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_SEKOLAH));
    } catch {
      // fallback jika localStorage bermasalah
    }
  }, []);

  const persistData = (updater: (prev: Sekolah[]) => Sekolah[]) => {
    setDataSekolah((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // abaikan error storage
      }
      return updated;
    });
  };

  const getStatusBadgeClass = (status?: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "terverifikasi" || s === "aktif") {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
    if (
      s.includes("tidak") ||
      s.includes("belum") ||
      s === "ditolak" ||
      s === "nonaktif"
    ) {
      return "bg-rose-50 text-rose-700 border-rose-100";
    }
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  const handleOpenDetail = (item: Sekolah) => {
    setSelectedSekolah(item);
    setShowDetail(true);
  };

  const handleOpenEdit = (item: Sekolah) => {
    setSelectedSekolah(item);
    setShowEdit(true);
  };

  const handleOpenHapus = (item: Sekolah) => {
    setSelectedSekolah(item);
    setShowHapus(true);
  };

  const handleConfirmHapus = () => {
    if (!selectedSekolah) return;
    persistData((prev) => prev.filter((s) => s.id !== selectedSekolah.id));
    setShowHapus(false);
    setSelectedSekolah(null);
  };

  const handleUpdateSekolah = (formData: FormSekolahState) => {
    if (!selectedSekolah) return;
    persistData((prev) =>
      prev.map((s) =>
        s.id === selectedSekolah.id
          ? {
              ...s,
              nama: formData.nama,
              username: formData.username,
              jenjang: formData.jenjang,
              email: formData.email,
              phone: formData.telepon,
              alamat: formData.alamat,
              updated_at: new Date().toLocaleString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }),
            }
          : s,
      ),
    );
    setShowEdit(false);
    setSelectedSekolah(null);
  };

  const handleSaveSekolah = (formData: FormSekolahState) => {
    const nowFormatted = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const newSekolah: Sekolah = {
      id: String(Date.now()),
      nama: formData.nama,
      username: formData.username,
      jenjang: formData.jenjang,
      role: "Sekolah",
      email: formData.email,
      phone: formData.telepon,
      alamat: formData.alamat,
      status: "Tidak Terverifikasi",
      created_at: nowFormatted,
      updated_at: nowFormatted,
    };

    persistData((prev) => [newSekolah, ...prev]);
    setShowTambah(false);
  };

  // Filter pencarian berdasarkan nama, username, atau jenjang
  const filtered = dataSekolah.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.nama ?? "").toLowerCase().includes(q) ||
      (s.username ?? "").toLowerCase().includes(q) ||
      (s.jenjang ?? "").toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSekolah = filtered.slice(startIndex, endIndex);

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
      <div className="flex flex-col flex-1 w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Halaman & Action Bar */}
        <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#2B7A75]" />
              Manajemen Sekolah Pasien
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola data seluruh pihak sekolah
            </p>
          </div>

          <div className="flex flex-col items-stretch w-full gap-3 sm:flex-row sm:w-auto sm:items-center">
            {/* Input Pencarian */}
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama, jenjang..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-teal-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all shadow-xs text-gray-700"
              />
            </div>

            {/* Tombol Tambah Sekolah */}
            <button
              onClick={() => setShowTambah(true)}
              className="cursor-pointer flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E5C58] hover:bg-[#164340] text-white font-semibold text-sm transition-all shadow-md shadow-teal-900/10 active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} />
              Tambah Sekolah
            </button>
          </div>
        </div>

        {/* Kontainer Tabel (Desktop) & Cards (Mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-transparent md:bg-white rounded-3xl md:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] md:border md:border-teal-50 overflow-hidden flex-1 flex flex-col"
        >
          {/* Tampilan Tabel Desktop */}
          <div className="flex-1 hidden w-full overflow-x-auto md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F9F8] border-b border-teal-100/60">
                  <th className="py-4 px-6 text-xs font-bold text-[#1E5C58] uppercase tracking-wider w-16 text-center">
                    NO
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-[#1E5C58] uppercase tracking-wider">
                    INFO SEKOLAH
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-[#1E5C58] uppercase tracking-wider">
                    JENJANG
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-[#1E5C58] uppercase tracking-wider">
                    KONTAK
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-[#1E5C58] uppercase tracking-wider text-center">
                    STATUS
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-[#1E5C58] uppercase tracking-wider text-center">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {paginatedSekolah.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Filter className="w-10 h-10 mb-2 text-gray-300" />
                        <p className="text-sm font-medium">
                          Tidak ada data sekolah ditemukan.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSekolah.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F4F9F8]/50 transition-colors group"
                    >
                      {/* NO */}
                      <td className="px-6 py-5 text-sm font-medium text-center text-gray-500">
                        {startIndex + index + 1}
                      </td>

                      {/* INFO SEKOLAH */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-[#E6F3F0] text-[#2B7A75] flex items-center justify-center font-bold text-sm shrink-0">
                            {item.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1E5C58]">
                              {item.nama}
                            </p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              @{item.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* JENJANG */}
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E6F3F0] text-[#1E5C58] text-xs font-semibold border border-teal-100/50">
                          <GraduationCap className="w-4 h-4 text-[#2B7A75]" />
                          {item.jenjang}
                        </span>
                      </td>

                      {/* KONTAK */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium whitespace-nowrap">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {item.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {item.phone}
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-bold tracking-wider uppercase border rounded-full ${getStatusBadgeClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            title="Lihat Detail"
                            className="p-1.5 text-gray-400 hover:text-[#2B7A75] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Ubah Data"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenHapus(item)}
                            title="Hapus Data"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Tampilan Mobile Card */}
          <div className="flex-1 w-full p-4 space-y-4 md:hidden">
            {paginatedSekolah.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400 bg-white border shadow-xs rounded-3xl border-teal-50">
                <Filter className="w-10 h-10 mb-2 text-gray-300" />
                <p className="text-sm font-medium">Tidak ada data ditemukan.</p>
              </div>
            ) : (
              paginatedSekolah.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white border border-teal-50/60 rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(43,122,117,0.06)]"
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center min-w-0 gap-3">
                      <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100/50 text-[#2B7A75] flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                        {item.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1E5C58] truncate leading-snug">
                          {item.nama}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate mt-0.5">
                          @{item.username}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#E6F3F0] text-[10px] font-semibold text-[#1E5C58]">
                            <GraduationCap className="w-3 h-3 text-[#2B7A75]" />
                            {item.jenjang}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 px-1 bg-[#F4F9F8]/60 p-3.5 rounded-2xl border border-teal-50/50">
                    <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium min-w-0">
                      <Mail className="w-3.5 h-3.5 text-[#2B7A75] shrink-0" />
                      <span className="truncate">{item.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                      <Phone className="w-3.5 h-3.5 text-[#2B7A75] shrink-0" />
                      <span>{item.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3.5 border-t border-teal-50/50">
                    <p className="text-[10px] font-bold text-gray-400 tracking-wider">
                      No. #{startIndex + index + 1}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="cursor-pointer p-2 bg-white hover:bg-teal-50 border border-teal-100/60 text-[#2B7A75] rounded-xl shadow-2xs active:scale-90 transition-all"
                        title="Detail"
                      >
                        <Eye size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 transition-all bg-white border cursor-pointer hover:bg-amber-50 border-amber-100/60 text-amber-600 rounded-xl shadow-2xs active:scale-90"
                        title="Ubah"
                      >
                        <Pencil size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleOpenHapus(item)}
                        className="p-2 transition-all bg-white border cursor-pointer hover:bg-rose-50 border-red-100/60 text-rose-500 rounded-xl shadow-2xs active:scale-90"
                        title="Hapus"
                      >
                        <Trash2 size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 p-4 px-6 bg-white border-t border-gray-100 sm:flex-row">
              <p className="text-xs font-medium text-gray-500 sm:text-sm">
                Menampilkan{" "}
                <span className="font-bold text-[#1E5C58]">
                  {paginatedSekolah.length === 0 ? 0 : startIndex + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-[#1E5C58]">
                  {Math.min(endIndex, filtered.length)}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-[#1E5C58]">
                  {filtered.length}
                </span>{" "}
                sekolah
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage <= 1}
                  className="cursor-pointer px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white shadow-xs"
                >
                  Prev
                </button>
                <div className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2B7A75] border border-[#2B7A75] shadow-xs select-none">
                  {currentPage} / {totalPages || 1}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                  className="cursor-pointer px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white shadow-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Tambah Sekolah */}
      <FormSekolah
        open={showTambah}
        mode="tambah"
        onClose={() => setShowTambah(false)}
        onSubmit={handleSaveSekolah}
      />

      {/* Modal Detail Sekolah */}
      <FormDetailSekolah
        open={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedSekolah(null);
        }}
        sekolah={selectedSekolah}
      />

      {/* Modal Ubah Sekolah */}
      <FormSekolah
        open={showEdit}
        mode="ubah"
        onClose={() => {
          setShowEdit(false);
          setSelectedSekolah(null);
        }}
        onSubmit={handleUpdateSekolah}
        initialData={selectedSekolah}
      />

      {/* Modal Hapus Sekolah */}
      <FormHapusSekolah
        open={showHapus}
        onClose={() => {
          setShowHapus(false);
          setSelectedSekolah(null);
        }}
        onConfirm={handleConfirmHapus}
        namaSekolah={selectedSekolah?.nama}
      />
    </div>
  );
}

