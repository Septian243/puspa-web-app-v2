/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import ResponsiveOrangtuaLayout from "@/components/layout/ResponsiveOrangtuaLayout";
import {
  getParentAssessmentQuestions,
  submitParentAssessment,
} from "@/lib/api/asesmentTerapiOrtu";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useAssessmentSteps } from "@/hooks/useAssessmentSteps";
import { usePersistAnswers, loadSavedAnswers } from "@/hooks/usePersistAnswers";
import StepNavigator from "../data-umum/components/StepNavigator";

function FisioterapiContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessment_id");

  const [keluhanQuestion, setKeluhanQuestion] = useState<any>(null);
  const [riwayatQuestion, setRiwayatQuestion] = useState<any>(null);
  const [keluhanJawaban, setKeluhanJawaban] = useState("");
  const [riwayatJawaban, setRiwayatJawaban] = useState("");
  const [loading, setLoading] = useState(false);
  const [answersReady, setAnswersReady] = useState(false);
  const { toasts, addToast, dismissToast } = useToast();
  const { steps, loading: stepsLoading, getNextPath, getPrevPath } = useAssessmentSteps(assessmentId);

  // Bangun objek jawaban untuk persist (key: question_id)
  const answersObj: Record<string, any> = {
    keluhan: keluhanJawaban,
    riwayat: riwayatJawaban,
  };
  usePersistAnswers(assessmentId, "fisio", answersObj, answersReady);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await getParentAssessmentQuestions("parent_fisio");
        const questions = res?.data?.groups?.[0]?.questions || [];

        setKeluhanQuestion(questions.find((q: any) => q.question_number === 1));
        setRiwayatQuestion(questions.find((q: any) => q.question_number === 2));

        // Restore dari localStorage
        const saved = loadSavedAnswers(assessmentId, "fisio");
        if (saved) {
          if (saved.keluhan) setKeluhanJawaban(saved.keluhan);
          if (saved.riwayat) setRiwayatJawaban(saved.riwayat);
        }
        setAnswersReady(true);
      } catch (err) {
        console.error(err);
      }
    }

    fetchQuestions();
  }, [assessmentId]);

  const handleSubmit = async () => {
    if (!assessmentId) return addToast("error", "Assessment ID tidak ditemukan", "Pastikan URL sudah benar.");

    // Validasi field wajib
    if (!keluhanJawaban.trim()) {
      addToast("warning", "Data belum lengkap", "Kolom keluhan utama wajib diisi.");
      return;
    }
    if (!riwayatJawaban.trim()) {
      addToast("warning", "Data belum lengkap", "Kolom riwayat medis wajib diisi.");
      return;
    }

    const payload = {
      answers: [
        { question_id: keluhanQuestion?.id, answer: { value: keluhanJawaban } },
        { question_id: riwayatQuestion?.id, answer: { value: riwayatJawaban } },
      ],
    };

    try {
      setLoading(true);
      await submitParentAssessment(assessmentId, "fisio_parent", payload);
      addToast("success", "Data fisioterapi berhasil disimpan!", "Mengarahkan ke halaman berikutnya...");
      setTimeout(() => {
        router.push(getNextPath("fisio"));
      }, 800);
    } catch (err) {
      console.error(err);
      addToast("error", "Gagal menyimpan data", "Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  const activeStep = steps.findIndex((step) => pathname.includes(step.path));

  // Navigasi kembali ke step sebelumnya
  const handlePrev = () => {
    router.push(getPrevPath("fisio"));
  };

  return (
    <>
    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    <ResponsiveOrangtuaLayout maxWidth="max-w-none">
      {/* Header section with back & close actions */}
      <div className="flex flex-row items-center justify-between gap-4 mb-6 text-[#1E5C58]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">II. Data Fisioterapi</h1>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Isi keluhan dan riwayat medis anak Anda untuk analisis fisioterapi.</p>
        </div>
        <button
          onClick={() => router.push(`/orangtua/assessment/kategori?assessment_id=${assessmentId}`)}
          className="flex items-center justify-center p-2.5 bg-white border border-teal-50 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 shadow-sm transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stepper Dinamis - hanya tampilkan terapi yang dibutuhkan anak */}
      <div className="w-full mb-6 md:mb-10">
        {!stepsLoading && (
          <StepNavigator steps={steps} activeStep={activeStep} assessmentId={assessmentId} />
        )}
      </div>

      <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] p-5 md:p-8 w-full">
        {/* 2-Column Grid Area Input Jawaban */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {keluhanQuestion ? (
            <div className="space-y-3">
              <label className="block text-xs sm:text-sm font-bold text-[#1E5C58] border-l-4 border-[#2B7A75] pl-3">
                {keluhanQuestion.question_text}
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-2xl p-4 h-48 md:h-64 focus:outline-none focus:ring-2 focus:ring-[#2B7A75] focus:border-transparent transition-all duration-200 bg-gray-50/30 hover:bg-white focus:bg-white text-xs sm:text-sm resize-y"
                placeholder={`Tuliskan ${keluhanQuestion.question_text.toLowerCase()} secara detail...`}
                value={keluhanJawaban}
                onChange={(e) => setKeluhanJawaban(e.target.value)}
              />
            </div>
          ) : (
            <div className="animate-pulse bg-gray-50 h-48 md:h-64 rounded-2xl"></div>
          )}

          {riwayatQuestion ? (
            <div className="space-y-3">
              <label className="block text-xs sm:text-sm font-bold text-[#1E5C58] border-l-4 border-[#2B7A75] pl-3">
                {riwayatQuestion.question_text}
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-2xl p-4 h-48 md:h-64 focus:outline-none focus:ring-2 focus:ring-[#2B7A75] focus:border-transparent transition-all duration-200 bg-gray-50/30 hover:bg-white focus:bg-white text-xs sm:text-sm resize-y"
                placeholder={`Tuliskan ${riwayatQuestion.question_text.toLowerCase()} secara detail...`}
                value={riwayatJawaban}
                onChange={(e) => setRiwayatJawaban(e.target.value)}
              />
            </div>
          ) : (
            <div className="animate-pulse bg-gray-50 h-48 md:h-64 rounded-2xl"></div>
          )}
        </div>

        {/* Navigasi Tombol Bawah */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4 border-t border-gray-50 pt-6">
          <p className="text-[10px] md:text-xs text-gray-400 font-semibold">
            Pastikan data yang diisi telah benar sebelum menekan tombol simpan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={handlePrev}
              className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-[#1E5C58] rounded-2xl font-bold active:scale-95 transition-all w-full sm:w-auto text-xs cursor-pointer text-center"
            >
              Sebelumnya
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-8 py-3.5 rounded-2xl text-white font-bold shadow-md shadow-teal-500/10 active:scale-95 transition-all w-full sm:w-auto text-xs cursor-pointer text-center ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#2B7A75] hover:bg-[#1E5C58]"
              }`}
            >
              {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
            </button>
          </div>
        </div>
      </div>
    </ResponsiveOrangtuaLayout>
    </>
  );
}

export default function DataFisioterapiPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="h-10 w-10 border-4 border-teal-100 border-t-[#2B7A75] rounded-full animate-spin"></div>
        <p className="text-gray-400 font-semibold animate-pulse text-sm">Memuat Halaman...</p>
      </div>
    }>
      <FisioterapiContent />
    </Suspense>
  );
}