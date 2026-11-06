"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Smile, X, Info, Calendar, Phone } from "lucide-react";
import { LaporanAsesmenSekolah } from "@/lib/api/laporanAsesmenSekolah";

interface FormDetailProfilAnakProps {
  open: boolean;
  onClose: () => void;
  anak: LaporanAsesmenSekolah | null;
}

export default function FormDetailProfilAnak({
  open,
  onClose,
  anak,
}: FormDetailProfilAnakProps) {
  if (!open || !anak) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-teal-50 overflow-hidden"
        >
          {/* Header Modal */}
          <div className="flex items-center justify-between p-6 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#E6F8F4] flex items-center justify-center text-[#1E5C58]">
                <Smile className="w-6 h-6 text-[#1E5C58]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#1E5C58] tracking-tight">
                  Detail Profil Anak
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Rincian informasi pasien
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Modal Detail */}
          <div className="p-6 sm:p-7 space-y-3.5">
            {/* Section Title */}
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
              <Info className="w-4 h-4 text-gray-400" />
              <span>INFORMASI ANAK</span>
            </div>

            {/* Information Card Container */}
            <div className="rounded-3xl border border-teal-50/70 bg-[#F4F9F8]/60 p-6 sm:p-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                {/* Nama Lengkap */}
                <div>
                  <p className="text-xs text-gray-400 font-medium">Nama Lengkap</p>
                  <p className="text-base font-extrabold text-[#1E5C58] mt-1">
                    {anak.namaAnak}
                  </p>
                </div>

                {/* Tempat, Tanggal Lahir */}
                <div>
                  <p className="text-xs text-gray-400 font-medium">Tempat, Tanggal Lahir</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#1E5C58]" />
                    <span>
                      {anak.tempatLahir ? `${anak.tempatLahir}, ` : ""}
                      {anak.tanggalLahir}
                    </span>
                  </p>
                </div>

                {/* Usia */}
                <div>
                  <p className="text-xs text-gray-400 font-medium">Usia</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
                    {anak.usia}
                  </p>
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <p className="text-xs text-gray-400 font-medium">Jenis Kelamin</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
                    {anak.jenisKelamin}
                  </p>
                </div>

                {/* Agama */}
                <div>
                  <p className="text-xs text-gray-400 font-medium">Agama</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
                    {anak.agama || "-"}
                  </p>
                </div>

                {/* Alamat */}
                <div>
                  <p className="text-xs text-gray-400 font-medium">Alamat</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
                    {anak.alamat || "Gayam"}
                  </p>
                </div>

                {/* Nama Orangtua / Wali */}
                <div>
                  <p className="text-xs text-gray-400 font-medium">Nama Orangtua / Wali</p>
                  <p className="text-xs sm:text-sm font-bold text-[#1E5C58] mt-1">
                    {anak.namaOrangTua}
                  </p>
                </div>

                {/* Nomor Handphone */}
                <div>
                  <p className="text-xs text-gray-400 font-medium">Nomor Handphone</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#1E5C58]" />
                    <span>{anak.teleponOrangTua}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Modal Actions */}
          <div className="flex items-center justify-end p-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-7 py-2.5 rounded-2xl bg-[#245D56] hover:bg-[#1C4B45] text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

