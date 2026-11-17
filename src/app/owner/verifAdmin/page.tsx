/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Users,
  ShieldAlert,
  Loader2,
  RotateCcw,
} from "lucide-react";
import {
  getUnverifiedAdmins,
  getAllAdmins,
  activateAdmin,
  deactivateAdmin,
  getAdminComputedStatus,
  markAdminVerified,
  markAdminRejected,
} from "@/lib/api/ownerAdmin";
import {
  getAdminRoles,
  AdminRoleItem,
  getStoredAdminRoles,
  saveStoredAdminRoles,
} from "@/lib/api/ownerHakAkses";

interface AdminData {
  user_id: string;
  admin_id: string;
  admin_name: string;
  email: string;
  admin_phone: string;
  createdAt: string;
}

interface RoleOption {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function getRoleIconAndColors(roleName: string, roleId: string) {
  const lower = `${roleName} ${roleId}`.toLowerCase();
  if (lower.includes("uang") || lower.includes("keuangan") || lower.includes("finance") || lower.includes("kas")) {
    return {
      icon: Wallet,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    };
  }
  if (lower.includes("presensi") || lower.includes("absen") || lower.includes("hadir")) {
    return {
      icon: ClipboardCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    };
  }
  if (lower.includes("layanan") || lower.includes("service") || lower.includes("jadwal") || lower.includes("pasien")) {
    return {
      icon: Heart,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
    };
  }
  if (lower.includes("terapis") || lower.includes("asesor") || lower.includes("assessor") || lower.includes("medis")) {
    return {
      icon: Users,
      iconBg: "bg-teal-50",
      iconColor: "text-[#1E5C58]",
    };
  }
  return {
    icon: ShieldCheck,
    iconBg: "bg-teal-50",
    iconColor: "text-[#1E5C58]",
  };
}

function mapToRoleOptions(roles: AdminRoleItem[]): RoleOption[] {
  return roles
    .filter((role) => role.name.toLowerCase() !== "admin")
    .map((role) => {
      const style = getRoleIconAndColors(role.name, role.id);
      return {
        id: role.name,
        title: role.name,
        desc: role.desc || "Memiliki izin akses menu sesuai pengaturan Hak Akses.",
        icon: style.icon,
        iconBg: style.iconBg,
        iconColor: style.iconColor,
      };
    });
}

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

  // Dynamic Role Options from Hak Akses
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

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
      const [unverifiedRes, allAdminsRes] = await Promise.all([
        getUnverifiedAdmins(),
        getAllAdmins(),
      ]);

      const list: AdminData[] = [];
      const seen = new Set<string>();

