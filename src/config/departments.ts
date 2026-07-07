export interface DesignationConfig {
  id: string;
  name: string;
  systemRole: "admin" | "sales" | "accountant" | "engineer" | "cad" | "field" | "qc" | "hr";
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


    ]
  },
  {
    id: "operations",
    name: "Operations Department",
    designations: [
      { id: "accountant", name: "Accountant", systemRole: "accountant" },

    ]
  },
  {
    id: "Engineer",
    name: "Engineer Department",
    designations: [
      { id: "engineer", name: "engineer", systemRole: "engineer" },

    ]
  },
  {
    id: "survey",
    name: "Survey Department",
    designations: [
      { id: "recon_eng", name: "Reconciliation Engineer", systemRole: "engineer" },
      { id: "field_surveyor", name: "Field Surveyor", systemRole: "field" },
    ]
  },
  {
    id: "design",
    name: "Design Department",
    designations: [
      { id: "cad_eng", name: "CAD Engineer", systemRole: "cad" },
      { id: "lidar_specialist", name: "Lidar Specialist", systemRole: "engineer" },
    ]
  },
  {
    id: "hr",
    name: "Human Resources (HR)",
    designations: [
      { id: "hr_manager", name: "HR Manager", systemRole: "hr" },
      { id: "hr_executive", name: "HR Executive", systemRole: "hr" },
    ]
  },
  {
    id: "sales",
    name: "Sales Department",
    designations: [
      { id: "sales_manager", name: "Sales Manager", systemRole: "sales" },
      { id: "sales_exec", name: "Sales Executive", systemRole: "sales" },
    ]
  }
];

export function getDesignationsForDepartment(deptId: string): DesignationConfig[] {
  return DEPARTMENTS.find((d: any) => d.id === deptId)?.designations || [];
}

export function getSystemRoleForDesignation(deptId: string, designationId: string): "admin" | "sales" | "accountant" | "engineer" | "cad" | "field" | "qc" | "hr" {
  const dept = DEPARTMENTS.find((d: any) => d.id === deptId);
  const desig = dept?.designations.find((r: any) => r.id === designationId);
  return desig?.systemRole || "engineer";
}
