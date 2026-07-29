import { renderToBuffer } from '@react-pdf/renderer';
import { SalarySlipPDF } from '@/components/pdf/SalarySlipPDF';
import { createElement } from 'react';

export async function generateSalarySlipPdfBuffer(snap: any, month: number, year: number) {
  const pdfElement = createElement(SalarySlipPDF, {
    employeeName: snap.employee_name,
    designation: snap.designation || 'Employee',
    month,
    year,
    basicSalary: snap.basic_salary || 0,
    hra: snap.hra || 0,
    allowance: snap.allowance || 0,
    pf: snap.pf || 0,
    esi: snap.esi || 0,
    professionalTax: snap.professional_tax || 0,
    incomeTax: snap.income_tax || 0,
    otherDeductions: snap.other_deductions || 0,
    grossSalary: snap.gross_salary || 0,
    totalDeductions: snap.total_deductions || 0,
    netPayable: snap.net_payable
  });
  return await renderToBuffer(pdfElement as any);
}
