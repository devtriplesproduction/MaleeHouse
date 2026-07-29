import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}

export async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download failed, falling back to window.open', error);
    window.open(url, '_blank');
  }
}

export function filterActivityLogsByRole(logs: any[], role: string) {
  if (role === 'admin' || role === 'accountant') return logs;
  
  const financeActions = [
    "PAYMENT_VERIFIED", "RECEIPT_GENERATED", "PAYMENT_LOGGED", 
    "INVOICE_CREATED", "INVOICE_DELETED", "update_invoice",
    "MILESTONES_CREATED", "MILESTONE_STATUS_UPDATE", "MILESTONE_RESCHEDULED",
    "QUOTATION_CREATED", "QUOTATION_STATUS_UPDATED", "QUOTATION_REVISED", "QUOTATION_DELETED",
    "EXPENSE_CREATED", "EXPENSE_UPDATED", "EXPENSE_DELETED", "BUDGET_ITEM_CREATED",
    "PROJECT_FROZEN", "PROJECT_UNFROZEN"
  ];
  
  return logs.filter(log => !financeActions.includes(log.action));
}
