import { Sekolah } from "./data_sekolah";

export type { Sekolah };

export const DUMMY_PROFIL_SEKOLAH: Sekolah = {
  id: "sch-1",
  nama: "SD Bakti",
  username: "sdbakti",
  jenjang: "SD (Sekolah Dasar)",
  role: "Sekolah",
  email: "sdbakti@gmail.com",
  phone: "0812-3456-7890",
  alamat: "Jl. Veteran No. 12, Jamsaren, Kediri",
  status: "TERVERIFIKASI",
  created_at: "01 Januari 2026 08:00:00",
  updated_at: "05 November 2026 10:00:00",
};

const PROFIL_STORAGE_KEY = "puspa_sekolah_profile_dummy";

export function getProfileSekolah(): Sekolah {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(PROFIL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      const dashData = localStorage.getItem("puspa_sekolah_portal_dummy");
      if (dashData) {
        const parsed = JSON.parse(dashData);
        if (parsed.namaSekolah) {
          return {
            ...DUMMY_PROFIL_SEKOLAH,
            nama: parsed.namaSekolah,
          };
        }
      }
    } catch (e) {
      console.error("Gagal membaca profil sekolah dari localStorage:", e);
    }
  }
  return DUMMY_PROFIL_SEKOLAH;
}

export function saveProfileSekolah(profil: Sekolah): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PROFIL_STORAGE_KEY, JSON.stringify(profil));

      // Sinkronkan ke daftar sekolah admin jika ada
      try {
        const listSekolah = localStorage.getItem("puspa_data_sekolah_dummy");
        if (listSekolah) {
          const listParsed: Sekolah[] = JSON.parse(listSekolah);
          const updatedList = listParsed.map((s) =>
            s.id === profil.id || s.username === profil.username
              ? { ...s, ...profil }
              : s
          );
          localStorage.setItem(
            "puspa_data_sekolah_dummy",
            JSON.stringify(updatedList)
          );
        }
      } catch (err) {
        // Abaikan
      }

      window.dispatchEvent(new Event("sekolah_profile_updated"));
    } catch (e) {
      console.error("Gagal menyimpan profil sekolah ke localStorage:", e);
    }
  }
}

// Alias kompatibilitas
export const getProfilSekolah = getProfileSekolah;
export const saveProfilSekolah = saveProfileSekolah;
