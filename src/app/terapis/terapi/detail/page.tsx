"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getTherapySessionDetail,
  TherapySessionDetail,
} from "@/lib/api/terapiTerapis";

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
  tanggal_lama?: string | null;
  waktu_lama?: string | null;
  alasan?: string | null;
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

const formatHubunganWali = (
  relationship?: string | null,
  guardianType?: string | null,
  fallback?: string | null
) => {
  if (relationship && relationship !== "-" && relationship !== "—") {
    return relationship;
  }
  if (guardianType && guardianType !== "-" && guardianType !== "—") {
    const lower = guardianType.toLowerCase();
    if (lower === "ibu") return "Ibu";
    if (lower === "ayah") return "Ayah";
    if (lower === "wali") return "Wali";
    return guardianType.charAt(0).toUpperCase() + guardianType.slice(1);
  }
  if (fallback && fallback !== "-" && fallback !== "—") {
    return fallback;
  }
  return "—";
};

// ── Wrapper Suspense ──────────────────────────────────────────────────────────
export default function DetailJadwalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FBFB]">
          <div className="flex flex-col items-center gap-3 text-[#1E5C58]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#81B7A9] border-t-transparent" />
            <p className="text-sm font-semibold">Memuat Detail Jadwal...</p>
          </div>
        </div>
      }
    >
      <DetailJadwalContent />
    </Suspense>
  );
}

