import axios from "axios";
import axiosInstance from "@/lib/axios";

// ── Types & Interfaces ────────────────────────────────────────────────────────

export type TherapyType = "okupasi" | "wicara" | "paedagog" | "fisio";
export type VirtualStatus = "scheduled" | "pending" | "rescheduled" | "completed";
export type DbSessionStatus =
  | "pending"
  | "present"
  | "absent"
  | "excused"
  | "sick"
  | "therapist_absent"
  | "therapist_excused"
  | "cancelled";

export interface RescheduleInfo {
  reason: string;
  requested_by: "children" | "therapist" | "guardian";
  new_session_id?: string;
  new_session_date?: string;
  new_session_date_formatted?: string;
  new_therapist_name?: string;
}

export interface TherapySessionItem {
  id: string;
  session_number: number;
  session_date: string;
  session_date_formatted: string;
  day: string;
  schedule_id: string;
  start_time: string;
  end_time: string;
  therapy_type: TherapyType;
  therapy_type_label: string;
  child_id: string;
  child_name: string;
  medical_record_number: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_type: string;
  therapist_id: string;
  therapist_name: string;
  is_substitute: boolean;
  status: DbSessionStatus;
  notes?: string | null;
  checked_in_at?: string | null;
  has_soap: boolean;
  is_rescheduled: boolean;
  is_reschedule?: boolean;
  reschedule_info?: RescheduleInfo | null;
  created_at?: string;
  updated_at?: string;
}

export interface TherapySoapDetail {
  id: string;
  therapy_session_id?: string;
  performed_at?: string | null;
  performed_date?: string | null;
  performed_date_formatted?: string | null;
  performed_time?: string | null;
  therapy_diagnosis: string;
  interventions: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  implementation: string;
  advanced_assessment: string;
  advanced_plan: string;
  total_soap_recorded?: number | null;
  last_intervention?: string | null;
  child_address?: string;
}

export interface TherapySessionDetail extends TherapySessionItem {
  child_gender: string;
  child_age: number | null;
  child_birth_date: string | null;
  child_birth_date_formatted: string | null;
  child_birth_place: string;
  child_school: string;
  child_address?: string;
  child_complaint: string;
  relationship_with_child: string;
  soap?: TherapySoapDetail | null;
}

export interface TherapySessionFilters {
  therapy_type?: TherapyType;
  status?: VirtualStatus;
  search?: string;
  date_range?: "today" | "tomorrow" | "this_week" | "this_month";
  date?: string;
  my_sessions?: boolean;
  per_page?: number;
  page?: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export interface TherapySessionsListResponse {
  items: TherapySessionItem[];
  meta: PaginationMeta;
}

export interface CreateTherapySoapPayload {
  therapy_session_id: string;
  performed_at: string;
  therapy_diagnosis: string;
  interventions: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  implementation: string;
  advanced_assessment: string;
  advanced_plan: string;
}

export interface ExportChildOption {
  id: string;
  child_name: string;
  medical_record_number: string;
}

export interface ExportTherapistOption {
  id: string;
  therapist_name: string;
  therapy_type: string;
  therapy_type_label: string;
}

export interface ExportTherapyTypeOption {
  value: string;
  label: string;
}

export interface ExportFilterOptions {
  scope?: "all" | "therapist";
  therapist_id?: string;
  therapist_name?: string;
  therapy_type?: string;
  therapy_type_label?: string;
  therapy_types?: ExportTherapyTypeOption[];
  therapists?: ExportTherapistOption[];
  children: ExportChildOption[];
}

export interface ExportTherapySoapFilters {
  child_id?: string | string[];
  therapist_id?: string;
  therapy_type?: string;
  period_type?: "daily" | "weekly" | "monthly" | "custom";
  date?: string;
  week?: number;
  month?: number;
  year?: number;
  date_from?: string;
  date_to?: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Mengambil daftar sesi terapi dengan filter terpaginasi (GET /therapy_sessions)
 */
export async function getTherapySessions(
  filters: TherapySessionFilters = {}
): Promise<TherapySessionsListResponse> {
  try {
    const params: Record<string, unknown> = { ...filters };
    if (typeof filters.my_sessions === "boolean") {
      params.my_sessions = filters.my_sessions ? 1 : 0;
    }

    const res = await axiosInstance.get("/therapy_sessions", {
      params,
    });

    const data = res.data?.data;
    const rawItems = (data?.items || []) as TherapySessionItem[];
    const items = rawItems.map((item) => ({
      ...item,
      is_rescheduled: item.is_reschedule ?? item.is_rescheduled ?? false,
    }));

    return {
      items,
      meta: data?.meta || {
        current_page: 1,
        last_page: 1,
        per_page: filters.per_page || 15,
        total: 0,
      },
    };
  } catch (error) {
    console.error("Gagal mengambil data therapy_sessions:", error);
    return {
      items: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: filters.per_page || 15,
        total: 0,
      },
    };
  }
}

/**
 * Mengambil detail catatan SOAP berdasarkan ID sesi terapi (GET /therapy_soaps/{session})
 */
export async function getTherapySoapBySession(
  sessionId: string
): Promise<TherapySoapDetail | null> {
  try {
    const res = await axiosInstance.get(`/therapy_soaps/${sessionId}`);
    return res.data?.data || null;
  } catch {
    // Jika 404 (belum ada catatan SOAP), kembalikan null
    return null;
  }
}

/**
 * Mengambil detail lengkap satu sesi terapi (GET /therapy_sessions/{session})
 */
export async function getTherapySessionDetail(
  sessionId: string
): Promise<TherapySessionDetail | null> {
  try {
    const res = await axiosInstance.get(`/therapy_sessions/${sessionId}`);
    const sessionDetail: TherapySessionDetail | null = res.data?.data || null;
    if (!sessionDetail) return null;

    if (sessionDetail.is_reschedule !== undefined) {
      sessionDetail.is_rescheduled = Boolean(sessionDetail.is_reschedule);
    }

    if (sessionDetail.has_soap || !sessionDetail.soap) {
      try {
        const soapData = await getTherapySoapBySession(sessionId);
        if (soapData) {
          sessionDetail.soap = soapData;
          sessionDetail.has_soap = true;
          if (!sessionDetail.child_address && soapData.child_address) {
            sessionDetail.child_address = soapData.child_address;
          }
        }
      } catch {
        // Biarkan jika belum ada SOAP
      }
    }

    return sessionDetail;
  } catch (error) {
    console.error(`Gagal mengambil detail sesi terapi (${sessionId}):`, error);
    return null;
  }
}

/**
 * Menyimpan catatan SOAP baru (POST /therapy_soaps)
 */
export async function createTherapySoap(
  payload: CreateTherapySoapPayload
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    const res = await axiosInstance.post("/therapy_soaps", payload);
    return {
      success: true,
      message: res.data?.message || "Catatan SOAP berhasil disimpan!",
      data: res.data?.data,
    };
  } catch (error: unknown) {
    console.error("Gagal menyimpan catatan SOAP:", error);
    let message = "Gagal menyimpan catatan SOAP. Silakan periksa kembali formulir Anda.";
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      message =
        errorData.message ||
        errorData.errors?.performed_at?.[0] ||
        errorData.errors?.therapy_session_id?.[0] ||
        message;
    }
    return {
      success: false,
      message,
    };
  }
}

