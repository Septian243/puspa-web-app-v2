/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface SchoolStudentItem {
  id: string;
  child_name: string;
  child_gender: string;
  child_birth_date: string | null;
  age: number | null;
  observation_status: string | null;
  assessment_status: string | null;
  created_at: string | null;
}

export interface SchoolStudentFilters {
  search?: string;
  gender?: string;
  page?: number;
  per_page?: number;
}

export interface SchoolStudentPaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface SchoolStudentListResponse {
  items: SchoolStudentItem[];
  meta: SchoolStudentPaginationMeta;
}

export interface SchoolStudentDetailItem {
  id: string;
  child_name: string;
  child_gender: string;
  child_birth_place: string | null;
  child_birth_date: string | null;
  age: number | null;
  child_complaint: string | null;
  school: {
    id: string;
    school_name: string;
    npsn: string | null;
  } | null;
  guardians: Array<{
    guardian_name: string;
    guardian_type: string;
  }>;
  observation_summary: any | null;
  assessment_summary: any | null;
  created_at: string | null;
}

/**
 * Mengambil daftar siswa terdaftar pada sekolah (dengan filter search & pagination)
 */
export async function getSchoolStudents(
  filters: SchoolStudentFilters = {}
): Promise<SchoolStudentListResponse> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.get("/school/students", {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const rawData = res.data?.data;
    const items = Array.isArray(rawData?.items)
      ? rawData.items
      : Array.isArray(rawData)
        ? rawData
        : [];

    const meta = rawData?.meta || res.data?.meta || {
      current_page: 1,
      last_page: 1,
      total: items.length,
      per_page: 10,
    };

    return {
      items: items as SchoolStudentItem[],
      meta,
    };
  } catch (error) {
    console.error("ERROR getSchoolStudents:", error);
    throw error;
  }
}

/**
 * Mengambil detail profil siswa sekolah berdasarkan childId
 */
export async function getSchoolStudentDetail(
  childId: string
): Promise<SchoolStudentDetailItem | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.get(`/school/students/${childId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data?.data || null;
  } catch (error) {
    console.error("ERROR getSchoolStudentDetail:", error);
    throw error;
  }
}
