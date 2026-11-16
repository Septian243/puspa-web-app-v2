// src/lib/api/ownerHakAkses.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "@/lib/axios";
import { getAllAdmins, getAdminComputedStatus } from "@/lib/api/ownerAdmin";

export interface AdminRoleItem {
  id: string;
  name: string;
  desc: string;
  checkedIds: string[];
  users_count?: number;
}

export const ADMIN_ROLES_STORAGE_KEY = "puspa_admin_roles";

export const INITIAL_ADMIN_ROLES: AdminRoleItem[] = [
  {
    id: "keuangan",
    name: "Admin Keuangan",
    desc: "Mengelola tagihan, pembayaran, dan pengembalian dana pasien.",
    checkedIds: ["dashboard", "admin", "keuangan", "ubah_profile", "ubah_password"],
  },
  {
    id: "presensi",
    name: "Admin Presensi",
    desc: "Mengelola kehadiran terapi serta pencatatan izin, sakit, dan tidak hadir.",
    checkedIds: ["dashboard", "terapis", "pasien_anak", "presensi", "ubah_profile", "ubah_password"],
  },
  {
    id: "layanan",
    name: "Admin Layanan",
    desc: "Mengelola jadwal observasi, asesmen, dan terapi pasien.",
    checkedIds: [
      "dashboard",
      "terapis",
      "pasien_anak",
      "observasi",
      "asesmen",
      "terapi_menu",
      "laporan_soap",
      "ubah_profile",
      "ubah_password",
    ],
  },
];

/**
 * Mengambil daftar jenis admin dari localStorage (sebagai fallback/sinkronisasi antar halaman)
 */
export function getStoredAdminRoles(): AdminRoleItem[] {
  if (typeof window === "undefined") return INITIAL_ADMIN_ROLES;
  try {
    const raw = localStorage.getItem(ADMIN_ROLES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_ROLES_STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_ROLES));
      return INITIAL_ADMIN_ROLES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_ADMIN_ROLES;
  } catch (e) {
    console.error("Gagal membaca admin roles dari localStorage:", e);
    return INITIAL_ADMIN_ROLES;
  }
}

/**
 * Menyimpan daftar jenis admin ke localStorage dan memicu custom event
 */
export function saveStoredAdminRoles(roles: AdminRoleItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_ROLES_STORAGE_KEY, JSON.stringify(roles));
    window.dispatchEvent(new Event("admin_roles_updated"));
  } catch (e) {
    console.error("Gagal menyimpan admin roles ke localStorage:", e);
  }
}

export interface AdminUserInRole {
  user_id: string;
  admin_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

/**
 * Mengambil daftar seluruh Jenis Admin beserta checkedIds menu
 */
export async function getAdminRoles() {
  try {
    const response = await axiosInstance.get("/owner/admin-roles");
    return {
      success: response.data.success ?? true,
      message: response.data.message ?? "Berhasil mengambil daftar jenis admin",
      data: (response.data.data || []) as AdminRoleItem[],
    };
  } catch (error: any) {
    console.error("API Error getAdminRoles:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal mengambil daftar jenis admin",
      data: [] as AdminRoleItem[],
    };
  }
}

/**
 * Membuat jenis admin baru
 */
export async function createAdminRole(payload: {
  name: string;
  desc?: string;
  checkedIds?: string[];
}) {
  try {
    const response = await axiosInstance.post("/owner/admin-roles", payload);
    return {
      success: response.data.success ?? true,
      message: response.data.message ?? "Jenis admin berhasil dibuat",
      data: response.data.data as AdminRoleItem,
    };
  } catch (error: any) {
    console.error("API Error createAdminRole:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal membuat jenis admin",
      data: null,
    };
  }
}

/**
 * Memperbarui jenis admin dan ceklis menu hak akses
 */
export async function updateAdminRole(
  roleId: string,
  payload: {
    name?: string;
    desc?: string;
    checkedIds?: string[];
  }
) {
  try {
    const response = await axiosInstance.put(`/owner/admin-roles/${roleId}`, payload);
    return {
      success: response.data.success ?? true,
      message: response.data.message ?? "Hak akses berhasil disimpan",
      data: response.data.data as AdminRoleItem,
    };
  } catch (error: any) {
    console.error("API Error updateAdminRole:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal menyimpan hak akses",
      data: null,
    };
  }
}

/**
 * Menghapus jenis admin
 */
export async function deleteAdminRole(roleId: string) {
  try {
    const response = await axiosInstance.delete(`/owner/admin-roles/${roleId}`);
    return {
      success: response.data.success ?? true,
      message: response.data.message ?? "Jenis admin berhasil dihapus",
      data: null,
    };
  } catch (error: any) {
    console.error("API Error deleteAdminRole:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal menghapus jenis admin",
      data: null,
    };
  }
}

/**
 * Mengambil daftar staf/pengguna admin yang terlibat dalam jenis admin tertentu
 */
export async function getAdminRoleUsers(roleId: string, roleName?: string) {
  try {
    const response = await axiosInstance.get(`/owner/admin-roles/${roleId}/users`);
    if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return {
        success: true,
        message: response.data.message ?? "Daftar pengguna peran berhasil dimuat",
        data: (response.data.data || []) as AdminUserInRole[],
      };
    }
  } catch (error: any) {
    console.warn("API getAdminRoleUsers belum tersedia atau gagal:", error.message);
  }

  // Fallback sinkronisasi dari daftar admin terverifikasi
  try {
    const adminsRes = await getAllAdmins();
    if (adminsRes.success && Array.isArray(adminsRes.data)) {
      const targetRole = (roleName || roleId).toLowerCase().trim();

      const matchedUsers: AdminUserInRole[] = adminsRes.data
        .map((item: any) => {
          const computed = getAdminComputedStatus(item);
          return {
            ...item,
            status: computed.status,
            jenis: computed.role || item.jenis || item.role || "",
          };
        })
        .filter((item: any) => {
          if (item.status !== "Terverifikasi") return false;
          const userRole = (item.jenis || "").toLowerCase().trim();
          return (
            userRole === targetRole ||
            (targetRole.includes("keuangan") && userRole.includes("keuangan")) ||
            (targetRole.includes("presensi") && userRole.includes("presensi")) ||
            (targetRole.includes("layanan") && userRole.includes("layanan"))
          );
        })
        .map((item: any) => ({
          user_id: String(item.admin_id || item.user_id || item.id),
          admin_id: String(item.admin_id || item.id),
          name: item.admin_name || item.name || "Admin",
          email: item.email || "-",
          phone: item.admin_phone || item.phone || "-",
          created_at: item.created_at || "Baru saja",
        }));

      return {
        success: true,
        message: "Daftar pengguna peran berhasil dimuat",
        data: matchedUsers,
      };
    }
  } catch (e) {
    console.error("Gagal sinkronisasi staf terlibat:", e);
  }

  return {
    success: true,
    message: "Belum ada pengguna pada peran ini",
    data: [] as AdminUserInRole[],
  };
}

