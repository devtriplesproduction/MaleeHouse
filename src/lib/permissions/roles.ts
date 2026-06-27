export type Role = "admin" | "sales" | "accountant" | "engineer" | "cad" | "field" | "field_engineer" | "qc" | "employee" | "hr";

export const ROLES = {
  ADMIN: "admin" as Role,
  SALES: "sales" as Role,
  ACCOUNTANT: "accountant" as Role,
  ENGINEER: "engineer" as Role,
  CAD: "cad" as Role,
  FIELD: "field" as Role,
  FIELD_ENGINEER: "field_engineer" as Role,
  QC: "qc" as Role,
  EMPLOYEE: "employee" as Role,
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
  field_engineer: "/field",
  qc: "/review",
  employee: "/eod", // Base employee landing
  hr: "/hr",
};

// Strict route protection map (Prefix -> Allowed Roles)
export const PATH_PERMISSIONS: Record<string, Role[]> = {
  "/admin": ["admin"],
  "/sales": ["admin", "sales"],
  "/clients": ["admin", "sales"],
  "/accounts": ["admin", "accountant", "sales"], // Sales can view accounts pipeline
  "/operations": ["admin", "engineer", "cad", "field", "field_engineer", "qc"],
  "/review": ["admin", "engineer"],
  "/engineer": ["admin", "engineer"],
  "/cad": ["admin", "cad"],
  "/field": ["admin", "field", "field_engineer"],
  "/eod": ["admin", "sales", "accountant", "engineer", "cad", "field", "field_engineer", "qc", "employee", "hr"],
  "/sop": ["admin", "sales", "accountant", "engineer", "cad", "field", "field_engineer", "qc", "employee", "hr"],
  "/leaves": ["admin", "sales", "accountant", "engineer", "cad", "field", "field_engineer", "qc", "employee", "hr"],
  "/projects": ["admin", "sales", "accountant", "engineer", "cad", "field", "field_engineer", "qc", "employee", "hr"],
  "/hr": ["admin", "hr"],
};

