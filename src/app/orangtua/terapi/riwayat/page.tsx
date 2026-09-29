"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  ArrowLeft,
  CalendarDays,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ResponsiveOrangtuaLayout from "@/components/layout/ResponsiveOrangtuaLayout";

// ======================
// Types
// ======================
interface SoapNote {
  subjektif: string;
  objektif: string;
  assessment: string;
  plan: string;
  implementasi: string;
  assessmentLanjutan: string;
  planLanjutan: string;
}

interface RiwayatSesi {
  id: number;
  namaAnak: string;
  jenisTerapi: string;
  jenisTerapiBadgeColor: string;
  tanggal: string;        // display format: "18/09/2026"
  tanggalRaw: string;     // for sorting: "2026-09-18"
  jamMulai: string;
  durasi: string;
  terapis: string;
  diagnosisTerapi: string;
  judulSesi: string;
  deskripsiSingkat: string;
  soap: SoapNote;
}

// ======================
// Dummy Data
// ======================
const ANAK_LIST = ["Semua", "Rayhan", "Putra Pratama"];

const DUMMY_RIWAYAT: RiwayatSesi[] = [
  {
    id: 1,
    namaAnak: "Rayhan",
    jenisTerapi: "PLB (Paedagog)",
    jenisTerapiBadgeColor: "bg-[#EAF4F2] text-[#1E5C58]",
    tanggal: "18/09/2026",
    tanggalRaw: "2026-09-18",
    jamMulai: "08.55",
    durasi: "60 menit",
    terapis: "Alief Arifun",
    diagnosisTerapi: "Keterlambatan bicara dan fokus",
    judulSesi: "Keterlambatan bicara dan fokus",
    deskripsiSingkat: "Rayhan • Terapi bermain terstruktur dan latihan atensi",
    soap: {
      subjektif:
        "Ibu menyampaikan anak sulit mengikuti instruksi dua langkah.",
      objektif:
        "Mengikuti instruksi satu langkah dengan pengingat.",
      assessment:
        "Atensi masih pendek, sekitar 5 menit.",
      plan:
        "Latihan atensi bertahap dengan permainan puzzle.",
      implementasi:
        "Puzzle 4 keping dan permainan menyusun balok.",
      assessmentLanjutan:
        "Anak antusias dengan permainan visual.",
      planLanjutan:
        "Naikkan tingkat kesulitan puzzle.",
    },
  },
  {
    id: 2,
    namaAnak: "Rayhan",
    jenisTerapi: "PLB (Paedagog)",
    jenisTerapiBadgeColor: "bg-[#EAF4F2] text-[#1E5C58]",
    tanggal: "11/09/2026",
    tanggalRaw: "2026-09-11",
    jamMulai: "08.55",
    durasi: "60 menit",
    terapis: "Alief Arifun",
    diagnosisTerapi: "Keterlambatan bicara dan fokus",
    judulSesi: "Keterlambatan bicara dan fokus",
    deskripsiSingkat: "Rayhan • Latihan atensi dan instruksi satu langkah",
    soap: {
      subjektif:
        "Orang tua melaporkan anak sudah mulai mau mendengarkan lebih lama.",
      objektif:
        "Mampu mengikuti instruksi satu langkah tanpa pengingat 3x dari 5x percobaan.",
      assessment:
        "Ada peningkatan kecil pada atensi dibanding sesi sebelumnya.",
      plan:
        "Mulai latihan instruksi dua langkah sederhana.",
      implementasi:
        "Permainan sortir warna dan menyusun urutan.",
      assessmentLanjutan:
        "Anak sudah bisa duduk tenang ±8 menit.",
      planLanjutan:
        "Tambahkan variasi permainan dengan instruksi dua langkah.",
    },
  },
  {
    id: 3,
    namaAnak: "Rayhan",
    jenisTerapi: "Okupasi Terapi",
    jenisTerapiBadgeColor: "bg-amber-50 text-amber-700",
    tanggal: "04/09/2026",
    tanggalRaw: "2026-09-04",
    jamMulai: "08.50",
    durasi: "45 menit",
    terapis: "Nindya Zahri",
    diagnosisTerapi: "Keterlambatan motorik halus",
    judulSesi: "Keterlambatan bicara dan fokus",
    deskripsiSingkat: "Rayhan • Asesmen dan permainan terstruktur",
    soap: {
      subjektif:
        "Ibu menyampaikan anak kesulitan memegang pensil.",
      objektif:
        "Genggaman tripod belum terbentuk, masih menggunakan genggaman silinder.",
      assessment:
        "Tonus otot tangan perlu distimulasi lebih lanjut.",
      plan:
        "Latihan playdoh dan aktivitas finger painting.",
      implementasi:
        "Sesi 30 menit playdoh dan 15 menit mewarnai.",
      assessmentLanjutan:
        "Anak menikmati aktivitas playdoh dengan antusias.",
      planLanjutan:
        "Tingkatkan resistansi playdoh secara bertahap.",
    },
  },
  {
    id: 4,
    namaAnak: "Putra Pratama",
    jenisTerapi: "Terapi Wicara",
    jenisTerapiBadgeColor: "bg-blue-50 text-blue-700",
    tanggal: "10/09/2026",
    tanggalRaw: "2026-09-10",
    jamMulai: "10.00",
    durasi: "45 menit",
    terapis: "Rina Wulandari",
    diagnosisTerapi: "Keterlambatan bicara",
    judulSesi: "Latihan produksi konsonan",
    deskripsiSingkat: "Putra Pratama • Latihan pengucapan konsonan B dan P",
    soap: {
      subjektif:
        "Orang tua melaporkan anak jarang mau berbicara di rumah.",
      objektif:
        "Mampu mengucapkan 'ba' dan 'pa' dengan stimulasi visual cermin.",
      assessment:
        "Kemampuan imitasi oromotor mulai muncul.",
      plan:
        "Latihan babbling dengan variasi vokal a, i, u.",
      implementasi:
        "Permainan tiup busa dan latihan cermin 20 menit.",
      assessmentLanjutan:
        "Kontak mata mulai konsisten selama sesi.",
      planLanjutan:
        "Gabungkan latihan wicara dengan aktivitas bermain favorit.",
    },
  },
];

