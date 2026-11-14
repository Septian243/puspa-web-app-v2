/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, User, ArrowLeft, Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import CalendarComponent from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { updateAsessmentSchedule } from "@/lib/api/jadwal_asessment";
import { getAssessmentDetail } from "@/lib/api/asesment";
import { showSuccessToast, showErrorToast, handleApiError } from "@/lib/toast";

function AturAsesmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id") || searchParams.get("assessment_id");

  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("09:00");
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const detail = await getAssessmentDetail(assessmentId);
        setPatientData(detail);
        if (detail?.scheduled_date) {
          setDate(new Date(detail.scheduled_date));
        }
        if (detail?.scheduled_time) {
          setTime(detail.scheduled_time.slice(0, 5));
        }
      } catch (err) {
        console.error("Gagal memuat detail asesmen:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [assessmentId]);

  const handleSave = async () => {
    if (!assessmentId) {
      showErrorToast("Assessment ID tidak ditemukan.");
      return;
    }

    setSaving(true);
    try {
      const formattedDate = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
      await updateAsessmentSchedule(Number(assessmentId), formattedDate, time);

      showSuccessToast("Jadwal asesmen berhasil diperbarui ✅");
      setTimeout(() => {
        router.push("/terapis/asessment");
      }, 1000);
    } catch (err: any) {
      handleApiError(err, "Gagal memperbarui jadwal asesmen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#1E5C58] mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
          <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#2B7A75]" />
            Atur Jadwal Asesmen
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Tentukan tanggal dan jam pelaksanaan asesmen klinis anak
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-teal-50 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8"
      >
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm font-medium">
            Memuat detail jadwal asesmen...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sisi Kiri: Info Pasien & Waktu */}
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#F4F9F8] border border-teal-100/50">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2B7A75] block mb-2">
                  Informasi Pasien
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100/60 text-[#1E5C58] flex items-center justify-center font-bold">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1E5C58]">
                      {patientData?.child_name || "Pasien Asesmen"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      ID Asesmen: #{assessmentId || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2 flex items-center gap-1.5">
                  <Clock size={15} className="text-[#2B7A75]" />
                  Jam Pelaksanaan
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-teal-100 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2B7A75]/20 focus:border-[#2B7A75]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-amber-600" />
                  Tanggal Terpilih:
                </p>
                <p className="font-semibold text-sm text-[#1E5C58]">
                  {date.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  pukul {time} WIB
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-[#1E5C58] hover:bg-[#163F3C] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Menyimpan Jadwal..." : "Simpan Jadwal Asesmen"}
              </button>
            </div>

            {/* Sisi Kanan: Kalender */}
            <div className="flex flex-col items-center justify-center">
              <CalendarComponent
                onChange={(val: any) => setDate(val)}
                value={date}
                locale="id-ID"
                className="rounded-2xl border border-teal-100/60 p-3 shadow-xs w-full"
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function AturAsesmentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-medium text-gray-400">
          Memuat halaman...
        </div>
      }
    >
      <AturAsesmentContent />
    </Suspense>
  );
}
