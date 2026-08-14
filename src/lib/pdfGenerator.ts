import { renderToBuffer } from '@react-pdf/renderer';
import { SalarySlipPDF } from '@/components/pdf/SalarySlipPDF';
import { createElement } from 'react';

export async function generateSalarySlipPdfBuffer(snap: any, month: number, year: number) {
  const pdfElement = createElement(SalarySlipPDF, {
    employeeName: snap.employee_name,
    employeeId: snap.employee_id_external,
    department: snap.department,
    designation: snap.designation || 'Employee',
    joiningDate: snap.joining_date,
    month,
    year,
    daysPresent: snap.days_present,
    daysField: snap.days_field,
    daysPaidLeave: snap.days_paid_leave,
    daysUnpaidLeave: snap.days_unpaid_leave,
    daysAbsent: snap.days_absent,
    baseSalary: snap.base_salary,
    basicSalary: snap.basic_salary || 0,
    hra: snap.hra || 0,
    allowance: snap.allowance || 0,
    bonus: snap.bonus || 0,
    overtimeHours: snap.overtime_hours || 0,
    overtimePay: snap.overtime_pay || 0,
    pf: snap.pf || 0,
    esi: snap.esi || 0,
    professionalTax: snap.professional_tax || 0,
    incomeTax: snap.income_tax || 0,
    otherDeductions: snap.other_deductions || 0,
    grossSalary: snap.gross_salary || 0,
    totalDeductions: snap.total_deductions || 0,
    netPayable: snap.net_salary || snap.net_payable,
    panNumber: snap.pan_number,
    uanNumber: snap.uan_number,
    bankName: snap.bank_name,
    bankAccountNumber: snap.bank_account_number,
    bankIfsc: snap.bank_ifsc
  });
  return await renderToBuffer(pdfElement as any);
}
