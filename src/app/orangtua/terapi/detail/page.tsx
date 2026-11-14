/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ResponsiveOrangtuaLayout from "@/components/layout/ResponsiveOrangtuaLayout";
import { getScheduleDetail } from "@/lib/api/jadwal_terapi";
import { getChildDetail } from "@/lib/api/childrenAsesment";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Terjadwal: { label: "Terjadwal", color: "text-[#2B7A75]", bg: "bg-[#EAF4F2]" },
  Reschedule: { label: "Reschedule", color: "text-amber-700", bg: "bg-amber-100" },
  Selesai: { label: "Selesai", color: "text-blue-700", bg: "bg-blue-100" },
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-gray-800">{value}</p>
    </div>
  );
}

function SectionCard({ tag, children }: { tag: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-5 py-2.5 border-b border-gray-100">
        <span className="inline-block px-2.5 py-0.5 bg-[#EAF4F2] text-[#1E5C58] text-[9.5px] font-extrabold uppercase tracking-widest rounded-full">
          {tag}
        </span>
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  );
}

function formatNoRekam(raw: string | number | undefined | null): string {
  if (!raw || raw === "-") return "-";
  const str = String(raw).trim();
  const digits = str.replace(/\D/g, "");
  if (digits) {
    const num = digits.length > 6 ? digits.slice(-6) : digits.padStart(6, "0");
    return `RM-${num}`;
  }
  return str.startsWith("RM-") ? str : `RM-${str}`;
}

