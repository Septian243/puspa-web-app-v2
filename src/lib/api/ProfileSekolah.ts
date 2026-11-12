/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface SchoolProfileData {
  id?: string;
  school_name?: string;
  nama?: string;
  npsn?: string;
  pic_name?: string;
  jenjang?: string;
  school_address?: string;
  alamat?: string;
  username?: string;
  email?: string;
  school_phone?: string;
  phone?: string;
}

/**
 * Mengambil profil sekolah dari backend
 */
export async function getSchoolProfile(): Promise<SchoolProfileData | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.get("/school/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data?.data || null;
  } catch (error) {
    console.error("ERROR getSchoolProfile:", error);
    return null;
  }
}

/**
 * Memperbarui profil sekolah
 */
export async function updateSchoolProfile(payload: Partial<SchoolProfileData>): Promise<any> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.put("/school/profile", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("ERROR updateSchoolProfile:", error);
    throw error;
  }
}