/**
 * Mengambil opsi filter untuk halaman unduh catatan SOAP (GET /therapy_soaps/export/filter-options)
 */
export async function getExportFilterOptions(params?: {
  therapy_type?: string;
  therapist_id?: string;
}): Promise<ExportFilterOptions | null> {
  try {
    const res = await axiosInstance.get("/therapy_soaps/export/filter-options", {
      params,
    });
    return res.data?.data || null;
  } catch (error) {
    console.error("Gagal mengambil filter options export SOAP:", error);
    return null;
  }
}

/**
 * Mengunduh berkas PDF catatan SOAP (GET /therapy_soaps/export)
 */
export async function downloadExportTherapySoapPdf(
  filters: ExportTherapySoapFilters = {}
): Promise<{ success: boolean; error?: string; fileName?: string }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await axiosInstance.get("/therapy_soaps/export", {
      params: filters,
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    });

    if (res.data.type === "application/json") {
      const text = await res.data.text();
      const parsed = JSON.parse(text);
      return {
        success: false,
        error: parsed.message || "Data catatan SOAP tidak ditemukan.",
      };
    }

    let fileName = `laporan_soap_${new Date().toISOString().slice(0, 10)}.pdf`;
    const disposition = res.headers["content-disposition"] || res.headers["Content-Disposition"];
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, "").trim();
      }
    }

    const blob = new Blob([res.data], { type: "application/pdf" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, fileName };
  } catch (error: any) {
    console.error("Gagal mendownload PDF export SOAP:", error);

    if (error.response?.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const json = JSON.parse(errorText);
        return {
          success: false,
          error: json.message || "Data catatan SOAP tidak ditemukan untuk filter ini.",
        };
      } catch {
        // Fallback jika gagal parse json
      }
    }

    const message =
      error.response?.data?.message ||
      (error.response?.status === 404
        ? "Data catatan SOAP tidak ditemukan untuk filter yang dipilih."
        : "Gagal mengunduh laporan PDF.");

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Helper untuk menghitung jumlah sesi tertunda milik terapis yang login
 */
export async function getPendingSessionsCount(
  therapyType?: TherapyType
): Promise<number> {
  try {
    const res = await getTherapySessions({
      therapy_type: therapyType,
      status: "pending",
      my_sessions: true,
      per_page: 1,
      page: 1,
    });
    return res.meta.total || 0;
  } catch (error) {
    console.error("Gagal menghitung pending sessions:", error);
    return 0;
  }
}

/**
 * Helper untuk mengambil riwayat sesi terapi & SOAP untuk portal orang tua
 */
export async function getParentTherapyHistory(params: { child_id?: string; start_date?: string; end_date?: string } = {}) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await axiosInstance.get("/my/dashboard/therapy-history", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || [];
  } catch (error) {
    console.error("Gagal mengambil riwayat terapi orang tua:", error);
    return [];
  }
}
