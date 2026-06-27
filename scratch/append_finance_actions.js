const fs = require('fs');
const p = 'E:/Triple S Production/MaleeHouse-main/src/actions/finance.actions.ts';
let code = fs.readFileSync(p, 'utf8');

const newCode = `
export async function getFinancialOverviewAction(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    
    // Fetch all relevant data
    const [paymentsRes, expensesRes, invoicesRes] = await Promise.all([
      supabase.from('payments').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('invoices').select('*')
    ]);

    const payments = paymentsRes.data || [];
    const expenses = expensesRes.data || [];
    const invoices = invoicesRes.data || [];

    let totalIncome = 0;
    payments.forEach((p: any) => {
      if (p.status === 'verified' || p.status === 'approved' || p.status === 'paid' || p.status === 'pending') {
        // Treating all recorded payments as income (unless specifically rejected)
        if (p.status !== 'rejected') totalIncome += Number(p.amount || 0);
      }
    });

    let totalExpenses = 0;
    expenses.forEach((e: any) => {
      totalExpenses += Number(e.amount || 0);
    });

    // Monthly profit for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let currentMonthIncome = 0;
    payments.forEach((p: any) => {
      if (p.status !== 'rejected') {
        const d = new Date(p.payment_date || p.created_at);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          currentMonthIncome += Number(p.amount || 0);
        }
      }
    });

    let currentMonthExpense = 0;
    expenses.forEach((e: any) => {
      const d = new Date(e.expense_date || e.created_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        currentMonthExpense += Number(e.amount || 0);
      }
    });

    const monthlyProfit = currentMonthIncome - currentMonthExpense;

    // Accounts Receivable (Invoiced minus Paid)
    let totalInvoiced = 0;
    invoices.forEach((i: any) => {
      if (i.status !== 'cancelled') totalInvoiced += Number(i.total_amount || 0);
    });
    const accountsReceivable = Math.max(0, totalInvoiced - totalIncome);

    // Accounts Payable (Pending Expenses)
    let accountsPayable = 0;
    expenses.forEach((e: any) => {
      if (e.status === 'pending') {
        accountsPayable += Number(e.amount || 0);
      }
    });

    // Cash flow grouped by month (Jan-Dec for current year)
    const monthlyCashFlowMap: Record<number, { income: number, expense: number }> = {};
    for (let i = 0; i < 12; i++) monthlyCashFlowMap[i] = { income: 0, expense: 0 };

    payments.forEach((p: any) => {
      if (p.status !== 'rejected') {
        const d = new Date(p.payment_date || p.created_at);
        if (d.getFullYear() === currentYear) {
          monthlyCashFlowMap[d.getMonth()].income += Number(p.amount || 0);
        }
      }
    });

    expenses.forEach((e: any) => {
      const d = new Date(e.expense_date || e.created_at);
      if (d.getFullYear() === currentYear) {
        monthlyCashFlowMap[d.getMonth()].expense += Number(e.amount || 0);
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCashFlow = Object.keys(monthlyCashFlowMap).map(m => ({
      month: monthNames[Number(m)],
      income: monthlyCashFlowMap[Number(m)].income,
      expense: monthlyCashFlowMap[Number(m)].expense
    }));

    // Expense by category
    const categoryMap: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const cat = e.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
    });
    const expenseByCategory = Object.keys(categoryMap).map(k => ({
      name: k,
      value: categoryMap[k]
    }));

    return {
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        monthlyProfit,
        accountsReceivable,
        accountsPayable,
        monthlyCashFlow,
        expenseByCategory
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectProfitabilityAction(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    
    const [projectsRes, invoicesRes, expensesRes] = await Promise.all([
      supabase.from('projects').select('id, name'),
      supabase.from('invoices').select('project_id, total_amount, status'),
      supabase.from('expenses').select('project_id, amount')
    ]);

    const projects = projectsRes.data || [];
    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];

    const profitMap: Record<string, { id: string, name: string, invoiced: number, expenses: number, margin: number }> = {};

    projects.forEach((p: any) => {
      profitMap[p.id] = { id: p.id, name: p.name, invoiced: 0, expenses: 0, margin: 0 };
    });

    invoices.forEach((i: any) => {
      if (i.status !== 'cancelled' && profitMap[i.project_id]) {
        profitMap[i.project_id].invoiced += Number(i.total_amount || 0);
      }
    });

    expenses.forEach((e: any) => {
      if (e.project_id && profitMap[e.project_id]) {
        profitMap[e.project_id].expenses += Number(e.amount || 0);
      }
    });

    const result = Object.values(profitMap).map(p => ({
      ...p,
      margin: p.invoiced - p.expenses
    }));

    result.sort((a, b) => b.margin - a.margin);

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`;

fs.writeFileSync(p, code + '\n' + newCode);
console.log('Appended actions.');
