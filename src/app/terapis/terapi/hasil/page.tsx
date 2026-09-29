/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
  const params = useSearchParams();

  // Data dikirim via query params
  const namaPasien = params.get("namaPasien") ?? "—";
  const namaOrangTua = params.get("namaOrangTua") ?? "—";
  const tipeTerapi = params.get("tipeTerapi") ?? "—";
  const terapis = params.get("terapis") ?? "—";
  const tanggalTerapi = params.get("tanggalTerapi") ?? "—";
  const waktu = params.get("waktu") ?? "—";

  // Data statis/dummy untuk field yang tidak ada di params
  const usia = "7 Tahun 4 Bulan";
  const alamat = "Surakarta";
  const nomorRM = "RM-000118";
  const jenisKelamin = "Perempuan";
  const tempatTglLahir = "Surakarta, 03 Mei 2019";
  const sekolah = "TK Tunas Bangsa";
  const hubunganOrangTua = "Ayah";

  const diagnosis = "Sensory Integration Disorder";
  const jumlahSesi = "3 sesi";
  const tindakanTerakhir = "Stimulasi sensori proprioseptif dan vestibular";

  const soapData = {
    s: "Orang tua melihat anak lebih tenang saat di rumah.",
    o: "Duduk 15 menit mandiri, kontak mata meningkat.",
    a: "Ada kemajuan pada fokus dan regulasi diri.",
    p: "Lanjutkan program, kenalkan tugas berurutan.",
    i: "Circuit sensori 3 pos.",
    a2: "Toleransi sensori membaik.",
    p2: "Evaluasi ulang dalam 4 sesi.",
  };

  return (
    <div className="p-6 md:p-8 space-y-6 text-[#1E5C58] bg-[#F8FBFB] min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1E5C58]">
            Hasil Terapi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Dokumen rekam hasil dan kesimpulan terapi pasien
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-bold border border-teal-100 text-[#1E5C58] hover:bg-teal-50 transition-colors">
            Unduh hasil
          </button>
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
        <Badge title="IDENTITAS ANAK & ORANG TUA" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8 mt-6">
          {/* Kolom 1 */}
          <div className="space-y-6">
            <InfoItem label="NAMA LENGKAP" value={namaPasien} />
            <InfoItem label="USIA" value={usia} />
            <InfoItem label="ALAMAT TEMPAT TINGGAL" value={alamat} />
            <InfoItem label="JENIS TERAPI" value={tipeTerapi} />
          </div>
          {/* Kolom 2 */}
          <div className="space-y-6">
            <InfoItem label="NOMOR REKAM MEDIS" value={nomorRM} />
            <InfoItem label="JENIS KELAMIN" value={jenisKelamin} />
            <InfoItem label="NAMA ORANG TUA" value={namaOrangTua} />
            <InfoItem label="TANGGAL & JAM TERAPI" value={`${tanggalTerapi}, ${waktu}`} />
          </div>
          {/* Kolom 3 */}
          <div className="space-y-6">
            <InfoItem label="TEMPAT & TANGGAL LAHIR" value={tempatTglLahir} />
            <InfoItem label="SEKOLAH" value={sekolah} />
            <InfoItem label="HUBUNGAN ORANG TUA" value={hubunganOrangTua} />
            <InfoItem label="NAMA TERAPIS" value={terapis} />
          </div>
        </div>
      </div>

      {/* ── Ringkasan Hasil Terapi ── */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-teal-50 relative overflow-hidden">
        <Badge title="RINGKASAN HASIL TERAPI" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mt-6">
          <InfoItem label="DIAGNOSIS TERAPI" value={diagnosis} />
          <InfoItem label="JUMLAH SESI TERCATAT" value={jumlahSesi} />
          <div className="md:col-span-2">
            <InfoItem label="TINDAKAN TERAPI TERAKHIR" value={tindakanTerakhir} />
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

function SoapCard({ initial, label, content }: { initial: string; label: string; content: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-teal-50">
      <div className="inline-flex items-center gap-1.5 bg-[#EAF4F2] text-[#1E5C58] px-3 py-1 rounded-full mb-4">
        <span className="font-extrabold text-sm">{initial}</span>
        <span className="text-[10px] font-bold tracking-wider">{label}</span>
      </div>
      <p className="text-[13px] font-medium text-gray-700 leading-relaxed px-1">
        {content}
      </p>
    </div>
  );
}
