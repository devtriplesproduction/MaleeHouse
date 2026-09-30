import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserProfileAction } from "@/actions/auth.actions";
import { Permission, SecurityContext, ROLE_PERMISSIONS } from "./permissions";

export async function logSecurityEvent(data: {
  userId?: string;
  role?: string;
  module: string;
  action: string;
  route: string;
  httpMethod: string;
  statusCode: number;
  reason: string;
}) {
  try {
    const supabaseAdmin: any = createAdminClient();
    const headersList = await headers();
    
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await supabaseAdmin.from('security_audit_logs').insert({
      user_id: data.userId || null,
      role: data.role || null,
      module: data.module,
      action: data.action,
      route: data.route,
      http_method: data.httpMethod,
      status_code: data.statusCode,
      reason: data.reason,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    // Fail-safe: console error logging so security logging failures never crash business operations
    console.error("CRITICAL: Failed to write to security_audit_logs:", error);
  }
}

export async function requireAuthenticatedUser(context: SecurityContext) {
  const profile: any = await getUserProfileAction();
  const route = context.route || "unknown";
  const httpMethod = context.httpMethod || "POST";

  if (!profile || !profile.is_active) {
    // Log unauthenticated attempt
    await logSecurityEvent({
      module: context.module,
      action: "AUTHENTICATE",
      route,
      httpMethod,
      statusCode: 401,
      reason: "User is not authenticated or profile is inactive"
    });

    return { 
      success: false, 
      profile: null, 
      error: "UNAUTHORIZED", 
      message: "User is not authenticated." 
    };
  }

  return { success: true, profile, error: null, message: null };
}

export async function requirePermission(
  profile: any,
  permission: Permission,
  context: SecurityContext,
  resourceContext?: Record<string, any>
) {
  const route = context.route || "unknown";
  const httpMethod = context.httpMethod || "POST";
  const role = profile.role;
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  const hasPermission = userPermissions.includes(permission);

  // Future ownership-based checks hook (using resourceContext)
  // Example: if (resourceContext && !isOwner(profile.id, resourceContext)) hasPermission = false;

  if (!hasPermission) {
    // Log forbidden attempt
    await logSecurityEvent({
      userId: profile.id,
      role,
      module: context.module,
      action: permission,
      route,
      httpMethod,
      statusCode: 403,
      reason: `User with role '${role}' lacks permission '${permission}'`
    });

    return { 
      authorized: false, 
      error: "FORBIDDEN", 
      message: "User lacks required permissions." 
    };
  }

  return { authorized: true, error: null, message: null };
}
