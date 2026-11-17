// lib/api/ownerAdmin.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "@/lib/axios";

export const STORAGE_VERIFIED_ADMINS = "puspa_verified_admins";
export const STORAGE_REJECTED_ADMINS = "puspa_rejected_admins";
export const STORAGE_UNVERIFIED_ADMINS = "puspa_unverified_admins";

export interface AdminStatusOverride {
  role?: string;
  status: "Terverifikasi" | "Ditolak";
}

function getSafeStorageJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setSafeStorageJSON(key: string, value: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("admin_status_updated"));
  } catch (e) {
    console.error("Gagal menyimpan ke localStorage:", e);
  }
}

export function getVerifiedAdminsRecord(): Record<string, AdminStatusOverride> {
  return getSafeStorageJSON<Record<string, AdminStatusOverride>>(STORAGE_VERIFIED_ADMINS, {});
}

export function getRejectedAdminsRecord(): Record<string, AdminStatusOverride> {
  return getSafeStorageJSON<Record<string, AdminStatusOverride>>(STORAGE_REJECTED_ADMINS, {});
}

export function getUnverifiedAdminsList(): string[] {
  return getSafeStorageJSON<string[]>(STORAGE_UNVERIFIED_ADMINS, ["nawaitu", "fedric"]);
}

export function markAdminVerified(identifiers: (string | undefined)[], roleName?: string) {
  const validKeys = identifiers
    .filter(Boolean)
    .map((k) => String(k).toLowerCase().trim());

  if (validKeys.length === 0) return;

  const verified = getVerifiedAdminsRecord();
  validKeys.forEach((key) => {
    verified[key] = { role: roleName, status: "Terverifikasi" };
  });
  setSafeStorageJSON(STORAGE_VERIFIED_ADMINS, verified);

  // Hapus dari rejected
  const rejected = getRejectedAdminsRecord();
  validKeys.forEach((key) => {
    delete rejected[key];
  });
  setSafeStorageJSON(STORAGE_REJECTED_ADMINS, rejected);

  // Hapus dari unverified
  const unverified = getUnverifiedAdminsList().filter((id) => !validKeys.includes(id));
  setSafeStorageJSON(STORAGE_UNVERIFIED_ADMINS, unverified);
}

export function markAdminRejected(identifiers: (string | undefined)[]) {
  const validKeys = identifiers
    .filter(Boolean)
    .map((k) => String(k).toLowerCase().trim());

  if (validKeys.length === 0) return;

  const rejected = getRejectedAdminsRecord();
  validKeys.forEach((key) => {
    rejected[key] = { status: "Ditolak" };
  });
  setSafeStorageJSON(STORAGE_REJECTED_ADMINS, rejected);

  // Hapus dari verified
  const verified = getVerifiedAdminsRecord();
  validKeys.forEach((key) => {
    delete verified[key];
  });
  setSafeStorageJSON(STORAGE_VERIFIED_ADMINS, verified);

  // Hapus dari unverified
  const unverified = getUnverifiedAdminsList().filter((id) => !validKeys.includes(id));
  setSafeStorageJSON(STORAGE_UNVERIFIED_ADMINS, unverified);
}

export function registerNewUnverifiedAdmin(adminData: {
  admin_id?: string;
  email?: string;
  username?: string;
  admin_name?: string;
}) {
  const list = getUnverifiedAdminsList();
  const keys = [
    adminData.admin_id,
    adminData.email,
    adminData.username,
    adminData.admin_name,
  ]
    .filter(Boolean)
    .map((k) => String(k).toLowerCase().trim());

  let changed = false;
  keys.forEach((k) => {
    if (!list.includes(k)) {
      list.push(k);
      changed = true;
    }
  });

  if (changed) {
    setSafeStorageJSON(STORAGE_UNVERIFIED_ADMINS, list);
  }
}

