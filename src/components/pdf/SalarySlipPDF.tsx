import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  documentTitle: {
    fontSize: 16,
    color: '#666',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 5,
    marginBottom: 10,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    color: '#6b7280',
  },
  value: {
    flex: 1,
    fontWeight: 'bold',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  tableColLeft: {
    flex: 1,
  },
  tableColRight: {
    width: 100,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#1e3a8a',
    marginTop: 10,
    paddingTop: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

interface SalarySlipProps {
  employeeName: string;
  employeeId?: string;
  designation: string;
  month: number;
  year: number;
  grossSalary: number;
  totalDeductions: number;
  netPayable: number;
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

export const SalarySlipPDF = ({
  employeeName,
  designation,
  month,
  year,
  grossSalary,
  totalDeductions,
  netPayable,
}: SalarySlipProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>MaleeHouse OS</Text>
          <Text style={styles.documentTitle}>Salary Slip</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{employeeName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Designation:</Text>
            <Text style={styles.value}>{designation}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payroll Period:</Text>
            <Text style={styles.value}>{getMonthName(month)} {year}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Salary Details</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableColLeft}>Description</Text>
              <Text style={styles.tableColRight}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLeft}>Gross Earnings</Text>
              <Text style={styles.tableColRight}>{formatCurrency(grossSalary)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColLeft}>Total Deductions</Text>
              <Text style={styles.tableColRight}>-{formatCurrency(totalDeductions)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.tableColLeft}>Net Payable Salary</Text>
              <Text style={[styles.tableColRight, { color: '#166534' }]}>{formatCurrency(netPayable)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          This is a computer-generated document. No signature is required.
          {'\n'}Generated on {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
};
