"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { User, Users, Calendar, ArrowLeft } from "lucide-react";
import { showSuccessToast } from "@/lib/api-error";

interface JadwalDetail {
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

  // Ambil detail jadwal berdasarkan ID (dari sessionStorage sebelum tersambung ke API).
  // TODO: Saat endpoint API backend sudah tersedia, ganti baris ini dengan query/fetch API.
  const jadwal = useMemo<JadwalDetail | null>(() => {
    if (typeof window === "undefined" || !jadwalId) return null;
    try {
      const stored = sessionStorage.getItem(`terapi_selected_${jadwalId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Gagal membaca jadwal dari sessionStorage:", e);
    }
    return null;
  }, [jadwalId]);

  // Data pasien (didapat dari jadwal by ID, atau fallback ke params jika ada)
  const namaPasien = jadwal?.namaPasien ?? params.get("namaPasien") ?? "—";
  const namaOrangTua = jadwal?.namaOrangTua ?? params.get("namaOrangTua") ?? "—";
  const telepon = jadwal?.telepon ?? params.get("telepon") ?? "—";
  const tipeTerapi = jadwal?.tipeTerapi ?? params.get("tipeTerapi") ?? "—";
  const terapis = jadwal?.terapis ?? params.get("terapis") ?? "—";
  const tanggalTerapi = (jadwal?.tanggal ? formatTanggal(jadwal.tanggal) : null) ?? params.get("tanggalTerapi") ?? "—";
  const waktu = jadwal?.waktu ?? params.get("waktu") ?? "—";
  const hubunganWali = jadwal?.hubunganWali ?? params.get("hubunganWali") ?? "—";
  const nomorRM = jadwal?.nomorRM ?? params.get("nomorRM") ?? "—";
  const usia = jadwal?.usia ?? params.get("usia") ?? "—";
  const jenisKelamin = jadwal?.jenisKelamin ?? params.get("jenisKelamin") ?? "—";
  const tempatTglLahir = jadwal?.tempatTglLahir ?? params.get("tempatTglLahir") ?? "—";
  const asalSekolah = jadwal?.asalSekolah ?? params.get("asalSekolah") ?? "—";
  const alamat = jadwal?.alamat ?? params.get("alamat") ?? "—";

  // State form
  const [formData, setFormData] = useState({
    tanggalJam: "",
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSimpan = () => {
    console.log("Simpan SOAP:", formData);

    const getTargetType = () => {
      const lower = tipeTerapi.toLowerCase();
      if (lower.includes("okupasi")) return "okupasi";
      if (lower.includes("wicara")) return "wicara";
      if (lower.includes("fisio")) return "fisio";
      return "paedagog";
    };

    showSuccessToast("SOAP berhasil disimpan! ✅");
    router.push(`/terapis/terapi?type=${getTargetType()}&status=completed`);
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
          onClick={() => history.back()}
          className="cursor-pointer inline-flex items-center gap-2 bg-[#1E5C58] hover:bg-[#2E8B83] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>

      {/* ── Informasi Pasien ── */}
      <div className="p-6 space-y-4 bg-white border shadow-sm rounded-2xl border-teal-50">
        <h2 className="text-lg font-extrabold text-[#1E5C58]">
          Informasi Pasien Anak
        </h2>
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
          <InputCard label="Tanggal & jam *">
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
          <InputCard label={<SoapLabel initial="S" text="Subjektif" />}>
            <TextArea
              name="subjektif"
              value={formData.subjektif}
              onChange={handleChange}
              placeholder="Sebutkan keluhan subjektif pasien..."
            />
          </InputCard>
          <InputCard label={<SoapLabel initial="O" text="Objektif" />}>
            <TextArea
              name="objektif"
              value={formData.objektif}
              onChange={handleChange}
              placeholder="Sebutkan hasil observasi objektif..."
            />
          </InputCard>
          <InputCard label={<SoapLabel initial="A" text="Assessment" />}>
            <TextArea
              name="assessment"
              value={formData.assessment}
              onChange={handleChange}
              placeholder="Tuliskan assessment..."
            />
          </InputCard>
          <InputCard label={<SoapLabel initial="P" text="Plan" />}>
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
              placeholder="Tuliskan implementasi..."
            />
          </InputCard>
          <InputCard
            label={<SoapLabel initial="A" text="Assessment lanjutan" />}
          >
            <TextArea
              name="assessmentLanjutan"
              value={formData.assessmentLanjutan}
              onChange={handleChange}
              placeholder="Tuliskan assessment lanjutan..."
            />
          </InputCard>
        </div>

        <InputCard label={<SoapLabel initial="P" text="Plan lanjutan" />}>
          <TextArea
            name="planLanjutan"
            value={formData.planLanjutan}
            onChange={handleChange}
            placeholder="Tuliskan plan lanjutan..."
          />
        </InputCard>
      </div>

      {/* ── Footer Sticky ── */}
      <div className="sticky bottom-0 -mx-6 md:-mx-8 -mb-6 md:-mb-8 mt-6 bg-[#F8FBFB]/90 backdrop-blur-md border-t border-teal-100/50 p-4 md:px-8 z-50">
        <div className="max-w-[1920px] mx-auto flex justify-end gap-3">
          <button
            onClick={() => history.back()}
            className="cursor-pointer px-6 py-2.5 rounded-full text-sm font-bold border border-teal-100 text-[#1E5C58] hover:bg-teal-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSimpan}
            className="cursor-pointer px-6 py-2.5 rounded-full text-sm font-bold bg-[#1E5C58] text-white hover:bg-[#2B7A75] shadow-md shadow-teal-800/20 transition-all active:scale-95"
          >
            Simpan SOAP
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
