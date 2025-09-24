"use client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
};

export const getUser = (): AdminUser | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("adminUser");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const logout = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
  window.location.href = "/login";
};