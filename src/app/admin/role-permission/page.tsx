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
import { getRoleMatrix, RbacMatrixData, RoleInfo } from "@/lib/api/rbac";

export default function RolePermissionPage() {
  const [data, setData] = useState<RbacMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("semua");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getRoleMatrix();
      if (res) {
        setData(res);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const roles = useMemo<RoleInfo[]>(() => {
    return data?.roles || [
      { key: "owner", name: "Owner / Direktur", badge: "Super Admin" },
      { key: "admin", name: "Admin Operasional", badge: "Manager" },
      { key: "asesor", name: "Asesor Klinis", badge: "Clinical Specialist" },
      { key: "terapis", name: "Terapis", badge: "Practitioner" },
      { key: "user", name: "Orang Tua / Wali", badge: "Client" },
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF4F3] text-[#1E5C58] rounded-xl text-xs font-bold">
            <Sparkles size={14} />
            <span>5 Role Terstandarisasi</span>
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
                            return (
                              <td key={r.key} className="px-4 py-3 text-center">
                                {hasAccess ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    <span>Diizinkan</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-400">
                                    <XCircle size={13} className="text-gray-300" />
                                    <span>Terkunci</span>
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
