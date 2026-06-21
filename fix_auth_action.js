const fs = require('fs');

const path = 'src/actions/auth.actions.ts';
let code = fs.readFileSync(path, 'utf8');

// We need to import redirect from next/navigation
if (!code.includes("import { redirect }")) {
  code = "import { redirect } from 'next/navigation'\n" + code;
}

// Modify loginAction to use redirect
code = code.replace(
  /return \{ success: true, redirectPath, forcePasswordReset: !!profile\.force_password_reset \}/g,
  "// Removed return to use redirect"
);

// We should also look at how we handle it in LoginForm
fs.writeFileSync(path, code);
