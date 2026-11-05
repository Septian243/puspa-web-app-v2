export interface Sekolah {
  id: string;
  nama: string;
  username: string;
  jenjang: string;
  role: string;
  email: string;
  phone: string;
  alamat?: string;
  status: "TERVERIFIKASI" | "MENUNGGU" | "DITOLAK" | string;
  created_at?: string;
  updated_at?: string;
}

export const DUMMY_SEKOLAH: Sekolah[] = [
  // PAUD
  {
    id: "paud-1",
    nama: "PAUD Tunas Bangsa",
    username: "paudtunasbangsa",
    jenjang: "PAUD (Pendidikan Anak Usia Dini)",
    role: "Sekolah",
    email: "tunasbangsa@gmail.com",
    phone: "081234567890",
    alamat: "Jl. Tunas Bangsa No. 1, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "paud-2",
    nama: "PAUD Melati",
    username: "paudmelati",
    jenjang: "PAUD (Pendidikan Anak Usia Dini)",
    role: "Sekolah",
    email: "paudmelati@gmail.com",
    phone: "081234567891",
    alamat: "Jl. Melati No. 5, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "paud-3",
    nama: "PAUD Ceria Anak",
    username: "paudceria",
    jenjang: "PAUD (Pendidikan Anak Usia Dini)",
    role: "Sekolah",
    email: "paudceria@gmail.com",
    phone: "081234567892",
    alamat: "Jl. Ceria No. 8, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  // TK
  {
    id: "tk-1",
    nama: "TK Al-Hikmah",
    username: "tkalhikmah",
    jenjang: "TK (Taman Kanak-Kanak)",
    role: "Sekolah",
    email: "alhikmah@gmail.com",
    phone: "081234567893",
    alamat: "Jl. Kebonsari No. 12, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "tk-2",
    nama: "TK Aisyiyah Bustanul Athfal",
    username: "tkaisyiyah",
    jenjang: "TK (Taman Kanak-Kanak)",
    role: "Sekolah",
    email: "aisyiyah@gmail.com",
    phone: "081234567894",
    alamat: "Jl. KH Ahmad Dahlan No. 10, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "tk-3",
    nama: "TK Kartika",
    username: "tkkartika",
    jenjang: "TK (Taman Kanak-Kanak)",
    role: "Sekolah",
    email: "kartika@gmail.com",
    phone: "081234567895",
    alamat: "Jl. Hayam Wuruk No. 3, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "tk-4",
    nama: "TK Pembina",
    username: "tkpembina",
    jenjang: "TK (Taman Kanak-Kanak)",
    role: "Sekolah",
    email: "pembina@gmail.com",
    phone: "081234567896",
    alamat: "Jl. Pemuda No. 17, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "2",
    nama: "TK 1 Jamsaren",
    username: "jamsaren01",
    jenjang: "TK (Taman Kanak-Kanak)",
    role: "Sekolah",
    email: "jamsaren@gmail.com",
    phone: "089299886565",
    alamat: "Jl. Veteran No. 14, Jamsaren, Kediri",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  // SD
  {
    id: "sd-1",
    nama: "SD Permata Hati",
    username: "sdpermatahati",
    jenjang: "SD (Sekolah Dasar)",
    role: "Sekolah",
    email: "permatahati@gmail.com",
    phone: "081234567897",
    alamat: "Jl. Kutai No. 20, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "sd-2",
    nama: "SDN Darmo Permai",
    username: "sdndarmopermai",
    jenjang: "SD (Sekolah Dasar)",
    role: "Sekolah",
    email: "darmopermai@gmail.com",
    phone: "081234567898",
    alamat: "Jl. Darmo Permai No. 8, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "sd-3",
    nama: "SD Al-Azhar",
    username: "sdalazhar",
    jenjang: "SD (Sekolah Dasar)",
    role: "Sekolah",
    email: "alazhar@gmail.com",
    phone: "081234567899",
    alamat: "Jl. Wisma Permai No. 4, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "sd-4",
    nama: "MI Muhammadiyah",
    username: "mimuhammadiyah",
    jenjang: "SD (Sekolah Dasar)",
    role: "Sekolah",
    email: "mimuhammadiyah@gmail.com",
    phone: "081234567800",
    alamat: "Jl. Pucang Anom No. 15, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "1",
    nama: "SD 1 Jamsaren",
    username: "jamsaren01",
    jenjang: "SD (Sekolah Dasar)",
    role: "Sekolah",
    email: "jamsaren@gmail.com",
    phone: "089299886565",
    alamat: "Jl. Veteran No. 12, Jamsaren, Kediri",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  // SMP
  {
    id: "smp-1",
    nama: "SMPN 1 Surabaya",
    username: "smpn1surabaya",
    jenjang: "SMP (Sekolah Menengah Pertama)",
    role: "Sekolah",
    email: "smpn1sby@gmail.com",
    phone: "081234567801",
    alamat: "Jl. Pacar No. 4, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "smp-2",
    nama: "SMP Al-Hikmah",
    username: "smpalhikmah",
    jenjang: "SMP (Sekolah Menengah Pertama)",
    role: "Sekolah",
    email: "smpalhikmah@gmail.com",
    phone: "081234567802",
    alamat: "Jl. Kebonsari No. 14, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "smp-3",
    nama: "SMP Muhammadiyah",
    username: "smpmuhammadiyah",
    jenjang: "SMP (Sekolah Menengah Pertama)",
    role: "Sekolah",
    email: "smpmuhammadiyah@gmail.com",
    phone: "081234567803",
    alamat: "Jl. Kapas Krampung No. 22, Surabaya",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
  {
    id: "3",
    nama: "SMP 1 Jamsaren",
    username: "jamsaren01",
    jenjang: "SMP (Sekolah Menengah Pertama)",
    role: "Sekolah",
    email: "jamsaren@gmail.com",
    phone: "089299886565",
    alamat: "Jl. Veteran No. 10, Jamsaren, Kediri",
    status: "TERVERIFIKASI",
    created_at: "30 October 2026 13:04:54",
    updated_at: "30 October 2026 13:04:54",
  },
];

export function getDaftarSekolah(): Sekolah[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("puspa_data_sekolah_dummy");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Gabungkan data tersimpan dengan dummy baru jika belum ada
          const savedNames = new Set(parsed.map((item: Sekolah) => item.nama.toLowerCase()));
          const extraDummies = DUMMY_SEKOLAH.filter(
            (dummy) => !savedNames.has(dummy.nama.toLowerCase())
          );
          return [...parsed, ...extraDummies];
        }
      }
    } catch (e) {
      console.error("Gagal memuat data sekolah dari localStorage:", e);
    }
  }
  return DUMMY_SEKOLAH;
}
