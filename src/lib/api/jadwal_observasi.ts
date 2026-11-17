/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";
import { normalizeBidangKey, BidangKey, PetugasOption } from "@/components/form/FormAturAsesmen";
import { getTherapists } from "@/lib/api/jadwal_terapi";

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
// LOCAL PERSISTENCE HELPERS
// ========================================================

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

export function saveAssessmentAsessorByBidangLocal(
  observationOrAssessmentId: number | string,
  asessorByBidang: Record<string, string>,
  childName?: string
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("assessment_asessor_by_bidang");
    const map = raw ? JSON.parse(raw) : {};
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(asessorByBidang)) {
      const norm = normalizeBidangKey(k) || k.toLowerCase().trim();
      if (norm && v) normalized[norm] = v;
    }
    if (observationOrAssessmentId) {
      map[String(observationOrAssessmentId)] = normalized;
    }
    if (childName && childName.trim()) {
      map[`name_${childName.trim().toLowerCase()}`] = normalized;
    }
    localStorage.setItem("assessment_asessor_by_bidang", JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save assessment asessor by bidang locally:", e);
  }
}

export function getAssessmentAsessorByBidangLocal(
  observationOrAssessmentId?: number | string | null,
  childName?: string | null
): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("assessment_asessor_by_bidang");
    if (!raw) return null;
    const map = JSON.parse(raw);
    let found: Record<string, string> | null = null;
    if (observationOrAssessmentId && map[String(observationOrAssessmentId)]) {
      found = map[String(observationOrAssessmentId)];
    } else if (childName && childName.trim()) {
      found = map[`name_${childName.trim().toLowerCase()}`];
    }
    if (!found) return null;
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(found)) {
      const norm = normalizeBidangKey(k) || k.toLowerCase().trim();
      if (norm && v) normalized[norm] = v;
    }
    return Object.keys(normalized).length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

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
    };

    // 1. Petakan pilihan terapis per bidang pengguna
    const chosenMap: Record<string, { id: string; name: string }> = {};
    if (petugasByBidang) {
      for (const [k, v] of Object.entries(petugasByBidang)) {
        const normK = normalizeBidangKey(k) || k.toLowerCase().trim();
        if (!normK || !v || v === "-") continue;
        let tId = "";
        let tName = "";
        const colonIdx = v.indexOf(":");
        if (colonIdx > 0) {
          tId = v.slice(0, colonIdx).trim();
          tName = v.slice(colonIdx + 1).trim();
        } else if (/^[0-9A-Za-z]{20,30}$/.test(v.trim())) {
          tId = v.trim();
        } else {
          tName = v.trim();
        }
        chosenMap[normK] = { id: tId, name: tName };
      }
    }

    // Ambil opsi terapis langsung dari endpoint REST API untuk mapping assessment_detail_id & therapist_id
    const options = await getObservationTherapistOptions(observation_id);
    const therapistsPayload: Array<{
      assessment_detail_id?: number;
      therapist_id: string;
      type: string;
    }> = [];

    // Jika options dari backend ada (mengembalikan assessment_detail_id atau list assessor)
    if (Array.isArray(options) && options.length > 0) {
      for (const opt of options) {
        const normOptType = normalizeBidangKey(opt.type) || (opt.type || "").toLowerCase().trim();
        const chosen = chosenMap[normOptType];

        // 1. Utamakan ID yang dipilih user
        let therapistId = chosen?.id || "";

        // 2. Jika user hanya punya nama, cari ID di opt.therapists
        if (!therapistId && chosen?.name) {
          const matched = (opt.therapists || []).find(
            (t: any) =>
              (t.name || t.therapist_name || t.nama || "").toLowerCase().trim() === chosen.name.toLowerCase()
          );
          if (matched) therapistId = String(matched.id || matched.therapist_id || "");
        }

        // 3. Fallback jika belum matched
        if (!therapistId) {
          const ctId = opt.current_therapist?.id ?? opt.current_therapist_id;
          if (ctId) therapistId = String(ctId);
          else if (Array.isArray(opt.therapists) && opt.therapists.length > 0) {
            therapistId = String(opt.therapists[0].id || opt.therapists[0].therapist_id || "");
          }
        }

        const detailId = opt.assessment_detail_id || opt.id;
        if (therapistId) {
          therapistsPayload.push({
            assessment_detail_id: detailId ? Number(detailId) : undefined,
            therapist_id: String(therapistId),
            type: normOptType,
          });
        }
      }
    }

    // Tambahkan bidang yang dipilih pengguna tetapi belum ada di therapistsPayload
    for (const [normK, chosen] of Object.entries(chosenMap)) {
      const alreadyAdded = therapistsPayload.some((item) => item.type === normK);
      if (!alreadyAdded) {
        let tId = chosen.id;
        if (!tId && chosen.name) {
          try {
            const allT = await getTherapists();
            const found = allT.find(
              (t: any) =>
                (t.name || t.therapist_name || t.nama || "").toLowerCase().trim() === chosen.name.toLowerCase()
            );
            if (found) tId = String(found.id || found.therapist_id || "");
          } catch {
            // ignore
          }
        }
        if (tId) {
          therapistsPayload.push({
            therapist_id: String(tId),
            type: normK,
          });
        }
      }
    }

    // Fallback single petugas jika therapistsPayload masih kosong
    if (therapistsPayload.length === 0 && petugas && String(petugas).trim() !== "" && String(petugas) !== "-") {
      therapistsPayload.push({
        therapist_id: String(petugas).trim(),
        type: "wicara",
      });
    }

    if (therapistsPayload.length > 0) {
      payload.therapists = therapistsPayload.map((item) => {
        const clean: any = { therapist_id: item.therapist_id, type: item.type };
        if (item.assessment_detail_id !== undefined && item.assessment_detail_id !== null) {
          clean.assessment_detail_id = item.assessment_detail_id;
        }
        return clean;
      });
    }

    const resolvedTherapistId =
      petugas !== undefined && petugas !== null && String(petugas).trim() !== "" && String(petugas) !== "-"
        ? (!isNaN(Number(petugas)) ? Number(petugas) : String(petugas).trim())
        : therapistsPayload[0]?.therapist_id ?? undefined;

    if (resolvedTherapistId !== undefined) {
      payload.therapist_id = resolvedTherapistId;
      payload.observer_id = resolvedTherapistId;
      payload.terapis_id = resolvedTherapistId;
    }

    if (petugasName && String(petugasName).trim() !== "" && String(petugasName) !== "-") {
      payload.observer = String(petugasName).trim();
      payload.therapist_name = String(petugasName).trim();
      payload.nama_terapis = String(petugasName).trim();
    }

    if (petugasByBidang && Object.keys(petugasByBidang).length > 0) {
      saveAssessmentAsessorByBidangLocal(observation_id, petugasByBidang);
    }

    let res: any;
    try {
      res = await api.put(
        `/observations/${observation_id}/agreement`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (putErr: any) {
      if (putErr.response?.status === 405) {
        console.warn("PUT failed with 405 Method Not Allowed, retrying with pure POST:", putErr);
        const postPayload = { ...payload };
        delete postPayload._method;
        res = await api.post(
          `/observations/${observation_id}/agreement`,
          postPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        throw putErr;
      }
    }

    
    if (res.data?.data?.assessment_id && petugasByBidang) {
      saveAssessmentAsessorByBidangLocal(res.data.data.assessment_id, petugasByBidang);
    }
    return res.data;
  } catch (error: any) {
    console.warn("createObservationAgreement failed:", error?.response?.data || error?.message || error);
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

    // Tangani berbagai kemungkinan format response Laravel:
    // 1. { data: [...] }   → res.data.data
    // 2. { data: { data: [...] } }  → res.data.data.data (pagination)
    // 3. [...] langsung    → res.data
    const raw = res.data;
    let result: any[] = [];
    if (Array.isArray(raw)) result = raw;
    else if (raw && Array.isArray(raw.data)) result = raw.data;
    else if (raw && raw.data && Array.isArray(raw.data.data)) result = raw.data.data;

    return result;
  } catch (err) {
    console.warn("getObservationTherapistOptions:", err);
    return [];
  }
}

/**
 * Parsing opsi terapis per bidang dari response /observations/{observation}/therapist-options.
 * Hanya mengambil terapis yang tervalidasi sebagai assessor oleh backend.
 *
 * Format response backend (TherapistOptionsAction.php):
 * [
 *   {
 *     "assessment_detail_id": 12,
 *     "type": "wicara",
 *     "current_therapist": { "id": 5, "name": "Nindya Zahri" },
 *     "therapists": [{ "id": 5, "name": "Nindya Zahri" }]
 *   },
 *   ...  // bisa ada lebih dari 1 entry dengan type yang sama
 * ]
 */
export function parseTherapistOptionsByBidang(
  rawOptions: any
): Partial<Record<BidangKey, PetugasOption[]>> {
  // Gunakan Map sementara untuk merge (deduplicate) per bidang
  const tempMap: Partial<Record<BidangKey, Map<string, PetugasOption>>> = {};

  if (!rawOptions) return {};

  const processTherapistList = (list: any[], normType: BidangKey) => {
    if (!tempMap[normType]) {
      tempMap[normType] = new Map<string, PetugasOption>();
    }
    const bidangMap = tempMap[normType]!;

    for (const t of list) {
      const id = String(t.therapist_id ?? t.id ?? "");
      const name: string = t.therapist_name ?? t.name ?? t.nama ?? "";
      if (!name) continue;
      // Gunakan id sebagai dedup key; jika tidak ada id, gunakan name
      const key = id || name.toLowerCase();
      if (!bidangMap.has(key)) {
        bidangMap.set(key, {
          id: id || undefined,
          name,
          section: t.therapist_section ?? t.section ?? normType,
        });
      }
    }
  };

  if (Array.isArray(rawOptions)) {
    for (const opt of rawOptions) {
      const rawType = opt.type || opt.section || opt.bidang;
      const normType = normalizeBidangKey(rawType);

      // Jika type adalah "umum", distribusikan terapis di dalamnya ke bidang masing-masing berdasarkan section-nya
      if (!normType) {
        if ((rawType || "").toLowerCase().trim() === "umum") {
          const list: any[] = Array.isArray(opt.therapists)
            ? opt.therapists
            : Array.isArray(opt.assessors)
              ? opt.assessors
              : [];
          for (const t of list) {
            const tSection = normalizeBidangKey(t.section || t.therapist_section);
            if (tSection) {
              processTherapistList([t], tSection);
            }
          }
        } else {
          console.warn("[parseTherapistOptionsByBidang] type tidak dikenali:", rawType, "→ entry dilewati:", opt);
        }
        continue;
      }

      // Ambil array therapists (assessor tervalidasi)
      const list: any[] = Array.isArray(opt.therapists)
        ? opt.therapists
        : Array.isArray(opt.assessors)
          ? opt.assessors
          : [];

      if (list.length === 0) {
        // Tetap tambahkan entry kosong agar bidang ini terdaftar (meski tidak ada assessor)
        if (!tempMap[normType]) tempMap[normType] = new Map();
        console.warn(`[parseTherapistOptionsByBidang] therapists kosong untuk bidang "${normType}" (type="${rawType}")`);
      }

      processTherapistList(list, normType);
    }
  } else if (typeof rawOptions === "object") {
    for (const [k, v] of Object.entries(rawOptions)) {
      const normType = normalizeBidangKey(k);
      if (!normType) continue;

      let list: any[] = [];
      if (Array.isArray(v)) {
        list = v;
      } else if (v && typeof v === "object" && Array.isArray((v as any).therapists)) {
        list = (v as any).therapists;
      } else if (v && typeof v === "object" && Array.isArray((v as any).assessors)) {
        list = (v as any).assessors;
      }

      processTherapistList(list, normType);
    }
  }

  // Konversi Map ke array
  const result: Partial<Record<BidangKey, PetugasOption[]>> = {};
  for (const [bidang, bidangMap] of Object.entries(tempMap) as [BidangKey, Map<string, PetugasOption>][]) {
    result[bidang] = Array.from(bidangMap.values());
  }

  return result;
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
      const bidang = options
        .map((opt: any) => normalizeBidangKey(opt.type))
        .filter((t): t is BidangKey => t !== null);

      const uniqueBidang = Array.from(new Set(bidang)) as string[];
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
