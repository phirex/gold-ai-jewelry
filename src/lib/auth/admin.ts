/**
 * Admin Authentication Helpers
 *
 * Provides utilities for admin role verification and protection.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type UserRole = "user" | "admin" | "crafter";

// Simple admin credentials (from env or hardcoded for now)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Gdfgdg$#%35y5";
const ADMIN_COOKIE_NAME = "admin_auth";
const ADMIN_COOKIE_VALUE = "authenticated_admin_session";

/**
 * Verify admin credentials
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * Check if current request has valid admin cookie
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  return authCookie?.value === ADMIN_COOKIE_VALUE;
}

/**
 * Get admin auth cookie config
 */
export function getAdminCookieConfig() {
  return {
    name: ADMIN_COOKIE_NAME,
    value: ADMIN_COOKIE_VALUE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  };
}

/**
 * Require admin access - redirects to login if not authorized
 */
export async function requireAdmin(locale: string = "en") {
  const isAuth = await isAdminAuthenticated();
  
  if (!isAuth) {
    redirect(`/${locale}/admin/login`);
  }
  
  return {
    user: {
      name: "Admin",
      email: "admin@goldai.com",
      role: "admin",
    },
  };
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
