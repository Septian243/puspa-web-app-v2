import {
  LaporanAsesmenSekolah,
  getDaftarLaporanAsesmenSekolah,
} from "./laporanAsesmenSekolah";
import { getProfileSekolah } from "./ProfileSekolah";

export interface SekolahDashboardData {
  namaSekolah: string;
  role: string;
  totalAnak: number;
  totalAnakTrend?: string;
  asesmenTersedia: number;
  asesmenTersediaTrend?: string;
  belumDiunduh: number;
  belumDiunduhTrend?: string;
  sudahDiunduh: number;
  belumDikirimAdmin: number;
  tanggalData: string;
  asesmenTerbaru: LaporanAsesmenSekolah[];
  daftarSemuaLaporan: LaporanAsesmenSekolah[];
  statusChart: {
    name: string;
    value: number;
    color: string;
  }[];
}

const DASHBOARD_STORAGE_KEY = "puspa_sekolah_portal_dummy";

export function getDashboardSekolahData(): SekolahDashboardData {
  const profile = getProfileSekolah();
  const laporan = getDaftarLaporanAsesmenSekolah();

  const totalAnak = laporan.length;
  const asesmenTersedia = laporan.filter(
    (a) => a.statusAsesmen === "tersedia"
  ).length;
  const sudahDiunduh = laporan.filter(
    (a) => a.statusAsesmen === "tersedia" && a.statusUnduh
  ).length;
  const belumDiunduh = laporan.filter(
    (a) => a.statusAsesmen === "tersedia" && !a.statusUnduh
  ).length;
  const belumDikirimAdmin = laporan.filter(
    (a) => a.statusAsesmen !== "tersedia"
  ).length;

  const asesmenTerbaru = laporan
    .filter((a) => a.statusAsesmen === "tersedia")
    .slice(0, 3);

  const baseData: SekolahDashboardData = {
    namaSekolah: profile.nama || "SD Bakti",
    role: "Sekolah",
    totalAnak,
    totalAnakTrend: "+2 dari kemarin",
    asesmenTersedia,
    asesmenTersediaTrend: "Sesuai jadwal",
    belumDiunduh,
    belumDiunduhTrend: "Terus bertumbuh",
    sudahDiunduh,
    belumDikirimAdmin,
    tanggalData: "Kamis, 05 November 2026",
    asesmenTerbaru,
    daftarSemuaLaporan: laporan,
    statusChart: [
      { name: "Sudah diunduh", value: sudahDiunduh, color: "#38A3A5" },
      { name: "Belum diunduh", value: belumDiunduh, color: "#FFB703" },
      {
        name: "Belum dikirim admin",
        value: belumDikirimAdmin,
        color: "#F472B6",
      },
    ],
  };

  return baseData;
}

export function saveDashboardSekolahData(data: SekolahDashboardData): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Gagal menyimpan data dasbor sekolah ke localStorage:", e);
    }
  }
}

// Alias kompatibilitas
export const getSekolahDashboardData = getDashboardSekolahData;
export const saveSekolahDashboardData = saveDashboardSekolahData;
