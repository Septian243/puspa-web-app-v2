/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface SchoolDashboardStats {
  school_name: string;
  npsn: string | null;
  pic_name: string | null;
  total_students: number;
  students_with_observation: number;
  students_with_assessment: number;
  students_downloaded?: number;
  downloaded_assessments_count?: number;
}

/**
 * Mengambil ringkasan statistik dasbor sekolah dari backend
 */
export async function getSchoolDashboard(): Promise<SchoolDashboardStats | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.get("/school/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data?.data || null;
  } catch (error) {
    console.error("ERROR getSchoolDashboard:", error);
    throw error;
  }
}
