// src/lib/api/jadwal_asesmen.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";
import type { Jadwal } from "@/app/admin/jadwal_asesmen/page"; // sesuaikan path
import { normalizeBidangKey } from "@/components/form/FormAturAsesmen";

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
          const type = normalizeBidangKey(a.type) || (a.type || "").toLowerCase();
          const name = a.name || a.assessor_name || a.therapist_name || "";
          if (type && name) assessorsByBidang[type] = name;
        }
      } else if (Array.isArray(item.assessment_details)) {
        for (const d of item.assessment_details) {
          const type = normalizeBidangKey(d.type) || (d.type || "").toLowerCase();
          const name = d.assessor_name || d.assessor || d.name || "";
          if (type && name) assessorsByBidang[type] = name;
        }
      } else if (item.assessor && item.assessor !== "-" && !Array.isArray(item.type)) {
        // Single assessor + single type
        const type = normalizeBidangKey(item.type) || (item.type || "").toLowerCase();
        if (type && type !== "-") assessorsByBidang[type] = item.assessor;
      } else if (item.assessor && item.assessor !== "-" && Array.isArray(item.type)) {
        // Single assessor but multiple types — assign to first type as fallback
        const firstType = normalizeBidangKey(item.type[0]) || (item.type[0] || "").toLowerCase();
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
  scheduled_time: string,
  petugasByBidang?: Record<string, string>
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // 1. Format scheduled_time to HH:mm (H:i with colon for Carbon)
    let formattedTime = (scheduled_time || "").trim().replace(".", ":");
    if (/^\d{1,2}:\d{2}/.test(formattedTime)) {
      const [h, m] = formattedTime.split(":");
      formattedTime = `${h.padStart(2, "0")}:${m}`;
    }

    // 2. Format scheduled_date to YYYY-MM-DD
    let formattedDate = (scheduled_date || "").trim();
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(formattedDate)) {
      const [d, m, y] = formattedDate.split(/[\/\-]/);
      formattedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    const payload: any = {
      scheduled_date: formattedDate,
      scheduled_time: formattedTime,
      _method: "PATCH",
    };

    // Ambil opsi terapis assessment untuk mapping assessment_detail_id & therapist_id
    const options = await getAssessmentTherapistOptions(assessment_id);
    const therapistsPayload: Array<{ assessment_detail_id: number; therapist_id: string | number }> = [];

    if (Array.isArray(options) && options.length > 0) {
      for (const opt of options) {
        const normOptType = normalizeBidangKey(opt.type) || (opt.type || "").toLowerCase().trim();
        let matchedTherapist: any = null;

        if (petugasByBidang) {
          let targetName = "";
          for (const [k, v] of Object.entries(petugasByBidang)) {
            const normK = normalizeBidangKey(k) || k.toLowerCase().trim();
            if (normK === normOptType || k.toLowerCase().trim() === (opt.type || "").toLowerCase().trim()) {
              targetName = (v || "").toLowerCase().trim();
              break;
            }
          }
          if (targetName) {
            matchedTherapist = (opt.therapists || []).find((t: any) => {
              const tName = (t.name || t.therapist_name || t.nama || "").toLowerCase().trim();
              const tId = String(t.id || t.therapist_id || "");
              return tName === targetName || tId === targetName;
            });
          }
        }

        if (!matchedTherapist && opt.current_therapist_id) {
          matchedTherapist = (opt.therapists || []).find(
            (t: any) => String(t.id || t.therapist_id) === String(opt.current_therapist_id)
          );
        }

        if (!matchedTherapist && Array.isArray(opt.therapists) && opt.therapists.length > 0) {
          matchedTherapist = opt.therapists[0];
        }

        if (matchedTherapist) {
          therapistsPayload.push({
            assessment_detail_id: opt.assessment_detail_id || opt.id,
            therapist_id: matchedTherapist.id || matchedTherapist.therapist_id,
          });
        }
      }
    }

    if (therapistsPayload.length > 0) {
      payload.therapists = therapistsPayload;
    }

    const res = await api.post(
      `/assessments/${assessment_id}`,
      payload,
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

// ========================================================
// GET ASSESSMENT THERAPIST OPTIONS
// ========================================================
export async function getAssessmentTherapistOptions(
  assessment_id: number | string
): Promise<any[]> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.get(`/assessments/${assessment_id}/therapist-options`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || [];
  } catch (err) {
    console.warn("getAssessmentTherapistOptions:", err);
    return [];
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
 * Mengutamakan endpoint /assessments/{id}/therapist-options langsung dari DB
 */
export async function getAssessmentAsessorsByBidang(
  assessment_id: number
): Promise<Record<string, string>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return {};

  try {
    // 1. Ambil dari endpoint resmi therapist-options
    const options = await getAssessmentTherapistOptions(assessment_id);
    const result: Record<string, string> = {};

    if (Array.isArray(options) && options.length > 0) {
      for (const opt of options) {
        const normType = normalizeBidangKey(opt.type) || (opt.type || "").toLowerCase().trim();
        if (!normType) continue;

        let therapistName = "";
        if (opt.current_therapist_name) {
          therapistName = opt.current_therapist_name;
        } else if (opt.current_therapist?.name || opt.current_therapist?.therapist_name) {
          therapistName = opt.current_therapist.name || opt.current_therapist.therapist_name;
        } else if (opt.current_therapist_id && Array.isArray(opt.therapists)) {
          const matched = opt.therapists.find(
            (t: any) => String(t.id || t.therapist_id) === String(opt.current_therapist_id)
          );
          if (matched && (matched.name || matched.therapist_name || matched.nama)) {
            therapistName = matched.name || matched.therapist_name || matched.nama;
          }
        }

        if (therapistName) {
          result[normType] = therapistName;
        }
      }
    }

    if (Object.keys(result).length > 0) {
      return result;
    }

    // 2. Fallback ke endpoint detail
    const res = await api.get(`/assessments/${assessment_id}/detail`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = res.data?.data;
    if (!data) return {};

    if (Array.isArray(data.assessors)) {
      for (const a of data.assessors) {
        const normType = normalizeBidangKey(a.type);
        const name = a.name || a.assessor_name || a.therapist_name || a.nama || "";
        if (normType && name) result[normType] = name;
      }
    }

    if (Array.isArray(data.assessment_details)) {
      for (const d of data.assessment_details) {
        const normType = normalizeBidangKey(d.type);
        const name = d.assessor_name || d.assessor || d.therapist_name || d.name || "";
        if (normType && name && !result[normType]) result[normType] = name;
      }
    }

    if (Object.keys(result).length === 0) {
      const normType = normalizeBidangKey(data.type);
      const name = data.assessor || data.assessor_name || data.therapist_name || "";
      if (normType && name) result[normType] = name;
    }

    return result;
  } catch {
    return {};
  }
}
