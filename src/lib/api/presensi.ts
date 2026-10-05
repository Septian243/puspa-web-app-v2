/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface SessionAttendanceItem {
  id: string;
  session_number: number;
  session_date: string;
  schedule_id: string;
  child_id: string;
  child_name: string;
  medical_record_number: string;
  guardian_name: string;
  guardian_phone: string;
  therapist_id: string;
  therapist_name: string;
  therapy_type: "okupasi" | "fisio" | "wicara" | "paedagog";
  start_time: string;
  end_time: string;
  status:
    | "pending"
    | "present"
    | "absent"
    | "excused"
    | "sick"
    | "therapist_absent"
    | "therapist_excused"
    | "cancelled";
  notes?: string | null;
  checked_in_at?: string | null;
  attendance_token?: string | null;
  is_rescheduled: boolean;
  reschedule_info?: {
    reschedule_id: string;
    new_session_id: string;
    new_session_date: string;
    requested_by: string;
    reason?: string;
  } | null;
  created_at?: string;
}

export interface RescheduleItem {
  id: string;
  requested_by: "children" | "therapist" | "guardian";
  reason?: string;
  child_id: string;
  child_name: string;
  medical_record_number: string;
  therapy_type: string;
  original_session: {
    id: string;
    session_number: number;
    session_date: string;
    therapist_name: string;
    status: string;
  } | null;
  new_session: {
    id: string;
    session_number: number;
    session_date: string;
    therapist_name: string;
    status: string;
  } | null;
  created_at?: string;
}

export interface AttendanceFilters {
  date?: string;
  therapist_id?: string;
  therapy_type?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export async function getTodaySessions(filters: AttendanceFilters = {}) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.get("/sessions/today", {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      items: (res.data?.data?.items || []) as SessionAttendanceItem[],
      meta: res.data?.data?.meta || { current_page: 1, last_page: 1, total: 0 },
      links: res.data?.data?.links || {},
    };
  } catch (error) {
    console.error("ERROR getTodaySessions:", error);
    return {
      items: [],
      meta: { current_page: 1, last_page: 1, total: 0 },
      links: {},
    };
  }
}

export async function getRescheduledSessions(filters: { date?: string; search?: string; page?: number; per_page?: number } = {}) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.get("/sessions/rescheduled", {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      items: (res.data?.data?.items || []) as RescheduleItem[],
      meta: res.data?.data?.meta || { current_page: 1, last_page: 1, total: 0 },
      links: res.data?.data?.links || {},
    };
  } catch (error) {
    console.error("ERROR getRescheduledSessions:", error);
    return {
      items: [],
      meta: { current_page: 1, last_page: 1, total: 0 },
      links: {},
    };
  }
}

export async function markAttendance(
  sessionId: string,
  data: { status: string; notes?: string }
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.post(`/sessions/${sessionId}/attendance`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("ERROR markAttendance:", error);
    throw error;
  }
}

export async function updateAttendance(
  sessionId: string,
  data: { status?: string; notes?: string }
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.put(`/sessions/${sessionId}/attendance`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("ERROR updateAttendance:", error);
    throw error;
  }
}

export async function getSessionQr(sessionId: string) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.get(`/sessions/${sessionId}/qr`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data?.data;
  } catch (error) {
    console.error("ERROR getSessionQr:", error);
    throw error;
  }
}

export async function scanQrAttendance(qrToken: string) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.post(
      "/sessions/qr-scan",
      { token: qrToken },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("ERROR scanQrAttendance:", error);
    throw error;
  }
}

export async function createReschedule(
  sessionId: string,
  data: {
    new_date: string;
    new_therapist_id?: string;
    reason: string;
    requested_by: "children" | "therapist" | "guardian";
  }
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.post(`/sessions/${sessionId}/reschedule`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("ERROR createReschedule:", error);
    throw error;
  }
}

export async function exportAttendance(filters: {
  date_from?: string;
  date_to?: string;
  therapy_type?: string;
  therapist_id?: string;
  child_id?: string;
  status?: string;
  format?: "excel" | "pdf";
}) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await api.get("/sessions/export", {
      params: filters,
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const fileFormat = filters.format === "pdf" ? "pdf" : "xlsx";
    const mimeType =
      filters.format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    const blob = new Blob([res.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rekap_kehadiran_${new Date().toISOString().split("T")[0]}.${fileFormat}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("ERROR exportAttendance:", error);
    throw error;
  }
}
