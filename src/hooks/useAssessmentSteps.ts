/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { getMyAssessmentDetail } from "@/lib/api/checkStatusAsesment";

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

/**
 * Fetch dan kembalikan daftar step yang hanya berisi terapi
 * yang dibutuhkan oleh anak berdasarkan assessment_id.
 * "umum" selalu ada di posisi pertama.
 */
export function useAssessmentSteps(assessmentId: string | null) {
  const [steps, setSteps] = useState<AssessmentStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assessmentId) {
      // fallback: semua step
      const all = STEP_ORDER.map((code) => ({ code, ...TYPE_TO_PATH[code] }));
      setSteps(all);
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetch = async () => {
      try {
        const data = await getMyAssessmentDetail(assessmentId);
        const types = (data.details || []).map((d: any) => d.type as string);

        // Selalu sertakan "umum", lalu filter sesuai types dari API
        const needed = STEP_ORDER.filter(
          (code) => code === "umum" || types.includes(code)
        );
        if (mounted) {
          setSteps(needed.map((code) => ({ code, ...TYPE_TO_PATH[code] })));
        }
      } catch {
        // Fallback ke semua step jika gagal fetch
        if (mounted) {
          setSteps(STEP_ORDER.map((code) => ({ code, ...TYPE_TO_PATH[code] })));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [assessmentId]);

  return { steps, loading };
}
