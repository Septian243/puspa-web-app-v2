"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";

// =========================================
// Types
// =========================================
interface SekolahData {
  id: number;
  namaSekolah: string;
  jenjangKode: string;         // "SD" | "SMP" | "SMA" | "PAUD" | "SMK"
  jenjangLabel: string;        // "Sekolah Dasar" | "Sekolah Menengah Pertama" dst
  alamat: string;
  peran: string;               // e.g. "Sekolah"
  username: string;
  email: string;
  noTelepon: string;
  tanggalPendaftaran: string;  // display format: "04 November 2026 15:03:38"
  status: "Terverifikasi" | "Tidak Terverifikasi";
}

// =========================================
// Jenjang Label Map
// =========================================
const JENJANG_LABEL: Record<string, string> = {
  PAUD: "Pendidikan Anak Usia Dini",
  SD:   "Sekolah Dasar",
  SMP:  "Sekolah Menengah Pertama",
  SMA:  "Sekolah Menengah Atas",
  SMK:  "Sekolah Menengah Kejuruan",
};

// =========================================
// Mock Data (replace with API call later)
// =========================================
const MOCK_SEKOLAH: SekolahData[] = [
  {
    id: 1,
    namaSekolah: "SD 1 Jamsaren",
    jenjangKode: "SD",
    jenjangLabel: JENJANG_LABEL["SD"],
    alamat: "Serengan Surakarta",
    peran: "Sekolah",
    username: "jamsaren01",
    email: "jamsaren01@mail.com",
    noTelepon: "08823451676812",
    tanggalPendaftaran: "04 November 2026 15:03:38",
    status: "Terverifikasi",
  },
  {
    id: 2,
    namaSekolah: "PAUD Ahmad Dahlan",
    jenjangKode: "PAUD",
    jenjangLabel: JENJANG_LABEL["PAUD"],
    alamat: "Laweyan Surakarta",
    peran: "Sekolah",
    username: "ahmaddahlah",
    email: "ahmaddahlah@gmail.com",
    noTelepon: "08123456789",
    tanggalPendaftaran: "27 June 2026 09:14:21",
    status: "Tidak Terverifikasi",
  },
  {
    id: 3,
    namaSekolah: "SMP N 9 Surakarta",
    jenjangKode: "SMP",
    jenjangLabel: JENJANG_LABEL["SMP"],
    alamat: "Banjarsari Surakarta",
    peran: "Sekolah",
    username: "09esempe",
    email: "09esempe@gmail.com",
    noTelepon: "123456789012",
    tanggalPendaftaran: "30 September 2026 11:22:00",
    status: "Terverifikasi",
  },
  {
    id: 4,
    namaSekolah: "SD Al Islam 1",
    jenjangKode: "SD",
    jenjangLabel: JENJANG_LABEL["SD"],
    alamat: "Pasar Kliwon Surakarta",
    peran: "Sekolah",
    username: "alislam01",
    email: "alislam01@gmail.com",
    noTelepon: "080090898979",
    tanggalPendaftaran: "04 November 2026 10:45:55",
    status: "Terverifikasi",
  },
];

