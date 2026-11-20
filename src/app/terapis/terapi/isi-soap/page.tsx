"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, Users, Calendar, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import {
  getTherapySessionDetail,
  createTherapySoap,
  TherapySessionDetail,
  CreateTherapySoapPayload,
} from "@/lib/api/terapiTerapis";
import { createHandleChange } from "@/lib/formUtils";

interface StoredJadwal {
  id: string;
  namaPasien: string;
  namaOrangTua: string;
  telepon: string;
  tipeTerapi: string;
  terapis: string;
  tanggal: string;
  waktu: string;
  status: string;
  nomorRM?: string;
  usia?: string;
  jenisKelamin?: string;
  tempatTglLahir?: string;
  asalSekolah?: string;
  alamat?: string;
  hubunganWali?: string;
}

const formatTanggal = (yyyyMmDd: string) => {
  if (!yyyyMmDd) return "";
  const parts = yyyyMmDd.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return yyyyMmDd;
};

const formatGender = (gender?: string | null) => {
  if (!gender) return "—";
  const lower = gender.toLowerCase();
  if (lower === "laki-laki" || lower === "l") return "Laki-laki";
  if (lower === "perempuan" || lower === "p") return "Perempuan";
  return gender;
};

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatPerformedAtForApi = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return "";
  const formatted = dateTimeLocal.replace("T", " ");
  if (formatted.length === 16) {
    return `${formatted}:00`;
  }
  return formatted;
};

export default function IsiSoapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FBFB]">
          <div className="flex flex-col items-center gap-3 text-[#1E5C58]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#81B7A9] border-t-transparent" />
            <p className="text-sm font-semibold">Memuat Form SOAP...</p>
          </div>
        </div>
      }
    >
      <IsiSoapContent />
    </Suspense>
  );
}

