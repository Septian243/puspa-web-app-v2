/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface Sekolah {
  id: string;
  nama: string;
  school_name?: string;
  npsn?: string | null;
  username: string;
  jenjang: string;
  jenjangKode?: string;
  jenjangLabel?: string;
  role?: string;
  email: string;
  phone: string;
  school_phone?: string;
  noTelepon?: string;
  alamat?: string;
  school_address?: string;
  pic_name?: string;
  status: "TERVERIFIKASI" | "MENUNGGU" | "DITOLAK" | "Terverifikasi" | "Tidak Terverifikasi" | string;
  verification_status?: string;
  students_count?: number;
  created_at?: string;
  updated_at?: string;
  tanggalPendaftaran?: string;
}

export interface CreateSchoolPayload {
  username: string;
  email: string;
  password: string;
  school_name: string;
  jenjang?: string;
  npsn?: string | null;
  school_phone?: string;
  school_address?: string;
  pic_name?: string;
}

export interface UpdateSchoolPayload {
  school_name?: string;
  jenjang?: string;
  npsn?: string | null;
  school_phone?: string;
  school_address?: string;
  pic_name?: string;
}

export async function getSchools(search?: string): Promise<Sekolah[]> {
  const params: Record<string, string> = {};
  if (search && search.trim()) {
    params.search = search.trim();
  }

  const res = await api.get("/schools", { params });
  const rawData = res.data?.data ?? [];

  return rawData.map((item: any) => {
    const rawStatus = (item.status || "").toLowerCase().trim();
    let displayStatus = "Tidak Terverifikasi";
    if (rawStatus === "terverifikasi" || rawStatus === "verified" || rawStatus === "aktif") {
      displayStatus = "Terverifikasi";
    } else if (rawStatus === "ditolak" || rawStatus === "rejected") {
      displayStatus = "Ditolak";
    } else {
      displayStatus = "Tidak Terverifikasi";
    }

    return {
      id: item.id,
      nama: item.namaSekolah || item.school_name || "-",
      school_name: item.school_name || item.namaSekolah || "-",
      npsn: item.npsn || null,
      username: item.username || "-",
      jenjang: item.jenjang || "-",
      jenjangKode: item.jenjangKode || item.jenjang || "-",
      jenjangLabel: item.jenjangLabel || item.jenjang || "-",
      role: "Sekolah",
      email: item.email || "-",
      phone: item.noTelepon || item.school_phone || "-",
      school_phone: item.school_phone || item.noTelepon || "-",
      noTelepon: item.noTelepon || item.school_phone || "-",
      alamat: item.alamat || item.school_address || "-",
      school_address: item.school_address || item.alamat || "-",
      pic_name: item.pic_name || "-",
      status: displayStatus,
      verification_status: item.verification_status,
      students_count: item.students_count ?? 0,
      created_at: item.created_at || item.tanggalPendaftaran || "-",
      updated_at: item.updated_at || item.created_at || item.tanggalPendaftaran || "-",
      tanggalPendaftaran: item.tanggalPendaftaran || item.created_at || "-",
    };
  });
}

export async function getSchoolById(id: string): Promise<Sekolah> {
  const res = await api.get(`/schools/${id}`);
  const item = res.data?.data;

  const rawStatus = (item?.status || "").toLowerCase().trim();
  let displayStatus = "Tidak Terverifikasi";
  if (rawStatus === "terverifikasi" || rawStatus === "verified" || rawStatus === "aktif") {
    displayStatus = "Terverifikasi";
  } else if (rawStatus === "ditolak" || rawStatus === "rejected") {
    displayStatus = "Ditolak";
  } else {
    displayStatus = "Tidak Terverifikasi";
  }

  return {
    id: item.id,
    nama: item.namaSekolah || item.school_name || "-",
    school_name: item.school_name || item.namaSekolah || "-",
    npsn: item.npsn || null,
    username: item.username || "-",
    jenjang: item.jenjang || "-",
    jenjangKode: item.jenjangKode || item.jenjang || "-",
    jenjangLabel: item.jenjangLabel || item.jenjang || "-",
    role: "Sekolah",
    email: item.email || "-",
    phone: item.noTelepon || item.school_phone || "-",
    school_phone: item.school_phone || item.noTelepon || "-",
    noTelepon: item.noTelepon || item.school_phone || "-",
    alamat: item.alamat || item.school_address || "-",
    school_address: item.school_address || item.alamat || "-",
    pic_name: item.pic_name || "-",
    status: displayStatus,
    verification_status: item.verification_status,
    students_count: item.students_count ?? 0,
    created_at: item.created_at || item.tanggalPendaftaran || "-",
    updated_at: item.updated_at || item.created_at || item.tanggalPendaftaran || "-",
    tanggalPendaftaran: item.tanggalPendaftaran || item.created_at || "-",
  };
}

export async function createSchool(payload: CreateSchoolPayload): Promise<Sekolah> {
  const res = await api.post("/schools", payload);
  return res.data?.data;
}

export async function updateSchool(id: string, payload: UpdateSchoolPayload): Promise<Sekolah> {
  const res = await api.put(`/schools/${id}`, payload);
  return res.data?.data;
}

export async function deleteSchool(id: string): Promise<void> {
  await api.delete(`/schools/${id}`);
}

let cachedSchoolsList: Sekolah[] = [];

export function getDaftarSekolah(): Sekolah[] {
  // Trigger background fetch if empty
  if (cachedSchoolsList.length === 0 && typeof window !== "undefined") {
    getSchools().then((schools) => {
      cachedSchoolsList = schools;
    }).catch((err) => {
      console.warn("Background fetch schools failed:", err);
    });
  }
  return cachedSchoolsList;
}

// Prefetch for instant dropdown availability
if (typeof window !== "undefined") {
  getSchools().then((s) => {
    cachedSchoolsList = s;
  }).catch(() => {});
}
