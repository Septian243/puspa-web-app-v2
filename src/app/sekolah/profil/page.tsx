"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  School,
  Hash,
  UserCheck,
  GraduationCap,
  MapPin,
  User,
  Mail,
  Phone,
  Edit3,
  X,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSchoolProfile, updateSchoolProfile, SchoolProfileData } from "@/lib/api/ProfileSekolah";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

export default function ProfilSekolahPage() {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch Profil Sekolah dari backend
  const { data: profile, isLoading } = useQuery({
    queryKey: ["school-profile"],
    queryFn: () => getSchoolProfile(),
  });

  // Form State untuk Modal Edit
  const [formData, setFormData] = useState<SchoolProfileData>({
    school_name: "",
    npsn: "",
    jenjang: "SD",
    pic_name: "",
    school_phone: "",
    school_address: "",
  });

  const handleOpenEdit = () => {
    if (profile) {
      setFormData({
        school_name: profile.school_name || profile.nama || "",
        npsn: profile.npsn || "",
        jenjang: profile.jenjang || "SD",
        pic_name: profile.pic_name || "",
        school_phone: profile.school_phone || profile.phone || "",
        school_address: profile.school_address || profile.alamat || "",
      });
    }
    setIsEditOpen(true);
  };

  // Mutation Update Profil
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<SchoolProfileData>) => updateSchoolProfile(payload),
    onSuccess: () => {
      showSuccessToast("Profil sekolah berhasil diperbarui!", "Berhasil");
      queryClient.invalidateQueries({ queryKey: ["school-profile"] });
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gagal memperbarui profil sekolah.";
      showErrorToast(msg, "Gagal");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-3">
        <div className="w-9 h-9 border-3 border-teal-100 border-t-[#1E5C58] rounded-full animate-spin" />
        <p className="text-xs font-medium animate-pulse">Memuat profil sekolah...</p>
      </div>
    );
  }

  const schoolName = profile?.school_name || profile?.nama || "-";
  const npsn = profile?.npsn || "-";
  const picName = profile?.pic_name || "-";
  const jenjang = profile?.jenjang || "-";
  const schoolAddress = profile?.school_address || profile?.alamat || "-";
  const username = profile?.username || "-";
  const email = profile?.email || "-";
  const schoolPhone = profile?.school_phone || profile?.phone || "-";

  return (
    <div className="max-w-5xl p-4 mx-auto space-y-6 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col gap-6"
      >
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
                {schoolName}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 bg-teal-50 text-[#1E5C58] text-[10px] font-bold rounded-md uppercase tracking-wide border border-teal-100/30">
                  Role: Sekolah
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md uppercase tracking-wide border border-emerald-200/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Terverifikasi
                </span>
                {jenjang !== "-" && (
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wide border border-blue-200/60">
                    Jenjang: {jenjang}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Profil Button */}
            <div className="w-full mt-5 sm:mt-0 sm:mb-2 shrink-0 sm:w-auto">
              <button
                type="button"
                onClick={handleOpenEdit}
                className="flex items-center justify-center gap-2 text-white bg-[#1E5C58] hover:bg-[#174d49] border border-transparent px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-900/10 active:scale-95 cursor-pointer w-full sm:w-auto transition-all"
              >
                <Edit3 className="w-4 h-4 text-white" />
                <span>Ubah Profil</span>
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
                    {schoolName}
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
                    {npsn}
                  </p>
                </div>
              </div>

              {/* 3. Penanggung Jawab (PIC) */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <UserCheck className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Penanggung Jawab (PIC)
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    {picName}
                  </p>
                </div>
              </div>

              {/* 4. Jenjang Pendidikan */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Jenjang Pendidikan
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                    {jenjang}
                  </p>
                </div>
              </div>

              {/* 5. Alamat Sekolah */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30 sm:col-span-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                  <MapPin className="w-5 h-5 text-[#2B7A75]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Alamat Lengkap Sekolah
                  </p>
                  <p className="text-sm font-bold text-gray-700 mt-0.5 leading-relaxed">
                    {schoolAddress}
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
                    {username}
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
                    {email}
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
                    {schoolPhone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================= MODAL EDIT PROFIL SEKOLAH ================= */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-teal-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#1E5C58] text-white">
                <div className="flex items-center gap-2.5">
                  <School className="w-5 h-5 text-teal-200" />
                  <h3 className="font-extrabold text-base">Ubah Profil Sekolah</h3>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Nama Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.school_name || ""}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#1E5C58] focus:ring-1 focus:ring-[#1E5C58]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      NPSN
                    </label>
                    <input
                      type="text"
                      value={formData.npsn || ""}
                      onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#1E5C58]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Jenjang
                    </label>
                    <select
                      value={formData.jenjang || "SD"}
                      onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#1E5C58]"
                    >
                      <option value="PAUD">PAUD</option>
                      <option value="TK">TK</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="SMK">SMK</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      PIC (Penanggung Jawab)
                    </label>
                    <input
                      type="text"
                      value={formData.pic_name || ""}
                      onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#1E5C58]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      No. Telepon Sekolah
                    </label>
                    <input
                      type="text"
                      value={formData.school_phone || ""}
                      onChange={(e) => setFormData({ ...formData, school_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#1E5C58]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Alamat Lengkap Sekolah
                  </label>
                  <textarea
                    rows={3}
                    value={formData.school_address || ""}
                    onChange={(e) => setFormData({ ...formData, school_address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-[#1E5C58]"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#1E5C58] hover:bg-[#174d49] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{updateMutation.isPending ? "Menyimpan..." : "Simpan Profil"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
