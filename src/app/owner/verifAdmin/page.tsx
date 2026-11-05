"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Check,
  X,
  Wallet,
  ClipboardCheck,
  Heart,
  RotateCcw,
} from "lucide-react";
import {
  getUnverifiedAdmins,
  activateAdmin,
  deactivateAdmin,
} from "@/lib/api/ownerAdmin";

interface AdminData {
  user_id: string;
  admin_id: string;
  admin_name: string;
  email: string;
  admin_phone: string;
  createdAt: string;
}

const DEFAULT_SAMPLE_ADMINS: AdminData[] = [
  {
    user_id: "sample-1",
    admin_id: "adm-001",
    admin_name: "Kaila",
    email: "kaila@gmail.com",
    admin_phone: "081234567890",
    createdAt: "24 April 2026",
  },
  {
    user_id: "sample-2",
    admin_id: "adm-002",
    admin_name: "Budi Santoso",
    email: "budi.santoso@gmail.com",
    admin_phone: "088234567891",
    createdAt: "02 Mei 2026",
  },
];

const ROLE_OPTIONS = [
  {
    id: "keuangan",
    title: "Admin Keuangan",
    desc: "Mengelola tagihan, pembayaran, dan pengembalian dana pasien.",
    icon: Wallet,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "presensi",
    title: "Admin Presensi",
    desc: "Mengelola kehadiran terapi serta pencatatan izin, sakit, dan tidak hadir.",
    icon: ClipboardCheck,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "layanan",
    title: "Admin Layanan",
    desc: "Mengelola jadwal observasi, asesmen, dan terapi pasien.",
    icon: Heart,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
];

function formatTanggalDaftar(dateString?: string): string {
  if (!dateString) return "-";
  if (/[a-zA-Z]/.test(dateString) && !dateString.includes("T")) {
    return dateString;
  }
  try {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  } catch {
    // fallback
  }
  return dateString.split(" ").slice(0, 3).join(" ");
}

const VerifikasiAdminPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal States
  const [approveModalAdmin, setApproveModalAdmin] = useState<AdminData | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rejectModalAdmin, setRejectModalAdmin] = useState<AdminData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchUnverifiedAdmins = async () => {
    setLoading(true);
    try {
      const res = await getUnverifiedAdmins();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setAdmins(res.data);
      } else {
        // Fallback to sample data if backend has no pending admins
        setAdmins(DEFAULT_SAMPLE_ADMINS);
      }
    } catch (err) {
      console.error(err);
      setAdmins(DEFAULT_SAMPLE_ADMINS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnverifiedAdmins();
  }, []);

  const handleOpenApproveModal = (admin: AdminData) => {
    setSelectedRole(null);
    setApproveModalAdmin(admin);
  };

  const handleOpenRejectModal = (admin: AdminData) => {
    setRejectModalAdmin(admin);
  };

  const handleApproveConfirm = async () => {
    if (!approveModalAdmin || !selectedRole) return;
    setIsSubmitting(true);

    const targetAdmin = approveModalAdmin;
    const selectedRoleData = ROLE_OPTIONS.find((r) => r.id === selectedRole);

    try {
      if (!targetAdmin.user_id.startsWith("sample-")) {
        await activateAdmin(targetAdmin.user_id);
      }
      setAdmins((prev) => prev.filter((a) => a.user_id !== targetAdmin.user_id));
      setApproveModalAdmin(null);
      setSelectedRole(null);
      showToast(
        `Admin ${targetAdmin.admin_name} berhasil disetujui sebagai ${selectedRoleData?.title}!`
      );
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan saat memproses persetujuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalAdmin) return;
    setIsSubmitting(true);

    const targetAdmin = rejectModalAdmin;

    try {
      if (!targetAdmin.user_id.startsWith("sample-")) {
        await deactivateAdmin(targetAdmin.user_id);
      }
      setAdmins((prev) => prev.filter((a) => a.user_id !== targetAdmin.user_id));
      setRejectModalAdmin(null);
      showToast(`Pendaftaran admin ${targetAdmin.admin_name} telah ditolak.`);
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan saat memproses penolakan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetData = () => {
    setAdmins(DEFAULT_SAMPLE_ADMINS);
    setSearch("");
    showToast("Data verifikasi admin berhasil direset.");
  };

  const filteredAdmins = admins.filter(
    (item) =>
      item.admin_name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedRoleObj = ROLE_OPTIONS.find((r) => r.id === selectedRole);

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
      <div className="flex flex-col flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-teal-50 pb-5">
          <div>
            <h1 className="text-xl font-extrabold text-[#1E5C58]">Verifikasi Administrator</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Setujui atau tolak pendaftaran administrator baru untuk mengelola platform PUSPA.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-64 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#81B7A9]" />
            </div>
            <input
              type="text"
              placeholder="Cari admin..."
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
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl md:bg-transparent border border-teal-50 md:border-0 shadow-xs md:shadow-none">
              <div className="w-10 h-10 border-4 border-teal-100 border-t-[#2B7A75] rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-medium text-sm animate-pulse">
                Memuat berkas verifikasi...
              </p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-3xl md:bg-transparent border border-teal-50 md:border-0 shadow-xs md:shadow-none">
              <div className="w-20 h-20 bg-teal-50/50 rounded-full flex items-center justify-center mb-4 border border-teal-100/30">
                <ShieldCheck className="w-10 h-10 text-[#2B7A75] opacity-50" />
              </div>
              <h3 className="text-base font-bold text-gray-700 mb-1">
                {search ? "Admin Tidak Ditemukan" : "Tidak Ada Antrean Verifikasi"}
              </h3>
              <p className="text-gray-400 text-xs max-w-xs font-semibold leading-relaxed mb-4">
                {search
                  ? `Tidak ada administrator yang cocok dengan pencarian "${search}".`
                  : "Saat ini belum ada administrator baru yang menunggu verifikasi dari Anda."}
              </p>
              {admins.length < DEFAULT_SAMPLE_ADMINS.length && (
                <button
                  onClick={handleResetData}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E5C58] hover:bg-[#163F3C] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <RotateCcw size={14} />
                  Reset Data Awal
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400">
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider w-16">
                        No
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">
                        Nama Admin
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">
                        Email
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">
                        Tanggal Pendaftaran
                      </th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-center w-64">
                        Tindakan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map((admin, idx) => (
                      <tr
                        key={admin.user_id}
                        className="border-b border-gray-55 last:border-0 hover:bg-[#F4F9F8]/50 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm font-semibold text-gray-450">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-gray-800">
                          {admin.admin_name}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-500">
                          {admin.email}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-[#1E5C58]">
                          {formatTanggalDaftar(admin.createdAt)}
                        </td>
                        <td className="py-4 px-6 flex items-center justify-center gap-3">
                          {/* Approve Button */}
                          <button
                            onClick={() => handleOpenApproveModal(admin)}
                            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200/50 transition-all font-bold text-xs shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <Check size={14} strokeWidth={2.5} />
                            Setujui
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => handleOpenRejectModal(admin)}
                            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/50 transition-all font-bold text-xs shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <X size={14} strokeWidth={2.5} />
                            Tolak
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {filteredAdmins.map((admin, idx) => (
                  <div
                    key={admin.user_id}
                    className="bg-white border border-teal-50 rounded-2xl p-4 space-y-3.5 shadow-xs text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{admin.admin_name}</h4>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{admin.email}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#1E5C58] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100/30 shrink-0">
                        No. {idx + 1}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-teal-50/55 flex justify-between items-center text-xs">
                      <div>
                        <span className="block text-[10px] text-gray-400 uppercase font-semibold">Tgl Daftar</span>
                        <span className="font-semibold text-gray-650">{formatTanggalDaftar(admin.createdAt)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => handleOpenApproveModal(admin)}
                        className="cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 font-bold text-xs transition-all"
                      >
                        <Check size={14} strokeWidth={2.5} />
                        Setujui
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(admin)}
                        className="cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 font-bold text-xs transition-all"
                      >
                        <X size={14} strokeWidth={2.5} />
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Modal 1 & 2: Setujui Admin (Pilih Peran) */}
      <AnimatePresence>
        {approveModalAdmin && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
            onClick={() => !isSubmitting && setApproveModalAdmin(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Dark Teal */}
              <div className="bg-[#1E5C58] px-6 py-5 flex items-center justify-between text-white shrink-0">
                <div>
                  <h3 className="text-lg font-bold leading-tight">Setujui Admin</h3>
                  <p className="text-xs text-white/80 mt-1 font-medium">
                    Pilih peran admin sebelum menyetujui
                  </p>
                </div>
                <button
                  onClick={() => !isSubmitting && setApproveModalAdmin(null)}
                  className="cursor-pointer w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Admin Preview Card */}
                <div className="bg-[#F4F9F8] rounded-2xl p-4 flex items-center gap-3.5 border border-teal-50">
                  <div className="w-11 h-11 rounded-full bg-[#EAF4F2] text-[#1E5C58] flex items-center justify-center font-bold text-base shrink-0 border border-teal-100/50">
                    {approveModalAdmin.admin_name.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 leading-snug truncate">
                      {approveModalAdmin.admin_name}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                      {approveModalAdmin.email} · Daftar {formatTanggalDaftar(approveModalAdmin.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Pilih Peran Admin */}
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#1E5C58] mb-3">
                    PILIH PERAN ADMIN
                  </p>

                  <div className="space-y-3">
                    {ROLE_OPTIONS.map((role) => {
                      const isSelected = selectedRole === role.id;
                      return (
                        <div
                          key={role.id}
                          onClick={() => setSelectedRole(role.id)}
                          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all ${
                            isSelected
                              ? "border-2 border-[#1E5C58] bg-[#EAF4F2]/30 shadow-xs"
                              : "border border-gray-200/90 hover:border-teal-200 bg-white hover:bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 pr-2">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-black/5 ${role.iconBg} ${role.iconColor}`}
                            >
                              <role.icon size={20} strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">
                                {role.title}
                              </h5>
                              <p className="text-[11px] text-gray-400 font-medium leading-relaxed mt-1">
                                {role.desc}
                              </p>
                            </div>
                          </div>

                          {/* Radio Indicator */}
                          <div className="ml-3 shrink-0">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-[#1E5C58] text-white flex items-center justify-center shadow-xs">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setApproveModalAdmin(null)}
                    className="cursor-pointer px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs sm:text-sm transition-all"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    disabled={!selectedRole || isSubmitting}
                    onClick={handleApproveConfirm}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                      selectedRole && !isSubmitting
                        ? "cursor-pointer bg-[#1E5C58] hover:bg-[#163F3C] text-white shadow-xs"
                        : "cursor-not-allowed bg-[#A3CBC6] text-white"
                    }`}
                  >
                    {isSubmitting
                      ? "Memproses..."
                      : selectedRoleObj
                      ? `Setujui sebagai ${selectedRoleObj.title}`
                      : "Setujui"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Tolak Pendaftaran */}
      <AnimatePresence>
        {rejectModalAdmin && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
            onClick={() => !isSubmitting && setRejectModalAdmin(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Dark Teal */}
              <div className="bg-[#1E5C58] px-6 py-5 flex items-center justify-between text-white shrink-0">
                <div>
                  <h3 className="text-lg font-bold leading-tight">Tolak Pendaftaran</h3>
                  <p className="text-xs text-white/80 mt-1 font-medium">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
                <button
                  onClick={() => !isSubmitting && setRejectModalAdmin(null)}
                  className="cursor-pointer w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Admin Preview Card */}
                <div className="bg-[#F4F9F8] rounded-2xl p-4 flex items-center gap-3.5 border border-teal-50">
                  <div className="w-11 h-11 rounded-full bg-[#EAF4F2] text-[#1E5C58] flex items-center justify-center font-bold text-base shrink-0 border border-teal-100/50">
                    {rejectModalAdmin.admin_name.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 leading-snug truncate">
                      {rejectModalAdmin.admin_name}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                      {rejectModalAdmin.email} · Daftar {formatTanggalDaftar(rejectModalAdmin.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Confirmation text */}
                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                  Yakin ingin menolak pendaftaran admin ini? Akun tidak akan dapat mengelola platform PUSPA.
                </p>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setRejectModalAdmin(null)}
                    className="cursor-pointer px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs sm:text-sm transition-all"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleRejectConfirm}
                    className="cursor-pointer px-5 py-2.5 rounded-xl bg-[#D92D20] hover:bg-[#B42318] text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
                  >
                    {isSubmitting ? "Memproses..." : "Ya, tolak"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1E5C58] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold"
          >
            <Check size={16} className="text-[#81B7A9]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifikasiAdminPage;
