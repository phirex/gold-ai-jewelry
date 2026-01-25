/**
 * Admin Authentication Helpers
 *
 * Provides utilities for admin role verification and protection.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { redirect } from "next/navigation";

export type UserRole = "user" | "admin" | "crafter";

/**
 * Check if the current user has admin privileges
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

/**
 * Check if the current user has crafter or admin privileges
 */
export async function isCrafterOrAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  return role === "admin" || role === "crafter";
}

/**
 * Get the current admin session or null if not authorized
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }
  
  if (session.user.role !== "admin") {
    return null;
  }
  
  return session;
}

/**
 * Require admin access - redirects to sign in if not authorized
 * Use this in server components/pages
 */
export async function requireAdmin(locale: string = "en") {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/pricing`);
  }
  
  if (session.user.role !== "admin") {
    redirect(`/${locale}/unauthorized`);
  }
  
  return session;
}

/**
 * Check admin access for API routes
 * Returns { authorized: boolean, session, error? }
 */
export async function checkAdminAccess(): Promise<{
  authorized: boolean;
  session: Awaited<ReturnType<typeof getServerSession>> | null;
  error?: string;
}> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      authorized: false,
      session: null,
      error: "Not authenticated",
    };
  }
  
  if (session.user.role !== "admin") {
    return {
      authorized: false,
      session,
      error: "Admin access required",
    };
  }
  
  return {
    authorized: true,
    session,
  };
}

/**
 * Admin role labels for display
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  admin: "Administrator",
  crafter: "Crafter",
};

/**
 * Admin role colors for badges
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  user: "bg-gray-500",
  admin: "bg-red-500",
  crafter: "bg-amber-500",
};
