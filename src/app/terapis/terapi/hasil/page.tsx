"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileEdit,
  Download,
  User,
  Users,
  Calendar,
} from "lucide-react";
import {
  getTherapySessionDetail,
  TherapySessionDetail,
} from "@/lib/api/terapiTerapis";
import { useTherapistProfile } from "@/context/ProfileTerapisContext";

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

export default function HasilTerapiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FBFB]">
          <div className="flex flex-col items-center gap-3 text-[#1E5C58]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#81B7A9] border-t-transparent" />
            <p className="text-sm font-semibold">Memuat Hasil Terapi...</p>
          </div>
        </div>
      }
    >
      <HasilTerapiContent />
    </Suspense>
  );
}

function HasilTerapiContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useTherapistProfile();
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

  // Fetch detail sesi dan SOAP dari API backend
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
        console.error("Gagal mengambil data hasil terapi:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jadwalId]);

  // Data pasien dari sessionDetail API > storedJadwal > query params
  const namaPasien = sessionDetail?.child_name ?? storedJadwal?.namaPasien ?? params.get("namaPasien") ?? "—";
  const namaOrangTua = sessionDetail?.guardian_name ?? storedJadwal?.namaOrangTua ?? params.get("namaOrangTua") ?? "—";
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

  const usia =
    (sessionDetail?.child_age ? `${sessionDetail.child_age} Tahun` : null) ??
    storedJadwal?.usia ??
    params.get("usia") ??
    "—";
  const alamat = sessionDetail?.child_address ?? storedJadwal?.alamat ?? params.get("alamat") ?? "—";
  const nomorRM = sessionDetail?.medical_record_number ?? storedJadwal?.nomorRM ?? params.get("nomorRM") ?? "—";
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
  const telepon = sessionDetail?.guardian_phone ?? storedJadwal?.telepon ?? params.get("telepon") ?? "—";
  const sekolah = sessionDetail?.child_school ?? storedJadwal?.asalSekolah ?? params.get("asalSekolah") ?? "—";
  const hubunganOrangTua = formatHubunganWali(
    sessionDetail?.relationship_with_child,
    sessionDetail?.guardian_type,
    storedJadwal?.hubunganWali || params.get("hubunganWali")
  );
  const hubunganDisplay =
    hubunganOrangTua !== "—"
      ? hubunganOrangTua
      : sessionDetail?.relationship_with_child || storedJadwal?.hubunganWali || "—";

  // Data SOAP dari API backend (relasi soap pada detail session)
  const soap = sessionDetail?.soap;
  const diagnosis = soap?.therapy_diagnosis || "—";
  const jumlahSesi = soap?.total_soap_recorded
    ? `${soap.total_soap_recorded} sesi`
    : sessionDetail?.session_number
      ? `Sesi ke-${sessionDetail.session_number}`
      : "—";
  const tindakanTerakhir = soap?.interventions || "—";

  const tanggalJamPelaksanaan = (() => {
    if (soap?.performed_date_formatted && soap?.performed_time) {
      return `${soap.performed_date_formatted}, ${soap.performed_time}`;
    }
    if (soap?.performed_date_formatted) {
      return soap.performed_date_formatted;
    }
    if (soap?.performed_at) {
      try {
        const d = new Date(soap.performed_at);
        if (!isNaN(d.getTime())) {
          const datePart = d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          const timePart = d.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          return `${datePart}, ${timePart.replace(".", ":")}`;
        }
      } catch {
        return soap.performed_at;
      }
    }
    return "—";
  })();

  const soapData = {
    s: soap?.subjective || "—",
    o: soap?.objective || "—",
    a: soap?.assessment || "—",
    p: soap?.plan || "—",
    i: soap?.implementation || "—",
    a2: soap?.advanced_assessment || "—",
    p2: soap?.advanced_plan || "—",
  };

  const handleKembali = () => {
    const rawType =
      params.get("type") ||
      (sessionDetail?.therapy_type || storedJadwal?.tipeTerapi || "").toLowerCase();
    let targetType = "paedagog";
    if (rawType.includes("okupasi")) targetType = "okupasi";
    else if (rawType.includes("wicara")) targetType = "wicara";
    else if (rawType.includes("fisio")) targetType = "fisio";

    const targetStatus = params.get("status") || "completed";
    router.push(`/terapis/terapi?type=${targetType}&status=${targetStatus}`);
  };

  const isMySpecialty = useMemo(() => {
    if (!profile?.therapist_section) return false;
    const mySection = profile.therapist_section.toLowerCase();
    const rawType = (sessionDetail?.therapy_type || tipeTerapi || params.get("type") || "").toLowerCase();
    return (
      rawType.includes(mySection) ||
      (mySection.includes("plb") && (rawType.includes("paedagog") || rawType.includes("plb"))) ||
      (mySection.includes("paedagog") && (rawType.includes("paedagog") || rawType.includes("plb"))) ||
      (mySection.includes("okupasi") && rawType.includes("okupasi")) ||
      (mySection.includes("wicara") && rawType.includes("wicara")) ||
      (mySection.includes("fisio") && rawType.includes("fisio"))
    );
  }, [profile, sessionDetail, tipeTerapi, params]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FBFB]">
        <div className="flex flex-col items-center gap-3 text-[#1E5C58]">
          <Loader2 className="w-8 h-8 animate-spin text-[#81B7A9]" />
          <p className="text-sm font-semibold">Memuat Hasil Terapi...</p>
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
            Hasil Terapi
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Dokumen rekam hasil dan kesimpulan terapi pasien
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
        <div className="flex items-center gap-3">
          {isMySpecialty && (
            <button
              type="button"
              disabled
              title="Fitur ekspor SOAP ditunda sementara menunggu endpoint pengiriman PDF dari backend"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-teal-100 text-[#1E5C58] opacity-50 cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export SOAP (Pending)</span>
            </button>
          )}
          <button
            onClick={handleKembali}
            className="cursor-pointer inline-flex items-center gap-2 bg-[#1E5C58] hover:bg-[#2E8B83] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>

      {/* ── Peringatan jika belum ada SOAP ── */}
      {sessionDetail && !sessionDetail.has_soap && (
        <div className="flex flex-col justify-between gap-4 p-5 text-sm border shadow-xs bg-amber-50 border-amber-200 rounded-2xl sm:flex-row sm:items-center text-amber-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Catatan SOAP Belum Diisi</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Sesi terapi ini belum memiliki catatan SOAP tersimpan. Anda dapat mengisi catatan SOAP sekarang.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/terapis/terapi/isi-soap?jadwal_id=${sessionDetail.id}`)}
            className="cursor-pointer inline-flex items-center justify-center gap-2 bg-[#1E5C58] hover:bg-[#2E8B83] text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-xs shrink-0"
          >
            <FileEdit className="w-3.5 h-3.5" />
            Isi SOAP Sekarang
          </button>
        </div>
      )}

      {/* ── Informasi Pasien Anak ── */}
      <div className="p-6 space-y-4 bg-white border shadow-sm rounded-2xl border-teal-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[#1E5C58]">
            Informasi Pasien Anak
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
          <InfoItem label="Nama lengkap" value={namaPasien} />
          <InfoItem label="Nomor rekam medis" value={nomorRM} />
          <InfoItem label="Jenis kelamin" value={jenisKelamin} />
          <InfoItem label="Usia" value={usia} />
          <InfoItem label="Tempat & tanggal lahir" value={tempatTglLahir} />
          <InfoItem label="Asal sekolah" value={sekolah} />
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
                {hubunganDisplay !== "—" && (
                  <span className="text-xs font-bold bg-[#EAF4F2] text-[#1E5C58] px-2 py-0.5 rounded-full">
                    {hubunganDisplay}
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

      {/* ── Ringkasan Hasil Terapi ── */}
      <div className="p-6 space-y-4 bg-white border shadow-sm rounded-2xl border-teal-50">
        <h2 className="text-lg font-extrabold text-[#1E5C58]">
          Ringkasan Hasil Terapi
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
          <InfoItem label="Tanggal & jam pelaksanaan" value={tanggalJamPelaksanaan} />
          <InfoItem label="Jumlah sesi tercatat" value={jumlahSesi} />
          <div className="sm:col-span-2">
            <InfoItem label="Diagnosis terapi" value={diagnosis} />
          </div>
          <div className="sm:col-span-2">
            <InfoItem label="Tindakan terapi terakhir" value={tindakanTerakhir} />
          </div>
        </div>
      </div>

      {/* ── SOAP Sesi Terakhir ── */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-[#1E5C58] mb-4">SOAP sesi terakhir</h2>
        <div className="space-y-4">
          <SoapCard initial="S" label="(SUBJEKTIF)" content={soapData.s} />
          <SoapCard initial="O" label="(OBJEKTIF)" content={soapData.o} />
          <SoapCard initial="A" label="(ASSESSMENT)" content={soapData.a} />
          <SoapCard initial="P" label="(PLAN)" content={soapData.p} />
          <SoapCard initial="I" label="(IMPLEMENTASI)" content={soapData.i} />
          <SoapCard initial="A" label="(ASSESSMENT LANJUTAN)" content={soapData.a2} />
          <SoapCard initial="P" label="(PLAN LANJUTAN)" content={soapData.p2} />
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

function SoapCard({ initial, label, content }: { initial: string; label: string; content: string }) {
  return (
    <div className="p-5 bg-white border shadow-sm rounded-2xl border-teal-50">
      <div className="inline-flex items-center gap-1.5 bg-[#EAF4F2] text-[#1E5C58] px-3 py-1 rounded-full mb-4">
        <span className="text-sm font-extrabold">{initial}</span>
        <span className="text-[10px] font-bold tracking-wider">{label}</span>
      </div>
      <p className="text-[13px] font-medium text-gray-700 leading-relaxed px-1">
        {content}
      </p>
    </div>
  );
}
