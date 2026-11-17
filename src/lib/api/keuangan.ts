/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface ChildGuardianItem {
  child_id: string;
  child_name: string;
  guardian_id: string;
  guardian_name: string;
}

export interface InvoiceItemPayload {
  therapy_type: string;
  session_count: number;
  price_per_session: number;
}

export interface CreateInvoicePayload {
  child_id: string;
  guardian_id: string;
  type: "Bulanan" | "Paket Durasi";
  period_label: string;
  start_date?: string | null;
  end_date?: string | null;
  discount?: number;
  notes?: string;
  items: InvoiceItemPayload[];
}

export interface InvoiceFilters {
  status_tab?: string;
  tipe?: string;
  tahun?: string;
  bulan?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && token !== "null" && token !== "undefined") {
      const tokenType = localStorage.getItem("tokenType") || "Bearer";
      headers.Authorization = `${tokenType} ${token}`;
    }
  }
  return headers;
}

export async function getChildrenWithGuardians(): Promise<ChildGuardianItem[]> {
  try {
    const res = await api.get("/finance/children-guardians", {
      headers: getAuthHeaders(),
    });
    return res.data?.data || [];
  } catch (error) {
    console.error("ERROR getChildrenWithGuardians:", error);
    return [];
  }
}

export async function getInvoices(filters: InvoiceFilters = {}) {
  try {
    const res = await api.get("/finance/invoices", {
      params: filters,
      headers: getAuthHeaders(),
    });
    return res.data?.data;
  } catch (error) {
    console.error("ERROR getInvoices:", error);
    return null;
  }
}

export async function createInvoice(payload: CreateInvoicePayload) {
  try {
    const res = await api.post("/finance/invoices", payload, {
      headers: getAuthHeaders(),
    });
    return res.data?.data;
  } catch (error) {
    console.error("ERROR createInvoice:", error);
    throw error;
  }
}

export async function updateInvoice(id: string, payload: Partial<CreateInvoicePayload>) {
  try {
    const res = await api.put(`/finance/invoices/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return res.data?.data;
  } catch (error) {
    console.error("ERROR updateInvoice:", error);
    throw error;
  }
}

export async function deleteInvoice(id: string) {
  try {
    const res = await api.delete(`/finance/invoices/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("ERROR deleteInvoice:", error);
    throw error;
  }
}

export async function payInvoice(id: string, payload: FormData | { payment_method: string; payment_date: string; receipt_number?: string }) {
  try {
    const isFormData = payload instanceof FormData;
    const res = await api.post(`/finance/invoices/${id}/pay`, payload, {
      headers: getAuthHeaders(isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" }),
    });
    return res.data?.data;
  } catch (error) {
    console.error("ERROR payInvoice:", error);
    throw error;
  }
}

export async function getAttendanceForRefund(id: string) {
  try {
    const res = await api.get(`/finance/invoices/${id}/refund-attendance`, {
      headers: getAuthHeaders(),
    });
    return res.data?.data;
  } catch (error) {
    console.error("ERROR getAttendanceForRefund:", error);
    return null;
  }
}

export async function refundInvoice(id: string, payload: FormData | { mode: string; kehadiran: number; total_sesi: number; tanggal?: string; metode_pengembalian?: string; no_resi?: string }) {
  try {
    const isFormData = payload instanceof FormData;
    const res = await api.post(`/finance/invoices/${id}/refund`, payload, {
      headers: getAuthHeaders(isFormData ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" }),
    });
    return res.data?.data;
  } catch (error) {
    console.error("ERROR refundInvoice:", error);
    throw error;
  }
}

export async function getCredits() {
  try {
    const res = await api.get("/finance/credits", {
      headers: getAuthHeaders(),
    });
    return res.data?.data;
  } catch (error) {
    console.error("ERROR getCredits:", error);
    return null;
  }
}

export async function getTransactions(filters: { metode?: string; tahun?: string; bulan?: string; search?: string; page?: number; per_page?: number } = {}) {
  try {
    const res = await api.get("/finance/transactions", {
      params: filters,
      headers: getAuthHeaders(),
    });
    return res.data?.data;
  } catch (error) {
    console.error("ERROR getTransactions:", error);
    return null;
  }
}
