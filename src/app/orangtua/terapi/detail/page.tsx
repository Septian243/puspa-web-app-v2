"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  User,
  Phone,
  MapPin,
  School,
  Clock,
  CalendarDays,
  Baby,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import ResponsiveOrangtuaLayout from "@/components/layout/ResponsiveOrangtuaLayout";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Terjadwal: { label: "Terjadwal", color: "text-[#2B7A75]", bg: "bg-[#EAF4F2]" },
  Reschedule: { label: "Reschedule", color: "text-amber-700", bg: "bg-amber-100" },
  Selesai: { label: "Selesai", color: "text-blue-700", bg: "bg-blue-100" },
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  );
}

function SectionCard({ tag, children }: { tag: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-6 py-3 border-b border-gray-100">
        <span className="inline-block px-3 py-1 bg-[#EAF4F2] text-[#1E5C58] text-[10px] font-extrabold uppercase tracking-widest rounded-full">
          {tag}
        </span>
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  );
}

function SoapCard({ tag, content }: { tag: string; content: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50">
        <span className="inline-block px-3 py-1 bg-[#EAF4F2] text-[#1E5C58] text-[10px] font-extrabold uppercase tracking-widest rounded-full">
          {tag}
        </span>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-gray-700">{content}</p>
      </div>
    </div>
  );
}

function DetailContent() {
  const router = useRouter();
  const params = useSearchParams();

  const namaAnak = params.get("namaAnak") ?? "-";
  const noRekam = params.get("noRekam") ?? "-";
  const jenisTerapi = params.get("jenisTerapi") ?? "-";
  const terapis = params.get("terapis") ?? "-";
  const tanggal = params.get("tanggal") ?? "-";
  const jamMulai = params.get("jamMulai") ?? "-";
  const jamSelesai = params.get("jamSelesai") ?? "-";
  const status = params.get("status") ?? "Terjadwal";
  const namaOrangtua = params.get("namaOrangtua") ?? "-";
  const nomorTelepon = params.get("nomorTelepon") ?? "-";
  const jenisKelamin = params.get("jenisKelamin") ?? "-";
  const usia = params.get("usia") ?? "-";
  const tempatTanggalLahir = params.get("tempatTanggalLahir") ?? "-";
  const asalSekolah = params.get("asalSekolah") ?? "-";
  const alamat = params.get("alamat") ?? "-";

  const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG["Terjadwal"];

  return (
    <ResponsiveOrangtuaLayout maxWidth="max-w-full">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight">
            Detail Jadwal Terapi
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">
            {namaAnak} &bull; {noRekam} &bull; {tanggal} &bull; {jamMulai} – {jamSelesai}
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E5C58] hover:bg-[#163F3C] text-white text-sm font-bold rounded-xl shadow-md shadow-teal-900/20 transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar
        </button>
      </motion.div>

      {/* Cards */}
      <div className="space-y-4">
        {/* Informasi Anak */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <SectionCard tag="Informasi Anak">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <InfoField label="Nama Lengkap" value={namaAnak} />
              <InfoField label="Nomor Rekam Medis" value={noRekam} />
              <InfoField label="Jenis Kelamin" value={jenisKelamin} />
              <InfoField label="Usia" value={usia} />
              <InfoField label="Tempat & Tanggal Lahir" value={tempatTanggalLahir} />
              <InfoField label="Asal Sekolah" value={asalSekolah} />
              <InfoField label="Alamat" value={alamat} />
            </div>
          </SectionCard>
        </motion.div>

        {/* Orang Tua / Wali & Terapis */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <SectionCard tag="Orang Tua / Wali & Terapis">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <InfoField label="Nama Orang Tua" value={namaOrangtua} />
              <InfoField label="Nomor Telepon" value={nomorTelepon} />
              <InfoField label="Terapis" value={terapis} />
            </div>
          </SectionCard>
        </motion.div>

        {/* Rincian Jadwal Terapi */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <SectionCard tag="Rincian Jadwal Terapi">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <InfoField label="Jenis Terapi" value={jenisTerapi} />
              <InfoField
                label="Tanggal & Jam Terapi"
                value={`${tanggal} pukul ${jamMulai} – ${jamSelesai}`}
              />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${sc.bg} ${sc.color}`}>
                  {sc.label}
                </span>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* Perubahan Jadwal (Only for Reschedule) */}
        {status === "Reschedule" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <SectionCard tag="Perubahan Jadwal">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <InfoField
                  label="Jadwal Sebelumnya"
                  value="25/09/2026 pukul 15.07 - 16.00"
                />
                <InfoField
                  label="Jadwal Baru"
                  value={`${tanggal} pukul ${jamMulai} - ${jamSelesai}`}
                />
                <InfoField
                  label="Alasan"
                  value="Demam tinggi, sudah izin dari orang tua"
                />
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Selesai: Ringkasan Hasil & SOAP */}
        {status === "Selesai" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="space-y-6 pt-2"
          >
            <SectionCard tag="Ringkasan Hasil Terapi">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <InfoField
                  label="Diagnosis Terapi"
                  value="Keterlambatan bicara dan fokus"
                />
                <InfoField
                  label="Tindakan Terapi Terakhir"
                  value="Terapi bermain terstruktur dan latihan atensi"
                />
                <InfoField
                  label="Jumlah Sesi Tercatat"
                  value="3 sesi"
                />
              </div>
            </SectionCard>

            <div>
              <h3 className="text-lg font-bold text-[#1E5C58] mb-4 mt-2 px-1 tracking-tight">SOAP</h3>
              <div className="space-y-3">
                <SoapCard tag="S (SUBJEKTIF)" content="Ibu menyampaikan anak sulit mengikuti instruksi dua langkah." />
                <SoapCard tag="O (OBJEKTIF)" content="Mengikuti instruksi satu langkah dengan pengingat." />
                <SoapCard tag="A (ASSESSMENT)" content="Atensi masih pendek, sekitar 5 menit." />
                <SoapCard tag="P (PLAN)" content="Latihan atensi bertahap dengan permainan puzzle." />
                <SoapCard tag="I (IMPLEMENTASI)" content="Puzzle 4 keping dan permainan menyusun balok." />
                <SoapCard tag="A (ASSESSMENT LANJUTAN)" content="Anak antusias dengan permainan visual." />
                <SoapCard tag="P (PLAN LANJUTAN)" content="Naikkan tingkat kesulitan puzzle." />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </ResponsiveOrangtuaLayout>
  );
}

export default function TerapiDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <div className="w-10 h-10 border-4 border-teal-100 border-t-[#2B7A75] rounded-full animate-spin" />
        <p className="text-gray-400 font-medium text-sm animate-pulse">Memuat detail terapi...</p>
      </div>
    }>
      <DetailContent />
    </Suspense>
  );
}
