/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { getMyAssessmentDetail } from "@/lib/api/checkStatusAsesment";
import { normalizeBidangKey } from "@/components/form/FormAturAsesmen";

/**
 * Peta dari kode terapi API → path URL
 */
const TYPE_TO_PATH: Record<string, { label: string; path: string }> = {
  umum:    { label: "Data Umum",           path: "/orangtua/assessment/kategori/data-umum" },
  fisio:   { label: "Data Fisioterapi",    path: "/orangtua/assessment/kategori/fisioterapi" },
  okupasi: { label: "Data Terapi Okupasi", path: "/orangtua/assessment/kategori/okupasi" },
  wicara:  { label: "Data Terapi Wicara", path: "/orangtua/assessment/kategori/wicara" },
  paedagog:{ label: "Data Paedagog",      path: "/orangtua/assessment/kategori/paedagog" },
};

// Urutan tampilan step (tetap)
const STEP_ORDER = ["umum", "fisio", "okupasi", "wicara", "paedagog"];

export interface AssessmentStep {
  label: string;
  path: string;
  code: string;
}

function getCachedSteps(assessmentId: string | null): AssessmentStep[] {
  if (typeof window === "undefined" || !assessmentId) return [];
  try {
    const raw = sessionStorage.getItem(`assessment_steps_${assessmentId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

function setCachedSteps(assessmentId: string | null, steps: AssessmentStep[]) {
  if (typeof window === "undefined" || !assessmentId || steps.length === 0) return;
  try {
    sessionStorage.setItem(`assessment_steps_${assessmentId}`, JSON.stringify(steps));
  } catch {}
}

/**
 * Fetch dan kembalikan daftar step yang hanya berisi terapi
 * yang dibutuhkan oleh anak berdasarkan assessment_id.
 * "umum" selalu ada di posisi pertama.
 */
export function useAssessmentSteps(assessmentId: string | null) {
  const [steps, setSteps] = useState<AssessmentStep[]>(() => getCachedSteps(assessmentId));
  const [loading, setLoading] = useState(() => getCachedSteps(assessmentId).length === 0);

  useEffect(() => {
    if (!assessmentId) {
      // fallback: semua step
      const all = STEP_ORDER.map((code) => ({ code, ...TYPE_TO_PATH[code] }));
      setSteps(all);
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchSteps = async () => {
      try {
        const data = await getMyAssessmentDetail(assessmentId);
        const types = (data.details || []).map((d: any) => {
          const raw = String(d.type || "").toLowerCase().trim();
          if (raw === "umum") return "umum";
          return normalizeBidangKey(raw) || raw;
        });

        // Selalu sertakan "umum", lalu filter sesuai types dari API
        const needed = STEP_ORDER.filter(
          (code) => code === "umum" || types.includes(code)
        );
        const mappedSteps = needed.map((code) => ({ code, ...TYPE_TO_PATH[code] }));
        if (mounted) {
          setSteps(mappedSteps);
          setCachedSteps(assessmentId, mappedSteps);
        }
      } catch {
        // Fallback ke semua step jika gagal fetch dan belum ada di state
        if (mounted) {
          setSteps((prev) =>
            prev.length > 0
              ? prev
              : STEP_ORDER.map((code) => ({ code, ...TYPE_TO_PATH[code] }))
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSteps();
    return () => {
      mounted = false;
    };
  }, [assessmentId]);

  const getNextStep = (currentCode: string): AssessmentStep | null => {
    const list = steps.length > 0 ? steps : STEP_ORDER.map((c) => ({ code: c, ...TYPE_TO_PATH[c] }));
    const idx = list.findIndex((s) => s.code === currentCode);
    if (idx !== -1 && idx < list.length - 1) {
      return list[idx + 1];
    }
    return null;
  };

  const getPrevStep = (currentCode: string): AssessmentStep | null => {
    const list = steps.length > 0 ? steps : STEP_ORDER.map((c) => ({ code: c, ...TYPE_TO_PATH[c] }));
    const idx = list.findIndex((s) => s.code === currentCode);
    if (idx > 0) {
      return list[idx - 1];
    }
    return null;
  };

  const getNextPath = (currentCode: string): string => {
    const next = getNextStep(currentCode);
    if (next) {
      return `${next.path}${assessmentId ? `?assessment_id=${assessmentId}` : ""}`;
    }
    return `/orangtua/assessment/kategori${assessmentId ? `?assessment_id=${assessmentId}` : ""}`;
  };

  const getPrevPath = (currentCode: string): string => {
    const prev = getPrevStep(currentCode);
    if (prev) {
      const extra = prev.code === "umum" ? "&last_category=last" : "";
      return `${prev.path}${assessmentId ? `?assessment_id=${assessmentId}${extra}` : ""}`;
    }
    return `/orangtua/assessment/kategori${assessmentId ? `?assessment_id=${assessmentId}` : ""}`;
  };

  const isLastStep = (currentCode: string): boolean => {
    if (steps.length === 0) return currentCode === "paedagog";
    return steps[steps.length - 1].code === currentCode;
  };

  return { steps, loading, getNextStep, getPrevStep, getNextPath, getPrevPath, isLastStep };
}
