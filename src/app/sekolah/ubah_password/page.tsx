"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, ChevronLeft, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { updatePassword, UpdatePasswordPayload } from "@/lib/api/profile";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

export default function UbahPasswordSekolahPage() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // TanStack Query Mutation untuk Update Password (PUT /api/v1/profile/update-password)
  const mutation = useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => updatePassword(payload),
    onSuccess: (res) => {
      if (res?.success) {
        showSuccessToast(res.message || "Password berhasil diperbarui!", "Berhasil");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
      } else {
        const errorMsg =
          typeof res?.message === "string"
            ? res.message
            : "Gagal mengubah password. Pastikan password saat ini sudah benar.";
        showErrorToast(errorMsg, "Gagal Memperbarui");
      }
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Terjadi kesalahan saat menghubungi server.";
      showErrorToast(msg, "Gagal");
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!currentPassword.trim()) {
      errs.currentPassword = "Password saat ini wajib diisi";
    }

    if (!newPassword.trim()) {
      errs.newPassword = "Password baru wajib diisi";
    } else if (newPassword.length < 8) {
      errs.newPassword = "Password baru minimal 8 karakter";
    }

    if (!confirmPassword.trim()) {
      errs.confirmPassword = "Konfirmasi password baru wajib diisi";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Konfirmasi password baru tidak cocok";
    }

    return errs;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const valErrors = validate();
    setErrors(valErrors);

    if (Object.keys(valErrors).length > 0) {
      showErrorToast("Harap periksa kembali isian form ubah password.", "Validasi Gagal");
      return;
    }

    mutation.mutate({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    });
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-teal-50 text-[#1E5C58]"
      >
        {/* Header Ubah Password */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 mb-3 border rounded-2xl bg-teal-50/60 border-teal-100/50 text-[#2B7A75]">
            <Lock className="w-6 h-6" strokeWidth={2} />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E5C58] text-center tracking-tight">
            Ubah Password
          </h2>
          <p className="mt-1 text-xs font-semibold text-center text-gray-400">
            Pastikan password baru Anda kuat dan aman
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. PASSWORD SAAT INI */}
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
              Password Saat Ini
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-4 pr-12 py-3 border rounded-xl outline-none transition-all text-sm font-semibold text-gray-700 bg-white placeholder:text-gray-400 ${
                  errors.currentPassword
                    ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
                    : "border-gray-200 focus:ring-2 focus:ring-[#2B7A75]/10 focus:border-[#2B7A75]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2B7A75] transition-colors p-1 cursor-pointer"
                title={showCurrent ? "Sembunyikan password" : "Lihat password"}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 ml-1 text-xs font-medium text-red-500">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* 2. PASSWORD BARU */}
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-4 pr-12 py-3 border rounded-xl outline-none transition-all text-sm font-semibold text-gray-700 bg-white placeholder:text-gray-400 ${
                  errors.newPassword
                    ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
                    : "border-gray-200 focus:ring-2 focus:ring-[#2B7A75]/10 focus:border-[#2B7A75]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2B7A75] transition-colors p-1 cursor-pointer"
                title={showNew ? "Sembunyikan password" : "Lihat password"}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 ml-1 text-xs font-medium text-red-500">
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* 3. KONFIRMASI PASSWORD BARU */}
          <div className="space-y-1.5">
            <label className="ml-1 text-xs font-bold tracking-wider text-gray-500 uppercase">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-4 pr-12 py-3 border rounded-xl outline-none transition-all text-sm font-semibold text-gray-700 bg-white placeholder:text-gray-400 ${
                  errors.confirmPassword
                    ? "border-red-300 focus:ring-2 focus:ring-red-500/10 focus:border-red-500"
                    : "border-gray-200 focus:ring-2 focus:ring-[#2B7A75]/10 focus:border-[#2B7A75]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2B7A75] transition-colors p-1 cursor-pointer"
                title={showConfirm ? "Sembunyikan password" : "Lihat password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 ml-1 text-xs font-medium text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Divider & Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-6 mt-8 border-t border-gray-100">
            <Link
              href="/sekolah/profil"
              className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold transition-all text-xs active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Kembali</span>
            </Link>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-[#2B7A75] hover:bg-[#1E5C58] text-white font-bold shadow-md shadow-teal-500/10 transition-all text-xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {mutation.isPending ? (
                <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