function IsiSoapContent() {
  const router = useRouter();
  const params = useSearchParams();
  const jadwalId = params.get("jadwal_id") || params.get("id");

  const [sessionDetail, setSessionDetail] = useState<TherapySessionDetail | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback cache dari sessionStorage jika ada
  const storedJadwal = useMemo<StoredJadwal | null>(() => {
    if (typeof window === "undefined" || !jadwalId) return null;
    try {
      const stored = sessionStorage.getItem(`terapi_selected_${jadwalId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Gagal membaca jadwal dari sessionStorage:", e);
    }
    return null;
  }, [jadwalId]);

  // Fetch detail jadwal dari API backend
  useEffect(() => {
    if (!jadwalId) {
      setIsLoadingSession(false);
      return;
    }

    let isMounted = true;
    setIsLoadingSession(true);

    getTherapySessionDetail(jadwalId)
      .then((data) => {
        if (isMounted) {
          setSessionDetail(data);
          setIsLoadingSession(false);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil detail jadwal dari API:", err);
        if (isMounted) {
          setIsLoadingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jadwalId]);

  const namaPasien = sessionDetail?.child_name ?? storedJadwal?.namaPasien ?? params.get("namaPasien") ?? "—";
  const namaOrangTua = sessionDetail?.guardian_name ?? storedJadwal?.namaOrangTua ?? params.get("namaOrangTua") ?? "—";
  const telepon = sessionDetail?.guardian_phone ?? storedJadwal?.telepon ?? params.get("telepon") ?? "—";
  const tipeTerapi = sessionDetail?.therapy_type_label ?? storedJadwal?.tipeTerapi ?? params.get("tipeTerapi") ?? "—";
  const terapis = sessionDetail?.therapist_name ?? storedJadwal?.terapis ?? params.get("terapis") ?? "—";
  const tanggalTerapi =
    sessionDetail?.session_date_formatted ||
    (sessionDetail?.session_date ? formatTanggal(sessionDetail.session_date) : null) ||
    (storedJadwal?.tanggal ? formatTanggal(storedJadwal.tanggal) : null) ||
    params.get("tanggalTerapi") ||
    "—";
  const waktu = sessionDetail
    ? `${sessionDetail.start_time} - ${sessionDetail.end_time}`
    : storedJadwal?.waktu ?? params.get("waktu") ?? "—";
  const hubunganWali = sessionDetail?.relationship_with_child ?? storedJadwal?.hubunganWali ?? params.get("hubunganWali") ?? "—";
  const nomorRM = sessionDetail?.medical_record_number ?? storedJadwal?.nomorRM ?? params.get("nomorRM") ?? "—";
  const usia =
    (sessionDetail?.child_age ? `${sessionDetail.child_age} Tahun` : null) ??
    storedJadwal?.usia ??
    params.get("usia") ??
    "—";
  const jenisKelamin = sessionDetail?.child_gender
    ? formatGender(sessionDetail.child_gender)
    : storedJadwal?.jenisKelamin ?? params.get("jenisKelamin") ?? "—";
  const tempatTglLahir =
    (sessionDetail?.child_birth_place && sessionDetail?.child_birth_date_formatted
      ? `${sessionDetail.child_birth_place}, ${sessionDetail.child_birth_date_formatted}`
      : null) ??
    storedJadwal?.tempatTglLahir ??
    params.get("tempatTglLahir") ??
    "—";
  const asalSekolah = sessionDetail?.child_school ?? storedJadwal?.asalSekolah ?? params.get("asalSekolah") ?? "—";
  const alamat = sessionDetail?.child_address ?? storedJadwal?.alamat ?? params.get("alamat") ?? "—";

  // State form
  const [formData, setFormData] = useState({
    tanggalJam: getCurrentDateTimeLocal(),
    diagnosis: "",
    tindakan: "",
    subjektif: "",
    objektif: "",
    assessment: "",
    plan: "",
    implementasi: "",
    assessmentLanjutan: "",
    planLanjutan: "",
  });

  const handleChange = createHandleChange(setFormData);

  const handleSimpan = async () => {
    if (!jadwalId) {
      showErrorToast("ID sesi terapi tidak ditemukan. Pastikan Anda membuka form melalui jadwal yang valid.");
      return;
    }

    // Presensi anak harus berstatus Hadir terlebih dahulu untuk mengisi dan menyimpan SOAP
    if (sessionDetail && sessionDetail.status !== "present") {
      showErrorToast("Presensi anak harus tercatat Hadir terlebih dahulu untuk dapat mengisi dan menyimpan catatan SOAP.");
      return;
    }

    if (!formData.tanggalJam) {
      showErrorToast("Tanggal & jam pelaksanaan terapi wajib diisi.");
      return;
    }

    if (!formData.diagnosis.trim()) {
      showErrorToast("Diagnosis terapi wajib diisi.");
      return;
    }

    if (!formData.tindakan.trim()) {
      showErrorToast("Tindakan terapi wajib diisi.");
      return;
    }

    if (!formData.subjektif.trim()) {
      showErrorToast("Catatan Subjektif (S) wajib diisi.");
      return;
    }

    if (!formData.objektif.trim()) {
      showErrorToast("Catatan Objektif (O) wajib diisi.");
      return;
    }

    if (!formData.assessment.trim()) {
      showErrorToast("Catatan Assessment (A) wajib diisi.");
      return;
    }

    if (!formData.plan.trim()) {
      showErrorToast("Catatan Plan (P) wajib diisi.");
      return;
    }

    const performedAt = formatPerformedAtForApi(formData.tanggalJam);
    const payload: CreateTherapySoapPayload = {
      therapy_session_id: jadwalId,
      performed_at: performedAt,
      therapy_diagnosis: formData.diagnosis.trim(),
      interventions: formData.tindakan.trim(),
      subjective: formData.subjektif.trim(),
      objective: formData.objektif.trim(),
      assessment: formData.assessment.trim(),
      plan: formData.plan.trim(),
      implementation: formData.implementasi.trim() || undefined,
      advanced_assessment: formData.assessmentLanjutan.trim() || undefined,
      advanced_plan: formData.planLanjutan.trim() || undefined,
    };

    setIsSubmitting(true);
    const result = await createTherapySoap(payload);
    setIsSubmitting(false);

    if (result.success) {
      showSuccessToast(result.message || "SOAP berhasil disimpan! ✅");

      const getTargetType = () => {
        const rawType = (sessionDetail?.therapy_type || tipeTerapi || "").toLowerCase();
        if (rawType.includes("okupasi")) return "okupasi";
        if (rawType.includes("wicara")) return "wicara";
        if (rawType.includes("fisio")) return "fisio";
        return "paedagog";
      };

      router.push(`/terapis/terapi?type=${getTargetType()}&status=completed`);
    } else {
      showErrorToast(result.message);
    }
  };

  const handleKembali = () => {
    const rawType =
      params.get("type") ||
      (sessionDetail?.therapy_type || tipeTerapi || "").toLowerCase();
    let targetType = "paedagog";
    if (rawType.includes("okupasi")) targetType = "okupasi";
    else if (rawType.includes("wicara")) targetType = "wicara";
    else if (rawType.includes("fisio")) targetType = "fisio";

    const targetStatus = params.get("status") || "scheduled";
    router.push(`/terapis/terapi?type=${targetType}&status=${targetStatus}`);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 text-[#1E5C58] bg-[#F8FBFB] min-h-screen relative">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#1E5C58]">
            Form Isi SOAP
          </h1>
          <p className="mt-1 text-xs text-gray-500 md:text-sm">
            Lengkapi catatan SOAP untuk{" "}
            <strong className="text-gray-700">{namaPasien}</strong>{" "}
            {usia !== "—" ? `(${usia})` : ""}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EAF4F2] text-[#1E5C58]">
              <Calendar className="w-3.5 h-3.5" />
              {tanggalTerapi} • {waktu}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EAF4F2] text-[#1E5C58]">
              Jenis terapi: {tipeTerapi}
            </span>
          </div>
        </div>
        <button
          onClick={handleKembali}
          className="cursor-pointer inline-flex items-center gap-2 bg-[#1E5C58] hover:bg-[#2E8B83] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>

      {/* ── Peringatan jika sesi sudah memiliki SOAP ── */}
      {sessionDetail?.has_soap && (
        <div className="flex items-start gap-3 p-4 text-sm border shadow-xs bg-amber-50 border-amber-200 rounded-2xl text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Sesi Terapi Ini Sudah Memiliki Catatan SOAP</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Catatan SOAP untuk sesi terapi ini sudah pernah dibuat sebelumnya. Anda dapat melihat hasil rekaman SOAP melalui riwayat terapi selesai.
            </p>
          </div>
        </div>
      )}

      {/* ── Peringatan jika status kehadiran bukan present ── */}
      {sessionDetail && sessionDetail.status !== "present" && (
        <div className="flex items-start gap-3 p-4 text-sm border shadow-xs bg-amber-50 border-amber-200 rounded-2xl text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Perhatian: Status Kehadiran Belum Hadir</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Presensi pasien saat ini belum tercatat Hadir. Pengisian dan penyimpanan catatan SOAP hanya dapat dilakukan setelah pasien dipresensi Hadir oleh admin atau melalui scan QR.
            </p>
          </div>
        </div>
      )}

      {/* ── Informasi Pasien ── */}
      <div className="p-6 space-y-4 bg-white border shadow-sm rounded-2xl border-teal-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#1E5C58]">
            Informasi Pasien Anak
          </h2>
          {isLoadingSession && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#1E5C58] font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat data...
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
          <InfoItem label="Nama lengkap" value={namaPasien} />
          <InfoItem label="Nomor rekam medis" value={nomorRM} />
          <InfoItem label="Jenis kelamin" value={jenisKelamin} />
          <InfoItem label="Usia" value={usia} />
          <InfoItem label="Tempat & tanggal lahir" value={tempatTglLahir} />
          <InfoItem label="Asal sekolah" value={asalSekolah} />
          <InfoItem label="Jenis terapi" value={tipeTerapi} />
          <InfoItem label="Alamat" value={alamat} />
        </div>
      </div>

      {/* ── Orang Tua & Terapis ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="p-6 space-y-4 bg-white border shadow-sm rounded-2xl border-teal-50">
          <div className="flex items-center gap-2 text-base font-extrabold text-[#1E5C58]">
            <Users className="w-4 h-4 text-[#81B7A9]" />
            <span>Orangtua / Wali</span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-gray-400">Nama orang tua</p>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-gray-800">
                  {namaOrangTua}
                </span>
                {hubunganWali !== "—" && (
                  <span className="text-xs font-bold bg-[#EAF4F2] text-[#1E5C58] px-2 py-0.5 rounded-full">
                    {hubunganWali}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">Nomor telepon</p>
              <p className="text-[14px] font-bold text-gray-800">{telepon}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 bg-white border shadow-sm rounded-2xl border-teal-50">
          <div className="flex items-center gap-2 text-base font-extrabold text-[#1E5C58]">
            <User className="w-4 h-4 text-[#81B7A9]" />
            <span>Ditangani oleh</span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-gray-400">Terapis</p>
              <p className="text-[14px] font-bold text-gray-800">{terapis}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">Bidang</p>
              <p className="text-[14px] font-bold text-gray-800">{tipeTerapi}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form SOAP ── */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputCard label="Tanggal & jam pelaksanaan *">
            <div className="relative">
              <input
                type="datetime-local"
                name="tanggalJam"
                value={formData.tanggalJam}
                onChange={handleChange}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#81B7A9] focus:ring-1 focus:ring-[#81B7A9] text-gray-700 bg-white"
              />
            </div>
          </InputCard>
          <InputCard label="Diagnosis terapi *">
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              placeholder="Contoh: Sensory Integration Disorder"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#81B7A9] focus:ring-1 focus:ring-[#81B7A9] text-gray-700 placeholder:text-gray-300 bg-white"
            />
          </InputCard>
        </div>

        <InputCard label="Tindakan terapi *">
          <TextArea
            name="tindakan"
            value={formData.tindakan}
            onChange={handleChange}
            placeholder="Tuliskan tindakan terapi yang dilakukan..."
          />
        </InputCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputCard label={<SoapLabel initial="S" text="Subjektif *" />}>
            <TextArea
              name="subjektif"
              value={formData.subjektif}
              onChange={handleChange}
              placeholder="Sebutkan keluhan subjektif pasien..."
            />
          </InputCard>
          <InputCard label={<SoapLabel initial="O" text="Objektif *" />}>
            <TextArea
              name="objektif"
              value={formData.objektif}
              onChange={handleChange}
              placeholder="Sebutkan hasil observasi objektif..."
            />
          </InputCard>
          <InputCard label={<SoapLabel initial="A" text="Assessment *" />}>
            <TextArea
              name="assessment"
              value={formData.assessment}
              onChange={handleChange}
              placeholder="Tuliskan assessment..."
            />
          </InputCard>
          <InputCard label={<SoapLabel initial="P" text="Plan *" />}>
            <TextArea
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              placeholder="Tuliskan plan..."
            />
          </InputCard>
          <InputCard label={<SoapLabel initial="I" text="Implementasi" />}>
            <TextArea
              name="implementasi"
              value={formData.implementasi}
              onChange={handleChange}
              placeholder="Tuliskan implementasi (opsional)..."
            />
          </InputCard>
          <InputCard
            label={<SoapLabel initial="A" text="Assessment lanjutan" />}
          >
            <TextArea
              name="assessmentLanjutan"
              value={formData.assessmentLanjutan}
              onChange={handleChange}
              placeholder="Tuliskan assessment lanjutan (opsional)..."
            />
          </InputCard>
        </div>

        <InputCard label={<SoapLabel initial="P" text="Plan lanjutan" />}>
          <TextArea
            name="planLanjutan"
            value={formData.planLanjutan}
            onChange={handleChange}
            placeholder="Tuliskan plan lanjutan (opsional)..."
          />
        </InputCard>
      </div>

      {/* ── Footer Sticky ── */}
      <div className="sticky bottom-0 -mx-6 md:-mx-8 -mb-6 md:-mb-8 mt-6 bg-[#F8FBFB]/90 backdrop-blur-md border-t border-teal-100/50 p-4 md:px-8 z-50">
        <div className="max-w-[1920px] mx-auto flex justify-end gap-3">
          <button
            type="button"
            onClick={() => history.back()}
            disabled={isSubmitting}
            className="cursor-pointer px-6 py-2.5 rounded-full text-sm font-bold border border-teal-100 text-[#1E5C58] hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSimpan}
            disabled={isSubmitting || (sessionDetail !== null && sessionDetail.status !== "present")}
            title={sessionDetail?.status !== "present" ? "Presensi anak harus Hadir terlebih dahulu untuk menyimpan catatan SOAP" : undefined}
            className="cursor-pointer px-6 py-2.5 rounded-full text-sm font-bold bg-[#1E5C58] text-white hover:bg-[#2B7A75] shadow-md shadow-teal-800/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan SOAP</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-sm text-gray-400">{label}</p>
      <p className="text-[14px] font-bold text-gray-800">{value}</p>
    </div>
  );
}

function InputCard({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 bg-white border shadow-sm rounded-2xl border-teal-50">
      <label className="block text-sm font-extrabold text-[#1E5C58] mb-3">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextArea({
  name,
  value,
  onChange,
  placeholder,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#81B7A9] focus:ring-1 focus:ring-[#81B7A9] text-gray-700 placeholder:text-gray-300 bg-white resize-y"
    />
  );
}

function SoapLabel({ initial, text }: { initial: string; text: string }) {
  return (
    <div className="flex items-start gap-1">
      <span className="text-xs uppercase">{initial}</span>
      <span>{text}</span>
    </div>
  );
}
