/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface Jadwal {
  observation_id: number;
  nama: string;
  usia: string;
  jenisKelamin: string;
  sekolah: string;
  orangtua: string;
  telepon: string;
  tanggalObservasi?: string | null;
  waktu?: string | null;
  observer?: string | null;
  therapist_id?: string | null;
  therapist_name?: string | null;
  administrator?: string | null;
  assessment_status: string;
}

// ========================================================
// LOCAL PERSISTENCE HELPERS (DEPRECATED - MIGRATED TO REST API)
// ========================================================

/**
 * @deprecated Helper localStorage telah digantikan dengan sinkronisasi langsung ke REST API.
 */
export function saveObservationBidangLocal(
  _observationId: number | string,
  _bidang: string[]
) { }

export function getObservationBidangLocal(
  _observationId: number | string
): string[] | null {
  return null;
}

export function saveAssessmentAsessorByBidangLocal(
  _observationOrAssessmentId: number | string,
  _asessorByBidang: Record<string, string>,
  _childName?: string
) { }

export function getAssessmentAsessorByBidangLocal(
  _observationOrAssessmentId?: number | string | null,
  _childName?: string | null
): Record<string, string> | null {
  return null;
}

export function saveObservationTherapistLocal(
  _observationId: number | string,
  _therapistId: string | number,
  _therapistName: string
) { }

export function getObservationTherapistLocal(_observationId: number | string): {
  therapist_id: string;
  therapist_name: string;
} | null {
  return null;
}

// ========================================================
// GET OBSERVATIONS (Pending / Scheduled / Completed)
// ========================================================
export async function getObservations(
  status: "pending" | "scheduled" | "completed",
  search: string = "",
  date?: string
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    let endpoint = "/observations";

    if (status === "pending") endpoint = "/observations/pending";
    if (status === "scheduled") endpoint = "/observations/scheduled";
    if (status === "completed") endpoint = "/observations/completed";

    console.log("Fetching observations from:", endpoint);

    const params: any = { search };

    if (date) params.date = date;   // ⬅ hanya kirim kalau ada

    const res = await api.get(endpoint, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    const list = res.data?.data || [];

    return list.map((item: any) => {
      const isPending = status === "pending";
      const isScheduled = status === "scheduled";
      const isCompleted = status === "completed";

      // 1. Therapist ID (if returned as number or ID)
      const rawTherapistId =
        item.therapist_id ??
        item.observer_id ??
        item.terapis_id ??
        item.petugas_id ??
        item.therapist?.therapist_id ??
        item.therapist?.id ??
        item.observer?.therapist_id ??
        item.observer?.id ??
        item.terapis?.therapist_id ??
        item.terapis?.id ??
        item.petugas?.therapist_id ??
        item.petugas?.id ??
        (typeof item.therapist === "number" ? item.therapist : null) ??
        (typeof item.observer === "number" ? item.observer : null) ??
        (typeof item.terapis === "number" ? item.terapis : null) ??
        (typeof item.petugas === "number" ? item.petugas : null) ??
        null;

      // 2. Therapist Name (ONLY from therapist/observer fields, NEVER from administrator)
      const therapistName =
        item.therapist_name ||
        item.nama_terapis ||
        item.terapis_nama ||
        item.observer_name ||
        item.petugas_name ||
        item.nama_petugas ||
        (typeof item.therapist === "string" && isNaN(Number(item.therapist)) && item.therapist !== "-" ? item.therapist : null) ||
        (typeof item.observer === "string" && isNaN(Number(item.observer)) && item.observer !== "-" ? item.observer : null) ||
        (typeof item.terapis === "string" && isNaN(Number(item.terapis)) && item.terapis !== "-" ? item.terapis : null) ||
        (typeof item.petugas === "string" && isNaN(Number(item.petugas)) && item.petugas !== "-" ? item.petugas : null) ||
        item.therapist?.therapist_name ||
        item.therapist?.name ||
        item.therapist?.nama ||
        item.therapist?.user?.name ||
        item.observer?.therapist_name ||
        item.observer?.name ||
        item.observer?.nama ||
        item.observer?.user?.name ||
        item.terapis?.therapist_name ||
        item.terapis?.name ||
        item.terapis?.nama ||
        item.terapis?.user?.name ||
        item.petugas?.therapist_name ||
        item.petugas?.name ||
        item.petugas?.nama ||
        item.petugas?.user?.name ||
        (isCompleted ? (item.observer || item.therapist_name) : null) ||
        "-";

      const resolvedTherapistName = therapistName || "-";
      const resolvedTherapistId = rawTherapistId ? String(rawTherapistId) : null;

      return {
        observation_id: item.observation_id,
        nama: item.child_name,
        usia: isPending ? item.child_age : "-",
        jenisKelamin: isPending ? item.child_gender : "-",
        sekolah: isPending ? item.child_school : "-",
        orangtua: item.guardian_name,
        telepon: item.guardian_phone,

        tanggalObservasi:
          item.scheduled_date ||
          item.observation_date ||
          item.date ||
          item.tanggal_observasi ||
          item.tanggal ||
          null,
        waktu: isScheduled
          ? (item.scheduled_time || item.time || item.jam || item.waktu || "-")
          : (item.time || item.scheduled_time || item.jam || item.waktu || "-"),

        observer: resolvedTherapistName,
        therapist_id: resolvedTherapistId,
        therapist_name: resolvedTherapistName !== "-" ? resolvedTherapistName : null,
        administrator: item.administrator || item.admin_name || null,

        assessment_status: item.assessment_status || "-",
      };
    });

  } catch (error) {
    console.error("ERROR getObservations:", error);
    return [];
  }
}


