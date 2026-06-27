
const fs = require('fs');
const p = 'E:/Triple S Production/MaleeHouse-main/src/app/(modules)/accounts/page.tsx';
let code = fs.readFileSync(p, 'utf8');

// 1. Imports
code = code.replace(
  'import { getAllMilestonesAction } from \'@/actions/finance.actions\';',
  'import { getAllMilestonesAction, getFinancialOverviewAction, getProjectProfitabilityAction } from \'@/actions/finance.actions\';\nimport { FinanceChart } from \'@/features/accounts/FinanceChart\';\nimport { ArrowUpRight, ArrowDownRight, Wallet, Clock, CheckSquare } from \'lucide-react\';'
);
// I used double quotes in the file probably. Let's just use replace with regex.

