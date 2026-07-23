export type Role = "admin" | "sales" | "accountant" | "engineer" | "cad" | "field" | "hr";

export const ROLES = {
  ADMIN: "admin" as Role,
  SALES: "sales" as Role,
  ACCOUNTANT: "accountant" as Role,
  ENGINEER: "engineer" as Role,
  CAD: "cad" as Role,
  FIELD: "field" as Role,
  HR: "hr" as Role,
};

// Determines base redirection rules (legacy and new module-based)
export const ROLE_REDIRECTS: Record<Role, string> = {
  admin: "/admin",
  sales: "/sales",
  accountant: "/accounts",
  engineer: "/engineer",
  cad: "/cad",
  field: "/field",
  hr: "/hr",
};

// Strict route protection map (Prefix -> Allowed Roles)
export const PATH_PERMISSIONS: Record<string, Role[]> = {
  "/admin": ["admin"],
  "/sales": ["admin", "sales"],
  "/clients": ["admin", "sales"],
  "/accounts/audit": ["admin"],
  "/accounts/payroll": ["admin", "accountant"],
  "/accounts": ["admin", "accountant", "sales"], // Sales can view accounts pipeline
  "/operations": ["admin", "engineer", "cad", "field"],
  "/review": ["admin", "engineer"],
  "/engineer": ["admin", "engineer"],
  "/cad": ["admin", "cad"],
  "/field": ["admin", "field"],
  "/eod": ["admin", "sales", "accountant", "engineer", "cad", "field", "hr"],
  "/sop": ["admin", "sales", "accountant", "engineer", "cad", "field", "hr"],
  "/leaves": ["admin", "sales", "accountant", "engineer", "cad", "field", "hr"],
  "/projects": ["admin", "sales", "accountant", "engineer", "cad", "field", "hr"],
  "/hr": ["admin", "hr"],
  "/invoices": ["admin", "accountant", "sales"],
  "/receipts": ["admin", "accountant", "sales"],
};