// ── Konten Utama ─────────────────────────────────────────────────────────────
function DetailJadwalContent() {
  const router = useRouter();
  const params = useSearchParams();
  const jadwalId = params.get("jadwal_id") || params.get("id");

  const [sessionDetail, setSessionDetail] = useState<TherapySessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getTherapySessionDetail(jadwalId)
      .then((data) => {
        if (isMounted) {
          setSessionDetail(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil detail jadwal dari API:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jadwalId]);

  // Mapping data pasien (API > SessionStorage > SearchParams)
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

  const jenisKelamin = sessionDetail?.child_gender
    ? formatGender(sessionDetail.child_gender)
    : storedJadwal?.jenisKelamin ?? params.get("jenisKelamin") ?? "—";

  const usia = sessionDetail?.child_age !== null && sessionDetail?.child_age !== undefined
    ? `${sessionDetail.child_age} Tahun`
    : storedJadwal?.usia ?? params.get("usia") ?? "—";

  const tempatTglLahir = sessionDetail?.child_birth_place
    ? `${sessionDetail.child_birth_place}, ${sessionDetail.child_birth_date_formatted || (sessionDetail.child_birth_date ? formatTanggal(sessionDetail.child_birth_date) : "")}`
    : storedJadwal?.tempatTglLahir ?? params.get("tempatTglLahir") ?? "—";

  const asalSekolah = sessionDetail?.child_school || storedJadwal?.asalSekolah || params.get("asalSekolah") || "—";
  const alamat = sessionDetail?.child_address || storedJadwal?.alamat || params.get("alamat") || "—";
  const nomorRM = sessionDetail?.medical_record_number || storedJadwal?.nomorRM || params.get("nomorRM") || "—";
  const hubunganWali = formatHubunganWali(
    sessionDetail?.relationship_with_child,
    sessionDetail?.guardian_type,
    storedJadwal?.hubunganWali || params.get("hubunganWali")
  );

  // Data Reschedule
  const isRescheduled =
    sessionDetail?.is_rescheduled ||
    sessionDetail?.is_reschedule ||
    !!storedJadwal?.tanggal_lama;
  const tanggalLama =
    sessionDetail?.session_date_formatted ||
    (sessionDetail?.session_date ? formatTanggal(sessionDetail.session_date) : null) ||
    (storedJadwal?.tanggal_lama ? formatTanggal(storedJadwal.tanggal_lama) : null) ||
    tanggalTerapi;

  const waktuLama = waktu;
  const tanggalBaru =
    sessionDetail?.reschedule_info?.new_session_date_formatted ||
    (sessionDetail?.reschedule_info?.new_session_date ? formatTanggal(sessionDetail.reschedule_info.new_session_date) : null) ||
    tanggalTerapi;

  const waktuBaru = waktu;
  const alasan = sessionDetail?.reschedule_info?.reason || storedJadwal?.alasan || params.get("alasan") || "—";

  const handleKembali = () => {
    const rawType =
      params.get("type") ||
      (sessionDetail?.therapy_type || storedJadwal?.tipeTerapi || "").toLowerCase();
    let targetType = "paedagog";
    if (rawType.includes("okupasi")) targetType = "okupasi";
    else if (rawType.includes("wicara")) targetType = "wicara";
    else if (rawType.includes("fisio")) targetType = "fisio";

    const targetStatus = params.get("status") || "scheduled";
    router.push(`/terapis/terapi?type=${targetType}&status=${targetStatus}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FBFB]">
        <div className="flex flex-col items-center gap-3 text-[#1E5C58]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#81B7A9] border-t-transparent" />
          <p className="text-sm font-semibold">Memuat Detail Jadwal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:justify-between md:items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1E5C58]">
            Detail Jadwal Terapi
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Informasi lengkap jadwal sesi terapi pasien.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleKembali}
            className="cursor-pointer inline-flex items-center gap-2 bg-[#1E5C58] hover:bg-[#2E8B83] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>

      {/* ── Identitas Anak ── */}
      <div className="relative p-6 overflow-hidden bg-white border shadow-sm rounded-2xl md:p-8 border-teal-50">
        <Badge title="IDENTITAS ANAK" />
        <div className="grid grid-cols-1 mt-6 md:grid-cols-3 gap-y-6 gap-x-8">
          <div className="space-y-6">
            <InfoItem label="NAMA LENGKAP" value={namaPasien} />
            <InfoItem label="NOMOR REKAM MEDIS" value={nomorRM} />
            <InfoItem label="USIA" value={usia} />
          </div>
          <div className="space-y-6">
            <InfoItem label="JENIS KELAMIN" value={jenisKelamin} />
            <InfoItem label="TEMPAT & TANGGAL LAHIR" value={tempatTglLahir} />
            <InfoItem label="SEKOLAH" value={asalSekolah} />
          </div>
          <div className="space-y-6">
            <InfoItem label="ALAMAT TEMPAT TINGGAL" value={alamat} />
          </div>
        </div>
      </div>

      {/* ── Identitas Orang Tua / Wali ── */}
      <div className="relative p-6 overflow-hidden bg-white border shadow-sm rounded-2xl md:p-8 border-teal-50">
        <Badge title="IDENTITAS ORANG TUA / WALI" />
        <div className="grid grid-cols-1 mt-6 md:grid-cols-3 gap-y-6 gap-x-8">
          <div className="space-y-6">
            <InfoItem label="NAMA ORANG TUA" value={namaOrangTua} />
          </div>
          <div className="space-y-6">
            <InfoItem label="HUBUNGAN ORANG TUA" value={hubunganWali} />
          </div>
          <div className="space-y-6">
            <InfoItem label="NOMOR TELEPON" value={telepon} />
          </div>
        </div>
      </div>

      {/* ── Detail Layanan Terapi ── */}
      <div className="relative p-6 overflow-hidden bg-white border shadow-sm rounded-2xl md:p-8 border-teal-50">
        <Badge title="DETAIL LAYANAN TERAPI" />
        <div className="grid grid-cols-1 mt-6 md:grid-cols-3 gap-y-6 gap-x-8">
          <InfoItem label="JENIS TERAPI" value={tipeTerapi} />
          <InfoItem label="TANGGAL & JAM TERAPI" value={`${tanggalTerapi}, ${waktu}`} />
          <InfoItem label="NAMA TERAPIS" value={terapis} />
        </div>
      </div>

      {/* ── Informasi Reschedule ── */}
      {isRescheduled && (
        <div className="relative p-6 overflow-hidden border shadow-sm bg-amber-50/50 rounded-2xl md:p-8 border-amber-100">
          <Badge title="INFORMASI RESCHEDULE" />
          <div className="grid grid-cols-1 mt-6 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="space-y-6">
              <InfoItem label="JADWAL SEMULA" value={`${tanggalLama}, ${waktuLama}`} />
            </div>
            <div className="space-y-6">
              <InfoItem label="JADWAL BARU" value={`${tanggalBaru}, ${waktuBaru}`} />
              <InfoItem label="ALASAN RESCHEDULE" value={alasan} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ title }: { title: string }) {
  return (
    <div className="inline-block bg-[#EAF4F2] text-[#1E5C58] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-2">
      {title}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-[13px] font-bold text-gray-800">{value}</p>
    </div>
  );
}
