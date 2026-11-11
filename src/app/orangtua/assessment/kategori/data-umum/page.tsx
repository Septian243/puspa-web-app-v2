/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

// Menggunakan Layout Responsif dengan Sidebar Sticky
import ResponsiveOrangtuaLayout from "@/components/layout/ResponsiveOrangtuaLayout";
import StepNavigator from "./components/StepNavigator";
import IdentitasForm from "./components/IdentitasForm";
import QuestionRenderer from "./components/QuestionRenderer";
import NavigationButtons from "./components/NavigationButtons";

import { useAssessmentData } from "./hooks/useAssessmentData";
import { useAnswers } from "./hooks/useAnswers";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { useAssessmentSteps } from "@/hooks/useAssessmentSteps";
import { usePersistAnswers, loadSavedAnswers } from "@/hooks/usePersistAnswers";

import {
  submitParentAssessment,
  updateParentIdentity,
} from "@/lib/api/asesmentTerapiOrtu";
import { getMyAssessments } from "@/lib/api/childrenAsesment";

import { INITIAL_PARENT_IDENTITY } from "./utils/constants";

export default function FormAssessmentOrangtua() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const assessmentIdFromQuery = searchParams?.get("assessment_id") || null;

  // ---- State ----
  const [activeCategory, setActiveCategory] = useState<string>("identitas");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [childName, setChildName] = useState<string>("");
  const [childBirthInfo, setChildBirthInfo] = useState<string>("");
  const [parentIdentity, setParentIdentity] = useState<any>(INITIAL_PARENT_IDENTITY);
  const [answersReady, setAnswersReady] = useState(false);

  // ---- Hooks ----
  const { toasts, addToast, dismissToast } = useToast();
  const { steps: dynamicSteps, loading: stepsLoading, getNextPath } = useAssessmentSteps(assessmentIdFromQuery);
  const { groups, loading, answers, setAnswers } = useAssessmentData();
  const { setAnswer, toggleCheckboxValue, handleTableCell } = useAnswers(answers, setAnswers);

  // Persist jawaban ke localStorage
  usePersistAnswers(assessmentIdFromQuery, "umum", answers, answersReady);

  // Step navigator
  const activeStep = dynamicSteps.findIndex((step) => pathname?.includes(step.path));
  const currentQuestions = groups.find((g) => g.group_key === activeCategory)?.questions || [];
  const categoryOrder = groups.map((g) => g.group_key);
  const currentIndex = categoryOrder.indexOf(activeCategory);

  /* =======================
     RESTORE ANSWERS DARI LOCALSTORAGE
  ========================== */
  useEffect(() => {
    if (loading) return; // Tunggu data questions selesai dimuat
    const saved = loadSavedAnswers(assessmentIdFromQuery, "umum");
    if (saved && Object.keys(saved).length > 0) {
      setAnswers((prev: any) => ({ ...prev, ...saved }));
    }
    setAnswersReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  /* =======================
     RESTORE KATEGORI TERAKHIR (dari searchParams jika ada)
  ========================== */
  useEffect(() => {
    if (categoryOrder.length === 0) return;
    const lastCat = searchParams?.get("last_category");
    if (!lastCat) return;
    if (lastCat === "last") {
      setActiveCategory(categoryOrder[categoryOrder.length - 1]);
    } else if (categoryOrder.includes(lastCat)) {
      setActiveCategory(lastCat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryOrder.length]);

  /* =======================
     LOAD CHILD INFO
  ========================== */
  useEffect(() => {
    if (!assessmentIdFromQuery) return;

    const loadAssessments = async () => {
      try {
        const res = await getMyAssessments();
        const list = Array.isArray(res?.data) ? res.data : [];

        const found = list.find(
          (it: any) => String(it.assessment_id) === String(assessmentIdFromQuery)
        );

        if (found) {
          setChildName(found.child_name || "");
          setChildBirthInfo(found.child_birth_info || "");
        }
      } catch (err) {
        console.error("Gagal memuat daftar assessment:", err);
      }
    };

    loadAssessments();
  }, [assessmentIdFromQuery]);

  /* =======================
     NAVIGATION
  ========================== */
  const goNextCategory = () => {
    if (currentIndex < categoryOrder.length - 1) {
      setActiveCategory(categoryOrder[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrevCategory = () => {
    if (currentIndex > 0) {
      setActiveCategory(categoryOrder[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentIndex === 0 || currentIndex === -1) {
      setActiveCategory("identitas");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* =======================
     PARENT IDENTITY HANDLERS
  ========================== */
  const setParentField = (key: string, value: any) => {
    setParentIdentity((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmitIdentity = async (e?: any) => {
    if (e) e.preventDefault();

    // Validasi: minimal nama ayah atau nama ibu wajib diisi
    const fatherName = (parentIdentity.father_name || "").trim();
    const motherName = (parentIdentity.mother_name || "").trim();
    if (!fatherName && !motherName) {
      addToast(
        "warning",
        "Data belum lengkap",
        "Nama lengkap Ayah atau Ibu wajib diisi minimal salah satu."
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        father_identity_number: parentIdentity.father_identity_number || null,
        father_name: parentIdentity.father_name || null,
        father_phone: parentIdentity.father_phone || null,
        father_birth_date: parentIdentity.father_birth_date || null,
        father_occupation: parentIdentity.father_occupation || null,
        father_relationship: parentIdentity.father_relationship || null,

        mother_identity_number: parentIdentity.mother_identity_number || null,
        mother_name: parentIdentity.mother_name || null,
        mother_phone: parentIdentity.mother_phone || null,
        mother_birth_date: parentIdentity.mother_birth_date || null,
        mother_occupation: parentIdentity.mother_occupation || null,
        mother_relationship: parentIdentity.mother_relationship || null,

        guardian_identity_number: parentIdentity.guardian_identity_number || null,
        guardian_name: parentIdentity.guardian_name || null,
        guardian_phone: parentIdentity.guardian_phone || null,
        guardian_birth_date: parentIdentity.guardian_birth_date || null,
        guardian_occupation: parentIdentity.guardian_occupation || null,
        guardian_relationship: parentIdentity.guardian_relationship || null,
      };

      await updateParentIdentity(payload);
      addToast("success", "Identitas berhasil disimpan", "Melanjutkan ke bagian berikutnya...");
      // Tunggu sebentar agar toast terlihat lalu navigasi
      setTimeout(() => goNextCategory(), 800);
    } catch (err: any) {
      console.error("Gagal update identitas:", err);
      addToast("error", "Gagal menyimpan identitas", err?.message || "Terjadi kesalahan pada server.");
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================
     ASSESSMENT SUBMISSION
  ========================== */
  const handleSubmitAssessment = async () => {
    if (!assessmentIdFromQuery) {
      addToast("error", "Assessment ID tidak ditemukan", "Pastikan URL sudah benar.");
      return;
    }

    // Validasi: semua pertanyaan wajib harus terisi
    const currentQuestionsList = groups
      .filter((g) => g.group_key !== "identitas")
      .flatMap((g) => g.questions || []);
    const emptyRequired = currentQuestionsList.filter(
      (q: any) => !q.is_optional && (answers[q.id] === "" || answers[q.id] === null || answers[q.id] === undefined ||
        (Array.isArray(answers[q.id]) && answers[q.id].length === 0))
    );
    if (emptyRequired.length > 0) {
      addToast(
        "warning",
        "Data belum lengkap",
        `Masih ada ${emptyRequired.length} pertanyaan wajib yang belum diisi.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([qid, value]) => {
        let ansPayload: any = {};
        if (value === null || value === undefined || value === "") {
          ansPayload = { value: null };
        } else if (typeof value === "object") {
          ansPayload = value;
        } else if (Array.isArray(value)) {
          ansPayload = { value };
        } else {
          ansPayload = { value };
        }
        return {
          question_id: Number(qid),
          answer: ansPayload,
        };
      });

      const payload = {
        answers: answerArray,
        child_name: childName || null,
        child_birth_info: childBirthInfo || null,
      };

      await submitParentAssessment(assessmentIdFromQuery, "umum_parent", payload);
      addToast("success", "Data umum berhasil disimpan!", "Mengarahkan ke halaman berikutnya...");
      setTimeout(() => {
        router.push(getNextPath("umum"));
      }, 800);
    } catch (err: any) {
      console.error("Gagal submit assessment:", err);
      addToast("error", "Gagal mengirim data", err?.message || "Terjadi kesalahan pada server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    <ResponsiveOrangtuaLayout maxWidth="max-w-none">
      {/* Header section with back & close actions */}
      <div className="flex flex-row items-center justify-between gap-4 mb-6 text-[#1E5C58]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">I. Data Umum</h1>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">Lengkapi identitas dan riwayat tumbuh kembang anak Anda.</p>
        </div>
        <button
          onClick={() =>
            router.push(
              `/orangtua/assessment/kategori?assessment_id=${assessmentIdFromQuery}`
            )
          }
          className="flex items-center justify-center p-2.5 bg-white border border-teal-50 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 shadow-sm transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>
      </div>

      {/* Step Navigator - Dinamis sesuai terapi anak */}
      <div className="w-full mb-6">
        {!stepsLoading && (
          <StepNavigator steps={dynamicSteps} activeStep={activeStep} assessmentId={assessmentIdFromQuery} />
        )}
      </div>

      {/* Content Section */}
      <section className="bg-white rounded-3xl border border-teal-50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] p-5 md:p-8 w-full">
        {/* Title + Dropdown Kategori */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-base md:text-lg font-extrabold text-[#1E5C58]">
            {activeCategory === "identitas" ? "Identitas Orang Tua & Anak" : groups.find((g) => g.group_key === activeCategory)?.title || "Formulir"}
          </h2>

          <div className="relative inline-block w-full sm:w-64">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-xs md:text-sm text-[#1E5C58] font-bold w-full bg-white cursor-pointer focus:ring-2 focus:ring-[#2B7A75] focus:border-transparent outline-none transition-all"
            >
              <option value="identitas">Identitas Orang Tua & Anak</option>
              {groups.map((g) => (
                <option key={g.group_key} value={g.group_key}>
                  {g.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-450 pointer-events-none" />
          </div>
        </div>

        {/* IDENTITAS FORM */}
        {activeCategory === "identitas" && (
          <IdentitasForm
            childName={childName}
            setChildName={setChildName}
            childBirthInfo={childBirthInfo}
            setChildBirthInfo={setChildBirthInfo}
            parentIdentity={parentIdentity}
            setParentField={setParentField}
            onSubmit={handleSubmitIdentity}
            submitting={submitting}
          />
        )}

        {/* DYNAMIC QUESTIONS */}
        {activeCategory !== "identitas" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-full flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B7A75]"></div>
                </div>
              ) : currentQuestions.length === 0 ? (
                <p className="col-span-full text-sm md:text-base text-gray-500 text-center py-12">
                  Tidak ada pertanyaan di kategori ini.
                </p>
              ) : (
                currentQuestions.map((q: any) => (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    answer={answers[q.id]}
                    onAnswerChange={setAnswer}
                    onToggleCheckbox={toggleCheckboxValue}
                    onTableCellChange={handleTableCell}
                  />
                ))
              )}
            </div>

            {/* Navigation Buttons */}
            <NavigationButtons
              currentIndex={currentIndex}
              totalCategories={categoryOrder.length}
              onPrev={goPrevCategory}
              onNext={goNextCategory}
              onSubmit={handleSubmitAssessment}
              submitting={submitting}
            />
          </div>
        )}
      </section>
    </ResponsiveOrangtuaLayout>
    </>
  );
}