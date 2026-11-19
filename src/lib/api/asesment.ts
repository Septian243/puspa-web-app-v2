/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "@/lib/axios";

export interface Assessment {
  id: number;
  assessment_id: number;
  child_id: string;
  child_name: string;
  guardian_name: string;
  guardian_phone: string;
  type: string; // wicara, okupasi, paedagog, fisio
  administrator: string;
  assessor: string | null;
  therapist_id?: string | null;
  scheduled_date?: string;
  scheduled_time?: string;
  status: string;
}


export const getAssessments = async (
  type: "paedagog" | "okupasi" | "wicara" | "fisio",
  status: "scheduled" | "completed",
  date?: string,
  search?: string,
  myAssessments?: boolean
): Promise<Assessment[]> => {
  try {
    const params: Record<string, string> = {
      type,
      search: search || "",
    };

    if (date) params.date = date;
    if (typeof myAssessments === "boolean") {
      params.my_assessments = myAssessments ? "1" : "0";
    }

    // SESUAIKAN DENGAN BE
    const endpoint =
      status === "scheduled"
        ? "/assessments/scheduled"
        : "/assessments/completed";

    const response = await axiosInstance.get(endpoint, { params });

    return response.data.data ?? [];
  } catch (error: any) {
    console.error(
      "❌ Gagal mengambil data assessment:",
      error.response?.data || error.message
    );
    throw error;
  }
};



// ================== INTERFACE DETAIL ASSESSMENT ==================
export interface AssessmentDetail {
  observation_id: number;
  child_name: string;
  child_birth_date: string;
  child_age: string;
  child_gender: string;
  child_school: string;
  child_address: string;
  scheduled_date: string;
  scheduled_time: string;
  parent_type: string;
  parent_name: string;
  relationship: string;
  parent_phone: string;
  admin_name: string;
  type: string;
  assessors?: Array<{
    type: string;
    therapist_id: string | null;
    therapist_name: string | null;
  }>;
  assessor_names?: string | null;
}

// ================== GET ASSESSMENT DETAIL (DATA PASIEN) ==================
// ================== GET ASSESSMENT DETAIL ==================
export const getAssessmentDetail = async (assessmentId: string) => {
  try {
    const { data } = await axiosInstance.get(
      `/assessments/${assessmentId}/detail`
    );

    return data.data ?? {};
  } catch (error: any) {
    console.error("❌ Gagal mengambil detail assessment:", {
      url: `/assessments/${assessmentId}/detail`,
      status: error.response?.status,
      message: error.response?.data || error.message,
    });
    return {};
  }
};

export interface AssessmentAccessCheckResult {
  allowed: boolean;
  message?: string;
  detail?: any;
}

export async function checkAssessmentAccess(
  assessmentId: string,
  formType: "fisio" | "okupasi" | "paedagog" | "wicara",
  profile?: {
    therapist_id?: string | number;
    therapist_section?: string;
  } | null
): Promise<AssessmentAccessCheckResult> {
  if (!assessmentId) {
    return {
      allowed: false,
      message: "Assessment ID tidak ditemukan di URL.",
    };
  }

  // 1. Cek kesesuaian spesialisasi terapis
  if (profile?.therapist_section) {
    if (profile.therapist_section.toLowerCase() !== formType.toLowerCase()) {
      return {
        allowed: false,
        message: `Bidang keahlian Anda (${profile.therapist_section}) tidak sesuai dengan form asesmen ini (${formType.toUpperCase()}).`,
      };
    }
  }

  // 2. Ambil detail asesmen dan cek penugasan petugas
  try {
    const detail = await getAssessmentDetail(assessmentId);
    if (!detail) {
      return {
        allowed: false,
        message: "Data detail asesmen tidak ditemukan.",
      };
    }

    if (Array.isArray(detail.assessors)) {
      const assigned = detail.assessors.find(
        (a: any) => (a.type || "").toLowerCase() === formType.toLowerCase()
      );

      if (!assigned || !assigned.therapist_id) {
        return {
          allowed: false,
          message: `Asesmen bidang ${formType.toUpperCase()} ini belum memiliki petugas yang ditugaskan. Hubungi Admin terlebih dahulu.`,
          detail,
        };
      }

      if (profile?.therapist_id && String(assigned.therapist_id) !== String(profile.therapist_id)) {
        return {
          allowed: false,
          message: `Asesmen bidang ${formType.toUpperCase()} ini ditugaskan kepada ${assigned.therapist_name || "terapis lain"}. Pengisian hanya dapat dilakukan oleh petugas yang ditugaskan.`,
          detail,
        };
      }
    }

    return {
      allowed: true,
      detail,
    };
  } catch (err: any) {
    if (err?.response?.status === 403) {
      return {
        allowed: false,
        message: err?.response?.data?.message || "Anda tidak memiliki otorisasi untuk mengakses asesmen ini.",
      };
    }
    return {
      allowed: true,
    };
  }
}



