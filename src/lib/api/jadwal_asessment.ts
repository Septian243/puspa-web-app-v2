// src/lib/api/jadwal_asesmen.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";
import type { Jadwal } from "@/app/admin/jadwal_asesmen/page"; // sesuaikan path

export async function getAssessmentsAdmin(
  status: "scheduled" | "completed",
  search: string = "",
  date?: string
): Promise<Jadwal[]> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return [];

    let endpoint = "/assessments";
    if (status === "scheduled") endpoint = "/assessments/scheduled/admin";
    if (status === "completed") endpoint = "/assessments/completed/admin";

    const params: Record<string, any> = {};
    if (search) params.search = search;
    if (date && date.trim() !== "") params.date = date;

    const res = await api.get(endpoint, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    const list = res.data?.data || [];

    return list.map((item: any) => {
      // Susun assessorsByBidang dari data yang ada
      // Backend bisa return: item.assessors (array {type, name}), atau item.assessor (single string)
      const assessorsByBidang: Record<string, string> = {};

      if (Array.isArray(item.assessors)) {
        for (const a of item.assessors) {
          const type = (a.type || "").toLowerCase();
          const name = a.name || a.assessor_name || a.therapist_name || "";
          if (type && name) assessorsByBidang[type] = name;
        }
      } else if (Array.isArray(item.assessment_details)) {
        for (const d of item.assessment_details) {
          const type = (d.type || "").toLowerCase();
          const name = d.assessor_name || d.assessor || d.name || "";
          if (type && name) assessorsByBidang[type] = name;
        }
      } else if (item.assessor && item.assessor !== "-" && !Array.isArray(item.type)) {
        // Single assessor + single type
        const type = (item.type || "").toLowerCase();
        if (type && type !== "-") assessorsByBidang[type] = item.assessor;
      } else if (item.assessor && item.assessor !== "-" && Array.isArray(item.type)) {
        // Single assessor but multiple types — assign to first type as fallback
        const firstType = (item.type[0] || "").toLowerCase();
        if (firstType) assessorsByBidang[firstType] = item.assessor;
      }

      return {
        assessment_id: item.assessment_id,
        nama: item.child_name,
        orangtua: item.guardian_name,
        telepon: item.guardian_phone,
        tipe: Array.isArray(item.type) && item.type.length > 0
          ? item.type.join(", ")
          : item.type || "-",
        administrator: item.administrator || "-",
        asessor: item.assessor || "-",
        assessorsByBidang: Object.keys(assessorsByBidang).length > 0 ? assessorsByBidang : undefined,
        tanggalObservasi: item.scheduled_date || "-",
        waktu: item.scheduled_time || "-",
      };
    });
  } catch (error) {
    console.error("❌ ERROR getAssessmentsAdmin:", error);
    return [];
  }
}

export async function updateAsessmentSchedule(
  assessment_id: number,
  scheduled_date: string,
  scheduled_time: string
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.post(
      `/assessments/${assessment_id}`,
      {
        scheduled_date,
        scheduled_time,
        _method: "PATCH",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("❌ ERROR updateAsessmentSchedule:", error);
    throw error;
  }
}

// src/lib/api/jadwal_asesmen.ts
export async function getAssessmentDetail(assessment_id: number) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await api.get(
    `/assessments/${assessment_id}/detail`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data.data;
}

/**
 * Fetch asessor per bidang untuk suatu assessment_id.
 * Mencoba endpoint /assessments/{id}/detail dan /assessments/scheduled/admin
 * untuk mendapatkan mapping bidang → nama asessor.
 */
export async function getAssessmentAsessorsByBidang(
  assessment_id: number
): Promise<Record<string, string>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return {};

  try {
    // Coba endpoint detail dulu
    const res = await api.get(`/assessments/${assessment_id}/detail`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = res.data?.data;
    if (!data) return {};

    const result: Record<string, string> = {};
    const validTypes = ["paedagog", "okupasi", "wicara", "fisio"];

    // Cek berbagai kemungkinan struktur response
    if (Array.isArray(data.assessors)) {
      for (const a of data.assessors) {
        const type = (a.type || "").toLowerCase();
        const name = a.name || a.assessor_name || a.therapist_name || "";
        if (validTypes.includes(type) && name) result[type] = name;
      }
    }

    if (Array.isArray(data.assessment_details)) {
      for (const d of data.assessment_details) {
        const type = (d.type || "").toLowerCase();
        const name = d.assessor_name || d.assessor || d.name || "";
        if (validTypes.includes(type) && name && !result[type]) result[type] = name;
      }
    }

    // Fallback: single assessor + type
    if (Object.keys(result).length === 0) {
      const type = (data.type || "").toLowerCase();
      const name = data.assessor || data.assessor_name || "";
      if (validTypes.includes(type) && name) result[type] = name;
    }

    return result;
  } catch {
    return {};
  }
}