      // 1. Ambil dari getUnverifiedAdmins()
      if (unverifiedRes.success && Array.isArray(unverifiedRes.data)) {
        unverifiedRes.data.forEach((item: any) => {
          const computed = getAdminComputedStatus(item);
          if (!computed.isVerifiedOrRejected) {
            const userId = String(item.user_id || item.id || item.admin_id || "");
            const email = item.email || "-";
            const key = (userId || email).toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                user_id: userId,
                admin_id: String(item.admin_id || item.id || item.user_id || ""),
                admin_name: item.admin_name || item.name || item.username || "Admin",
                email,
                admin_phone: item.admin_phone || item.phone || item.phone_number || item.noTelepon || "-",
                createdAt: item.createdAt || item.created_at || item.tanggalPendaftaran || "-",
              });
            }
          }
        });
      }

      // 2. Gabungkan dengan admin dari getAllAdmins() yang belum terverifikasi (misal Nawaitu dan Fedric)
      if (allAdminsRes.success && Array.isArray(allAdminsRes.data)) {
        allAdminsRes.data.forEach((item: any) => {
          const computed = getAdminComputedStatus(item);
          if (!computed.isVerifiedOrRejected) {
            const userId = String(item.user_id || item.id || item.admin_id || "");
            const email = item.email || "-";
            const key = (userId || email).toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                user_id: userId,
                admin_id: String(item.admin_id || item.id || item.user_id || ""),
                admin_name: item.admin_name || item.name || item.username || "Admin",
                email,
                admin_phone: item.admin_phone || item.phone || item.phone_number || item.noTelepon || "-",
                createdAt: item.createdAt || item.created_at || item.tanggalPendaftaran || "-",
              });
            }
          }
        });
      }

      setAdmins(list);
    } catch (err) {
      console.error(err);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleOptions = async () => {
    setLoadingRoles(true);
    try {
      const res = await getAdminRoles();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setRoleOptions(mapToRoleOptions(res.data));
        saveStoredAdminRoles(res.data);
        return;
      }
    } catch (err) {
      console.warn("API getAdminRoles gagal, membaca dari penyimpanan lokal:", err);
    } finally {
      setLoadingRoles(false);
    }

    // Fallback dari penyimpanan lokal / initial roles
    const local = getStoredAdminRoles();
    setRoleOptions(mapToRoleOptions(local));
  };

  useEffect(() => {
    fetchUnverifiedAdmins();
    loadRoleOptions();

    // Listener sinkronisasi jika role diubah di tab/halaman Hak Akses
    const handleSyncRoles = () => {
      const local = getStoredAdminRoles();
      setRoleOptions(mapToRoleOptions(local));
    };

    const handleStatusSync = () => {
      fetchUnverifiedAdmins();
    };

    window.addEventListener("storage", handleSyncRoles);
    window.addEventListener("storage", handleStatusSync);
    window.addEventListener("admin_roles_updated", handleSyncRoles);
    window.addEventListener("admin_status_updated", handleStatusSync);

    return () => {
      window.removeEventListener("storage", handleSyncRoles);
      window.removeEventListener("storage", handleStatusSync);
      window.removeEventListener("admin_roles_updated", handleSyncRoles);
      window.removeEventListener("admin_status_updated", handleStatusSync);
    };
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
    const selectedRoleData = roleOptions.find((r) => r.id === selectedRole);
    const assignedRoleLabel = selectedRoleData?.title || selectedRole;

    try {
      const res = await activateAdmin(targetAdmin.user_id, assignedRoleLabel);
      markAdminVerified(
        [targetAdmin.user_id, targetAdmin.admin_id, targetAdmin.email, targetAdmin.admin_name],
        assignedRoleLabel
      );
      setAdmins((prev) => prev.filter((a) => a.user_id !== targetAdmin.user_id && a.email !== targetAdmin.email));
      setApproveModalAdmin(null);
      setSelectedRole(null);

      if (res.success) {
        showToast(
          `Admin ${targetAdmin.admin_name} berhasil disetujui sebagai ${assignedRoleLabel}!`
        );
      } else {
        showToast(
          `Admin ${targetAdmin.admin_name} berhasil disetujui sebagai ${assignedRoleLabel} (Status server: ${res.message}).`
        );
      }
    } catch (err) {
      console.error(err);
      markAdminVerified(
        [targetAdmin.user_id, targetAdmin.admin_id, targetAdmin.email, targetAdmin.admin_name],
        assignedRoleLabel
      );
      setAdmins((prev) => prev.filter((a) => a.user_id !== targetAdmin.user_id && a.email !== targetAdmin.email));
      setApproveModalAdmin(null);
      setSelectedRole(null);
      showToast(`Admin ${targetAdmin.admin_name} berhasil disetujui sebagai ${assignedRoleLabel}!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalAdmin) return;
    setIsSubmitting(true);

    const targetAdmin = rejectModalAdmin;

    try {
      await deactivateAdmin(targetAdmin.user_id);
      markAdminRejected(
        [targetAdmin.user_id, targetAdmin.admin_id, targetAdmin.email, targetAdmin.admin_name]
      );
      setAdmins((prev) => prev.filter((a) => a.user_id !== targetAdmin.user_id && a.email !== targetAdmin.email));
      setRejectModalAdmin(null);
      showToast(`Pendaftaran admin ${targetAdmin.admin_name} telah ditolak.`);
    } catch (err: any) {
      console.error(err);
      markAdminRejected(
        [targetAdmin.user_id, targetAdmin.admin_id, targetAdmin.email, targetAdmin.admin_name]
      );
      setAdmins((prev) => prev.filter((a) => a.user_id !== targetAdmin.user_id && a.email !== targetAdmin.email));
      setRejectModalAdmin(null);
      showToast(`Pendaftaran admin ${targetAdmin.admin_name} telah ditolak.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetData = () => {
    fetchUnverifiedAdmins();
    loadRoleOptions();
    setSearch("");
    showToast("Data verifikasi admin berhasil diperbarui.");
  };
  const filteredAdmins = admins.filter(
    (item) =>
      (item.admin_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedRoleObj = roleOptions.find((r) => r.id === selectedRole);

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
              <p className="text-gray-400 text-xs max-w-xs font-semibold leading-relaxed">
                {search
                  ? `Tidak ada administrator yang cocok dengan pencarian "${search}".`
                  : "Saat ini belum ada administrator baru yang menunggu verifikasi dari Anda."}
              </p>
              <button
                onClick={handleResetData}
                className="mt-4 cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E5C58] hover:bg-[#163F3C] text-white text-xs font-bold transition-all shadow-xs"
              >
                <RotateCcw size={14} />
                Muat Ulang Data
              </button>
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
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#1E5C58]">
                      PILIH PERAN ADMIN
                    </p>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {roleOptions.length} Peran Tersedia
                    </span>
                  </div>

                  {loadingRoles ? (
                    <div className="flex items-center justify-center p-8 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <Loader2 className="w-5 h-5 text-[#1E5C58] animate-spin mr-2" />
                      <span className="text-xs text-gray-400 font-medium">Memuat jenis admin...</span>
                    </div>
                  ) : roleOptions.length === 0 ? (
                    <div className="p-4 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                      <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-bold text-gray-700">Belum Ada Jenis Admin</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Silakan tambahkan jenis admin terlebih dahulu pada menu Hak Akses.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roleOptions.map((role) => {
                        const isSelected = selectedRole === role.id;
                        return (
                          <div
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all ${isSelected
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
                  )}
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
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${selectedRole && !isSubmitting
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