// =========================================
// Status Badge Component
// =========================================
function StatusBadge({ status }: { status: SekolahData["status"] }) {
  const isVerified = status === "Terverifikasi";
  return (
    <div
      className={`inline-flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-center leading-tight border transition-all ${
        isVerified
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
    SD:   "bg-blue-50 text-blue-700 border-blue-200/60",
    SMP:  "bg-amber-50 text-amber-700 border-amber-200/60",
    SMA:  "bg-teal-50 text-teal-700 border-teal-200/60",
    SMK:  "bg-orange-50 text-orange-700 border-orange-200/60",
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
    { icon: School,   label: "NAMA SEKOLAH",        value: sekolah.namaSekolah },
    { icon: BookOpen, label: "JENJANG",              value: sekolah.jenjangLabel },
    { icon: MapPin,   label: "ALAMAT",               value: sekolah.alamat },
    {
      icon: BadgeCheck,
      label: "PERAN / JABATAN",
      value: (
        <span className="inline-block mt-0.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#EAF4F2] text-[#1E5C58] border border-teal-100">
          {sekolah.peran}
        </span>
      ),
    },
    { icon: User,     label: "USERNAME",             value: sekolah.username },
    { icon: Mail,     label: "ALAMAT EMAIL",         value: sekolah.email },
    { icon: Phone,    label: "NO. TELEPON",          value: sekolah.noTelepon },
    { icon: Calendar, label: "TANGGAL PENDAFTARAN",  value: sekolah.tanggalPendaftaran },
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
            className="cursor-pointer w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={17} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Modal Body (scrollable) ── */}
        <div className="overflow-y-auto flex-1 px-6 pb-6">
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
                    <p className="text-sm font-bold text-gray-800 leading-snug break-all">
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
  const [search, setSearch] = useState("");
  const [selectedSekolah, setSelectedSekolah] = useState<SekolahData | null>(null);

  const filteredSekolah = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_SEKOLAH.filter(
      (s) =>
        s.namaSekolah.toLowerCase().includes(q) ||
        s.jenjangKode.toLowerCase().includes(q) ||
        s.jenjangLabel.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
      <div className="flex flex-col flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-teal-50 pb-5">
          <div>
            <h1 className="text-xl font-extrabold text-[#1E5C58]">Daftar Sekolah Pasien</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Kelola dan pantau seluruh akun sekolah yang terdaftar di platform PUSPA.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
            <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-3xl md:bg-transparent border border-teal-50 md:border-0 shadow-xs md:shadow-none">
              <div className="w-20 h-20 bg-teal-50/50 rounded-full flex items-center justify-center mb-4 border border-teal-100/30">
                <School className="w-10 h-10 text-[#2B7A75] opacity-50" />
              </div>
              <h3 className="text-base font-bold text-gray-700 mb-1">Sekolah Tidak Ditemukan</h3>
              <p className="text-gray-400 text-xs max-w-xs font-semibold leading-relaxed">
                {search
                  ? `Tidak ada hasil yang cocok dengan pencarian "${search}".`
                  : "Belum ada data sekolah yang terdaftar di platform PUSPA."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block w-full">
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
                    <tr className="border-b border-gray-55 text-gray-400">
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
                        <td className="py-4 px-3 text-xs font-bold text-gray-700">{idx + 1}</td>
                        <td className="py-4 px-3 text-xs font-bold text-gray-800 truncate">{sekolah.namaSekolah}</td>
                        <td className="py-4 px-3">
                          <JenjangBadge kode={sekolah.jenjangKode} />
                        </td>
                        <td className="py-4 px-3 text-xs font-medium text-gray-600 truncate">{sekolah.username}</td>
                        <td className="py-4 px-3 text-xs font-medium text-gray-500 truncate">{sekolah.email}</td>
                        <td className="py-4 px-3 text-xs font-medium text-gray-600">{sekolah.noTelepon}</td>
                        <td className="py-4 px-3">
                          <StatusBadge status={sekolah.status} />
                        </td>
                        <td className="py-4 px-3 text-center">
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
              <div className="block md:hidden space-y-4">
                {filteredSekolah.map((sekolah, idx) => (
                  <div
                    key={sekolah.id}
                    className="bg-white border border-teal-50 rounded-2xl p-4 space-y-3.5 shadow-xs"
                  >
                    <div className="flex justify-between items-start">
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

                    <div className="pt-3 border-t border-gray-100 space-y-2">
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
          <p className="text-xs text-gray-400 font-medium -mt-2">
            Menampilkan{" "}
            <span className="font-bold text-[#1E5C58]">{filteredSekolah.length}</span>{" "}
            dari {MOCK_SEKOLAH.length} sekolah terdaftar
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
