"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  UserCog,
  Edit3,
  X,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";

import { handleApiError } from "@/lib/api-error";
import { createHandleChange } from "@/lib/formUtils";

interface FormUbahTerapisProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (data: {
    nama: string;
    bidang: string;
    username: string;
    email: string;
    telepon: string;
  }) => void;
  initialData?: {
    nama: string;
    bidang: string;
    username: string;
    email: string;
    telepon: string;
  };
}

const bidangOptions = [
  "Fisioterapi",
  "Okupasi Terapi",
  "Terapi Wicara",
  "Paedagog",
];

export default function FormUbahTerapis({
  open,
  onClose,
  onUpdate,
  initialData,
}: FormUbahTerapisProps) {
  const [formData, setFormData] = useState({
    nama: "",
    bidang: "",
    username: "",
    email: "",
    telepon: "",
  });

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        nama: initialData.nama || "",
        bidang: initialData.bidang || "",
        username: initialData.username || "",
        email: initialData.email || "",
        telepon: initialData.telepon || "",
      });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = createHandleChange(setFormData, {
    numericFields: ["telepon"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nama ||
      !formData.bidang ||
      !formData.username ||
      !formData.email ||
      !formData.telepon
    ) {
      handleApiError(null, "Semua field wajib diisi!");
      return;
    }

    onUpdate(formData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center bg-[#1E5C58]/20 backdrop-blur-sm z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-3xl"
        >
          {/* Header */}
          <div className="relative p-6 overflow-hidden text-white bg-linear-to-br from-amber-500 to-amber-600">
            <div className="absolute top-0 right-0 z-0 w-32 h-32 transform translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-white/10 blur-2xl" />

            <button
              onClick={onClose}
              className="cursor-pointer absolute right-4 top-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 text-white border bg-white/20 rounded-2xl backdrop-blur-md border-white/30 shrink-0">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Ubah Data Terapis</h2>
                <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-white/80">
                  <UserCog className="w-3.5 h-3.5" /> @{initialData?.username}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Input Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Nama Lengkap
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-amber-500" />
                </div>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className="w-full py-3 pr-4 text-sm font-medium text-gray-700 transition-all border border-gray-200 outline-none pl-11 bg-gray-50 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                  required
                />
              </div>
            </div>

            {/* Input Bidang */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Bidang / Spesialisasi
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Stethoscope className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-amber-500" />
                </div>
                <select
                  name="bidang"
                  value={formData.bidang}
                  onChange={handleChange}
                  className="w-full py-3 pr-4 text-sm font-medium text-gray-700 transition-all border border-gray-200 outline-none appearance-none cursor-pointer pl-11 bg-gray-50 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                  required
                >
                  <option value="" disabled>
                    Pilih Bidang Terapis
                  </option>
                  {bidangOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Nama Pengguna
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserCog className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-amber-500" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full py-3 pr-4 text-sm font-medium text-gray-700 transition-all border border-gray-200 outline-none pl-11 bg-gray-50 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                  required
                />
              </div>
            </div>

            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-amber-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full py-3 pr-4 text-sm font-medium text-gray-700 transition-all border border-gray-200 outline-none pl-11 bg-gray-50 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                  required
                />
              </div>
            </div>

            {/* Input Telepon */}
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-gray-700">
                Telepon
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-amber-500" />
                </div>
                <input
                  type="tel"
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleChange}
                  inputMode="numeric"
                  minLength={6}
                  maxLength={14}
                  className="w-full py-3 pr-4 text-sm font-medium text-gray-700 transition-all border border-gray-200 outline-none pl-11 bg-gray-50 rounded-xl focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                  required
                />
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="cursor-pointer px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
