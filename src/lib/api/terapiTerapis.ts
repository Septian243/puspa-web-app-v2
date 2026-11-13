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
  start_time?: string;
  end_time?: string;
  new_start_time?: string;
  new_end_time?: string;
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
  implementation?: string;
  advanced_assessment?: string;
  advanced_plan?: string;
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

const sessionTimeCache = new Map<string, { waktu: string; therapist_name?: string }>();

export async function getRescheduledSessionInfo(
  newSessionId: string
): Promise<{ start_time?: string; end_time?: string; waktu?: string; therapist_name?: string } | null> {
  if (!newSessionId) return null;

  const cached = sessionTimeCache.get(newSessionId);
  if (cached) {
    const [s, e] = cached.waktu.split(" - ");
    return {
      start_time: s,
      end_time: e,
      waktu: cached.waktu,
      therapist_name: cached.therapist_name,
    };
  }

  try {
    const res = await axiosInstance.get(`/therapy_sessions/${newSessionId}`);
    const detail = res.data?.data;
    if (!detail) return null;

    let extractedTime = "";
    if (detail.notes) {
      const match = detail.notes.match(
        /pukul\s+([0-9]{1,2}[:.][0-9]{2})\s*-\s*([0-9]{1,2}[:.][0-9]{2})/i
      );
      if (match) {
        extractedTime = `${match[1].replace(".", ":")} - ${match[2].replace(".", ":")}`;
      }
    }

    if (!extractedTime && detail.start_time && detail.end_time && detail.start_time !== "-" && detail.end_time !== "-") {
      extractedTime = `${detail.start_time.slice(0, 5)} - ${detail.end_time.slice(0, 5)}`;
    }

    if (extractedTime) {
      sessionTimeCache.set(newSessionId, {
        waktu: extractedTime,
        therapist_name: detail.therapist_name,
      });

      const [s, e] = extractedTime.split(" - ");
      return {
        start_time: s,
        end_time: e,
        waktu: extractedTime,
        therapist_name: detail.therapist_name,
      };
    }

    return null;
  } catch (err) {
    console.error("Gagal mengambil waktu sesi baru reschedule:", err);
    return null;
  }
}

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

    // JIKA STATUS RESCHEDULED: Ambil jam sesi baru murni dari frontend jika belum ada
    if (filters.status === "rescheduled") {
      const itemsToResolve = items.filter(
        (it) => it.reschedule_info?.new_session_id && (!it.reschedule_info?.start_time || it.reschedule_info.start_time === "-")
      );
      if (itemsToResolve.length > 0) {
        await Promise.allSettled(
          itemsToResolve.map(async (item) => {
            const newSessionId = item.reschedule_info?.new_session_id;
            if (!newSessionId) return;
            const info = await getRescheduledSessionInfo(newSessionId);
            if (info && item.reschedule_info) {
              if (info.start_time) item.reschedule_info.start_time = info.start_time;
              if (info.end_time) item.reschedule_info.end_time = info.end_time;
              if (info.start_time) item.reschedule_info.new_start_time = info.start_time;
              if (info.end_time) item.reschedule_info.new_end_time = info.end_time;
              if (info.therapist_name && info.therapist_name !== "-") {
                item.reschedule_info.new_therapist_name = info.therapist_name;
              }
            }
          })
        );
      }
    }

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

    if (sessionDetail.reschedule_info?.new_session_id && (!sessionDetail.reschedule_info.start_time || sessionDetail.reschedule_info.start_time === "-")) {
      const info = await getRescheduledSessionInfo(sessionDetail.reschedule_info.new_session_id);
      if (info && sessionDetail.reschedule_info) {
        if (info.start_time) sessionDetail.reschedule_info.start_time = info.start_time;
        if (info.end_time) sessionDetail.reschedule_info.end_time = info.end_time;
        if (info.start_time) sessionDetail.reschedule_info.new_start_time = info.start_time;
        if (info.end_time) sessionDetail.reschedule_info.new_end_time = info.end_time;
        if (info.therapist_name && info.therapist_name !== "-") {
          sessionDetail.reschedule_info.new_therapist_name = info.therapist_name;
        }
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
 * Interface item data untuk pratinjau catatan SOAP (GET /therapy_soaps/preview)
 */
export interface TherapySoapPreviewItem {
  id: string | number;
  child_name: string;
  medical_record_number: string;
  therapist_name: string;
  therapy_type: string;
  date: string;
  time: string;
  diagnosis: string;
}

/**
 * Mengambil pratinjau data catatan SOAP (10 baris pertama) (GET /therapy_soaps/preview)
 */
export async function getTherapySoapPreview(
  filters: ExportTherapySoapFilters = {},
  limit = 10
): Promise<TherapySoapPreviewItem[]> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await axiosInstance.get("/therapy_soaps/preview", {
      params: { ...filters, limit },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || [];
  } catch (error) {
    console.error("Gagal mengambil preview data SOAP:", error);
    return [];
  }
}

/**
 * Mengunduh berkas catatan SOAP dalam format PDF atau Excel (.xlsx) (GET /therapy_soaps/export)
 */
export async function downloadExportTherapySoap(
  filters: ExportTherapySoapFilters = {},
  format: "pdf" | "excel" = "pdf"
): Promise<{ success: boolean; error?: string; fileName?: string }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const isExcel = format === "excel";
    const mimeType = isExcel
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf";
    const ext = isExcel ? "xlsx" : "pdf";

    const res = await axiosInstance.get("/therapy_soaps/export", {
      params: { ...filters, format },
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: isExcel ? mimeType : "application/pdf",
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

    let fileName = `catatan_soap_${new Date().toISOString().slice(0, 10)}.${ext}`;
    const disposition = res.headers["content-disposition"] || res.headers["Content-Disposition"];
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, "").trim();
      }
    }

    const blob = new Blob([res.data], { type: mimeType });
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
    console.error(`Gagal mendownload ${format.toUpperCase()} export SOAP:`, error);

    if (error.response?.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const json = JSON.parse(errorText);
        const errMsg = json.message && json.message !== "Not Found"
          ? json.message
          : "Data catatan SOAP tidak ditemukan untuk periode atau filter yang dipilih.";
        return {
          success: false,
          error: errMsg,
        };
      } catch {
        // Fallback jika gagal parse json
      }
    }

    const rawMessage = error.response?.data?.message;
    const message =
      rawMessage && rawMessage !== "Not Found"
        ? rawMessage
        : (error.response?.status === 404
          ? "Data catatan SOAP tidak ditemukan untuk periode atau filter yang dipilih."
          : `Gagal mengunduh laporan ${format.toUpperCase()}.`);

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Mengunduh berkas PDF catatan SOAP (GET /therapy_soaps/export)
 */
export async function downloadExportTherapySoapPdf(
  filters: ExportTherapySoapFilters = {}
): Promise<{ success: boolean; error?: string; fileName?: string }> {
  return downloadExportTherapySoap(filters, "pdf");
}

/**
 * Mengunduh berkas Excel catatan SOAP (GET /therapy_soaps/export?format=excel)
 */
export async function downloadExportTherapySoapExcel(
  filters: ExportTherapySoapFilters = {}
): Promise<{ success: boolean; error?: string; fileName?: string }> {
  return downloadExportTherapySoap(filters, "excel");
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
