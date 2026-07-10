import { Role } from "./roles";

export type Capability = 
  | "project:create" 
  | "project:delete" 
  | "project:archive"
  | "finance:invoice" 
  | "finance:verify_payment" 
  | "finance:unfreeze"
  | "ops:assign_cad" 
  | "ops:schedule_visit" 
  | "ops:escalate_revisions"
  | "cad:upload" 
  | "field:report" 
  | "qc:verify" 
  | "vault:overwrite";

const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  admin: [
    "project:create", "project:delete", "project:archive",
    "finance:invoice", "finance:verify_payment", "finance:unfreeze",
    "ops:assign_cad", "ops:schedule_visit", "ops:escalate_revisions",
    "cad:upload", "field:report", "qc:verify", "vault:overwrite"
  ],
  sales: ["project:create", "ops:assign_cad"],
  accountant: ["project:create", "finance:invoice", "finance:verify_payment", "finance:unfreeze"],
  engineer: ["ops:assign_cad", "ops:schedule_visit", "ops:escalate_revisions", "cad:upload", "field:report"],
  cad: ["cad:upload"],
  field: ["field:report"],
  field_engineer: ["field:report"],
  qc: ["qc:verify"],
  employee: [],
  hr: [],
};

/**
 * Checks if the user's role permits executing a specific operation capability.
 */
export function hasCapability(role: Role, action: Capability): boolean {
  if (role === "admin") return true;
  const capabilities = ROLE_CAPABILITIES[role] || [];
  return capabilities.includes(action);
}
