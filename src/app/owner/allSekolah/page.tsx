"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  X,
  School,
  Phone,
  Mail,
  BookOpen,
  User,
  MapPin,
  BadgeCheck,
  Calendar,
  Activity,
  Loader2,
} from "lucide-react";
import { getAllSchools, OwnerSchoolItem } from "@/lib/api/ownerSekolah";

// =========================================
// Types
// =========================================
interface SekolahData {
  id: string | number;
  namaSekolah: string;
  jenjangKode: string;         // "SD" | "SMP" | "SMA" | "PAUD" | "SMK"
  jenjangLabel: string;        // "Sekolah Dasar" | "Sekolah Menengah Pertama" dst
  alamat: string;
  peran: string;               // e.g. "Sekolah"
  username: string;
  email: string;
  noTelepon: string;
  tanggalPendaftaran: string;  // display format: "04 November 2026 15:03:38"
  status: "Terverifikasi" | "Tidak Terverifikasi" | "Ditolak";
}

// =========================================
// Jenjang Label Map
// =========================================
const JENJANG_LABEL: Record<string, string> = {
  PAUD: "Pendidikan Anak Usia Dini",
  SD: "Sekolah Dasar",
  SMP: "Sekolah Menengah Pertama",
  SMA: "Sekolah Menengah Atas",
  SMK: "Sekolah Menengah Kejuruan",
};

// =========================================
// Status Badge Component
// =========================================
function StatusBadge({ status }: { status: SekolahData["status"] }) {
  const isVerified = status === "Terverifikasi";
  return (
    <div
      className={`inline-flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-center leading-tight border transition-all ${isVerified
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : "bg-rose-50 text-rose-700 border-rose-100"
        }`}
    >
      {isVerified ? (
        <span>Terverifikasi</span>
      ) : (
        <>
          <span>Tidak</span>
          <span>Terverifikasi</span>
        </>
      )}
    </div>
  );
}

// =========================================
// Jenjang Badge (table)
// =========================================
function JenjangBadge({ kode }: { kode: string }) {
  const colorMap: Record<string, string> = {
    PAUD: "bg-purple-50 text-purple-700 border-purple-200/60",
    SD: "bg-blue-50 text-blue-700 border-blue-200/60",
    SMP: "bg-amber-50 text-amber-700 border-amber-200/60",
    SMA: "bg-teal-50 text-teal-700 border-teal-200/60",
    SMK: "bg-orange-50 text-orange-700 border-orange-200/60",
  };
  const cls = colorMap[kode] ?? "bg-gray-50 text-gray-700 border-gray-200/60";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {kode}
    </span>
  );
}

