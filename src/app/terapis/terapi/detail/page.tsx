"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
  tanggal_lama?: string | null;
  waktu_lama?: string | null;
  kategori_alasan?: "Sakit" | "Izin" | "Tidak Hadir" | null;
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

// ── Konten ───────────────────────────────────────────────────────────────────
function DetailJadwalContent() {
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

  // Data pasien dari jadwal by ID (atau fallback ke params jika ada)
  const namaPasien = jadwal?.namaPasien ?? params.get("namaPasien") ?? "—";
  const namaOrangTua = jadwal?.namaOrangTua ?? params.get("namaOrangTua") ?? "—";
  const telepon = jadwal?.telepon ?? params.get("telepon") ?? "—";
  const tipeTerapi = jadwal?.tipeTerapi ?? params.get("tipeTerapi") ?? "—";
  const terapis = jadwal?.terapis ?? params.get("terapis") ?? "—";
  const tanggalTerapi = (jadwal?.tanggal ? formatTanggal(jadwal.tanggal) : null) ?? params.get("tanggalTerapi") ?? "—";
  const waktu = jadwal?.waktu ?? params.get("waktu") ?? "—";
  const jenisKelamin = jadwal?.jenisKelamin ?? params.get("jenisKelamin") ?? "—";
  const usia = jadwal?.usia ?? params.get("usia") ?? "—";
  const tempatTglLahir = jadwal?.tempatTglLahir ?? params.get("tempatTglLahir") ?? "—";
  const asalSekolah = jadwal?.asalSekolah ?? params.get("asalSekolah") ?? "—";
  const alamat = jadwal?.alamat ?? params.get("alamat") ?? "—";
  const nomorRM = jadwal?.nomorRM ?? params.get("nomorRM") ?? "—";
  const hubunganWali = jadwal?.hubunganWali ?? params.get("hubunganWali") ?? "—";

  // Field Reschedule
  const tanggalLama = (jadwal?.tanggal_lama ? formatTanggal(jadwal.tanggal_lama) : null) ?? params.get("tanggal_lama");
  const waktuLama = jadwal?.waktu_lama ?? params.get("waktu_lama");
  const kategoriAlasan = jadwal?.kategori_alasan ?? params.get("kategori_alasan");
  const alasan = jadwal?.alasan ?? params.get("alasan");

  const isRescheduled = tanggalLama || waktuLama || kategoriAlasan || alasan;

  return (
    <div className="p-6 md:p-8 space-y-6 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1E5C58]">
            Detail Jadwal Terapi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Informasi lengkap jadwal sesi terapi pasien.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => history.back()}
            className="cursor-pointer inline-flex items-center gap-2 bg-[#1E5C58] hover:bg-[#2E8B83] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>

      {/* ── Identitas Anak & Orang Tua ── */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-teal-50 relative overflow-hidden">
        <Badge title="IDENTITAS ANAK" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8 mt-6">
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

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-teal-50 relative overflow-hidden">
        <Badge title="IDENTITAS ORANG TUA / WALI" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8 mt-6">
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
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-teal-50 relative overflow-hidden">
        <Badge title="DETAIL LAYANAN TERAPI" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8 mt-6">
          <InfoItem label="JENIS TERAPI" value={tipeTerapi} />
          <InfoItem label="TANGGAL & JAM TERAPI" value={`${tanggalTerapi}, ${waktu}`} />
          <InfoItem label="NAMA TERAPIS" value={terapis} />
        </div>
      </div>

      {/* ── Informasi Reschedule ── */}
      {isRescheduled && (
        <div className="bg-amber-50/50 rounded-2xl p-6 md:p-8 shadow-sm border border-amber-100 relative overflow-hidden">
          <Badge title="INFORMASI RESCHEDULE" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mt-6">
            <div className="space-y-6">
              <InfoItem label="JADWAL SEMULA" value={`${tanggalLama || tanggalTerapi}, ${waktuLama || waktu}`} />
              <InfoItem label="KATEGORI ALASAN" value={kategoriAlasan || "—"} />
            </div>
            <div className="space-y-6">
              <InfoItem label="JADWAL BARU" value={`${tanggalTerapi}, ${waktu}`} />
              <InfoItem label="DETAIL ALASAN" value={alasan || "—"} />
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