// ========================================================
// UPDATE OBSERVATION SCHEDULE (PUT)
// ========================================================
export async function updateObservationSchedule(
  observation_id: number,
  scheduled_date: string,
  scheduled_time: string,
  petugas?: string | number,
  petugasName?: string
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Format scheduled_time to HH:mm (H:i with colon)
    let formattedTime = (scheduled_time || "").trim().replace(".", ":");
    if (/^\d{1,2}:\d{2}/.test(formattedTime)) {
      const [h, m] = formattedTime.split(":");
      formattedTime = `${h.padStart(2, "0")}:${m}`;
    }

    // Format scheduled_date to YYYY-MM-DD
    let formattedDate = (scheduled_date || "").trim();
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(formattedDate)) {
      const [d, m, y] = formattedDate.split(/[\/\-]/);
      formattedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    const payload: any = {
      scheduled_date: formattedDate,
      scheduled_time: formattedTime,
    };

    // The therapist ID (ULID string or number)
    const therapistId =
      petugas !== undefined && petugas !== null && String(petugas).trim() !== "" && String(petugas) !== "-"
        ? String(petugas).trim()
        : petugasName !== undefined && petugasName !== null && String(petugasName).trim() !== "" && String(petugasName) !== "-"
          ? String(petugasName).trim()
          : undefined;

    if (therapistId) {
      payload.therapist_id = therapistId;
      payload.observer_id = therapistId;
      payload.terapis_id = therapistId;
      payload.petugas_id = therapistId;
    }

    if (petugasName && isNaN(Number(petugasName))) {
      payload.therapist_name = petugasName;
      payload.observer = petugasName;
      payload.observer_name = petugasName;
      payload.nama_terapis = petugasName;
      payload.petugas = petugasName;
      payload.petugas_name = petugasName;
    }

    let res: any;
    try {
      res = await api.put(`/observations/${observation_id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (putErr) {
      console.warn("PUT failed, attempting POST with _method=PUT:", putErr);
      payload._method = "PUT";
      res = await api.post(`/observations/${observation_id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    console.log("UPDATE RESPONSE:", res.data);
    return res.data;
  } catch (error) {
    console.error("ERROR updateObservationSchedule:", error);
    throw error;
  }
}

// ========================================================
// CREATE OBSERVATION AGREEMENT → JADWAL ASESMEN
// POST /observations/{id}/agreement
// ========================================================
export async function createObservationAgreement(
  observation_id: number,
  scheduled_date: string,
  scheduled_time: string,
  petugas?: string | number,
  petugasName?: string,
  petugasByBidang?: Record<string, string>
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const payload: any = {
      scheduled_date,
      scheduled_time,
    };

    // Ambil opsi terapis langsung dari endpoint REST API untuk mapping assessment_detail_id & therapist_id
    const options = await getObservationTherapistOptions(observation_id);
    const therapistsPayload: Array<{ assessment_detail_id: number; therapist_id: string | number }> = [];

    if (Array.isArray(options) && options.length > 0) {
      for (const opt of options) {
        const type = (opt.type || "").toLowerCase();
        let matchedTherapist: any = null;

        if (petugasByBidang && petugasByBidang[type]) {
          const target = petugasByBidang[type].toLowerCase().trim();
          matchedTherapist = (opt.therapists || []).find(
            (t: any) =>
              (t.name || "").toLowerCase().trim() === target ||
              String(t.id) === String(target)
          );
        }

        if (!matchedTherapist && opt.current_therapist_id) {
          matchedTherapist = (opt.therapists || []).find(
            (t: any) => String(t.id) === String(opt.current_therapist_id)
          );
        }

        if (!matchedTherapist && Array.isArray(opt.therapists) && opt.therapists.length > 0) {
          if (petugas) {
            matchedTherapist = opt.therapists.find((t: any) => String(t.id) === String(petugas));
          }
          if (!matchedTherapist) {
            matchedTherapist = opt.therapists[0];
          }
        }

        if (matchedTherapist) {
          therapistsPayload.push({
            assessment_detail_id: opt.assessment_detail_id,
            therapist_id: matchedTherapist.id,
          });
        }
      }
    }

    if (therapistsPayload.length > 0) {
      payload.therapists = therapistsPayload;
    }

    const res = await api.put(
      `/observations/${observation_id}/agreement`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("AGREEMENT RESPONSE:", res.data);
    return res.data;
  } catch (error) {
    console.error("ERROR createObservationAgreement:", error);
    throw error;
  }
}

export async function getObservationDetail(observation_id: number, type: "pending" | "scheduled" | "completed") {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.get(`/observations/${observation_id}/detail`, {
      params: { type },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || null;
  } catch (err) {
    console.error("ERROR getObservationDetail:", err);
    return null;
  }
}

// ========================================================
// GET OBSERVATION THERAPIST OPTIONS
// ========================================================
export async function getObservationTherapistOptions(
  observation_id: number | string
): Promise<any[]> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.get(`/observations/${observation_id}/therapist-options`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || [];
  } catch (err) {
    console.warn("getObservationTherapistOptions:", err);
    return [];
  }
}

// ========================================================
// GET ASSESSMENT BIDANG BY OBSERVATION ID
// ========================================================
export async function getAssessmentBidangByObservation(
  observation_id: number | string
): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    // 1. Prioritas Utama: Ambil dari endpoint resmi therapist-options
    const options = await getObservationTherapistOptions(observation_id);
    if (Array.isArray(options) && options.length > 0) {
      const validTypes = ["paedagog", "okupasi", "wicara", "fisio"];
      const bidang = options
        .map((opt: any) => String(opt.type || "").toLowerCase().trim())
        .filter((t) => validTypes.includes(t));

      const uniqueBidang = Array.from(new Set(bidang));
      if (uniqueBidang.length > 0) {
        return uniqueBidang;
      }
    }

    // 2. Fallback: ambil dari detail observasi
    const detail = await getObservationDetail(Number(observation_id), "completed");
    if (!detail) return [];

    const bidangKeys = ["paedagog", "okupasi", "wicara", "fisio"] as const;
    const fromFlags = bidangKeys.filter(
      (k) => detail[k] === true || detail[k] === 1 || detail[k] === "1"
    );
    if (fromFlags.length > 0) return fromFlags;

    if (detail.recommendation) {
      const rec = String(detail.recommendation).toLowerCase();
      const matched = bidangKeys.filter((b) => rec.includes(b));
      if (matched.length > 0) return matched;
    }

    return [];
  } catch (err) {
    console.error("ERROR getAssessmentBidangByObservation:", err);
    return [];
  }
}
