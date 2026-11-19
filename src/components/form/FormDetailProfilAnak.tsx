"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Smile, X, Info, Calendar, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getSchoolStudentDetail } from "@/lib/api/laporanAsesmenSekolah";

function formatUsia(birthDateStr: string | null | undefined, fallbackAge?: number | null): string {
  if (!birthDateStr) {
    return fallbackAge != null ? `${fallbackAge} Tahun` : "-";
  }

  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) {
    return fallbackAge != null ? `${fallbackAge} Tahun` : "-";
  }

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return "-";

  if (years === 0) {
    return `${months} Bulan`;
  }

  if (months === 0) {
    return `${years} Tahun`;
  }

  return `${years} Tahun ${months} Bulan`;
}

function formatTanggal(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface FormDetailProfilAnakProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  childId?: string | null;
}

export default function FormDetailProfilAnak({
  open,
  isOpen,
  onClose,
  childId,
}: FormDetailProfilAnakProps) {
  const isModalOpen = Boolean(open ?? isOpen);

  // TanStack Query untuk Detail Profil Siswa (GET /api/v1/school/students/{childId})
  const { data: student, isLoading } = useQuery({
    queryKey: queryKeys.school.studentDetail(childId || ""),
    queryFn: () => getSchoolStudentDetail(childId!),
    enabled: isModalOpen && Boolean(childId),
    staleTime: 0,
  });

  if (!isModalOpen) return null;

  const primaryGuardian =
    student?.guardians?.find((g) => g.guardian_phone && g.guardian_phone !== "-") ||
    student?.guardians?.[0];
  const guardianName = primaryGuardian?.guardian_name || "-";
  const guardianPhone = primaryGuardian?.guardian_phone || "-";
  const religion = student?.child_religion || "-";
  const address = student?.child_address || "-";
  const formattedBirthDate = formatTanggal(student?.child_birth_date);
  const birthPlaceDate =
    student?.child_birth_place && student?.child_birth_date
      ? `${student.child_birth_place}, ${formattedBirthDate}`
      : formattedBirthDate !== "-"
        ? formattedBirthDate
        : student?.child_birth_place || "-";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl overflow-hidden bg-white border shadow-2xl rounded-3xl border-teal-50"
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
              className="p-2 text-gray-400 transition-colors cursor-pointer rounded-xl hover:text-gray-600 hover:bg-gray-100"
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
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
                  <div className="w-8 h-8 border-3 border-teal-100 border-t-[#1E5C58] rounded-full animate-spin" />
                  <p className="text-xs font-medium animate-pulse">
                    Memuat rincian profil siswa...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                  {/* Nama Lengkap */}
                  <div>
                    <p className="text-xs font-medium text-gray-400">Nama Lengkap</p>
                    <p className="text-base font-extrabold text-[#1E5C58] mt-1">
                      {student?.child_name || "-"}
                    </p>
                  </div>

                  {/* Tempat, Tanggal Lahir */}
                  <div>
                    <p className="text-xs font-medium text-gray-400">Tempat, Tanggal Lahir</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#1E5C58]" />
                      <span>{birthPlaceDate}</span>
                    </p>
                  </div>

                  {/* Usia */}
                  <div>
                    <p className="text-xs font-medium text-gray-400">Usia</p>
                    <p className="mt-1 text-xs font-bold text-gray-800 sm:text-sm">
                      {formatUsia(student?.child_birth_date, student?.age)}
                    </p>
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <p className="text-xs font-medium text-gray-400">Jenis Kelamin</p>
                    <p className="mt-1 text-xs font-bold text-gray-800 sm:text-sm">
                      {student?.child_gender || "-"}
                    </p>
                  </div>

                  {/* Agama */}
                  <div>
                    <p className="text-xs font-medium text-gray-400">Agama</p>
                    <p className="mt-1 text-xs font-bold text-gray-800 sm:text-sm">
                      {religion}
                    </p>
                  </div>

                  {/* Alamat */}
                  <div>
                    <p className="text-xs font-medium text-gray-400">Alamat</p>
                    <p className="mt-1 text-xs font-bold text-gray-800 sm:text-sm">
                      {address}
                    </p>
                  </div>

                  {/* Nama Orangtua / Wali */}
                  <div>
                    <p className="text-xs font-medium text-gray-400">Nama Orangtua / Wali</p>
                    <p className="text-xs sm:text-sm font-bold text-[#1E5C58] mt-1">
                      {guardianName}
                    </p>
                  </div>

                  {/* Nomor Handphone */}
                  <div>
                    <p className="text-xs font-medium text-gray-400">Nomor Handphone</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{guardianPhone}</span>
                    </p>
                  </div>
                </div>
              )}
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
