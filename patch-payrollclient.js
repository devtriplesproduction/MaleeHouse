const fs = require('fs');

let code = fs.readFileSync('src/app/(modules)/hr/payroll/PayrollClient.tsx', 'utf8');

// 1. Add import for notifySalarySlipsAction
if (!code.includes('notifySalarySlipsAction')) {
  code = code.replace(
    /unlockPayrollCycleAction,/,
    `unlockPayrollCycleAction,\n  notifySalarySlipsAction,`
  );
}

// 2. Add handleNotifyAll function
if (!code.includes('const handleNotifyAll')) {
  const handler = `
  const handleNotifyAll = async () => {
    if (!existingCycleId) return;
    setActionLoading(true);
    const loadingToastId = toast.loading(\`Sending notifications to all employees...\`);
    const res = await notifySalarySlipsAction(existingCycleId, month, year);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message, { id: loadingToastId });
      loadData(); // Reload to update status
    } else {
      toast.error(res.error || "Failed to send notifications.", { id: loadingToastId });
    }
  };
`;
  code = code.replace(/const handleViewSlip = async/, handler + '\n  const handleViewSlip = async');
}

// 3. Add Notify Button to UI
if (!code.includes('Notify Employees')) {
  code = code.replace(
    /<Button variant="outline" className="text-red-600 hover:text-red-700" onClick=\{handleUnlock\}/,
    `
              <Button variant="outline" className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20" onClick={handleNotifyAll} disabled={loading || actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Notify Employees
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleUnlock}`
  );
}

// Ensure Mail icon is imported
if (!code.includes('Mail,')) {
  code = code.replace(/import \{ \n\s*FileText,/, `import {\n  Mail,\n  FileText,`);
}

fs.writeFileSync('src/app/(modules)/hr/payroll/PayrollClient.tsx', code);
console.log('Patch PayrollClient.tsx complete.');
