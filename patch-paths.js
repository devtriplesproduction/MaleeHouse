const fs = require('fs');

let code = fs.readFileSync('src/actions/payroll.actions.ts', 'utf8');

// 1. Add getStoragePathFromUrl helper
if (!code.includes('function getStoragePathFromUrl')) {
  const injection = `
function getStoragePathFromUrl(pdfUrl: string): string {
  try {
    const urlObj = new URL(pdfUrl);
    const bucketStr = '/salary_slips/';
    const bucketIndex = urlObj.pathname.indexOf(bucketStr);
    if (bucketIndex !== -1) {
      return decodeURIComponent(urlObj.pathname.substring(bucketIndex + bucketStr.length));
    }
  } catch (e) {
    // ignore
  }
  const parts = pdfUrl.split('?')[0].split('/');
  return decodeURIComponent(parts[parts.length - 1]);
}
`;
  code = code.replace(/export interface PayrollCycle/, injection + '\nexport interface PayrollCycle');
}

// 2. Change file name format in lockPayrollCycleAction
code = code.replace(
  /let fileName = `salary_slip_\$\{snap\.employee_id\}_\$\{month\}_\$\{year\}\.pdf`;/,
  `let fileName = \`\$\{year\}/\$\{month\}/\$\{snap.employee_id\}/salary-slip.pdf\`;`
);

// 3. Change upsert: true to upsert: false in lockPayrollCycleAction to prevent overwrites
code = code.replace(
  /contentType: 'application\/pdf',\s*upsert: true/,
  `contentType: 'application/pdf',\n              upsert: false`
);

// 4. Update unlockPayrollCycleAction file paths mapping
code = code.replace(
  /const parts = s\.pdf_url\.split\('\/'\);\s*return parts\[parts\.length - 1\];/,
  `return getStoragePathFromUrl(s.pdf_url);`
);

// 5. Update emailSalarySlipAction
code = code.replace(
  /const urlParts = slip\.pdf_url\.split\('\/'\);\s*const fileName = urlParts\[urlParts\.length - 1\];/,
  `const fileName = getStoragePathFromUrl(slip.pdf_url);`
);

// 6. Update generateSignedSalarySlipUrlAction
code = code.replace(
  /const urlParts = slip\.pdf_url\.split\('\/'\);\s*const fileName = urlParts\[urlParts\.length - 1\];/,
  `const fileName = getStoragePathFromUrl(slip.pdf_url);`
);

// 7. Update getSalarySlipUrlAction
code = code.replace(
  /const urlParts = slip\.pdf_url\.split\('\/'\);\s*fileName = urlParts\[urlParts\.length - 1\];/,
  `fileName = getStoragePathFromUrl(slip.pdf_url);`
);


fs.writeFileSync('src/actions/payroll.actions.ts', code);
console.log('Patch complete.');