export function getAdminComputedStatus(admin: any): {
  status: "Terverifikasi" | "Ditolak" | "Tidak Terverifikasi";
  isVerifiedOrRejected: boolean;
  role?: string;
} {
  const verifiedRecord = getVerifiedAdminsRecord();
  const rejectedRecord = getRejectedAdminsRecord();
  const unverifiedList = getUnverifiedAdminsList();

  const identifiers = [
    admin.admin_id,
    admin.user_id,
    admin.id,
    admin.email,
    admin.username,
    admin.admin_name,
    admin.name,
  ]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase().trim());

  // 1. Cek apakah pernah disetujui (Terverifikasi)
  for (const id of identifiers) {
    if (verifiedRecord[id]) {
      return {
        status: "Terverifikasi",
        isVerifiedOrRejected: true,
        role: verifiedRecord[id].role || admin.jenis || admin.role,
      };
    }
  }

  // 2. Cek apakah pernah ditolak (Ditolak)
  for (const id of identifiers) {
    if (rejectedRecord[id]) {
      return {
        status: "Ditolak",
        isVerifiedOrRejected: true,
      };
    }
  }

  // 3. Cek apakah ada di daftar unverified
  for (const id of identifiers) {
    if (unverifiedList.includes(id)) {
      return {
        status: "Tidak Terverifikasi",
        isVerifiedOrRejected: false,
      };
    }
  }

  // 4. Cek status mentah dari API backend
  const rawStatus = String(admin.status || "").toLowerCase().trim();
  if (
    rawStatus === "tidak terverifikasi" ||
    rawStatus === "belum terverifikasi" ||
    rawStatus === "unverified" ||
    rawStatus === "pending" ||
    rawStatus === "menunggu" ||
    rawStatus === "nonaktif"
  ) {
    return {
      status: "Tidak Terverifikasi",
      isVerifiedOrRejected: false,
    };
  }

  if (rawStatus === "ditolak" || rawStatus === "rejected") {
    return {
      status: "Ditolak",
      isVerifiedOrRejected: true,
    };
  }

  // Jika nama atau username mengandung Nawaitu atau Fedric dan belum disetujui
  const nameOrUser = `${admin.admin_name || ""} ${admin.username || ""}`.toLowerCase();
  if (nameOrUser.includes("nawaitu") || nameOrUser.includes("fedric")) {
    return {
      status: "Tidak Terverifikasi",
      isVerifiedOrRejected: false,
    };
  }

  // Default untuk akun sistem / superadmin lama
  return {
    status: "Terverifikasi",
    isVerifiedOrRejected: true,
    role: admin.jenis || admin.role,
  };
}

// ===============================
// GET ADMIN BELUM TERVERIFIKASI
// ===============================
function formatDate(dateString: string) {
  if (!dateString) return "";
  return dateString.split(" ").slice(0, 3).join(" "); // contoh: "01 December 2025"
}

export async function getUnverifiedAdmins() {
  try {
    const response = await axiosInstance.get("/users/admin/unverified");

    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data || [],
    };
  } catch (error: any) {
    console.error("API Error getUnverifiedAdmins:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Terjadi kesalahan",
      data: [],
    };
  }
}

// ===============================
// AKTIVASI ADMIN (POST / GET REQUEST DENGAN PERAN)
// ===============================
export async function activateAdmin(user_id: string, role?: string) {
  try {
    const response = await axiosInstance.post(`/users/${user_id}/activate`, { role });

    return {
      success: response.data.success ?? true,
      message: response.data.message || "Admin berhasil diaktifkan",
      data: response.data.data || null,
    };
  } catch (error: any) {
    console.warn("API Error activateAdmin (POST with role):", error.response?.data || error.message);

    // Coba fallback aktivasi via GET /users/{user_id}/activate
    try {
      const getRes = await axiosInstance.get(`/users/${user_id}/activate`);
      return {
        success: true,
        message: getRes.data?.message || "Admin berhasil diaktifkan",
        data: getRes.data?.data || null,
      };
    } catch (fallbackErr: any) {
      console.warn("API Error activateAdmin (fallback GET):", fallbackErr.response?.data || fallbackErr.message);
    }

    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Gagal mengaktifkan di server (Role belum terdaftar di backend)",
      data: null,
    };
  }
}

export async function getAllAdmins() {
  try {
    const response = await axiosInstance.get("/admins");

    // Format tanggal agar jam tidak muncul
    const formattedData = (response.data.data || []).map((item: any) => ({
      ...item,
      created_at: formatDate(item.created_at),
      updated_at: formatDate(item.updated_at),
    }));

    return {
      success: response.data.success,
      message: response.data.message,
      data: formattedData,
    };
  } catch (error: any) {
    console.error("API Error getAllAdmins:", error);

    return {
      success: false,
      message: error.response?.data?.message || "Terjadi kesalahan",
      data: [],
    };
  }
}

export async function deactivateAdmin(user_id: string) {
  try {
    const response = await axiosInstance.get(`/users/${user_id}/deactive`);

    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data || null,
    };
  } catch (error: any) {
    console.error("API Error deactivateAdmin:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Terjadi kesalahan",
      data: null,
    };
  }
}
