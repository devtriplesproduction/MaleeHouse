export enum Permission {
  VIEW_HR_PAYROLL = "view_hr_payroll",
  VIEW_ACCOUNTS_PAYROLL = "view_accounts_payroll",
  APPROVE_PAYROLL = "approve_payroll",
  GENERATE_SLIPS = "generate_slips",
  RELEASE_SLIPS = "release_slips",
  MARK_PAYMENT_COMPLETED = "mark_payment_completed",
  SAVE_PAYROLL_DRAFT = "save_payroll_draft",
  SUBMIT_PAYROLL_TO_ACCOUNTS = "submit_payroll_to_accounts",
  RETURN_PAYROLL_TO_DRAFT = "return_payroll_to_draft",
}

export enum Module {
  PAYROLL = "Payroll",
  BANKING = "Banking",
  HR = "HR",
  CRM = "CRM",
  ADMIN = "Admin",
}

export interface SecurityContext {
  module: Module;
  route: string;
  httpMethod?: string;
}

// Maps role to its permitted actions (Static Role-Based Access mapping)
// This can be easily replaced by database queries in the future
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    Permission.VIEW_HR_PAYROLL,
    Permission.VIEW_ACCOUNTS_PAYROLL,
    Permission.APPROVE_PAYROLL,
    Permission.GENERATE_SLIPS,
    Permission.RELEASE_SLIPS,
    Permission.MARK_PAYMENT_COMPLETED,
    Permission.SAVE_PAYROLL_DRAFT,
    Permission.SUBMIT_PAYROLL_TO_ACCOUNTS,
    Permission.RETURN_PAYROLL_TO_DRAFT,
  ],
  hr: [
    Permission.VIEW_HR_PAYROLL,
    Permission.SAVE_PAYROLL_DRAFT,
    Permission.SUBMIT_PAYROLL_TO_ACCOUNTS,
    Permission.RETURN_PAYROLL_TO_DRAFT,
  ],
  accountant: [
    Permission.VIEW_ACCOUNTS_PAYROLL,
    Permission.APPROVE_PAYROLL,
    Permission.GENERATE_SLIPS,
    Permission.RELEASE_SLIPS,
    Permission.MARK_PAYMENT_COMPLETED,
    Permission.RETURN_PAYROLL_TO_DRAFT,
  ],
};
