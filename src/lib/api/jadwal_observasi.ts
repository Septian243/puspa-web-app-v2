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
// LOCAL PERSISTENCE HELPERS (FOR OBSERVATION BIDANG / ASSESSMENT TYPES)
// ========================================================

/**
 * Simpan bidang assessment yang dipilih saat observasi ke localStorage.
 * Key: "observation_bidang" (map observationId → bidang[])
 */
export function saveObservationBidangLocal(
  observationId: number | string,
  bidang: string[]
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("observation_bidang");
    const map = raw ? JSON.parse(raw) : {};
    map[String(observationId)] = bidang;
    localStorage.setItem("observation_bidang", JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save observation bidang locally:", e);
  }
}

/**
 * Ambil bidang assessment dari localStorage berdasarkan observationId.
 * Returns null jika tidak ada.
 */
export function getObservationBidangLocal(
  observationId: number | string
): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("observation_bidang");
    if (!raw) return null;
    const map = JSON.parse(raw);
    const item = map[String(observationId)];
    if (!Array.isArray(item) || item.length === 0) return null;
    return item;
  } catch {
    return null;
  }
}

/**
 * Simpan mapping asessor per bidang assessment ke localStorage.
 * Disimpan berdasarkan observationId, assessmentId, dan nama anak agar dapat ditemukan di mana saja.
 */
export function saveAssessmentAsessorByBidangLocal(
  observationOrAssessmentId: number | string,
  asessorByBidang: Record<string, string>,
  childName?: string
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("assessment_asessor_by_bidang");
    const map = raw ? JSON.parse(raw) : {};
    if (observationOrAssessmentId) {
      map[String(observationOrAssessmentId)] = asessorByBidang;
    }
    if (childName && childName.trim()) {
      map[`name_${childName.trim().toLowerCase()}`] = asessorByBidang;
    }
    localStorage.setItem("assessment_asessor_by_bidang", JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save assessment asessor by bidang locally:", e);
  }
}

/**
 * Ambil mapping asessor per bidang assessment dari localStorage berdasarkan id atau nama anak.
 * Returns null jika tidak ada.
 */
export function getAssessmentAsessorByBidangLocal(
  observationOrAssessmentId?: number | string | null,
  childName?: string | null
): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("assessment_asessor_by_bidang");
    if (!raw) return null;
    const map = JSON.parse(raw);
    if (observationOrAssessmentId && map[String(observationOrAssessmentId)]) {
      return map[String(observationOrAssessmentId)];
    }
    if (childName && childName.trim()) {
      const byName = map[`name_${childName.trim().toLowerCase()}`];
      if (byName) return byName;
    }
    return null;
  } catch {
    return null;
  }
}

// ========================================================
// LOCAL PERSISTENCE HELPERS (FOR OBSERVATION THERAPIST)
// ========================================================
export function saveObservationTherapistLocal(
  observationId: number | string,
  therapistId: string | number,
  therapistName: string
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("observation_therapists");
    const map = raw ? JSON.parse(raw) : {};
    map[String(observationId)] = {
      therapist_id: String(therapistId || ""),
      therapist_name: therapistName || "",
    };
    localStorage.setItem("observation_therapists", JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save observation therapist locally:", e);
  }
}

export function getObservationTherapistLocal(observationId: number | string): {
  therapist_id: string;
  therapist_name: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("observation_therapists");
    if (!raw) return null;
    const map = JSON.parse(raw);
    const item = map[String(observationId)];
    if (!item || (!item.therapist_name && !item.therapist_id)) return null;
    return item;
  } catch {
    return null;
  }
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

      // Check local storage mapping if backend response omitted therapist
      const localSaved =
        typeof window !== "undefined"
          ? getObservationTherapistLocal(item.observation_id)
          : null;

      let resolvedTherapistName =
        therapistName && therapistName !== "-"
          ? therapistName
          : localSaved?.therapist_name || "-";

      if (isCompleted && resolvedTherapistName === "-") {
        const asessorSaved = getAssessmentAsessorByBidangLocal(
          item.observation_id,
          item.child_name
        );
        if (asessorSaved && Object.keys(asessorSaved).length > 0) {
          resolvedTherapistName = Object.values(asessorSaved).join(", ");
        }
      }

      const resolvedTherapistId = rawTherapistId
        ? String(rawTherapistId)
        : localSaved?.therapist_id || null;

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

    // Persist to local storage as guaranteed backup
    if (therapistId || petugasName) {
      saveObservationTherapistLocal(
        observation_id,
        therapistId || "",
        petugasName || (therapistId ? String(therapistId) : "")
      );
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
  petugasName?: string
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const payload: any = {
      scheduled_date,
      scheduled_time,
    };

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
    }

    if (petugasName) {
      payload.observer = petugasName;
      payload.therapist_name = petugasName;
      payload.nama_terapis = petugasName;
    }

    if (therapistId || petugasName) {
      saveObservationTherapistLocal(
        observation_id,
        therapistId || "",
        petugasName || (therapistId ? String(therapistId) : "")
      );
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
    const data = res.data?.data || null;
    if (data && typeof window !== "undefined") {
      const localSaved = getObservationTherapistLocal(observation_id);
      if (localSaved) {
        if (!data.therapist_name && !data.observer) {
          data.therapist_name = localSaved.therapist_name;
          data.observer = localSaved.therapist_name;
          data.therapist_id = localSaved.therapist_id;
        }
      }
    }
    return data;
  } catch (err) {
    console.error("ERROR getObservationDetail:", err);
    return null;
  }
}

// ========================================================
// GET ASSESSMENT BIDANG BY OBSERVATION ID
// Fetch daftar bidang dari endpoint assessments/pending/admin
// yang mengembalikan tipe per assessment yang terhubung ke observation
// ========================================================
export async function getAssessmentBidangByObservation(
  observation_id: number | string
): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];

    // Fetch semua assessment pending (belum dijadwalkan) untuk admin
    const res = await api.get("/assessments/pending/admin", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const list: any[] = res.data?.data || [];

    // Kumpulkan semua tipe bidang yang observation_id-nya cocok
    const bidang: string[] = [];
    const validTypes = ["paedagog", "okupasi", "wicara", "fisio"];

    for (const item of list) {
      const itemObsId =
        item.observation_id ?? item.observasi_id ?? item.obs_id ?? null;

      if (String(itemObsId) === String(observation_id)) {
        const tipe = (item.type || item.tipe || "").toLowerCase();
        if (validTypes.includes(tipe) && !bidang.includes(tipe)) {
          bidang.push(tipe);
        }
        // Jika tipe adalah array
        if (Array.isArray(item.type)) {
          for (const t of item.type) {
            const tl = String(t).toLowerCase();
            if (validTypes.includes(tl) && !bidang.includes(tl)) {
              bidang.push(tl);
            }
          }
        }
      }
    }

    return bidang;
  } catch (err) {
    console.error("ERROR getAssessmentBidangByObservation:", err);
    return [];
  }
}
