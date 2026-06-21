export interface DesignationConfig {
  id: string;
  name: string;
  systemRole: "admin" | "sales" | "accountant" | "engineer" | "cad" | "field" | "qc";
}

export interface DepartmentConfig {
  id: string;
  name: string;
  designations: DesignationConfig[];
}

export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: "admin",
    name: "Admin Department",
    designations: [
      { id: "sys_admin", name: "System Administrator", systemRole: "admin" },
      { id: "ops_lead", name: "Operations Lead", systemRole: "admin" }
    ]
  },
  {
    id: "operations",
    name: "Operations Department",
    designations: [
      { id: "chief_accountant", name: "Chief Accountant", systemRole: "accountant" },
      { id: "jr_accountant", name: "Junior Accountant", systemRole: "accountant" },
      { id: "sales_director", name: "Sales Director", systemRole: "sales" },
      { id: "sales_exec", name: "Sales Executive", systemRole: "sales" },
      { id: "ops_coord", name: "Operations Coordinator", systemRole: "sales" }
    ]
  },
  {
    id: "survey",
    name: "Survey Department",
    designations: [
      { id: "recon_lead", name: "Reconciliation Team Lead", systemRole: "engineer" },
      { id: "recon_eng", name: "Reconciliation Engineer", systemRole: "engineer" },
      { id: "field_lead", name: "Field Survey Lead", systemRole: "field" },
      { id: "field_surveyor", name: "Field Surveyor", systemRole: "field" },
      { id: "qc_inspector", name: "QC Inspector", systemRole: "qc" }
    ]
  },
  {
    id: "design",
    name: "Design Department",
    designations: [
      { id: "cad_lead", name: "CAD Team Lead", systemRole: "cad" },
      { id: "sr_cad_eng", name: "Senior CAD Engineer", systemRole: "cad" },
      { id: "jr_cad_eng", name: "Junior CAD Engineer", systemRole: "cad" },
      { id: "lidar_specialist", name: "Lidar Specialist", systemRole: "engineer" },
      { id: "lidar_analyst", name: "Lidar Analyst", systemRole: "engineer" }
    ]
  }
];

export function getDesignationsForDepartment(deptId: string): DesignationConfig[] {
  return DEPARTMENTS.find((d: any) => d.id === deptId)?.designations || [];
}

export function getSystemRoleForDesignation(deptId: string, designationId: string): "admin" | "sales" | "accountant" | "engineer" | "cad" | "field" | "qc" {
  const dept = DEPARTMENTS.find((d: any) => d.id === deptId);
  const desig = dept?.designations.find((r: any) => r.id === designationId);
  return desig?.systemRole || "engineer";
}