// ======================
// Soap Grid Component
// ======================
function SoapGrid({ soap }: { soap: SoapNote }) {
  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        { key: "S (Subjektif)", val: soap.subjektif },
        { key: "O (Objektif)", val: soap.objektif },
        { key: "A (Assessment)", val: soap.assessment },
        { key: "P (Plan)", val: soap.plan },
        { key: "I (Implementasi)", val: soap.implementasi },
        { key: "A (Assessment Lanjutan)", val: soap.assessmentLanjutan },
        { key: "P (Plan Lanjutan)", val: soap.planLanjutan },
      ].map(({ key, val }) => (
        <div
          key={key}
          className="bg-[#F4F9F8]/80 border border-teal-100/60 rounded-xl px-4 py-3"
        >
          <p className="text-[9px] font-extrabold text-[#2B7A75] uppercase tracking-widest mb-1">
            {key}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{val}</p>
        </div>
      ))}
    </div>
  );
}

// ======================
// Session Card
// ======================
function SesiCard({ sesi, defaultOpen = false }: { sesi: RiwayatSesi; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
        open
          ? "border-[#2B7A75]/40 shadow-md shadow-teal-500/5"
          : "border-gray-200 hover:border-teal-200"
      } bg-white`}
    >
      {/* Card header */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full text-left px-5 py-4 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Bullet */}
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 ${
                  open ? "border-[#2B7A75] bg-[#2B7A75]" : "border-gray-300 bg-white"
                } shrink-0`}
              />
              <span
                className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${sesi.jenisTerapiBadgeColor}`}
              >
                {sesi.jenisTerapi}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                <CalendarDays size={12} className="text-gray-400" />
                {sesi.tanggal} · {sesi.jamMulai}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                <Clock size={12} className="text-gray-400" />
                {sesi.durasi}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-gray-800 leading-tight">
              {sesi.judulSesi}
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{sesi.deskripsiSingkat}</p>
          </div>

          {/* Toggle icon */}
          <div
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full border transition-all ${
              open
                ? "border-[#2B7A75] bg-[#2B7A75] text-white"
                : "border-gray-200 bg-gray-50 text-gray-400 hover:border-teal-300"
            }`}
          >
            {open ? <Minus size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4 mt-5">
                {/* Left column: basic info */}
                <div className="sm:col-span-1 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nama Anak</p>
                    <p className="text-sm font-bold text-gray-800">{sesi.namaAnak}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Jenis Terapi</p>
                    <p className="text-sm font-bold text-gray-800">{sesi.jenisTerapi}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Terapis</p>
                    <p className="text-sm font-bold text-gray-800">{sesi.terapis}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tanggal & Jam</p>
                    <p className="text-sm font-bold text-gray-800">{sesi.tanggal} pukul {sesi.jamMulai}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Durasi Sesi</p>
                    <p className="text-sm font-bold text-gray-800">{sesi.durasi}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Diagnosis Terapi</p>
                    <p className="text-sm font-bold text-gray-800">{sesi.diagnosisTerapi}</p>
                  </div>
                </div>

                {/* Right column: SOAP notes */}
                <div className="sm:col-span-2">
                  <SoapGrid soap={sesi.soap} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ======================
// Main Riwayat Page
// ======================
export default function RiwayatTerapiPage() {
  const router = useRouter();
  const [selectedAnak, setSelectedAnak] = useState("Semua");
  const [dariTanggal, setDariTanggal] = useState("");
  const [sampaiTanggal, setSampaiTanggal] = useState("");

  const filtered = DUMMY_RIWAYAT.filter((r) => {
    const matchAnak = selectedAnak === "Semua" || r.namaAnak === selectedAnak;
    let matchDari = true;
    let matchSampai = true;
    if (dariTanggal) matchDari = r.tanggalRaw >= dariTanggal;
    if (sampaiTanggal) matchSampai = r.tanggalRaw <= sampaiTanggal;
    return matchAnak && matchDari && matchSampai;
  }).sort((a, b) => b.tanggalRaw.localeCompare(a.tanggalRaw));

  return (
    <ResponsiveOrangtuaLayout maxWidth="max-w-5xl">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E5C58] tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-[#2B7A75]" />
            Riwayat Terapi Anak
          </h1>
          <p className="text-sm text-[#2B7A75]/70 mt-1 font-medium">
            Lihat riwayat seluruh sesi terapi atau pilih sebagian saja
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E5C58] hover:bg-[#163F3C] text-white text-sm font-bold rounded-xl shadow-md shadow-teal-900/20 transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar
        </button>
      </div>

      {/* Filter Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)]">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-extrabold uppercase tracking-widest rounded-full">
            Filter Riwayat
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5 flex-wrap">
          {/* Anak selector */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Anak</p>
            <div className="flex items-center gap-2 flex-wrap">
              {ANAK_LIST.map((a) => (
                <button
                  key={a}
                  onClick={() => setSelectedAnak(a)}
                  className={`cursor-pointer px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                    selectedAnak === a
                      ? "bg-[#1E5C58] text-white border-[#1E5C58] shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-[#2B7A75]"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dari Tanggal</p>
              <input
                type="date"
                value={dariTanggal}
                onChange={(e) => setDariTanggal(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#81B7A9] transition-colors hover:border-teal-200 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sampai Tanggal</p>
              <input
                type="date"
                value={sampaiTanggal}
                onChange={(e) => setSampaiTanggal(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#81B7A9] transition-colors hover:border-teal-200 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Count info */}
      <p className="text-sm text-gray-500 font-medium mb-4">
        <span className="font-bold text-[#1E5C58]">{filtered.length} sesi</span>{" "}
        ditampilkan, urut dari yang terbaru
      </p>

      {/* Session list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl gap-3">
            <History className="w-10 h-10 text-gray-200" />
            <p className="text-sm font-medium">Tidak ada riwayat yang cocok dengan filter</p>
          </div>
        ) : (
          filtered.map((sesi, idx) => (
            <motion.div
              key={sesi.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <SesiCard sesi={sesi} defaultOpen={idx === 0} />
            </motion.div>
          ))
        )}
      </div>
    </ResponsiveOrangtuaLayout>
  );
}
