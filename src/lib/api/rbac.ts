/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/axios";

export interface RoleInfo {
  key: string;
  name: string;
  badge: string;
}

export interface PermissionItem {
  key: string;
  label: string;
  access: Record<string, boolean>;
}

export interface PermissionCategory {
  category: string;
  items: PermissionItem[];
}

export interface RbacMatrixData {
  roles: RoleInfo[];
  matrix: PermissionCategory[];
}

export async function getRoleMatrix(): Promise<RbacMatrixData | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.get("/roles/matrix", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || null;
  } catch (error) {
    console.error("ERROR getRoleMatrix:", error);
    return null;
  }
}

export async function getMyPermissions(): Promise<{ roles: string[]; permissions: string[] } | null> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await api.get("/auth/me/permissions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || null;
  } catch (error) {
    console.error("ERROR getMyPermissions:", error);
    return null;
  }
}
