/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface Terapis {
  id: string; 
  nama: string;
  bidang: string;
  username: string;
  email: string;
  telepon: string;
  school_id?: string | null;
  school_name?: string | null;
  role: string;
  ditambahkan: string;
  diubah: string;
  status: string; 
}

const bidangMap: Record<string, string> = {
  fisio: "Fisioterapi",
  okupasi: "Okupasi Terapi",
  wicara: "Terapi Wicara",
  paedagog: "Paedagog",
};

const reverseBidangMap: Record<string, string> = {
  "Fisioterapi": "fisio",
  "Okupasi Terapi": "okupasi",
  "Terapi Wicara": "wicara",
  "Paedagog": "paedagog",
};


export async function getTerapis(): Promise<Terapis[]> {
  const token = localStorage.getItem("token_admin");
  const res = await api.get("/therapists", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.data.success && Array.isArray(res.data.data)) {
    return res.data.data.map((t: any) => ({
      id: t.therapist_id, 
      nama: t.therapist_name,
      bidang: bidangMap[t.therapist_section] || t.therapist_section,
      username: t.username,
      email: t.email,
      telepon: t.therapist_phone,
      school_id: t.school_id || null,
      school_name: t.school_name || t.school?.name || null,
      ditambahkan: t.created_at,
      diubah: t.updated_at,
      status: t.status,
      role: t.role,
    }));
  }

  return [];
}

export async function addTerapis(data: {
  nama: string;
  bidang: string;
  username: string;
  email: string;
  telepon: string;
  password: string;
  school_id?: string | null;
}) {
  const token = localStorage.getItem("token_admin");
  return api.post(
    "/therapists",
    {
      therapist_name: data.nama,
      therapist_section: reverseBidangMap[data.bidang] || data.bidang,
      username: data.username,
      email: data.email,
      therapist_phone: data.telepon,
      password: data.password,
      school_id: data.school_id || null,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function updateTerapis(
  id: string,
  data: {
    nama: string;
    bidang: string;
    username: string;
    email: string;
    telepon: string;
    school_id?: string | null;
  }
) {
  const token = localStorage.getItem("token_admin");
  return api.put(
    `/therapists/${id}`,
    {
      therapist_name: data.nama,
      therapist_section: reverseBidangMap[data.bidang] || data.bidang,
      username: data.username,
      email: data.email,
      therapist_phone: data.telepon,
      school_id: data.school_id || null,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function deleteTerapis(id: string) {
  const token = localStorage.getItem("token_admin");
  return api.delete(`/therapists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getDetailTerapis(id: string): Promise<Terapis | null> {
  const token = localStorage.getItem("token_admin");
  const res = await api.get(`/therapists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.data.success && res.data.data) {
    const t = res.data.data;
    return {
      id: t.therapist_id,
      nama: t.therapist_name,
      bidang: bidangMap[t.therapist_section] || t.therapist_section,
      username: t.username,
      email: t.email,
      telepon: t.therapist_phone,
      school_id: t.school_id || null,
      school_name: t.school_name || t.school?.name || null,
      ditambahkan: t.created_at,
      diubah: t.updated_at,
      status: t.status,
      role: t.role,
    };
  }

  return null;
}
