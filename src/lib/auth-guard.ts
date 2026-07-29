import { getUserProfileAction } from "@/actions/auth.actions";
import { redirect } from "next/navigation";
import { ROLE_REDIRECTS, Role } from "./permissions/roles";

/**
 * requireRole
 * A server-side guard for pages. 
 * Prevents unauthorized users from even seeing the page shell.
 */
export async function requireRole(allowedRole: string) {
  const profile = await getUserProfileAction();

  if (!profile) {
    redirect("/login");
  }

  // Determine if user is authorized for this specific route
  // Admin bypasses all checks, otherwise role must match allowedRole
  const isAuthorized = profile.role === 'admin' || profile.role === allowedRole;

  if (!profile.is_active || !isAuthorized) {
    // If not authorized, send them back to their own dashboard or login
    const fallback = profile.role ? ROLE_REDIRECTS[profile.role as Role] : "/login";
    redirect(fallback);
  }

  return { profile };
}

/**
 * requireAuth
 * Generic authentication guard for shared pages (like Profile).
 */
export async function requireAuth() {
  const profile = await getUserProfileAction();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  return { profile };
}
