/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Eye,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";
import { getAllAdmins, getAdminComputedStatus } from "@/lib/api/ownerAdmin";
import { getAdminById } from "@/lib/api/data_admin";

const DEFAULT_SAMPLE_ADMINS: any[] = [
  {
    admin_id: "adm-001",
    admin_name: "Super Admin",
    jenis: "-",
    username: "superadmin",
    email: "superadmin@puspa.id",
    admin_phone: "081234567890",
    status: "Terverifikasi",
    created_at: "10 Januari 2026",
    updated_at: "10 Januari 2026",
  },
  {
    admin_id: "adm-002",
    admin_name: "Kaila",
    jenis: "Admin Layanan",
    username: "kaila",
    email: "kaila@gmail.com",
    admin_phone: "081234567891",
    status: "Terverifikasi",
    created_at: "24 April 2026",
    updated_at: "24 April 2026",
  },
  {
    admin_id: "adm-003",
    admin_name: "Budi Santoso",
    jenis: "Admin Keuangan",
    username: "budisantoso",
    email: "budi.santoso@gmail.com",
    admin_phone: "088234567892",
    status: "Terverifikasi",
    created_at: "02 Mei 2026",
    updated_at: "02 Mei 2026",
  },
  {
    admin_id: "adm-004",
    admin_name: "Siti Rahma",
    jenis: "Admin Presensi",
    username: "sitirahma",
    email: "siti.rahma@gmail.com",
    admin_phone: "081398765432",
    status: "Terverifikasi",
    created_at: "15 Mei 2026",
    updated_at: "15 Mei 2026",
  },
];

