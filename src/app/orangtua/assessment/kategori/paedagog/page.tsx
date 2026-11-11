/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X, ChevronRight } from "lucide-react";
import ResponsiveOrangtuaLayout from "@/components/layout/ResponsiveOrangtuaLayout";
import {
  getParentAssessmentQuestions,
  submitParentAssessment,
  ParentAssessmentType,
} from "@/lib/api/asesmentTerapiOrtu";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useAssessmentSteps } from "@/hooks/useAssessmentSteps";
import { usePersistAnswers, loadSavedAnswers } from "@/hooks/usePersistAnswers";
import StepNavigator from "../data-umum/components/StepNavigator";

type Question = {
  id: number;
  question_code: string;
  question_number: string;
  question_text: string;
  answer_type: "radio" | "text";
  answer_options?: string[];
};

type Group = {
  group_id: number;
  group_key: string;
  title: string;
  questions: Question[];
};

function PaedagogFormContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessment_id");

  const { steps, loading: stepsLoading, getNextPath, getPrevPath, isLastStep } = useAssessmentSteps(assessmentId);
  const activeStep = steps.findIndex((s) => pathname.includes(s.path));

  const [groups, setGroups] = useState<Group[]>([]);
  const [answers, setAnswers] = useState<Record<string, Record<number, any>>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toasts, addToast, dismissToast } = useToast();

  // Persist jawaban ke localStorage (flatten ke satu Record)
  const flatAnswers: Record<string, any> = {};
  Object.entries(answers).forEach(([gk, qmap]) => {
    Object.entries(qmap).forEach(([qid, val]) => {
      flatAnswers[`${gk}__${qid}`] = val;
    });
  });
  usePersistAnswers(assessmentId, "paedagog", flatAnswers, !loading);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!assessmentId) {
        addToast("error", "Assessment ID tidak ditemukan", "Pastikan URL sudah benar.");
        return;
      }
      try {
        const res = await getParentAssessmentQuestions("parent_paedagog" as ParentAssessmentType);
        const dataGroups: Group[] = res.data.groups.map((g: any) => ({
          group_id: g.group_id,
          group_key: g.group_key,
          title: g.title,
          questions: g.questions.map((q: any) => ({
            id: q.id,
            question_code: q.question_code,
            question_number: q.question_number,
            question_text: q.question_text,
            answer_type: q.answer_type,
            answer_options: q.extra_schema ? JSON.parse(q.answer_options ?? "[]") : [],
          })),
        }));

        setGroups(dataGroups);

        // Restore dari localStorage jika ada
        const saved = loadSavedAnswers(assessmentId, "paedagog");
        if (saved && Object.keys(saved).length > 0) {
          // Unflatten kembali ke struktur {groupKey: {questionId: value}}
          const restored: Record<string, Record<number, any>> = {};
          Object.entries(saved).forEach(([key, val]) => {
            const parts = key.split("__");
            if (parts.length === 2) {
              const [gk, qid] = parts;
              if (!restored[gk]) restored[gk] = {};
              restored[gk][Number(qid)] = val;
            }
          });
          setAnswers(restored);
        } else {
          const initAnswers: Record<string, Record<number, any>> = {};
          dataGroups.forEach((g) => {
            initAnswers[g.group_key] = {};
            g.questions.forEach((q) => (initAnswers[g.group_key][q.id] = ""));
          });
          setAnswers(initAnswers);
        }
      } catch (error) {
        console.error(error);
        addToast("error", "Gagal mengambil pertanyaan", "Terjadi kesalahan pada server.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [assessmentId]);

  const handleChange = (groupKey: string, questionId: number, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        [questionId]: value,
      },
    }));
  };

  const handleNextGroup = () => currentStep < groups.length - 1 && setCurrentStep(currentStep + 1);
  const handlePreviousGroup = () => currentStep > 0 && setCurrentStep(currentStep - 1);

  const onSave = async () => {
    if (!assessmentId) return addToast("error", "Assessment ID tidak ditemukan", "Pastikan URL sudah benar.");
    try {
      setSubmitting(true);
      const formattedAnswers = Object.values(answers).flatMap((group) =>
        Object.entries(group)
          .filter(([_, answer]) => answer !== "" && answer !== null)
          .map(([questionId, answer]) => ({ question_id: Number(questionId), answer: { value: answer } }))
      );

      await submitParentAssessment(assessmentId, "paedagog_parent", { answers: formattedAnswers });
      addToast("success", "Semua data assessment berhasil disimpan!", "Assessment selesai. Mengarahkan...");
      setTimeout(() => {
        router.push(getNextPath("paedagog"));
      }, 800);
    } catch (error: any) {
      console.error(error);
      addToast("error", "Gagal submit jawaban", error.message || "Terjadi kesalahan pada server.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="h-10 w-10 border-4 border-teal-100 border-t-[#2B7A75] rounded-full animate-spin"></div>
        <p className="text-gray-400 font-semibold animate-pulse text-sm">Memuat Pertanyaan...</p>
      </div>
    );
  }

  if (groups.length === 0) return <p className="text-center py-12 text-gray-500 font-semibold">Tidak ada pertanyaan.</p>;

  const group = groups[currentStep];

  return (
    <>
    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    <ResponsiveOrangtuaLayout maxWidth="max-w-none">
      {/* Header section with back & close actions */}
      <div className="flex flex-row items-center justify-between gap-4 mb-6 text-[#1E5C58]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">V. Data Paedagog</h1>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Analisis kesiapan belajar, fokus akademis, and kemandirian perilaku anak Anda.</p>
        </div>
        <button
          onClick={() => router.push(`/orangtua/assessment/kategori?assessment_id=${assessmentId}`)}
          className="flex items-center justify-center p-2.5 bg-white border border-teal-50 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 shadow-sm transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stepper Dinamis */}
      <div className="w-full mb-6 md:mb-10">
        {!stepsLoading && (
          <StepNavigator steps={steps} activeStep={activeStep} assessmentId={assessmentId} />
        )}
      </div>

      {/* Card Pertanyaan - Responsive */}
      <div className="bg-white rounded-3xl border border-teal-50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] p-5 md:p-8 w-full">
        {/* Card Sub-header */}
        <div className="mb-6 md:mb-8 border-b border-gray-100 pb-4 flex items-center justify-between">
          <div>
            <h4 className="text-base md:text-lg font-extrabold text-[#1E5C58]">
              {group.title}
            </h4>
            <p className="text-[10px] md:text-xs text-gray-400 font-semibold mt-0.5">Aspek {currentStep + 1} dari {groups.length}</p>
          </div>
          
          <div className="flex gap-1">
            {groups.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-6 bg-[#2B7A75]" : "w-2 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Questions Render - Grid 2 Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {group.questions.map((q) => {
            const isFullWidth = q.answer_type === "text";
            return (
              <div key={q.id} className={`p-4 bg-white border border-teal-50/50 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.02)] ${isFullWidth ? "col-span-full" : "col-span-full md:col-span-1"}`}>
                <label className="block mb-3 font-bold text-[#1E5C58] text-xs md:text-sm leading-relaxed">
                  {q.question_number ? `${q.question_number}. ` : ""}{q.question_text}
                </label>

                {q.answer_type === "radio" ? (
                  <div className="flex flex-col sm:flex-row sm:gap-6 gap-3">
                    {q.answer_options?.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all select-none text-xs md:text-sm font-semibold ${
                          answers[group.group_key]?.[q.id] === opt 
                            ? "bg-teal-50/50 border-[#2B7A75]/35 text-[#1E5C58]" 
                            : "bg-white border-gray-200 text-gray-550 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`${group.group_key}-${q.id}`}
                          checked={answers[group.group_key]?.[q.id] === opt}
                          onChange={() => handleChange(group.group_key, q.id, opt)}
                          className="accent-[#2B7A75] w-4.5 h-4.5 cursor-pointer"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#2B7A75] focus:border-transparent transition-all duration-200 bg-gray-50/30 hover:bg-white focus:bg-white text-xs md:text-sm"
                    value={answers[group.group_key]?.[q.id] ?? ""}
                    onChange={(e) => handleChange(group.group_key, q.id, e.target.value)}
                    placeholder="Ketik jawaban Anda di sini..."
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation Buttons - Responsive */}
        <div className="flex flex-col sm:flex-row justify-between mt-10 gap-4 pt-6 border-t border-gray-100">
          <button
            onClick={currentStep > 0 ? handlePreviousGroup : () => router.push(getPrevPath("paedagog"))}
            className="px-6 py-3.5 rounded-2xl border border-gray-200 text-[#1E5C58] font-bold bg-white hover:bg-gray-50 transition-all text-xs order-2 sm:order-1 active:scale-95 cursor-pointer text-center"
          >
            Sebelumnya
          </button>

          <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
            {currentStep < groups.length - 1 ? (
              <button
                onClick={handleNextGroup}
                className="px-10 py-3.5 bg-[#2B7A75] hover:bg-[#1E5C58] text-white rounded-2xl font-bold transition-all shadow-md shadow-teal-500/10 active:scale-95 text-xs w-full sm:w-auto cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                Lanjutkan <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={onSave}
                disabled={submitting}
                className="px-10 py-3.5 bg-[#2B7A75] hover:bg-[#1E5C58] disabled:opacity-60 text-white rounded-2xl font-bold transition-all shadow-md shadow-teal-500/10 active:scale-95 text-xs w-full sm:w-auto cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                {submitting ? "Menyimpan..." : isLastStep("paedagog") ? "Simpan & Selesai" : "Simpan & Lanjutkan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </ResponsiveOrangtuaLayout>
    </>
  );
}

export default function PaedagogFormPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="h-10 w-10 border-4 border-teal-100 border-t-[#2B7A75] rounded-full animate-spin"></div>
        <p className="text-gray-400 font-semibold animate-pulse text-sm">Memuat Halaman...</p>
      </div>
    }>
      <PaedagogFormContent />
    </Suspense>
  );
}