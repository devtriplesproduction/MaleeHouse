const fs = require('fs');

let code = fs.readFileSync('src/actions/payroll.actions.ts', 'utf8');

// 1. Add headers import if not exists
if (!code.includes('import { headers }')) {
  code = code.replace(
    /import \{ normalizeData \} from '@\/lib\/normalize';/,
    `import { normalizeData } from '@/lib/normalize';\nimport { headers } from "next/headers";`
  );
}

// 2. Inject logPayrollEvent
if (!code.includes('async function logPayrollEvent')) {
  const injection = `
async function logPayrollEvent(
  action: string, 
  targetUserId: string | null | undefined, 
  details: any,
  severity: 'info' | 'warning' | 'critical' | 'security' = 'info'
) {
  let ip = null;
  let userAgent = null;
  try {
    const headersList = await headers();
    ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null;
    userAgent = headersList.get('user-agent') || null;
  } catch(e) {
    // ignore outside request
  }

  await logAdminAuditAction({
    action,
    targetUserId: targetUserId ?? undefined,
    severity,
    details: {
      ...details,
      ip_address: ip,
      user_agent: userAgent
    }
  });
}
`;
  code = code.replace(/export interface PayrollCycle/, injection + '\nexport interface PayrollCycle');
}

// 3. Update logAdminAuditAction calls for Lock/Unlock
code = code.replace(
  /await logAdminAuditAction\(\{[\s\S]*?action:\s*"PAYROLL_CYCLE_LOCKED"[\s\S]*?\}\);/g,
  `await logPayrollEvent("PAYROLL_CYCLE_LOCKED", null, { month, year, snapshot_count: frozenSnapshots.length, cycle_id: cycleId }, "critical");`
);

code = code.replace(
  /await logAdminAuditAction\(\{[\s\S]*?action:\s*"PAYROLL_CYCLE_UNLOCKED"[\s\S]*?\}\);/g,
  `await logPayrollEvent("PAYROLL_CYCLE_UNLOCKED", null, { month, year, cycle_id: existing.id }, "critical");`
);

// 4. Add Salary Slip Generation Log inside lockPayrollCycleAction loop
// Look for where we push to salarySlipsToInsert
code = code.replace(
  /salarySlipsToInsert\.push\(\{[\s\S]*?generated_by:\s*profile\.id\s*\}\);/g,
  `$&
        await logPayrollEvent(
          "SALARY_SLIP_GENERATED",
          snap.employee_id,
          { employee_id: snap.employee_id, cycle_id: cycleId, snapshot_id: snap.id, month, year },
          "info"
        );`
);

// 5. Update unlock action to select employee_id and log deletions
code = code.replace(
  /\.select\('pdf_url'\)\s*\n\s*\.eq\('cycle_id', existing\.id\);/,
  `.select('pdf_url, employee_id, snapshot_id, cycle_id')\n      .eq('cycle_id', existing.id);`
);

code = code.replace(
  /const filePaths = slipsToDelete\s*\n\s*\.map/m,
  `// Log deletions
      for (const s of slipsToDelete) {
        await logPayrollEvent("SALARY_SLIP_DELETED", s.employee_id, { employee_id: s.employee_id, cycle_id: s.cycle_id, snapshot_id: s.snapshot_id, month, year }, "warning");
      }
      
      const filePaths = slipsToDelete\n        .map`
);

// 6. emailSalarySlipAction
code = code.replace(
  /return \{ success: true, message: `Salary slip emailed to \$\{employeeName\}\.` \};/g,
  `await logPayrollEvent("SALARY_SLIP_EMAILED", slip.employee_id, { employee_id: slip.employee_id, snapshot_id: snapshotId, pdf_url: slip.pdf_url }, "info");
    return { success: true, message: \`Salary slip emailed to \${employeeName}.\` };`
);

// 7. generateSignedSalarySlipUrlAction (Download)
code = code.replace(
  /\.select\('pdf_url'\)\s*\n\s*\.eq\('snapshot_id', snapshotId\)/,
  `.select('pdf_url, employee_id, cycle_id')\n      .eq('snapshot_id', snapshotId)`
);

code = code.replace(
  /return \{ success: true, signedUrl: data\.signedUrl \};/g,
  `await logPayrollEvent("SALARY_SLIP_DOWNLOADED", slip.employee_id, { employee_id: slip.employee_id, snapshot_id: snapshotId, cycle_id: slip.cycle_id }, "info");
    return { success: true, signedUrl: data.signedUrl };`
);

// 8. markSalarySlipSharedAction (Share)
// We need to fetch slip to get employee_id
code = code.replace(
  /const \{ error \} = await supabaseAdmin\s*\n\s*\.from\('salary_slips'\)\s*\n\s*\.update\(\{ shared: true \}\)\s*\n\s*\.eq\('snapshot_id', snapshotId\);/m,
  `const { data: slipToShare } = await supabaseAdmin.from('salary_slips').select('employee_id, cycle_id').eq('snapshot_id', snapshotId).single();
    const { error } = await supabaseAdmin
      .from('salary_slips')
      .update({ shared: true })
      .eq('snapshot_id', snapshotId);
      
    if (slipToShare) {
      await logPayrollEvent("SALARY_SLIP_SHARED", slipToShare.employee_id, { employee_id: slipToShare.employee_id, snapshot_id: snapshotId, cycle_id: slipToShare.cycle_id }, "info");
    }`
);

// 9. getSalarySlipUrlAction (View)
code = code.replace(
  /return \{ success: true, url: signedUrlData\.signedUrl \};/g,
  `await logPayrollEvent("SALARY_SLIP_VIEWED", slip.employee_id, { employee_id: slip.employee_id, snapshot_id: snapshotId, cycle_id: slip.cycle_id }, "info");
    return { success: true, url: signedUrlData.signedUrl };`
);


fs.writeFileSync('src/actions/payroll.actions.ts', code);
console.log('Patch complete.');
