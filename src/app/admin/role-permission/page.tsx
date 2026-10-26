"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getRoleMatrix, updateRolePermission, RbacMatrixData, RoleInfo } from "@/lib/api/rbac";

const DEFAULT_RBAC_DATA: RbacMatrixData = {
  roles: [
    { key: "owner", name: "Owner / Direktur", badge: "Bisa Segalanya" },
    { key: "asesor", name: "Asesor Klinis", badge: "Asesmen & Terapi" },
    { key: "admin", name: "Admin Operasional", badge: "Administrasi & Jadwal" },
    { key: "terapis", name: "Terapis", badge: "Pelaksana Terapi" },
  ],
  matrix: [
    {
      category: "Manajemen Pasien",
      items: [
        { key: "show_children", label: "Melihat Daftar Pasien / Anak", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "show_detail_child", label: "Melihat Detail Pasien & Profil", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "edit_child", label: "Mengubah Data Pasien", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "delete_child", label: "Menghapus Data Pasien", access: { owner: true, asesor: false, admin: true, terapis: false } },
      ],
    },
    {
      category: "Observasi & Skrining (Fase 1)",
      items: [
        { key: "show_observations", label: "Melihat Jadwal & Status Observasi", access: { owner: true, asesor: true, admin: true, terapis: true } },
        { key: "show_detail_observation", label: "Melihat Detail Observasi", access: { owner: true, asesor: true, admin: true, terapis: true } },
        { key: "edit_schedule_observation", label: "Mengatur Tanggal / Reschedule Observasi", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "submit_observation", label: "Mengisi Hasil Observasi Klinis", access: { owner: true, asesor: true, admin: true, terapis: true } },
        { key: "show_observation_answer", label: "Melihat Jawaban Kuesioner Observasi", access: { owner: true, asesor: true, admin: true, terapis: true } },
        { key: "show_observation_summary", label: "Melihat Ringkasan Observasi", access: { owner: true, asesor: true, admin: true, terapis: true } },
        { key: "set_assessment", label: "Menyetujui & Melanjutkan ke Asesmen", access: { owner: true, asesor: true, admin: true, terapis: false } },
      ],
    },
    {
      category: "Asesmen Klinis (Fase 2)",
      items: [
        { key: "show_assessments", label: "Melihat Daftar Asesmen", access: { owner: true, asesor: true, admin: true, terapis: false } },
        { key: "show_detail_assessment", label: "Melihat Rincian Asesmen Klinis", access: { owner: true, asesor: true, admin: true, terapis: false } },
        { key: "edit_schedule_assessment", label: "Mengatur Jadwal Asesmen", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "submit_assessment", label: "Mengisi & Menyelesaikan Asesmen Klinis", access: { owner: true, asesor: true, admin: false, terapis: false } },
        { key: "upload_report_assessment_file", label: "Mengunggah Berkas Hasil Asesmen", access: { owner: true, asesor: true, admin: true, terapis: false } },
        { key: "download_child_report_assessment_file", label: "Mengunduh Laporan Hasil Asesmen", access: { owner: true, asesor: true, admin: true, terapis: false } },
      ],
    },
    {
      category: "Penjadwalan & Presensi (Fase 3 & 4)",
      items: [
        { key: "manage_schedules", label: "Membuat & Mengedit Master Jadwal Terapi", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "view_all_therapy_sessions", label: "Melihat Jadwal Seluruh Terapis (Lintas Terapis)", access: { owner: true, asesor: true, admin: true, terapis: false } },
        { key: "view_own_therapy_sessions", label: "Melihat Jadwal Sesi Sendiri", access: { owner: true, asesor: true, admin: true, terapis: true } },
        { key: "mark_attendance_qr", label: "Scan Presensi Kios / QR Code", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "edit_past_attendance", label: "Koreksi Presensi Sesi Lampau", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "reschedule_therapy_session", label: "Melakukan Reschedule Sesi Terapi", access: { owner: true, asesor: false, admin: true, terapis: false } },
      ],
    },
    {
      category: "Rekam Medis SOAP & Terapi (Fase 5)",
      items: [
        { key: "execute_therapy_session", label: "Menjalankan Sesi Terapi Pasien", access: { owner: true, asesor: true, admin: false, terapis: true } },
        { key: "write_therapy_soap", label: "Menulis & Mengisi Catatan SOAP Terapi", access: { owner: true, asesor: true, admin: false, terapis: true } },
        { key: "view_therapy_soap", label: "Melihat Catatan SOAP Pasien", access: { owner: true, asesor: true, admin: true, terapis: true } },
        { key: "export_therapy_soap", label: "Ekspor Laporan Rekam Medis SOAP", access: { owner: true, asesor: true, admin: true, terapis: false } },
      ],
    },
    {
      category: "Keuangan & Billing (Fase 6)",
      items: [
        { key: "manage_invoices", label: "Membuat & Mengelola Tagihan Invoice", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "manage_session_credits", label: "Mengelola Potongan Kredit Sesi (Session Credit)", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "process_refunds", label: "Memproses Refund & Pengembalian Dana", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "view_financial_reports", label: "Melihat Laporan Transaksi & Arus Kas", access: { owner: true, asesor: false, admin: true, terapis: false } },
      ],
    },
    {
      category: "Manajemen Pengguna & Staf",
      items: [
        { key: "show_admins", label: "Melihat Daftar Admin", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "add_admin", label: "Menambah Akun Admin", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "edit_admin", label: "Mengubah Data Admin", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "delete_admin", label: "Menghapus Akun Admin", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "show_therapists", label: "Melihat Daftar Terapis", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "add_therapist", label: "Menambah Akun Terapis", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "edit_therapist", label: "Mengubah Data Terapis", access: { owner: true, asesor: false, admin: true, terapis: false } },
        { key: "delete_therapist", label: "Menghapus Akun Terapis", access: { owner: true, asesor: false, admin: true, terapis: false } },
      ],
    },
  ],
};

