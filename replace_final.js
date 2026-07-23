const fs = require('fs');

const replacements = [
  {
    file: 'src/actions/expense.actions.ts',
    lineMatches: ['.select(\'*, projects(name, client_name), profiles!created_by(first_name, last_name), bank_accounts(bank_name)\');'],
    tableCols: 'id, amount, category, description, date, status, created_at, created_by, project_id, bank_account_id, vendor_name, reference_number, type, bank_accounts(bank_name), projects(name, client_name), profiles!created_by(first_name, last_name)'
  },
  {
    file: 'src/actions/payroll.actions.ts',
    lineMatches: ['.select(\'*, salary_slips(emailed, status)\')', '.select(\'*\')'],
    tableCols: 'id, employee_id, month, year, created_at, status, salary_slips(emailed, status)'
  },
  {
    file: 'src/actions/payroll_workflow.actions.ts',
    lineMatches: ['.select(\'*, profiles(first_name, last_name, role)\')'],
    tableCols: 'id, employee_id, month, year, created_at, status, basic, hra, conveyance, special_allowance, gross, pf, esi, tds, total_deductions, net_salary, emailed, profiles(first_name, last_name, role)'
  },
  {
    file: 'src/actions/reconciliation.actions.ts',
    lineMatches: ['.select("*, reconciled_by_profile:profiles!reconciled_by(first_name, last_name), superseded_by_profile:profiles!superseded_by(first_name, last_name)")'],
    tableCols: 'id, account_id, reconciled_by, superseded_by, status, created_at, total_amount, reconciled_by_profile:profiles!reconciled_by(first_name, last_name), superseded_by_profile:profiles!superseded_by(first_name, last_name)'
  },
  {
    file: 'src/actions/storage.actions.ts',
    lineMatches: ['.select(\'*, uploaded_by_profile:profiles!uploaded_by(first_name, last_name)\')'],
    tableCols: 'id, name, url, size, type, uploaded_by, created_at, project_id, uploaded_at, file_path, file_name, file_size, file_type, uploaded_by_profile:profiles!uploaded_by(first_name, last_name)'
  },
  {
    file: 'src/app/receipts/[id]/page.tsx',
    lineMatches: ['.select(\'*, projects(name, client_name, gst_number)\')', '.select(\'*, projects(name, client_name, id, gst_number)\')'],
    tableCols: 'id, amount, project_id, status, created_at, receipt_number, date, payment_method, client_name, projects(id, name, client_name, gst_number)'
  }
];

for (const r of replacements) {
  let content = fs.readFileSync(r.file, 'utf8');
  for (const matchStr of r.lineMatches) {
     const newStr = `.select('${r.tableCols}')`;
     content = content.split(matchStr).join(newStr);
     // also handle double quote variations just in case
     const matchStrDouble = matchStr.replace(/'/g, '"');
     content = content.split(matchStrDouble).join(newStr);
  }
  fs.writeFileSync(r.file, content, 'utf8');
  console.log('Fixed', r.file);
}