function renderJenisBadge(jenis?: string) {
  if (!jenis || jenis === "-" || jenis.trim() === "") {
    return <span className="text-gray-500 font-bold pl-2">-</span>;
  }

  const normalized = jenis.toLowerCase();
  if (normalized.includes("layanan")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-[#FCE7F3] text-[#BE185D]">
        {jenis}
      </span>
    );
  }
  if (normalized.includes("keuangan")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-[#FEF3C7] text-[#B45309]">
        {jenis}
      </span>
    );
  }
  if (normalized.includes("presensi")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-[#D1FAE5] text-[#047857]">
        {jenis}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-teal-50 text-[#1E5C58]">
      {jenis}
    </span>
  );
}

const AdminListPage: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();

    const handleStatusUpdate = () => {
      fetchAdmins();
    };

    window.addEventListener("admin_status_updated", handleStatusUpdate);
    window.addEventListener("storage", handleStatusUpdate);

    return () => {
      window.removeEventListener("admin_status_updated", handleStatusUpdate);
      window.removeEventListener("storage", handleStatusUpdate);
    };
  }, []);

  async function fetchAdmins() {
    try {
      setLoading(true);
      const res = await getAllAdmins();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Hanya tampilkan admin yang sudah terverifikasi (disetujui/ditolak)
        const processed = res.data
          .map((item: any) => {
            const computed = getAdminComputedStatus(item);
            return {
              ...item,
              status: computed.status,
              jenis: computed.role || item.jenis || item.role || item.admin_type || "-",
              isVerifiedOrRejected: computed.isVerifiedOrRejected,
            };
          })
          .filter((item: any) => item.isVerifiedOrRejected);

        setAdmins(processed);
      } else {
        setAdmins(DEFAULT_SAMPLE_ADMINS);
      }
    } catch (error) {
      console.error("Gagal mengambil data admin:", error);
      setAdmins(DEFAULT_SAMPLE_ADMINS);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewAdmin(adminItem: any) {
    setLoadingDetail(true);
    try {
      const data = await getAdminById(adminItem.admin_id);
      const merged = { ...adminItem, ...(data || {}) };
      const computed = getAdminComputedStatus(merged);
      setSelectedAdmin({
        ...merged,
        status: computed.status,
        jenis: computed.role || adminItem.jenis || merged.jenis || "-",
      });
    } catch (error) {
      console.error("Gagal mengambil detail admin:", error);
      const computed = getAdminComputedStatus(adminItem);
      setSelectedAdmin({
        ...adminItem,
        status: computed.status,
        jenis: computed.role || adminItem.jenis || "-",
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeModal() {
    setSelectedAdmin(null);
  }

  const filteredAdmins = admins.filter(
    (item) =>
      item.admin_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.username?.toLowerCase().includes(search.toLowerCase()) ||
      item.jenis?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-transparent w-full">
      <div className="flex flex-col flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-teal-50 pb-5">
          <div>
            <h1 className="text-xl font-extrabold text-[#1E5C58]">Daftar Administrator</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              Kelola dan pantau seluruh akun administrator yang terdaftar di platform PUSPA.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#81B7A9]" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, jenis, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-teal-50 rounded-xl text-sm focus:ring-2 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all placeholder-gray-450 font-medium text-gray-700 shadow-xs"
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
                Memuat data admin...
              </p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-3xl md:bg-transparent border border-teal-50 md:border-0 shadow-xs md:shadow-none">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4 border border-teal-100/30">
                <ShieldCheck className="w-10 h-10 text-[#2B7A75] opacity-50" />
              </div>
              <h3 className="text-base font-bold text-gray-700 mb-1">
                Data Tidak Ditemukan
              </h3>
              <p className="text-gray-400 text-xs max-w-sm font-semibold leading-relaxed">
                Belum ada data admin yang cocok dengan kriteria pencarian Anda.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block w-full">
                <table className="w-full text-left border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[5%]" />
                    <col className="w-[16%]" />
                    <col className="w-[16%]" />
                    <col className="w-[12%]" />
                    <col className="w-[15%]" />
                    <col className="w-[11%]" />
                    <col className="w-[9%]" />
                    <col className="w-[6%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-55 text-gray-400">
                      <th className="py-3.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                        No
                      </th>
                      <th className="py-3.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                        Nama Admin
                      </th>
                      <th className="py-3.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                        Jenis
                      </th>
                      <th className="py-3.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                        Username
                      </th>
                      <th className="py-3.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                        Email
                      </th>
                      <th className="py-3.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                        No. Telepon
                      </th>
                      <th className="py-3.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3.5 px-3 text-[10px] font-bold uppercase tracking-wider text-center">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map((admin, idx) => (
                      <tr
                        key={admin.admin_id || idx}
                        className="border-b border-gray-55 last:border-0 hover:bg-[#F4F9F8]/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-xs font-semibold text-gray-450">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 text-xs font-bold text-gray-800 truncate" title={admin.admin_name}>
                          {admin.admin_name}
                        </td>
                        <td className="py-3 px-3">
                          {renderJenisBadge(admin.jenis)}
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-gray-500 truncate" title={admin.username}>
                          {admin.username}
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-gray-500 truncate" title={admin.email}>
                          {admin.email}
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {admin.admin_phone}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10.5px] font-bold ${
                              admin.status === "Terverifikasi"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : admin.status === "Ditolak"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                          >
                            {admin.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleViewAdmin(admin)}
                            disabled={loadingDetail}
                            className="cursor-pointer inline-flex items-center justify-center w-8 h-8 bg-white text-[#2B7A75] border-2 border-teal-100 rounded-xl hover:bg-[#F4F9F8] hover:border-teal-200 transition-all shadow-xs"
                            title="Lihat detail admin"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {filteredAdmins.map((admin) => (
                  <div
                    key={admin.admin_id}
                    className="bg-white border border-teal-50 rounded-2xl p-4 space-y-3 shadow-xs text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{admin.admin_name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">@{admin.username}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            admin.status === "Terverifikasi"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : admin.status === "Ditolak"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {admin.status}
                        </span>
                        {renderJenisBadge(admin.jenis)}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-teal-50/55 space-y-1.5 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Email:</span>
                        <span className="font-medium">{admin.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Telepon:</span>
                        <span className="font-medium">{admin.admin_phone}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleViewAdmin(admin)}
                        disabled={loadingDetail}
                        className="cursor-pointer w-full py-2.5 rounded-xl bg-white border border-teal-100 text-[#2B7A75] font-bold text-xs hover:bg-[#F4F9F8] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye size={14} />
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Modal Detail Admin */}
        <AnimatePresence>
          {selectedAdmin && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm sm:max-w-[400px] max-h-[85vh] bg-white rounded-3xl shadow-[0_20px_50px_rgba(30,92,88,0.12)] border border-teal-50 relative overflow-hidden flex flex-col"
              >
                {/* Decorative header border */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-[#2B7A75] to-[#1E5C58]" />

                {/* Modal Header */}
                <div className="px-6 pt-6 pb-3 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-11 h-11 bg-teal-50 border border-teal-100/50 text-[#2B7A75] rounded-2xl flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#1E5C58] leading-tight">
                        Detail Akun Admin
                      </h3>
                      <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                        Informasi rinci lisensi admin
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-650 cursor-pointer p-1.5 rounded-lg hover:bg-gray-100/70 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="px-6 py-2 overflow-y-auto flex-1 space-y-3">
                  <DetailItem
                    icon={User}
                    label="Nama Lengkap"
                    value={selectedAdmin.admin_name}
                  />
                  <DetailItem
                    icon={Layers}
                    label="Jenis Admin"
                    value={
                      selectedAdmin.jenis && selectedAdmin.jenis !== "-" ? (
                        renderJenisBadge(selectedAdmin.jenis)
                      ) : (
                        "-"
                      )
                    }
                  />
                  <DetailItem
                    icon={ShieldCheck}
                    label="Username"
                    value={selectedAdmin.username}
                  />
                  <DetailItem
                    icon={Mail}
                    label="Alamat Email"
                    value={selectedAdmin.email}
                  />
                  <DetailItem
                    icon={Phone}
                    label="No. Telepon"
                    value={selectedAdmin.admin_phone}
                  />
                  <DetailItem
                    icon={AlertCircle}
                    label="Status Akun"
                    value={selectedAdmin.status}
                    isBadge
                    badgeType={selectedAdmin.status === "Terverifikasi" ? "success" : "danger"}
                  />
                  <DetailItem
                    icon={Calendar}
                    label="Tanggal Pendaftaran"
                    value={selectedAdmin.created_at}
                  />
                  <DetailItem
                    icon={Clock}
                    label="Pembaruan Terakhir"
                    value={selectedAdmin.updated_at}
                  />
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3.5 border-t border-gray-100 shrink-0 flex justify-end bg-white">
                  <button
                    onClick={closeModal}
                    className="cursor-pointer px-5 py-2 rounded-xl border border-gray-250 bg-white text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all w-full sm:w-auto active:scale-95"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Modal Detail Item Component
function DetailItem({ icon: Icon, label, value, isBadge = false, badgeType = "success" }: any) {
  return (
    <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-gray-50/50 border border-gray-100/50">
      <div className="text-gray-400 mt-0.5 shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-extrabold text-gray-455 uppercase tracking-wider block">
          {label}
        </span>
        {isBadge ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold mt-1 ${badgeType === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-rose-50 text-rose-700 border border-rose-100"
              }`}
          >
            {value}
          </span>
        ) : typeof value === "object" ? (
          <div className="mt-1">{value}</div>
        ) : (
          <p className="text-sm font-bold text-gray-700 mt-0.5 break-words">
            {value || "-"}
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminListPage;
