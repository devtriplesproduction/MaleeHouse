import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    width: 55,
    height: 55,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Helvetica-BoldOblique',
    marginTop: 2,
  },
  companyInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  companyNameBlue: {
    fontSize: 28,
    color: '#0070d2',
    fontFamily: 'Helvetica-Bold',
  },
  companyNamePink: {
    fontSize: 28,
    color: '#e11d48',
    fontFamily: 'Helvetica-Bold',
  },
  tagline: {
    fontSize: 10,
    color: '#4b5563',
    fontFamily: 'Helvetica-Oblique',
    marginBottom: 4,
  },
  flourishContainer: {
    alignSelf: 'center',
    marginBottom: 2,
    width: 140,
  },
  companyAddress: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 2,
  },
  documentTitleContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  documentTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0c2e5c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  documentSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0c2e5c',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  employeeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 15,
  },
  employeeCol: {
    flex: 1,
  },
  employeeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  empLabel: {
    width: 100,
    color: '#64748b',
    fontSize: 9,
  },
  empValue: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    fontSize: 9,
  },
  salarySection: {
    marginBottom: 25,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  salaryHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  salaryHeaderCell: {
    flex: 1,
    padding: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0c2e5c',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    fontSize: 10,
  },
  salaryHeaderCellLast: {
    flex: 1,
    padding: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0c2e5c',
    fontSize: 10,
  },
  salaryBody: {
    flexDirection: 'row',
  },
  salaryCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  salaryColLast: {
    flex: 1,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemLabel: {
    color: '#475569',
    fontSize: 9,
  },
  itemValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    fontSize: 9,
  },
  salaryFooter: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  salaryTotalCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    fontFamily: 'Helvetica-Bold',
    color: '#0c2e5c',
  },
  salaryTotalCellLast: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0c2e5c',
  },
  netPayableSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  bankDetails: {
    flex: 1,
    paddingRight: 20,
  },
  netPayableBox: {
    backgroundColor: '#0c2e5c',
    borderRadius: 6,
    padding: 15,
    width: 250,
  },
  netPayableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  netPayableLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#e2e8f0',
  },
  netPayableValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  netPayableWords: {
    fontSize: 9,
    color: '#94a3b8',
    fontFamily: 'Helvetica-Oblique',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  footerText: {
    textAlign: 'center',
    color: '#94a3b8',
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
  department?: string;
  joiningDate?: string | null;
  daysPresent?: number;
  daysField?: number;
  daysPaidLeave?: number;
  daysUnpaidLeave?: number;
  daysAbsent?: number;
  baseSalary?: number;
  bonus?: number;
  overtimeHours?: number;
  overtimePay?: number;
  panNumber?: string | null;
  uanNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
}

const getMonthName = (month: number) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[month - 1] || "";
};

const formatCurrency = (amount: number) => {
  const str = amount?.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }) || '0.00';
  return `₹ ${str}`;
};

// Simple number to words converter for INR
const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  
  const numStr = Math.floor(num).toString();
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

import path from 'path';
import fs from 'fs';

const Logo = () => {
  let logoSrc: any = null;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'maleehouse Logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoSrc = { data: logoBuffer, format: 'png' };
  } catch (e) {
    console.error("Failed to load logo image", e);
  }
  
  return (
    <View style={{ justifyContent: 'center', alignItems: 'flex-start', marginVertical: -15, marginLeft: -10 }}>
      {logoSrc && <Image src={logoSrc} style={{ height: 60 }} />}
    </View>
  );
};