// ================== COMPLETE ASSESSMENT ==================
export const completeAssessment = async (
  assessmentId: string,
  type: "paedagog" | "okupasi" | "wicara" | "fisio"
) => {
  try {
    const { data } = await axiosInstance.patch(
      `/assessments/${assessmentId}/status`,
      { status: "completed" },
      { params: { type } }
    );
    return data;
  } catch (error: any) {
    console.error(
      "❌ Gagal menyelesaikan assessment:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// ================== SUBMIT ASSESSMENT ================== // Pastikan axiosInstance di-import
export const submitAssessment = async (
  assessmentId: string,
  type: "paedagog" | "okupasi" | "wicara" | "fisio",
  payload: 
    | { answers: { question_id: number; answer: { score: number; note: string } }[] }
    | { answers: { question_id: number; answer: "yes" | "no" }[] }
) => {
  try {
    const endpoint = `/assessments/${assessmentId}/submit/${type}_assessor`;

    const { data } = await axiosInstance.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return data;
  } catch (error: any) {
    console.log("Submit error:", error.response?.data || error);
    throw error;
  }
};



// ================== GET ASSESSMENT ANSWERS ==================
export interface AssessmentAnswerItem {
  question_id: string;
  question_text: string;
  answer: any;
  note: string | null;
}

export const getAssessmentAnswers = async (
  assessmentId: string,
  type: "paedagog" | "okupasi" | "wicara" | "fisio"
) => {
  try {
    const res = await axiosInstance.get(
      `/assessments/${assessmentId}/answer/${type}_assessor`
    );
      console.log("CALLING:", `/assessments/${assessmentId}/answer/${type}_assessor`)

    // ✅ BE RETURN ARRAY DI data
    return res.data?.data ?? [];
  } catch (error: any) {
    console.error("❌ Gagal mengambil jawaban assessment:", error);
    return [];
  }
};

// ================== GET ASSESSMENT QUESTIONS ==================
// ================== GET ASSESSMENT QUESTIONS ==================
// ================== GET ASSESSMENT QUESTIONS ==================
export const getAssessmentQuestions = async (
  type: "paedagog" | "okupasi" | "wicara_oral" | "wicara_bahasa" | "fisio"
) => {
  let endpoint = "";

  try {
    // Semua assessment (paedagog, okupasi, wicara, fisio) menggunakan endpoint singular "/question"
    endpoint = `/assessments/${type}/question`;

    console.log("CALLING:", endpoint);

    const response = await axiosInstance.get(endpoint);

    const data = response.data?.data ?? {};

    return {
      assessment_type: data.assessment_type || type,
      groups: Array.isArray(data.groups) ? data.groups : [],
    };
  } catch (error: any) {
    console.error("❌ Gagal mengambil daftar pertanyaan:", {
      url: endpoint,
      status: error.response?.status,
      message: error.response?.data || error.message,
    });

    return { assessment_type: type, groups: [] };
  }
};

export async function submitAssessmentWicara(
  assessmentId: string,
  payload: {
    answers: {
      question_id: number;
      answer: any;
    }[];
  }
) {
  try {
    console.log("POST ->", `/assessments/${assessmentId}/submit/wicara_assessor`);
    console.log("PAYLOAD:", payload);

    const res = await axiosInstance.post(
      `/assessments/${assessmentId}/submit/wicara_assessor`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return res.data;
  } catch (err: any) {
    console.error(
      "ERROR submitAssessmentWicara:",
      err.response?.data || err
    );
    throw err;
  }
}

