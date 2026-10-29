/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";

/**
 * Simpan jawaban ke localStorage secara otomatis saat berubah.
 * Key: `assessment_answers_${assessmentId}_${type}`
 */
export function usePersistAnswers(
  assessmentId: string | null,
  type: string,
  answers: Record<string, any>,
  ready: boolean
) {
  const storageKey = assessmentId ? `assessment_answers_${assessmentId}_${type}` : null;

  // Simpan ke localStorage setiap kali answers berubah
  useEffect(() => {
    if (!storageKey || !ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch (_) { /* kuota penuh, abaikan */ }
  }, [answers, storageKey, ready]);
}

/**
 * Muat jawaban yang tersimpan dari localStorage.
 * Returns null jika tidak ada data tersimpan.
 */
export function loadSavedAnswers(
  assessmentId: string | null,
  type: string
): Record<string, any> | null {
  if (typeof window === "undefined" || !assessmentId) return null;
  const storageKey = `assessment_answers_${assessmentId}_${type}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}