export const SalarySlipPDF = ({
  employeeName,
  employeeId,
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
  department,
  joiningDate,
  daysPresent = 0,
  daysField = 0,
  daysPaidLeave = 0,
  daysUnpaidLeave = 0,
  daysAbsent = 0,
  baseSalary = 0,
  bonus = 0,
  overtimeHours = 0,
  overtimePay = 0,
  panNumber,
  uanNumber,
  bankName,
  bankAccountNumber,
  bankIfsc
}: SalarySlipProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Logo />
          </View>
          <View style={styles.documentTitleContainer}>
            <Text style={styles.documentTitle}>Payslip</Text>
            <Text style={styles.documentSubtitle}>{getMonthName(month)} {year}</Text>
          </View>
        </View>

        {/* Employee Summary Section */}
        <View style={styles.employeeSection}>
          <View style={styles.employeeCol}>
            <View style={styles.employeeRow}><Text style={styles.empLabel}>Employee Name:</Text><Text style={styles.empValue}>{employeeName}</Text></View>
            <View style={styles.employeeRow}><Text style={styles.empLabel}>Employee ID:</Text><Text style={styles.empValue}>{employeeId || 'N/A'}</Text></View>
            <View style={styles.employeeRow}><Text style={styles.empLabel}>Department:</Text><Text style={styles.empValue}>{department || 'N/A'}</Text></View>
            <View style={styles.employeeRow}><Text style={styles.empLabel}>Designation:</Text><Text style={styles.empValue}>{designation}</Text></View>
            <View style={styles.employeeRow}><Text style={styles.empLabel}>Date of Joining:</Text><Text style={styles.empValue}>{joiningDate ? new Date(joiningDate).toLocaleDateString('en-IN') : 'N/A'}</Text></View>
          </View>
          <View style={styles.employeeCol}>
            <View style={styles.employeeRow}><Text style={styles.empLabel}>Pay Period:</Text><Text style={styles.empValue}>{getMonthName(month)} {year}</Text></View>
            <View style={styles.employeeRow}><Text style={styles.empLabel}>Generated On:</Text><Text style={styles.empValue}>{new Date().toLocaleDateString('en-IN')}</Text></View>
            
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#0c2e5c', marginBottom: 4 }}>Attendance Summary</Text>
              <View style={styles.employeeRow}><Text style={styles.empLabel}>Present / Field:</Text><Text style={styles.empValue}>{daysPresent} / {daysField}</Text></View>
              <View style={styles.employeeRow}><Text style={styles.empLabel}>Leaves (Paid/Unpaid):</Text><Text style={styles.empValue}>{daysPaidLeave} / {daysUnpaidLeave}</Text></View>
              <View style={styles.employeeRow}><Text style={styles.empLabel}>Absent:</Text><Text style={styles.empValue}>{daysAbsent}</Text></View>
            </View>
          </View>
        </View>

        {/* Salary Details Section */}
        <View style={styles.salarySection}>
          <View style={styles.salaryHeader}>
            <Text style={styles.salaryHeaderCell}>EARNINGS</Text>
            <Text style={styles.salaryHeaderCellLast}>DEDUCTIONS</Text>
          </View>
          
          <View style={styles.salaryBody}>
            <View style={styles.salaryCol}>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>Basic Salary</Text><Text style={styles.itemValue}>{formatCurrency(basicSalary)}</Text></View>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>House Rent Allowance</Text><Text style={styles.itemValue}>{formatCurrency(hra)}</Text></View>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>Special Allowance</Text><Text style={styles.itemValue}>{formatCurrency(allowance)}</Text></View>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>Bonus</Text><Text style={styles.itemValue}>{formatCurrency(bonus)}</Text></View>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>Overtime Pay ({overtimeHours} hrs)</Text><Text style={styles.itemValue}>{formatCurrency(overtimePay)}</Text></View>
            </View>
            
            <View style={styles.salaryColLast}>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>Provident Fund (PF)</Text><Text style={styles.itemValue}>{formatCurrency(pf)}</Text></View>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>ESI</Text><Text style={styles.itemValue}>{formatCurrency(esi)}</Text></View>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>Professional Tax</Text><Text style={styles.itemValue}>{formatCurrency(professionalTax)}</Text></View>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>Income Tax (TDS)</Text><Text style={styles.itemValue}>{formatCurrency(incomeTax)}</Text></View>
              <View style={styles.salaryRow}><Text style={styles.itemLabel}>Other Deductions</Text><Text style={styles.itemValue}>{formatCurrency(otherDeductions)}</Text></View>
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

        {/* Footer Details */}
        <View style={styles.netPayableSection}>
          <View style={styles.bankDetails}>
            {panNumber && <View style={styles.employeeRow}><Text style={styles.empLabel}>PAN Number:</Text><Text style={styles.empValue}>{panNumber}</Text></View>}
            {uanNumber && <View style={styles.employeeRow}><Text style={styles.empLabel}>UAN Number:</Text><Text style={styles.empValue}>{uanNumber}</Text></View>}
            {bankName && <View style={styles.employeeRow}><Text style={styles.empLabel}>Bank Name:</Text><Text style={styles.empValue}>{bankName}</Text></View>}
            {bankAccountNumber && <View style={styles.employeeRow}><Text style={styles.empLabel}>Account No:</Text><Text style={styles.empValue}>{bankAccountNumber.replace(/.(?=.{4})/g, 'X')}</Text></View>}
            {bankIfsc && <View style={styles.employeeRow}><Text style={styles.empLabel}>IFSC Code:</Text><Text style={styles.empValue}>{bankIfsc}</Text></View>}
          </View>
          
          <View style={styles.netPayableBox}>
            <View style={styles.netPayableRow}>
              <Text style={styles.netPayableLabel}>Net Payable</Text>
              <Text style={styles.netPayableValue}>{formatCurrency(netPayable)}</Text>
            </View>
            <Text style={styles.netPayableWords}>{numberToWords(netPayable)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a computer-generated document and does not require a physical signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
