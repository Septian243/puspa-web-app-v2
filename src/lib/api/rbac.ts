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

export async function updateRolePermission(role: string, permission: string, enabled: boolean): Promise<boolean> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    await api.put(
      "/roles/permissions",
      { role, permission, enabled },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return true;
  } catch (error) {
    console.error("ERROR updateRolePermission:", error);
    return false;
  }
}
