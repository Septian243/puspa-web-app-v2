/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SchoolProfileData {
  id?: string;
  school_name?: string;
  nama?: string;
  npsn?: string;
  pic_name?: string;
  jenjang?: string;
  school_address?: string;
  alamat?: string;
  username?: string;
  email?: string;
  school_phone?: string;
  phone?: string;
}

/**
 * Mengambil profil sekolah
 * Note: Menunggu endpoint backend GET /api/v1/school/profile
 */
export async function getSchoolProfile(): Promise<SchoolProfileData | null> {
  // Belum disupport oleh backend (Pending)
  return null;
}

/**
 * Memperbarui profil sekolah
 * Note: Menunggu endpoint backend PUT /api/v1/school/profile
 */
export async function updateSchoolProfile(_payload: Partial<SchoolProfileData>): Promise<any> {
  // Belum disupport oleh backend (Pending)
  throw new Error("Fitur update profil sekolah berstatus Pending (Menunggu dukungan backend)");
}