function DetailContent() {
  const router = useRouter();
  const params = useSearchParams();

  const id = params.get("id");
  const initialNamaAnak = params.get("namaAnak") ?? "-";
  const rawNoRekam = params.get("noRekam") ?? "-";
  const initialNoRekam = formatNoRekam(rawNoRekam);
  const initialJenisTerapi = params.get("jenisTerapi") ?? "-";
  const initialTerapis = params.get("terapis") ?? "-";
  const initialTanggal = params.get("tanggal") ?? "-";
  const initialJamMulai = params.get("jamMulai") ?? "-";
  const initialJamSelesai = params.get("jamSelesai") ?? "-";
  const initialStatus = params.get("status") ?? "Terjadwal";
  const initialNamaOrangtua = params.get("namaOrangtua") ?? "-";
  const initialNomorTelepon = params.get("nomorTelepon") ?? "-";
  const initialJenisKelamin = params.get("jenisKelamin") ?? "-";
  const initialUsia = params.get("usia") ?? "-";
  const initialTempatTanggalLahir = params.get("tempatTanggalLahir") ?? "-";
  const initialAsalSekolah = params.get("asalSekolah") ?? "-";
  const initialAlamat = params.get("alamat") ?? "-";

  const [detailData, setDetailData] = useState({
    namaAnak: initialNamaAnak,
    noRekam: initialNoRekam,
    jenisTerapi: initialJenisTerapi,
    terapis: initialTerapis,
    tanggal: initialTanggal,
    jamMulai: initialJamMulai,
    jamSelesai: initialJamSelesai,
    status: initialStatus,
    namaOrangtua: initialNamaOrangtua,
    nomorTelepon: initialNomorTelepon,
    jenisKelamin: initialJenisKelamin,
    usia: initialUsia,
    tempatTanggalLahir: initialTempatTanggalLahir,
    asalSekolah: initialAsalSekolah,
    alamat: initialAlamat,
  });

  const [fetching, setFetching] = useState<boolean>(false);

  // Jika params kosong atau hanya bawa ID jadwal, fetch detail dari server
  useEffect(() => {
    if (id && (!initialNamaAnak || initialNamaAnak === "-")) {
      const loadSchedule = async () => {
        setFetching(true);
        try {
          const res = await getScheduleDetail(id);
          if (res) {
            let childInfo: any = null;
            if (res.child_id) {
              const childRes = await getChildDetail(res.child_id);
              childInfo = childRes.data;
            }

            setDetailData({
              namaAnak: res.child_name || childInfo?.name || "-",
              noRekam: formatNoRekam(res.medical_record_number || childInfo?.medical_record_number),
              jenisTerapi: res.therapy_type ? res.therapy_type.toUpperCase() : "-",
              terapis: res.therapist_name || "-",
              tanggal: res.period_start || "-",
              jamMulai: res.start_time || "-",
              jamSelesai: res.end_time || "-",
              status: res.status === "aktif" ? "Terjadwal" : res.status === "selesai" ? "Selesai" : "Reschedule",
              namaOrangtua: res.guardian_name || "-",
              nomorTelepon: res.guardian_phone || "-",
              jenisKelamin: childInfo?.gender || "-",
              usia: childInfo?.age ? `${childInfo.age} Tahun` : "-",
              tempatTanggalLahir: childInfo?.birth_date ? `${childInfo.birth_place || ""}, ${childInfo.birth_date}` : "-",
              asalSekolah: childInfo?.school || "-",
              alamat: childInfo?.address || "-",
            });
          }
        } catch (err) {
          console.error("Gagal load schedule detail:", err);
        } finally {
          setFetching(false);
        }
      };
      loadSchedule();
    }
  }, [id, initialNamaAnak]);

  const sc = STATUS_CONFIG[detailData.status] ?? STATUS_CONFIG["Terjadwal"];

  return (
    <ResponsiveOrangtuaLayout maxWidth="max-w-full">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-5 flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-xl font-extrabold text-[#1E5C58] tracking-tight">
            Detail Jadwal Terapi
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {detailData.namaAnak} &bull; {detailData.noRekam} &bull; {detailData.tanggal} &bull; {detailData.jamMulai} – {detailData.jamSelesai}
          </p>
        </div>

        <button
          onClick={() => router.push("/orangtua/terapi")}
          className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E5C58] hover:bg-[#163F3C] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft size={14} />
          Kembali ke Daftar
        </button>
      </motion.div>

                {fetching ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2B7A75]" />
                    <p className="text-xs font-semibold">Memuat rincian sesi terapi...</p>
                  </div>
                ) : (
                  /* Cards */
                  <div className="space-y-4">
                    {/* Informasi Anak */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.05 }}
                    >
                      <SectionCard tag="Informasi Anak">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                          <InfoField label="Nama Lengkap" value={detailData.namaAnak} />
                          <InfoField label="Nomor Rekam Medis" value={detailData.noRekam} />
                          <InfoField label="Jenis Kelamin" value={detailData.jenisKelamin} />
                          <InfoField label="Usia" value={detailData.usia} />
                          <InfoField label="Tempat & Tanggal Lahir" value={detailData.tempatTanggalLahir} />
                          <InfoField label="Asal Sekolah" value={detailData.asalSekolah} />
                          <InfoField label="Alamat" value={detailData.alamat} />
                        </div>
            </SectionCard>
            </motion.div>

              {/* Orang Tua / Wali & Terapis */ }
              < motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
              <SectionCard tag="Orang Tua / Wali & Terapis">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                  <InfoField label="Nama Orang Tua" value={detailData.namaOrangtua} />
                  <InfoField label="Nomor Telepon" value={detailData.nomorTelepon} />
                  <InfoField label="Terapis" value={detailData.terapis} />
                </div>
              </SectionCard>
            </motion.div>

              {/* Rincian Jadwal Terapi */ }
              < motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
              <SectionCard tag="Rincian Jadwal Terapi">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                  <InfoField label="Jenis Terapi" value={detailData.jenisTerapi} />
                  <InfoField
                    label="Tanggal & Jam Terapi"
                    value={`${detailData.tanggal} pukul ${detailData.jamMulai} – ${detailData.jamSelesai}`}
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
          {detailData.status === "Reschedule" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
            >
              <SectionCard tag="Perubahan Jadwal">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                  <InfoField
                    label="Jadwal Sebelumnya"
                    value="Informasi sesi lampau"
                  />
                  <InfoField
                    label="Jadwal Baru"
                    value={`${detailData.tanggal} pukul ${detailData.jamMulai} - ${detailData.jamSelesai}`}
                  />
                  <InfoField
                    label="Status"
                    value="Reschedule telah disetujui"
                  />
                </div>
              </SectionCard>
            </motion.div>
          )}
      </div>
      )}
    </ResponsiveOrangtuaLayout>
  );
}

export default function TerapiDetailPage() {
  return (
      <Suspense
        fallback={
          <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-[#2B7A75] rounded-full animate-spin" />
            <p className="text-gray-400 font-medium text-sm animate-pulse">Memuat detail terapi...</p>
          </div>
        }
      >
        <DetailContent />
      </Suspense>
      );
}
