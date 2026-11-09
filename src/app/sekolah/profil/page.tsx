"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  School,
  Hash,
  UserCheck,
  GraduationCap,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  Edit3,
  AlertCircle,
} from "lucide-react";
import { showErrorToast } from "@/lib/toast";

export default function ProfilSekolahPage() {
  const handlePendingEdit = () => {
    showErrorToast(
      "Fitur ubah profil sekolah berstatus Pending (Menunggu ketersediaan endpoint backend PUT /api/v1/school/profile).",
      "Pending Backend"
    );
  };

  return (
    <div className="max-w-5xl p-4 mx-auto space-y-6 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col gap-6"
      >
        {/* ================= CALLOUT STATUS PENDING ================= */}
        <div className="flex items-start gap-4 p-5 border shadow-xs bg-amber-50/80 border-amber-200/90 rounded-3xl sm:p-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                Pending Backend
              </span>
              <h3 className="text-sm font-extrabold text-amber-900">
                Fitur Profil Sekolah Menunggu Endpoint Backend
              </h3>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed mt-1.5 font-medium">
              Endpoint API untuk memuat dan memperbarui data profil sekolah (
              <code className="px-1.5 py-0.5 bg-amber-100 rounded font-semibold text-amber-900">
                GET/PUT /api/v1/school/profile
              </code>
              ) saat ini belum tersedia di backend Puspa. Seluruh data dummy telah
              dihilangkan dan nilai field sementara ditampilkan dengan tanda strip (
              <strong>-</strong>).
            </p>
          </div>
        </div>

        {/* ================= CARD 1: HEADER PROFIL ================= */}
        <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
          {/* Top Banner Gradient */}
          <div className="h-28 sm:h-36 bg-gradient-to-r from-[#1E5C58] via-[#2B7A75] to-[#81B7A9] relative overflow-hidden">
            <div className="absolute w-48 h-48 rounded-full pointer-events-none -top-12 -right-12 bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 w-32 h-32 rounded-full pointer-events-none left-1/4 bg-teal-400/10 blur-xl" />
          </div>

          {/* Avatar & Title Info */}
          <div className="relative flex flex-col items-center px-6 pb-6 text-center sm:text-left sm:items-end sm:flex-row sm:gap-6 -mt-14 sm:-mt-16">
            {/* Avatar Circle */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg text-[#2B7A75]">
                <School className="w-12 h-12 sm:w-16 sm:h-16 text-[#2B7A75]" />
              </div>
            </div>

            {/* School Name & Badges */}
            <div className="flex-1 min-w-0 mt-4 sm:mb-2">
              <h2 className="text-lg sm:text-2xl font-extrabold text-[#1E5C58] truncate">
                -
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 bg-teal-50 text-[#1E5C58] text-[10px] font-bold rounded-md uppercase tracking-wide border border-teal-100/30">
                  Role: Sekolah
                </span>
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md uppercase tracking-wide border border-amber-200/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending (Menunggu Backend)
                </span>
              </div>
            </div>

            {/* Disabled Edit Profil Button */}
            <div className="w-full mt-5 sm:mt-0 sm:mb-2 shrink-0 sm:w-auto">
              <button
                type="button"
                onClick={handlePendingEdit}
                title="Fitur edit profil sekolah berstatus Pending (Menunggu backend)"
                className="flex items-center justify-center gap-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 cursor-pointer w-full sm:w-auto transition-all"
              >
                <Edit3 className="w-4 h-4 text-gray-400" />
                <span>Edit Profil (Pending)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= CARD 2: INFORMASI SEKOLAH ================= */}
        <div className="bg-white border border-teal-50 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8">
          {/* Sub-Bagian 1: Identitas Lembaga */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-[#2B7A75] rounded-full inline-block" />
              <h3 className="font-extrabold text-[#1E5C58] text-base">
                Identitas Lembaga
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 1. Nama Lengkap Sekolah */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <School className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Nama Sekolah
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    -
                  </p>
                </div>
              </div>

              {/* 2. NPSN */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <Hash className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    NPSN
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    -
                  </p>
                </div>
              </div>

              {/* 3. Penanggung Jawab (PIC) - Kiri */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <UserCheck className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Penanggung Jawab (PIC)
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    -
                  </p>
                </div>
              </div>

              {/* 4. Jenjang Pendidikan - Kanan */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Jenjang Pendidikan
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    -
                  </p>
                </div>
              </div>

              {/* 4. Alamat Sekolah */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30 sm:col-span-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <MapPin className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Alamat Lengkap Sekolah
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    -
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Sub-Bagian 2: Kontak & Informasi Akun */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-[#2B7A75] rounded-full inline-block" />
              <h3 className="font-extrabold text-[#1E5C58] text-base">
                Kontak & Informasi Akun
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 1. Nama Pengguna (Username) */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <User className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Nama Pengguna (Username Akun)
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    -
                  </p>
                </div>
              </div>

              {/* 2. Alamat Email */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <Mail className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Alamat Email
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    -
                  </p>
                </div>
              </div>

              {/* 3. Nomor Telepon */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30 sm:col-span-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <Phone className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Nomor Telepon
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    -
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
