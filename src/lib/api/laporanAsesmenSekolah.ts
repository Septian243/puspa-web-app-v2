export interface LaporanAsesmenSekolah {
  id: string;
  no: number;
  namaAnak: string;
  jenisKelamin: "Laki-Laki" | "Perempuan";
  usia: string;
  tanggalLahir: string;
  tempatLahir?: string;
  agama?: string;
  alamat?: string;
  namaOrangTua: string;
  teleponOrangTua: string;
  initial: string;
  initialBg: string;
  statusAsesmen: "tersedia" | "belum_tersedia";
  statusUnduh: boolean; // true = Sudah diunduh, false = Belum diunduh
  tanggalKirim?: string;
  filePdf?: string;
  kelas?: string;
  catatanAsesmen?: string;
}

export const DUMMY_DAFTAR_ASESMEN_SEKOLAH: LaporanAsesmenSekolah[] = [
  {
    id: "1",
    no: 1,
    namaAnak: "Putra Pratama",
    jenisKelamin: "Laki-Laki",
    usia: "3 Tahun 9 Bulan",
    tempatLahir: "Sukoharjo",
    tanggalLahir: "01 Februari 2023",
    agama: "-",
    alamat: "Gayam",
    namaOrangTua: "Budi Pratama",
    teleponOrangTua: "0812 3456 7890",
    initial: "P",
    initialBg: "bg-blue-100 text-blue-600",
    statusAsesmen: "tersedia",
    statusUnduh: false,
    tanggalKirim: "03 November 2026",
    filePdf: "#",
    kelas: "TK-A",
  },
  {
    id: "2",
    no: 2,
    namaAnak: "Nana",
    jenisKelamin: "Laki-Laki",
    usia: "5 Tahun 9 Bulan",
    tempatLahir: "Surakarta",
    tanggalLahir: "01 Februari 2021",
    agama: "Islam",
    alamat: "Banjarsari",
    namaOrangTua: "Siti Rahayu",
    teleponOrangTua: "0813 9876 5432",
    initial: "N",
    initialBg: "bg-blue-100 text-blue-600",
    statusAsesmen: "tersedia",
    statusUnduh: false,
    tanggalKirim: "29 Oktober 2026",
    filePdf: "#",
    kelas: "TK-B",
  },
  {
    id: "3",
    no: 3,
    namaAnak: "Anggita",
    jenisKelamin: "Perempuan",
    usia: "4 Tahun 5 Bulan",
    tempatLahir: "Sukoharjo",
    tanggalLahir: "09 Mei 2022",
    agama: "Islam",
    alamat: "Kartasura",
    namaOrangTua: "Hendra Wijaya",
    teleponOrangTua: "0857 1122 3344",
    initial: "A",
    initialBg: "bg-rose-100 text-rose-600",
    statusAsesmen: "belum_tersedia",
    statusUnduh: false,
    kelas: "TK-A",
  },
  {
    id: "4",
    no: 4,
    namaAnak: "Alika",
    jenisKelamin: "Perempuan",
    usia: "7 Tahun 1 Bulan",
    tempatLahir: "Solo",
    tanggalLahir: "10 September 2019",
    agama: "Islam",
    alamat: "Jebres",
    namaOrangTua: "Dewi Lestari",
    teleponOrangTua: "0821 5566 7788",
    initial: "A",
    initialBg: "bg-rose-100 text-rose-600",
    statusAsesmen: "tersedia",
    statusUnduh: true,
    tanggalKirim: "21 Oktober 2026",
    filePdf: "#",
    kelas: "SD-1",
  },
  {
    id: "5",
    no: 5,
    namaAnak: "Arjuna",
    jenisKelamin: "Laki-Laki",
    usia: "3 Tahun 4 Bulan",
    tempatLahir: "Sukoharjo",
    tanggalLahir: "04 Juli 2023",
    agama: "Islam",
    alamat: "Baki",
    namaOrangTua: "Agus Setiawan",
    teleponOrangTua: "0878 4433 2211",
    initial: "A",
    initialBg: "bg-blue-100 text-blue-600",
    statusAsesmen: "belum_tersedia",
    statusUnduh: false,
    kelas: "PAUD",
  },
  {
    id: "6",
    no: 6,
    namaAnak: "Kenzo",
    jenisKelamin: "Laki-Laki",
    usia: "6 Tahun 2 Bulan",
    tempatLahir: "Surakarta",
    tanggalLahir: "15 Agustus 2020",
    agama: "Islam",
    alamat: "Laweyan",
    namaOrangTua: "Rian Kurniawan",
    teleponOrangTua: "0819 3322 1144",
    initial: "K",
    initialBg: "bg-blue-100 text-blue-600",
    statusAsesmen: "tersedia",
    statusUnduh: true,
    tanggalKirim: "18 Oktober 2026",
    filePdf: "#",
    kelas: "TK-B",
  },
  {
    id: "7",
    no: 7,
    namaAnak: "Clarissa",
    jenisKelamin: "Perempuan",
    usia: "5 Tahun 11 Bulan",
    tempatLahir: "Solo",
    tanggalLahir: "20 November 2020",
    agama: "Islam",
    alamat: "Pasar Kliwon",
    namaOrangTua: "Maya Indah",
    teleponOrangTua: "0812 7788 9900",
    initial: "C",
    initialBg: "bg-rose-100 text-rose-600",
    statusAsesmen: "tersedia",
    statusUnduh: false,
    tanggalKirim: "12 Oktober 2026",
    filePdf: "#",
    kelas: "TK-B",
  },
  {
    id: "8",
    no: 8,
    namaAnak: "Dimas",
    jenisKelamin: "Laki-Laki",
    usia: "4 Tahun 8 Bulan",
    tempatLahir: "Sukoharjo",
    tanggalLahir: "05 Maret 2022",
    agama: "Islam",
    alamat: "Polokarto",
    namaOrangTua: "Bambang Tri",
    teleponOrangTua: "0852 6655 4433",
    initial: "D",
    initialBg: "bg-blue-100 text-blue-600",
    statusAsesmen: "belum_tersedia",
    statusUnduh: false,
    kelas: "TK-A",
  },
  {
    id: "9",
    no: 9,
    namaAnak: "Felicia",
    jenisKelamin: "Perempuan",
    usia: "5 Tahun 2 Bulan",
    tempatLahir: "Surakarta",
    tanggalLahir: "14 Januari 2021",
    agama: "Kristen",
    alamat: "Manahan",
    namaOrangTua: "Fransiska",
    teleponOrangTua: "0813 1122 3344",
    initial: "F",
    initialBg: "bg-rose-100 text-rose-600",
    statusAsesmen: "tersedia",
    statusUnduh: false,
    tanggalKirim: "08 Oktober 2026",
    filePdf: "#",
    kelas: "TK-B",
  },
  {
    id: "10",
    no: 10,
    namaAnak: "Gibran",
    jenisKelamin: "Laki-Laki",
    usia: "6 Tahun 5 Bulan",
    tempatLahir: "Solo",
    tanggalLahir: "28 Mei 2020",
    agama: "Islam",
    alamat: "Serengan",
    namaOrangTua: "Gunawan",
    teleponOrangTua: "0822 4455 6677",
    initial: "G",
    initialBg: "bg-blue-100 text-blue-600",
    statusAsesmen: "tersedia",
    statusUnduh: false,
    tanggalKirim: "05 Oktober 2026",
    filePdf: "#",
    kelas: "TK-B",
  },
  {
    id: "11",
    no: 11,
    namaAnak: "Hafiz",
    jenisKelamin: "Laki-Laki",
    usia: "4 Tahun 1 Bulan",
    tempatLahir: "Sukoharjo",
    tanggalLahir: "19 September 2022",
    agama: "Islam",
    alamat: "Mojolaban",
    namaOrangTua: "Hasan Basri",
    teleponOrangTua: "0856 7788 9900",
    initial: "H",
    initialBg: "bg-blue-100 text-blue-600",
    statusAsesmen: "belum_tersedia",
    statusUnduh: false,
    kelas: "PAUD",
  },
  {
    id: "12",
    no: 12,
    namaAnak: "Jessica",
    jenisKelamin: "Perempuan",
    usia: "7 Tahun 3 Bulan",
    tempatLahir: "Surakarta",
    tanggalLahir: "03 Juli 2019",
    agama: "Kristen",
    alamat: "Kerten",
    namaOrangTua: "Johan",
    teleponOrangTua: "0818 9900 1122",
    initial: "J",
    initialBg: "bg-rose-100 text-rose-600",
    statusAsesmen: "tersedia",
    statusUnduh: true,
    tanggalKirim: "01 Oktober 2026",
    filePdf: "#",
    kelas: "SD-1",
  },
];

const STORAGE_KEY_ASESMEN = "puspa_laporan_asesmen_sekolah";

export function getDaftarLaporanAsesmenSekolah(): LaporanAsesmenSekolah[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASESMEN);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= DUMMY_DAFTAR_ASESMEN_SEKOLAH.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Gagal membaca daftar laporan asesmen sekolah dari localStorage:", e);
    }
  }
  return DUMMY_DAFTAR_ASESMEN_SEKOLAH;
}

export function saveDaftarLaporanAsesmenSekolah(data: LaporanAsesmenSekolah[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_ASESMEN, JSON.stringify(data));
      window.dispatchEvent(new Event("sekolah_asesmen_updated"));
    } catch (e) {
      console.error("Gagal menyimpan daftar laporan asesmen sekolah ke localStorage:", e);
    }
  }
}

export function unduhLaporanAsesmenSekolah(id: string): LaporanAsesmenSekolah[] {
  const current = getDaftarLaporanAsesmenSekolah();
  const updated = current.map((item) =>
    item.id === id ? { ...item, statusUnduh: true } : item
  );
  saveDaftarLaporanAsesmenSekolah(updated);
  return updated;
}
