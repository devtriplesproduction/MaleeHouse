const fs = require('fs');

let code = fs.readFileSync('src/actions/payroll.actions.ts', 'utf8');

// 1. lockPayrollCycleAction Validation Messages
code = code.replace(
  /throw new Error\(`Failed to list buckets: \$\{bucketsError\.message\}`\);/,
  `throw new Error("Validation Error: Storage bucket is not available.");`
);
code = code.replace(
  /throw new Error\(`Failed to create salary_slips bucket: \$\{createBucketError\.message\}`\);/,
  `throw new Error("Validation Error: Storage bucket is not available.");`
);

// 2. getSalarySlipUrlAction Validation Messages (View)
code = code.replace(
  /return \{ success: false, error: 'Unauthorized access to salary slip\.' \};/,
  `return { success: false, error: 'Validation Error: Employee does not have permission.' };`
);
code = code.replace(
  /return \{ success: false, error: "Salary slip not generated\." \};/,
  `return { success: false, error: "Validation Error: Salary slip does not exist." };`
);
code = code.replace(
  /return \{ success: false, error: "Failed to generate secure file URL\." \};/,
  `return { success: false, error: "Validation Error: File does not exist in storage." };`
);

// 3. generateSignedSalarySlipUrlAction Validation Messages (Download)
code = code.replace(
  /return \{ success: false, error: "Salary slip file not found\." \};/,
  `return { success: false, error: "Validation Error: Salary slip does not exist." };`
);
code = code.replace(
  /return \{ success: false, error: "Failed to generate secure link\." \};/,
  `return { success: false, error: "Validation Error: Signed URL generation failed." };`
);

// 4. emailSalarySlipAction Validation Messages
code = code.replace(
  /return \{ success: false, error: "Salary slip not found for this snapshot\." \};/,
  `return { success: false, error: "Validation Error: Salary slip does not exist." };`
);
code = code.replace(
  /return \{ success: false, error: "No PDF generated for this salary slip\." \};/,
  `return { success: false, error: "Validation Error: Salary slip file does not exist." };`
);

fs.writeFileSync('src/actions/payroll.actions.ts', code);
console.log('Patch complete.');
