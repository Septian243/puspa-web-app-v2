// src/lib/api/ownerSekolah.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "@/lib/axios";

export interface OwnerSchoolItem {
  id: string;
  namaSekolah: string;
  school_name?: string;
  npsn?: string;
  jenjangKode: string;
  jenjangLabel: string;
  alamat: string;
  school_address?: string;
  peran: string;
  username: string;
  email: string;
  noTelepon: string;
  school_phone?: string;
  tanggalPendaftaran: string;
  created_at?: string;
  status: "Terverifikasi" | "Tidak Terverifikasi" | "Ditolak";
  verification_status?: string;
  pic_name?: string;
  students_count?: number;
}

/**
 * Mengambil daftar sekolah yang belum diverifikasi
 */
export async function getUnverifiedSchools() {
  try {
    const response = await axiosInstance.get("/owner/schools/unverified");
    return {
      success: response.data.success ?? true,
      message: response.data.message ?? "Berhasil mengambil sekolah menunggu verifikasi",
      data: (response.data.data || []) as OwnerSchoolItem[],
    };
  } catch (error: any) {
    console.error("API Error getUnverifiedSchools:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal mengambil daftar verifikasi sekolah",
      data: [] as OwnerSchoolItem[],
    };
  }
}

/**
 * Menyetujui pendaftaran sekolah
 */
export async function verifySchool(schoolId: string) {
  try {
    const response = await axiosInstance.post(`/owner/schools/${schoolId}/verify`);
    return {
      success: response.data.success ?? true,
      message: response.data.message ?? "Sekolah berhasil diverifikasi",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("API Error verifySchool:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal memverifikasi sekolah",
      data: null,
    };
  }
}

/**
 * Menolak pendaftaran sekolah
 */
export async function rejectSchool(schoolId: string) {
  try {
    const response = await axiosInstance.post(`/owner/schools/${schoolId}/reject`);
    return {
      success: response.data.success ?? true,
      message: response.data.message ?? "Pendaftaran sekolah berhasil ditolak",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("API Error rejectSchool:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal menolak pendaftaran sekolah",
      data: null,
    };
  }
}

/**
 * Mengambil seluruh daftar sekolah (All Sekolah)
 */
export async function getAllSchools(search?: string) {
  try {
    const response = await axiosInstance.get("/owner/schools", {
      params: search ? { search } : undefined,
    });
    return {
      success: response.data.success ?? true,
      message: response.data.message ?? "Daftar sekolah berhasil dimuat",
      data: (response.data.data || []) as OwnerSchoolItem[],
    };
  } catch (error: any) {
    console.error("API Error getAllSchools:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gagal mengambil data seluruh sekolah",
      data: [] as OwnerSchoolItem[],
    };
  }
}

