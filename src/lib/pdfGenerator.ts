import { renderToBuffer } from '@react-pdf/renderer';
import { SalarySlipPDF } from '@/components/pdf/SalarySlipPDF';
import { createElement } from 'react';

export async function generateSalarySlipPdfBuffer(snap: any, month: number, year: number) {
  const pdfElement = createElement(SalarySlipPDF, {
    employeeName: snap.employee_name,
    designation: snap.designation || 'Employee',
    month,
    year,
    grossSalary: snap.gross_salary || 0,
    totalDeductions: snap.total_deductions || 0,
    netPayable: snap.net_payable
  });
  return await renderToBuffer(pdfElement as any);
}
