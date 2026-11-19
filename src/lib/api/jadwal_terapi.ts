/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface ScheduleItem {
  id: string;
  child_id: string;
  child_name: string;
  medical_record_number: string;
  guardian_name: string;
  guardian_phone: string;
  therapist_id: string;
  therapist_name: string;
  therapy_type: "okupasi" | "fisio" | "wicara" | "paedagog";
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  total_meetings: number;
  period_start: string;
  period_end: string;
  status: "aktif" | "non_aktif" | "selesai";
  created_at?: string;
}

export interface ScheduleDetailSession {
  session_id: string;
  session_number: number;
  session_date: string;
  therapist_id: string;
  therapist_name: string;
  status: string;
  notes?: string | null;
}

export interface ScheduleDetailItem extends ScheduleItem {
  sessions: ScheduleDetailSession[];
}

export interface ScheduleFilters {
  page?: number;
  per_page?: number;
  day_of_week?: number;
  status?: string;
  therapy_type?: string;
  search?: string;
}

export async function getSchedules(filters: ScheduleFilters = {}) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.get("/schedules", {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      items: res.data?.data?.items || [],
      meta: res.data?.data?.meta || { current_page: 1, last_page: 1, total: 0 },
      links: res.data?.data?.links || {},
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      console.warn("getSchedules: Endpoint /schedules belum tersedia atau tidak ditemukan (404).");
    } else {
      console.warn("ERROR getSchedules:", error);
    }
    return {
      items: [],
      meta: { current_page: 1, last_page: 1, total: 0 },
      links: {},
    };
  }
}

export async function getScheduleDetail(id: string): Promise<ScheduleDetailItem | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.get(`/schedules/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data?.data || null;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      console.warn(`getScheduleDetail: Endpoint /schedules/${id} tidak ditemukan (404).`);
    } else {
      console.error("ERROR getScheduleDetail:", error);
    }
    return null;
  }
}

export async function createSchedule(data: {
  child_id: string;
  therapist_id: string;
  therapy_type: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  total_meetings: number;
  period_start: string;
  period_end: string;
  status?: string;
}) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.post("/schedules", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("ERROR createSchedule:", error);
    throw error;
  }
}

export async function updateSchedule(
  id: string,
  data: Partial<{
    child_id: string;
    therapist_id: string;
    therapy_type: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    total_meetings: number;
    period_start: string;
    period_end: string;
    status: string;
  }>
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.put(`/schedules/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("ERROR updateSchedule:", error);
    throw error;
  }
}

export async function deleteSchedule(id: string) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.delete(`/schedules/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("ERROR deleteSchedule:", error);
    throw error;
  }
}

export async function getTherapists(section?: string) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.get("/therapists", {
      params: section ? { section } : {},
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data?.data || [];
  } catch (error) {
    console.error("ERROR getTherapists:", error);
    return [];
  }
}

export async function getChildren(hasCompletedAssessment?: boolean) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const params: Record<string, any> = {};

    if (typeof hasCompletedAssessment === "boolean") {
      params.has_completed_assessment = hasCompletedAssessment;
    }

    const res = await api.get("/children", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data?.data || [];
  } catch (error) {
    console.error("ERROR getChildren:", error);
    return [];
  }
}
