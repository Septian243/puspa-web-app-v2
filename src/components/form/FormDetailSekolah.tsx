"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle2,
  Home,
  Hash,
  BriefcaseMedical,
  Mail,
  Phone,
  CalendarDays,
  Clock,
  X,
  MapPin,
} from "lucide-react";
import { Sekolah } from "@/lib/api/data_sekolah";

interface FormDetailSekolahProps {
  open: boolean;
  onClose: () => void;
  sekolah: Sekolah | null;
}

export default function FormDetailSekolah({
  open,
  onClose,
  sekolah,
}: FormDetailSekolahProps) {
  if (!open || !sekolah) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center bg-[#1E5C58]/20 backdrop-blur-sm z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-[#1E5C58] to-[#2B7A75] p-6 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 z-0 w-32 h-32 transform translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-white/10 blur-2xl" />

            <button
              onClick={onClose}
              type="button"
              className="cursor-pointer absolute right-4 top-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex items-center gap-4">
              <div className="flex items-center justify-center text-white border w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-md border-white/30 shrink-0">
                <UserCircle2 className="w-8 h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold truncate">{sekolah.nama}</h2>
                <div className="flex items-center gap-2 mt-2 opacity-95 text-[10px] uppercase tracking-wider font-bold flex-nowrap overflow-x-auto no-scrollbar">
                  <span className="px-3 py-1 rounded-full bg-white/20 border border-white/20 shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <Home className="w-3.5 h-3.5 shrink-0" />
                    <span>{(sekolah.jenjang || "").split(" (")[0].trim() || "-"}</span>
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full border shadow-xs whitespace-nowrap shrink-0 ${
                      sekolah.status?.toLowerCase() === "terverifikasi"
                        ? "bg-white/20 border-white/20 text-white"
                        : "bg-rose-500/30 border-rose-300/40 text-rose-100"
                    }`}
                  >
                    {sekolah.status || "Tidak Terverifikasi"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="grid gap-3">
              {/* Nama Sekolah & Role */}
              <div className="flex items-start gap-3 bg-[#F4F9F8] p-3.5 rounded-xl border border-teal-50">
                <BriefcaseMedical className="w-5 h-5 text-[#2B7A75] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">
                    Nama Sekolah & Role
                  </p>
                  <p className="text-sm font-bold text-[#1E5C58]">
                    @{sekolah.username} ({sekolah.role?.toLowerCase() || "sekolah"})
                  </p>
                </div>
              </div>

              {/* NPSN */}
              <div className="flex items-start gap-3 bg-[#F4F9F8] p-3.5 rounded-xl border border-teal-50">
                <Hash className="w-5 h-5 text-[#2B7A75] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">
                    NPSN (Nomor Pokok Sekolah Nasional)
                  </p>
                  <p className="text-sm font-bold text-[#1E5C58]">
                    {sekolah.npsn || "-"}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3 bg-[#F4F9F8] p-3.5 rounded-xl border border-teal-50">
                <Mail className="w-5 h-5 text-[#2B7A75] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-bold text-[#1E5C58]">
                    {sekolah.email}
                  </p>
                </div>
              </div>

              {/* Telepon */}
              <div className="flex items-start gap-3 bg-[#F4F9F8] p-3.5 rounded-xl border border-teal-50">
                <Phone className="w-5 h-5 text-[#2B7A75] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">
                    Telepon
                  </p>
                  <p className="text-sm font-bold text-[#1E5C58]">
                    {sekolah.phone || "-"}
                  </p>
                </div>
              </div>

              {/* Alamat */}
              {sekolah.alamat && (
                <div className="flex items-start gap-3 bg-[#F4F9F8] p-3.5 rounded-xl border border-teal-50">
                  <MapPin className="w-5 h-5 text-[#2B7A75] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">
                      Alamat
                    </p>
                    <p className="text-sm font-bold text-[#1E5C58]">
                      {sekolah.alamat}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <hr className="my-2 border-teal-50" />

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1">
                  <CalendarDays className="w-3.5 h-3.5" /> Ditambahkan
                </div>
                <p className="text-xs font-bold text-gray-700">
                  {sekolah.created_at || sekolah.tanggalPendaftaran || "-"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1">
                  <Clock className="w-3.5 h-3.5" /> Terakhir Ubah
                </div>
                <p className="text-xs font-bold text-gray-700">
                  {sekolah.updated_at || sekolah.created_at || "-"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

