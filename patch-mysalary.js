const fs = require('fs');

let code = fs.readFileSync('src/app/(modules)/employee/salary/MySalaryClient.tsx', 'utf8');

if (!code.includes('employee_id: string;')) {
  code = code.replace(
    /pdf_url: string \| null;/,
    `pdf_url: string | null;
  employee_id: string;
  snapshot_id: string;`
  );
}

if (!code.includes('import { getSalarySlipUrlAction }')) {
  code = code.replace(
    /import \{ SalarySlipPreviewDialog \} from "@\/components\/modules\/SalarySlipPreviewDialog";/,
    `import { SalarySlipPreviewDialog } from "@/components/modules/SalarySlipPreviewDialog";\nimport { getSalarySlipUrlAction } from "@/actions/payroll.actions";`
  );
}

if (!code.includes('const handleRefreshUrl = async ()')) {
  const handler = `
  const handleRefreshUrl = async () => {
    if (!selectedSlip) return null;
    const res = await getSalarySlipUrlAction(selectedSlip.snapshot_id, selectedSlip.employee_id, selectedSlip.month, selectedSlip.year);
    if (res.success && res.url) {
      return res.url;
    }
    return null;
  };
`;
  code = code.replace(/const getMonthName/, handler + '\n  const getMonthName');
}

if (!code.includes('onRefreshUrl={handleRefreshUrl}')) {
  code = code.replace(
    /pdfUrl=\{selectedSlip\?\.pdf_url\} \s*\/>/,
    `pdfUrl={selectedSlip?.pdf_url} \n        onRefreshUrl={handleRefreshUrl}\n      />`
  );
}

fs.writeFileSync('src/app/(modules)/employee/salary/MySalaryClient.tsx', code);
console.log('Patch MySalaryClient.tsx complete.');