// =========================================
// Detail Modal — matches the reference image
// =========================================
function DetailModal({
  sekolah,
  onClose,
}: {
  sekolah: SekolahData;
  onClose: () => void;
}) {
  const rows: { icon: React.ElementType; label: string; value: React.ReactNode }[] = [
    { icon: School, label: "NAMA SEKOLAH", value: sekolah.namaSekolah },
    { icon: BookOpen, label: "JENJANG", value: sekolah.jenjangLabel },
    { icon: MapPin, label: "ALAMAT", value: sekolah.alamat },
    {
      icon: BadgeCheck,
      label: "PERAN / JABATAN",
      value: (
        <span className="inline-block mt-0.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#EAF4F2] text-[#1E5C58] border border-teal-100">
          {sekolah.peran}
        </span>
      ),
    },
    { icon: User, label: "USERNAME", value: sekolah.username },
    { icon: Mail, label: "ALAMAT EMAIL", value: sekolah.email },
    { icon: Phone, label: "NO. TELEPON", value: sekolah.noTelepon },
    { icon: Calendar, label: "TANGGAL PENDAFTARAN", value: sekolah.tanggalPendaftaran },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EAF4F2] border border-teal-100/60 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-[#1E5C58]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1E5C58] leading-tight">
                Detail Akun Sekolah
              </h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                Informasi rinci lisensi sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors cursor-pointer rounded-xl hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Modal Body (scrollable) ── */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto">
          <div className="divide-y divide-gray-100">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 py-4">
                {/* Icon */}
                <div className="mt-0.5 shrink-0">
                  <Icon size={18} strokeWidth={1.8} className="text-gray-400" />
                </div>
                {/* Content */}
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">
                    {label}
                  </p>
                  {typeof value === "string" ? (
                    <p className="text-sm font-bold leading-snug text-gray-800 break-all">
                      {value}
                    </p>
                  ) : (
                    value
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =========================================
// Main Page
// =========================================
export default function AllSekolahPage() {
  const [sekolahList, setSekolahList] = useState<SekolahData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSekolah, setSelectedSekolah] = useState<SekolahData | null>(null);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await getAllSchools();
      if (res.success && Array.isArray(res.data)) {
        setSekolahList(
          res.data.map((item) => ({
            id: item.id,
            namaSekolah: item.namaSekolah || item.school_name || "-",
            jenjangKode: item.jenjangKode || "SD",
            jenjangLabel: item.jenjangLabel || JENJANG_LABEL[item.jenjangKode] || "Sekolah Dasar",
            alamat: item.alamat || item.school_address || "-",
            peran: item.peran || "Sekolah",
            username: item.username || "-",
            email: item.email || "-",
            noTelepon: item.noTelepon || item.school_phone || "-",
            tanggalPendaftaran: item.tanggalPendaftaran || item.created_at || "-",
            status: item.status as SekolahData["status"],
          }))
        );
      } else {
        setSekolahList([]);
      }
    } catch {
      setSekolahList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const filteredSekolah = useMemo(() => {
    const q = search.toLowerCase();
    return sekolahList.filter(
      (s) =>
        s.namaSekolah.toLowerCase().includes(q) ||
        s.jenjangKode.toLowerCase().includes(q) ||
        s.jenjangLabel.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [search, sekolahList]);

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
      <div className="flex flex-col flex-1 w-full px-4 py-8 space-y-6 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="flex flex-col gap-4 pb-5 border-b md:flex-row md:items-center md:justify-between border-teal-50">
          <div>
            <h1 className="text-xl font-extrabold text-[#1E5C58]">Daftar Sekolah Pasien</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Kelola dan pantau seluruh akun sekolah yang terdaftar di platform PUSPA.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72 shrink-0">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-[#81B7A9]" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, jenjang, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-teal-50 rounded-xl text-sm focus:ring-2 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all placeholder-gray-400 font-medium text-gray-700 shadow-xs"
            />
          </div>
        </div>

        {/* Table/Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-transparent md:bg-white md:rounded-3xl md:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] md:border md:border-teal-50 overflow-hidden md:p-6 w-full"
        >
          {filteredSekolah.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-white border shadow-xs rounded-3xl md:bg-transparent border-teal-50 md:border-0 md:shadow-none">
              <div className="flex items-center justify-center w-20 h-20 mb-4 border rounded-full bg-teal-50/50 border-teal-100/30">
                <School className="w-10 h-10 text-[#2B7A75] opacity-50" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-700">Sekolah Tidak Ditemukan</h3>
              <p className="max-w-xs text-xs font-semibold leading-relaxed text-gray-400">
                {search
                  ? `Tidak ada hasil yang cocok dengan pencarian "${search}".`
                  : "Belum ada data sekolah yang terdaftar di platform PUSPA."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden w-full md:block">
                <table className="w-full text-left border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[4%]" />
                    <col className="w-[20%]" />
                    <col className="w-[9%]" />
                    <col className="w-[12%]" />
                    <col className="w-[22%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                    <col className="w-[7%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-55">
                      <th className="py-4 px-3 text-[10px] font-bold uppercase tracking-wider">No</th>
                      <th className="py-4 px-3 text-[10px] font-bold uppercase tracking-wider">Nama Sekolah</th>
                      <th className="py-4 px-3 text-[10px] font-bold uppercase tracking-wider">Jenjang</th>
                      <th className="py-4 px-3 text-[10px] font-bold uppercase tracking-wider">Username</th>
                      <th className="py-4 px-3 text-[10px] font-bold uppercase tracking-wider">Email</th>
                      <th className="py-4 px-3 text-[10px] font-bold uppercase tracking-wider">No. Telepon</th>
                      <th className="py-4 px-3 text-[10px] font-bold uppercase tracking-wider">Status</th>
                      <th className="py-4 px-3 text-[10px] font-bold uppercase tracking-wider text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSekolah.map((sekolah, idx) => (
                      <tr
                        key={sekolah.id}
                        className="border-b border-gray-55 last:border-0 hover:bg-[#F4F9F8]/50 transition-colors"
                      >
                        <td className="px-3 py-4 text-xs font-bold text-gray-700">{idx + 1}</td>
                        <td className="px-3 py-4 text-xs font-bold text-gray-800 truncate">{sekolah.namaSekolah}</td>
                        <td className="px-3 py-4">
                          <JenjangBadge kode={sekolah.jenjangKode} />
                        </td>
                        <td className="px-3 py-4 text-xs font-medium text-gray-600 truncate">{sekolah.username}</td>
                        <td className="px-3 py-4 text-xs font-medium text-gray-500 truncate">{sekolah.email}</td>
                        <td className="px-3 py-4 text-xs font-medium text-gray-600">{sekolah.noTelepon}</td>
                        <td className="px-3 py-4">
                          <StatusBadge status={sekolah.status} />
                        </td>
                        <td className="px-3 py-4 text-center">
                          <button
                            onClick={() => setSelectedSekolah(sekolah)}
                            className="cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#EAF4F2] hover:bg-[#2B7A75] text-[#2B7A75] hover:text-white border border-teal-100/50 transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                            title="Lihat Detail"
                          >
                            <Eye size={14} strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block space-y-4 md:hidden">
                {filteredSekolah.map((sekolah, idx) => (
                  <div
                    key={sekolah.id}
                    className="bg-white border border-teal-50 rounded-2xl p-4 space-y-3.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2.5">
                        <span className="text-[10px] font-bold text-[#1E5C58] bg-teal-50 px-2 py-1 rounded-lg border border-teal-100/30 shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{sekolah.namaSekolah}</h4>
                          <div className="mt-1">
                            <JenjangBadge kode={sekolah.jenjangKode} />
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={sekolah.status} />
                    </div>

                    <div className="pt-3 space-y-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User size={12} className="text-[#81B7A9]" />
                        <span>{sekolah.username}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail size={12} className="text-[#81B7A9]" />
                        <span className="break-all">{sekolah.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone size={12} className="text-[#81B7A9]" />
                        <span>{sekolah.noTelepon}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSekolah(sekolah)}
                      className="cursor-pointer w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#EAF4F2] hover:bg-[#2B7A75] text-[#2B7A75] hover:text-white border border-teal-100/50 font-bold text-xs transition-all"
                    >
                      <Eye size={14} strokeWidth={2} />
                      Lihat Detail
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Result count */}
        {filteredSekolah.length > 0 && (
          <p className="-mt-2 text-xs font-medium text-gray-400">
            Menampilkan{" "}
            <span className="font-bold text-[#1E5C58]">{filteredSekolah.length}</span>{" "}
            dari {sekolahList.length} sekolah terdaftar
          </p>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSekolah && (
          <DetailModal
            sekolah={selectedSekolah}
            onClose={() => setSelectedSekolah(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
