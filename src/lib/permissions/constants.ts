import { Role } from "./roles";

// Centralized permission checks for different operations
export const PERMISSIONS = {
  // Project Permissions
  PROJECT_CREATE: ["admin", "sales"],
  PROJECT_DELETE: ["admin"],
  PROJECT_ARCHIVE: ["admin", "accountant"],

  // Pipeline/Global View Permissions
  VIEW_SALES_PIPELINE: ["admin", "sales"],
  VIEW_ACCOUNTS_PIPELINE: ["admin", "accountant", "sales"],
  VIEW_ALL_PROJECTS: ["admin", "accountant", "engineer"], // Roles that can see all projects without assignment

  // Workflow Stages Configuration
  STAGE_UPDATE: {
    admin: ["*", "cad_finalization"],
    sales: ["lead_created", "quotation_requested", "quotation_sent", "payment_pending"],
    accountant: ["quotation_sent", "payment_pending", "payment_done", "ready_for_dispatch", "project_created", "quotation_requested"],
    engineer: [
      "data_collection", "prototype", "field_work", "data_sync",
      "field_assigned", "cad_approved", "review", "payment_pending", "completed", "cad_finalization"
    ],
    cad: ["prototype", "cad_revision", "cad_submitted", "data_sync", "review", "field_assigned", "field_work", "completed", "cad_finalization"],
    field: ["field_work", "field_assigned", "field_in_progress", "field_completed", "data_sync"],
    hr: [],
  } as Record<Role, string[]>,

  // File Upload Categories
  FILE_UPLOAD: {
    admin: ["*"],
    sales: ["quotation", "requirements"],
    accountant: ["receipt"],
    engineer: ["requirements", "prototype", "survey_data", "final_file", "technical_doc"],
    cad: ["prototype", "cad_drawing", "final_file"],
    field: ["survey_data", "site_photo", "field_report"],
    hr: [],
  } as Record<Role, string[]>
};
