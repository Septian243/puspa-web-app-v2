// src/lib/api/assessmentParent.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "@/lib/axios";

export async function getPendingParents(date = "", search = "", myPatients?: boolean) {
  try {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (search) params.search = search;
    if (typeof myPatients === "boolean") {
      params.my_patients = myPatients ? "1" : "0";
    }
    const res = await axiosInstance.get(`/assessments/pending/parent`, { params });
    return res.data.data;
  } catch (error: any) {
    console.error("Error fetching pending parents:", error?.response || error);
    throw error;
  }
}

export async function getCompletedParents(date = "", search = "", myPatients?: boolean) {
  try {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (search) params.search = search;
    if (typeof myPatients === "boolean") {
      params.my_patients = myPatients ? "1" : "0";
    }
    const res = await axiosInstance.get(`/assessments/completed/parent`, { params });
    return res.data.data;
  } catch (error: any) {
    console.error("Error fetching completed parents:", error?.response || error);
    throw error;
  }
}
