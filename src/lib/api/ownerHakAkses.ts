// src/lib/api/ownerHakAkses.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "@/lib/axios";

export interface AdminRoleItem {
  id: string;
  name: string;
  desc: string;
  checkedIds: string[];
  users_count?: number;
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
export async function getAdminRoleUsers(roleId: string) {
  try {
    const response = await axiosInstance.get(`/owner/admin-roles/${roleId}/users`);
    return {
      success: response.data.success ?? true,
      message: response.data.message ?? "Daftar pengguna peran berhasil dimuat",
      data: (response.data.data || []) as AdminUserInRole[],
    };
  } catch (error: any) {
    console.error("API Error getAdminRoleUsers:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal mengambil daftar staf terlibat",
      data: [] as AdminUserInRole[],
    };
  }
}

