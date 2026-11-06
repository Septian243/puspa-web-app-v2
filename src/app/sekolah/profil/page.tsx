"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  School,
  GraduationCap,
  MapPin,
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Edit3,
  Camera,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getProfileSekolah,
  saveProfileSekolah,
  Sekolah,
} from "@/lib/api/ProfileSekolah";

const jenjangPilihan = [
  "PAUD (Pendidikan Anak Usia Dini)",
  "TK (Taman Kanak-Kanak)",
  "SD (Sekolah Dasar)",
  "SMP (Sekolah Menengah Pertama)",
  "SMA (Sekolah Menengah Atas)",
  "SMK (Sekolah Menengah Kejuruan)",
  "SLB (Sekolah Luar Biasa)",
];

export default function ProfilSekolahPage() {
  const [sekolah, setSekolah] = useState<Sekolah | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    nama: "",
    phone: "",
    jenjang: "",
    username: "",
    email: "",
    alamat: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const data = getProfileSekolah();
    setSekolah(data);
    setEditForm({
      nama: data.nama || "",
      phone: data.phone || "",
      jenjang: data.jenjang || "SD (Sekolah Dasar)",
      username: data.username || "",
      email: data.email || "",
      alamat: data.alamat || "",
    });
  }, []);

  const handleStartEdit = () => {
    if (sekolah) {
      setEditForm({
        nama: sekolah.nama || "",
        phone: sekolah.phone || "",
        jenjang: sekolah.jenjang || "SD (Sekolah Dasar)",
        username: sekolah.username || "",
        email: sekolah.email || "",
        alamat: sekolah.alamat || "",
      });
      setErrors({});
    }
    setIsEditing(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!editForm.nama.trim()) newErrors.nama = "Nama sekolah wajib diisi";
    if (!editForm.phone.trim()) {
      newErrors.phone = "Nomor telepon wajib diisi";
    } else if (!/^[0-9+\s-]+$/.test(editForm.phone)) {
      newErrors.phone = "Nomor telepon tidak valid";
    }
    if (!editForm.jenjang.trim()) newErrors.jenjang = "Jenjang wajib dipilih";
    if (!editForm.username.trim()) {
      newErrors.username = "Nama pengguna wajib diisi";
    } else if (/\s/.test(editForm.username)) {
      newErrors.username = "Nama pengguna tidak boleh mengandung spasi";
    }
    if (!editForm.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = "Format email tidak valid";
    }
    if (!editForm.alamat.trim()) newErrors.alamat = "Alamat wajib diisi";
    return newErrors;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const valErrors = validate();
    setErrors(valErrors);
    if (Object.keys(valErrors).length > 0) return;

    if (!sekolah) return;

    const updated: Sekolah = {
      ...sekolah,
      nama: editForm.nama.trim(),
      phone: editForm.phone.trim(),
      jenjang: editForm.jenjang.trim(),
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      alamat: editForm.alamat.trim(),
      updated_at: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    };

    saveProfileSekolah(updated);
    setSekolah(updated);
    setIsEditing(false);
    toast.success("Profil sekolah berhasil diperbarui!", {
      icon: "🎉",
    });
  };

  if (!sekolah) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-3">
        <div className="w-9 h-9 border-3 border-teal-100 border-t-[#1E5C58] rounded-full animate-spin" />
        <p className="text-xs font-medium animate-pulse">Memuat profil sekolah...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-4 mx-auto space-y-6 sm:p-6 md:p-8">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view-profile"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
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
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      className="object-cover bg-white border-4 border-white rounded-full shadow-lg w-28 h-28 sm:w-32 sm:h-32"
                      alt="Foto Profil"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg text-[#2B7A75]">
                      <School className="w-12 h-12 sm:w-16 sm:h-16 text-[#2B7A75]" />
                    </div>
                  )}
                </div>

                {/* School Name & Badges */}
                <div className="flex-1 min-w-0 mt-4 sm:mb-2">
                  <h2 className="text-lg sm:text-2xl font-extrabold text-[#1E5C58] truncate">
                    {sekolah.nama}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                    <span className="px-2.5 py-0.5 bg-teal-50 text-[#1E5C58] text-[10px] font-bold rounded-md uppercase tracking-wide border border-teal-100/30">
                      {sekolah.role || "Sekolah"}
                    </span>
                    <span className="px-2.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-md uppercase tracking-wide border border-gray-100">
                      {sekolah.jenjang || "Pendidikan"}
                    </span>
                  </div>
                </div>

                {/* Edit Profil Button */}
                <div className="w-full mt-5 sm:mt-0 sm:mb-2 shrink-0 sm:w-auto">
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center justify-center gap-1.5 text-white bg-[#2B7A75] hover:bg-[#1E5C58] transition-all px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 active:scale-95 cursor-pointer w-full sm:w-auto"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profil</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ================= CARD 2: INFORMASI SEKOLAH ================= */}
            <div className="bg-white border border-teal-50 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <h3 className="font-extrabold text-[#1E5C58] text-base mb-6 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#2B7A75] rounded-full inline-block" />
                Informasi Sekolah
              </h3>

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
                      {sekolah.nama || "-"}
                    </p>
                  </div>
                </div>

                {/* 2. Jenjang Pendidikan */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                    <GraduationCap className="w-5 h-5 text-[#2B7A75]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Jenjang Pendidikan
                    </p>
                    <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                      {sekolah.jenjang || "-"}
                    </p>
                  </div>
                </div>

                {/* 3. Nama Pengguna (Username) */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                    <User className="w-5 h-5 text-[#2B7A75]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Nama Pengguna
                    </p>
                    <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                      @{sekolah.username || "-"}
                    </p>
                  </div>
                </div>

                {/* 4. Nomor Telepon */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                    <Phone className="w-5 h-5 text-[#2B7A75]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Nomor Telepon
                    </p>
                    <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                      {sekolah.phone || "-"}
                    </p>
                  </div>
                </div>

                {/* 5. Alamat Email (Span 2) */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30 sm:col-span-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                    <Mail className="w-5 h-5 text-[#2B7A75]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Alamat Email
                    </p>
                    <p className="text-sm font-bold text-[#2B7A75] truncate mt-0.5">
                      {sekolah.email || "-"}
                    </p>
                  </div>
                </div>

                {/* 6. Alamat Sekolah (Span 2) */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30 sm:col-span-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                    <MapPin className="w-5 h-5 text-[#2B7A75]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Alamat Sekolah
                    </p>
                    <p className="text-sm font-bold text-gray-700 truncate mt-0.5">
                      {sekolah.alamat || "-"}
                    </p>
                  </div>
                </div>

                {/* 7. Status Akun */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Status Akun
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-sm font-bold capitalize text-emerald-700">
                        {sekolah.status || "Terverifikasi"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 8. User Role */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FBFB] border border-teal-50/30">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
                    <Shield className="w-5 h-5 text-[#2B7A75]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      User Role
                    </p>
                    <p className="text-sm font-bold text-gray-700 capitalize truncate mt-0.5">
                      {sekolah.role || "Sekolah"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ================= EDIT MODE INLINE (SESUAI GAMBAR) ================= */
          <motion.div
            key="edit-profile"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="border border-teal-50 rounded-3xl p-6 sm:p-8 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
          >
            <h2 className="text-xl font-extrabold text-[#1E5C58] mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#2B7A75] rounded-full inline-block" />
              Edit Informasi Sekolah
            </h2>

            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Foto dan upload */}
              <div className="flex flex-col items-center shrink-0 lg:border-r lg:border-gray-100 lg:pr-8">
                <div className="relative group">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#2B7A75] shadow-md bg-white"
                      alt="Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-32 h-32 bg-white border-4 border-teal-200 border-dashed rounded-full">
                      <School className="w-12 h-12 text-[#2B7A75]" />
                    </div>
                  )}
                  <label className="absolute bottom-1 right-1 bg-[#2B7A75] hover:bg-[#1E5C58] p-2.5 rounded-full text-white cursor-pointer shadow-lg transition-all active:scale-90 border-2 border-white">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="mt-4 text-[10px] font-bold text-gray-400 text-center max-w-[150px] uppercase tracking-wide">
                  Ubah Foto Profil
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSave} className="flex flex-col justify-between flex-1">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Nama Lengkap */}
                  <div className="flex flex-col gap-1.5">
                    <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                      Nama Lengkap
                    </label>
                    <input
                      name="nama"
                      value={editForm.nama}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nama: e.target.value })
                      }
                      className={`border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-semibold text-gray-700 bg-white ${errors.nama
                        ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-[#2B7A75]/10 focus:border-[#2B7A75]"
                        }`}
                      placeholder="Masukkan nama sekolah"
                    />
                    {errors.nama && (
                      <p className="ml-1 text-xs text-red-500">{errors.nama}</p>
                    )}
                  </div>

                  {/* Nomor Telepon */}
                  <div className="flex flex-col gap-1.5">
                    <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                      Nomor Telepon
                    </label>
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className={`border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-semibold text-gray-700 bg-white ${errors.phone
                        ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-[#2B7A75]/10 focus:border-[#2B7A75]"
                        }`}
                      placeholder="Contoh: 0812..."
                    />
                    {errors.phone && (
                      <p className="ml-1 text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  {/* Jenjang */}
                  <div className="flex flex-col gap-1.5">
                    <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                      Jenjang
                    </label>
                    <div className="relative">
                      <select
                        name="jenjang"
                        value={editForm.jenjang}
                        onChange={(e) =>
                          setEditForm({ ...editForm, jenjang: e.target.value })
                        }
                        className={`w-full appearance-none border rounded-xl px-4 py-2.5 pr-10 outline-none transition-all text-sm font-semibold text-gray-700 bg-white cursor-pointer ${errors.jenjang
                          ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
                          : "border-gray-200 focus:ring-2 focus:ring-[#2B7A75]/10 focus:border-[#2B7A75]"
                          }`}
                      >
                        {jenjangPilihan.map((j) => (
                          <option key={j} value={j}>
                            {j}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.jenjang && (
                      <p className="ml-1 text-xs text-red-500">{errors.jenjang}</p>
                    )}
                  </div>

                  {/* Nama Pengguna */}
                  <div className="flex flex-col gap-1.5">
                    <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                      Nama Pengguna
                    </label>
                    <input
                      name="username"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                      className={`border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-semibold text-gray-700 bg-white ${errors.username
                        ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-[#2B7A75]/10 focus:border-[#2B7A75]"
                        }`}
                      placeholder="Contoh: sdbakti"
                    />
                    {errors.username && (
                      <p className="ml-1 text-xs text-red-500">{errors.username}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className={`border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-semibold text-gray-700 bg-white ${errors.email
                        ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-[#2B7A75]/10 focus:border-[#2B7A75]"
                        }`}
                      placeholder="contoh@gmail.com"
                    />
                    {errors.email && (
                      <p className="ml-1 text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Alamat */}
                  <div className="flex flex-col gap-1.5">
                    <label className="ml-1 text-xs font-bold text-gray-500 uppercase">
                      Alamat
                    </label>
                    <input
                      name="alamat"
                      value={editForm.alamat}
                      onChange={(e) =>
                        setEditForm({ ...editForm, alamat: e.target.value })
                      }
                      className={`border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-semibold text-gray-700 bg-white ${errors.alamat
                        ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-[#2B7A75]/10 focus:border-[#2B7A75]"
                        }`}
                      placeholder="Masukkan alamat sekolah"
                    />
                    {errors.alamat && (
                      <p className="ml-1 text-xs text-red-500">{errors.alamat}</p>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi Batal & Simpan */}
                <div className="flex flex-col justify-end gap-3 pt-6 mt-10 border-t border-gray-100 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setErrors({});
                    }}
                    className="w-full px-6 py-3 text-xs font-bold text-gray-500 transition-all cursor-pointer rounded-xl bg-gray-50 hover:bg-gray-100 sm:w-auto"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#2B7A75] hover:bg-[#1E5C58] text-white font-bold shadow-md shadow-teal-500/10 transition-all w-full sm:w-auto text-xs active:scale-95 cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