export default function RolePermissionPage() {
  const [data, setData] = useState<RbacMatrixData>(DEFAULT_RBAC_DATA);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("semua");
  const [userRole, setUserRole] = useState<string>("");
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      // Cek role user aktif dari localStorage
      if (typeof window !== "undefined") {
        const storedRole = localStorage.getItem("role") || localStorage.getItem("user_role") || "";
        setUserRole(storedRole.toLowerCase());
      }

      const res = await getRoleMatrix();
      if (res && res.matrix && res.matrix.length > 0) {
        setData(res);
      }
    }
    loadData();
  }, []);

  const isOwner = userRole === "owner";

  // Toggle permission khusus untuk role owner saja
  const handleTogglePermission = async (roleKey: string, permissionKey: string, currentAccess: boolean) => {
    if (!isOwner) return;

    // Owner tidak bisa mematikan hak akses dirinya sendiri
    if (roleKey === "owner") return;

    const newStatus = !currentAccess;
    const updateId = `${roleKey}_${permissionKey}`;
    setUpdatingKey(updateId);

    // Optimistic UI update
    setData((prev) => {
      const nextMatrix = prev.matrix.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          if (item.key === permissionKey) {
            return {
              ...item,
              access: {
                ...item.access,
                [roleKey]: newStatus,
              },
            };
          }
          return item;
        }),
      }));
      return { ...prev, matrix: nextMatrix };
    });

    const success = await updateRolePermission(roleKey, permissionKey, newStatus);
    if (!success) {
      // Revert if API failed
      setData((prev) => {
        const revertMatrix = prev.matrix.map((cat) => ({
          ...cat,
          items: cat.items.map((item) => {
            if (item.key === permissionKey) {
              return {
                ...item,
                access: {
                  ...item.access,
                  [roleKey]: currentAccess,
                },
              };
            }
            return item;
          }),
        }));
        return { ...prev, matrix: revertMatrix };
      });
    }

    setUpdatingKey(null);
  };

  const roles = useMemo<RoleInfo[]>(() => {
    return data?.roles || [
      { key: "owner", name: "Owner / Direktur", badge: "Bisa Segalanya" },
      { key: "asesor", name: "Asesor Klinis", badge: "Asesmen & Terapi" },
      { key: "admin", name: "Admin Operasional", badge: "Administrasi & Jadwal" },
      { key: "terapis", name: "Terapis", badge: "Pelaksana Terapi" },
    ];
  }, [data]);

  const filteredCategories = useMemo(() => {
    if (!data?.matrix) return [];

    return data.matrix
      .map((cat) => {
        const matchingItems = cat.items.filter((item) => {
          const matchSearch =
            item.label.toLowerCase().includes(search.toLowerCase()) ||
            item.key.toLowerCase().includes(search.toLowerCase());

          if (!matchSearch) return false;

          if (selectedRole !== "semua") {
            return item.access[selectedRole] !== undefined;
          }

          return true;
        });

        return {
          ...cat,
          items: matchingItems,
        };
      })
      .filter((cat) => cat.items.length > 0);
  }, [data, search, selectedRole]);

  return (
    <div className="p-6 md:p-8 space-y-6 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#EAF4F3] text-[#1E5C58] flex items-center justify-center shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">
              Matriks Hak Akses & RBAC (Role-Based Access Control)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Standarisasi hak asesmen, penjadwalan, rekam medis SOAP, dan keuangan per role di Puspa Holistic
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold">
              <Sparkles size={14} className="text-amber-600" />
              <span>Mode Edit Aktif (Owner)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-medium">
              <Lock size={13} className="text-gray-400" />
              <span>Read-Only Mode</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF4F3] text-[#1E5C58] rounded-xl text-xs font-bold">
            <Sparkles size={14} />
            <span>4 Role Terstandarisasi</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Role Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedRole("semua")}
            className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              selectedRole === "semua"
                ? "bg-[#1E5C58] text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Semua Role
          </button>
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelectedRole(r.key)}
              className={`cursor-pointer px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                selectedRole === r.key
                  ? "bg-[#1E5C58] text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari izin atau fitur..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50/60 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75] transition-all"
          />
        </div>
      </div>

      {/* Content Checklist Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-8 h-8 border-4 border-[#81B7A9] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-gray-500">Memuat matriks permission...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <Info className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-600">Tidak ada hak akses yang sesuai</p>
          <p className="text-xs text-gray-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredCategories.map((cat, catIdx) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.05 }}
              className="overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm"
            >
              {/* Category Header */}
              <div className="px-5 py-3.5 bg-[#EAF4F3] border-b border-teal-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-[#1E5C58]" />
                  <h2 className="text-xs font-extrabold text-[#1E5C58] uppercase tracking-wider">
                    {cat.category}
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-[#2B7A75] bg-white/70 px-2.5 py-0.5 rounded-full">
                  {cat.items.length} Kapabilitas
                </span>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-5 py-3 font-bold text-gray-500 w-2/5">Fitur & Kapabilitas</th>
                      {roles
                        .filter((r) => selectedRole === "semua" || selectedRole === r.key)
                        .map((r) => (
                          <th key={r.key} className="px-4 py-3 font-bold text-gray-700 text-center">
                            <div>{r.name}</div>
                            <span className="text-[10px] font-normal text-gray-400">{r.badge}</span>
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cat.items.map((item, itemIdx) => (
                      <tr
                        key={item.key}
                        className={itemIdx % 2 === 0 ? "bg-white hover:bg-teal-50/20" : "bg-gray-50/30 hover:bg-teal-50/20"}
                      >
                        <td className="px-5 py-3 font-semibold text-gray-800">
                          <div className="flex flex-col">
                            <span>{item.label}</span>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">{item.key}</span>
                          </div>
                        </td>

                        {roles
                          .filter((r) => selectedRole === "semua" || selectedRole === r.key)
                          .map((r) => {
                            const hasAccess = Boolean(item.access[r.key]);
                            const isCellUpdating = updatingKey === `${r.key}_${item.key}`;
                            const canToggle = isOwner && r.key !== "owner";

                            return (
                              <td key={r.key} className="px-4 py-3 text-center">
                                {canToggle ? (
                                  <button
                                    onClick={() => handleTogglePermission(r.key, item.key, hasAccess)}
                                    disabled={isCellUpdating}
                                    title={`Klik untuk ${hasAccess ? "mencabut" : "memberikan"} izin`}
                                    className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                                      hasAccess
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                        : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                    } ${isCellUpdating ? "opacity-50 pointer-events-none" : ""}`}
                                  >
                                    {hasAccess ? (
                                      <>
                                        <CheckCircle2 size={13} className="text-emerald-600" />
                                        <span>Diizinkan</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle size={13} className="text-gray-400" />
                                        <span>Terkunci</span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] select-none ${
                                      hasAccess
                                        ? "font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "font-medium bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    {hasAccess ? (
                                      <>
                                        <CheckCircle2 size={13} className="text-emerald-600" />
                                        <span>Diizinkan</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle size={13} className="text-gray-300" />
                                        <span>Terkunci</span>
                                      </>
                                    )}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
