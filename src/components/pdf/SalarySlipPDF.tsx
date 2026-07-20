import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#374151',
    letterSpacing: 1,
  },
  employeeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
  },
  employeeCol: {
    flex: 1,
  },
  employeeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  empLabel: {
    width: 90,
    color: '#6b7280',
  },
  empValue: {
    flex: 1,
    fontWeight: 'bold',
  },
  salarySection: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  salaryHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  salaryHeaderCell: {
    flex: 1,
    padding: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  salaryHeaderCellLast: {
    flex: 1,
    padding: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  salaryBody: {
    flexDirection: 'row',
  },
  salaryCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  salaryColLast: {
    flex: 1,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemLabel: {
    color: '#374151',
  },
  itemValue: {
    fontWeight: 'bold',
  },
  salaryFooter: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
  },
  salaryTotalCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    fontWeight: 'bold',
  },
  salaryTotalCellLast: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    fontWeight: 'bold',
  },
  netPayableSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30,
  },
  netPayableBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 10,
    width: 250,
  },
  netPayableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netPayableLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  netPayableValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  netPayableWords: {
    marginTop: 4,
    fontSize: 9,
    color: '#3b82f6',
    fontStyle: 'italic',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
  },
  footerLine: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
  },
});

interface SalarySlipProps {
  employeeName: string;
  employeeId?: string;
  designation: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  allowance: number;
  pf: number;
  esi: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  grossSalary: number;
  totalDeductions: number;
  netPayable: number;
  adjustments?: any[];
}

const getMonthName = (month: number) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[month - 1] || "";
};

const formatCurrency = (amount: number) => {
  return amount?.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'INR'
  }) || '₹0.00';
};

// Simple number to words converter for INR
const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  
  const numStr = num.toString();
  if (numStr.length > 9) return 'Amount too large';
  
  const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  
  let str = '';
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
  
  return str.trim() + ' Rupees Only';
};

export const SalarySlipPDF = ({
  employeeName,
  designation,
  month,
  year,
  basicSalary = 0,
  hra = 0,
  allowance = 0,
  pf = 0,
  esi = 0,
  professionalTax = 0,
  incomeTax = 0,
  otherDeductions = 0,
  grossSalary = 0,
  totalDeductions = 0,
  netPayable = 0,
  adjustments = [],
}: SalarySlipProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>Malee House</Text>
          <Text style={styles.companyAddress}>123 Business Park, City, State - 123456</Text>
          <Text style={styles.documentTitle}>Payslip for the month of {getMonthName(month)} {year}</Text>
        </View>

        <View style={styles.employeeSection}>
          <View style={styles.employeeCol}>
            <View style={styles.employeeRow}>
              <Text style={styles.empLabel}>Employee Name:</Text>
              <Text style={styles.empValue}>{employeeName}</Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.empLabel}>Designation:</Text>
              <Text style={styles.empValue}>{designation}</Text>
            </View>
          </View>
          <View style={styles.employeeCol}>
            <View style={styles.employeeRow}>
              <Text style={styles.empLabel}>Pay Period:</Text>
              <Text style={styles.empValue}>{getMonthName(month)} {year}</Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.empLabel}>Generated On:</Text>
              <Text style={styles.empValue}>{new Date().toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.salarySection}>
          <View style={styles.salaryHeader}>
            <Text style={styles.salaryHeaderCell}>EARNINGS</Text>
            <Text style={styles.salaryHeaderCellLast}>DEDUCTIONS</Text>
          </View>
          
          <View style={styles.salaryBody}>
            <View style={styles.salaryCol}>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}>Basic Salary</Text>
                <Text style={styles.itemValue}>{formatCurrency(basicSalary)}</Text>
              </View>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}>House Rent Allowance</Text>
                <Text style={styles.itemValue}>{formatCurrency(hra)}</Text>
              </View>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}>Special Allowance</Text>
                <Text style={styles.itemValue}>{formatCurrency(allowance)}</Text>
              </View>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}></Text>
                <Text style={styles.itemValue}></Text>
              </View>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}></Text>
                <Text style={styles.itemValue}></Text>
              </View>
            </View>
            
            <View style={styles.salaryColLast}>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}>Provident Fund (PF)</Text>
                <Text style={styles.itemValue}>{formatCurrency(pf)}</Text>
              </View>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}>ESI</Text>
                <Text style={styles.itemValue}>{formatCurrency(esi)}</Text>
              </View>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}>Professional Tax</Text>
                <Text style={styles.itemValue}>{formatCurrency(professionalTax)}</Text>
              </View>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}>Income Tax (TDS)</Text>
                <Text style={styles.itemValue}>{formatCurrency(incomeTax)}</Text>
              </View>
              <View style={styles.salaryRow}>
                <Text style={styles.itemLabel}>Other Deductions</Text>
                <Text style={styles.itemValue}>{formatCurrency(otherDeductions)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.salaryFooter}>
            <View style={styles.salaryTotalCell}>
              <Text>Total Earnings</Text>
              <Text>{formatCurrency(grossSalary)}</Text>
            </View>
            <View style={styles.salaryTotalCellLast}>
              <Text>Total Deductions</Text>
              <Text>{formatCurrency(totalDeductions)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.netPayableSection}>
          <View style={styles.netPayableBox}>
            <View style={styles.netPayableRow}>
              <Text style={styles.netPayableLabel}>Net Payable Amount:</Text>
              <Text style={styles.netPayableValue}>{formatCurrency(netPayable)}</Text>
            </View>
            <Text style={styles.netPayableWords}>{numberToWords(netPayable)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLine}>
            This is a computer-generated document and does not require a signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
