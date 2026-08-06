'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuthContext } from '@/lib/permissions/permissions';
import { getCompanySettingsAction } from '@/actions/settings.actions';

export interface ReportResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper to filter dates correctly
function filterByDate(data: any[], dateField: string, start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end);
  e.setHours(23, 59, 59, 999);
  const eTime = e.getTime();
  
  return data.filter(item => {
    const time = new Date(item[dateField]).getTime();
    return time >= s && time <= eTime;
  });
}

// Helper to fetch company and project details for report headers
async function getCompanyAndProjectDetails(supabase: any, projectId?: string) {
  const company = await getCompanySettingsAction();
  let project = {
    client_name: 'All Projects (Company-wide)',
    client_address: 'N/A',
    client_contact: 'N/A'
  };
  
  if (projectId) {
    const { data: projData } = await supabase.from('projects').select('client_name, client_address, client_contact').eq('id', projectId).single();
    if (projData) {
      project = projData;
    }
  }
  
  return { company, project };
}

export async function getProfitLossReportAction(start: string, end: string, projectId?: string): Promise<ReportResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };
    if (auth.role !== 'admin' && auth.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();

    const pId = projectId || null;
    const endISO = new Date(new Date(end).setHours(23, 59, 59, 999)).toISOString();
    const startISO = new Date(start).toISOString();
    
    const [revRes, expRes, details] = await Promise.all([
      supabase.rpc('get_revenue_by_project', { p_start_date: startISO, p_end_date: endISO, p_project_id: pId }),
      supabase.rpc('get_expense_by_category', { p_start_date: startISO, p_end_date: endISO, p_project_id: pId }),
      getCompanyAndProjectDetails(supabase, projectId)
    ]);

    if (revRes.error) throw revRes.error;
    if (expRes.error) throw expRes.error;

    let totalRevenue = 0;
    const revenueByProject: Record<string, number> = {};

    (revRes.data || []).forEach((row: any) => {
      const amt = Number(row.total_amount || 0);
      if (amt > 0) { 
        totalRevenue += amt;
        revenueByProject[row.project_name] = (revenueByProject[row.project_name] || 0) + amt;
      }
    });

    let totalCosts = 0;
    const costsByCategory: Record<string, number> = {};

    (expRes.data || []).forEach((row: any) => {
      const amt = Number(row.total_amount || 0);
      if (amt > 0) {
        totalCosts += amt;
        costsByCategory[row.category] = (costsByCategory[row.category] || 0) + amt;
      }
    });

    return {
      success: true,
      data: {
        totalRevenue,
        totalCosts,
        netProfit: totalRevenue - totalCosts,
        revenueByProject,
        costsByCategory,
        company: details.company,
        project: details.project
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getIncomeStatementAction(start: string, end: string, projectId?: string): Promise<ReportResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };
    if (auth.role !== 'admin' && auth.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    
    const pId = projectId || null;
    const endISO = new Date(new Date(end).setHours(23, 59, 59, 999)).toISOString();
    const startISO = new Date(start).toISOString();
    
    const [revRes, txRes, details] = await Promise.all([
      supabase.rpc('get_revenue_by_project', { p_start_date: startISO, p_end_date: endISO, p_project_id: pId }),
      supabase.rpc('get_income_statement_transactions', { p_start_date: startISO, p_end_date: endISO, p_project_id: pId }),
      getCompanyAndProjectDetails(supabase, projectId)
    ]);

    if (revRes.error) throw revRes.error;
    if (txRes.error) throw txRes.error;

    let totalIncome = 0;
    const incomeByProject: Record<string, number> = {};

    (revRes.data || []).forEach((row: any) => {
      const amt = Number(row.total_amount || 0);
      if (amt > 0) {
        totalIncome += amt;
        incomeByProject[row.project_name] = (incomeByProject[row.project_name] || 0) + amt;
      }
    });

    const incomeTransactions = (txRes.data || []).map((t: any) => ({
      date: t.date,
      project: t.project,
      amount: Number(t.amount || 0)
    }));

    return {
      success: true,
      data: {
        totalIncome,
        incomeByProject,
        incomeTransactions,
        company: details.company,
        project: details.project
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getExpenseStatementAction(start: string, end: string, projectId?: string): Promise<ReportResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };
    if (auth.role !== 'admin' && auth.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    const pId = projectId || null;
    const endISO = new Date(new Date(end).setHours(23, 59, 59, 999)).toISOString();
    const startISO = new Date(start).toISOString();

    const [expensesRes, details] = await Promise.all([
      supabase.rpc('get_expense_by_category', { p_start_date: startISO, p_end_date: endISO, p_project_id: pId }),
      getCompanyAndProjectDetails(supabase, projectId)
    ]);

    if (expensesRes.error) throw expensesRes.error;

    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {};

    (expensesRes.data || []).forEach((row: any) => {
      const amt = Number(row.total_amount || 0);
      if (amt > 0) {
        totalExpenses += amt;
        expensesByCategory[row.category] = (expensesByCategory[row.category] || 0) + amt;
      }
    });

    return {
      success: true,
      data: {
        totalExpenses,
        expensesByCategory,
        company: details.company,
        project: details.project
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCashFlowStatementAction(start: string, end: string, projectId?: string): Promise<ReportResponse> {
  // Simple operational cash flow
  return getProfitLossReportAction(start, end, projectId);
}

export async function getBalanceSheetAction(asOfDate: string, projectId?: string): Promise<ReportResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };
    if (auth.role !== 'admin' && auth.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();
    
    const pId = projectId || null;
    const endISO = new Date(new Date(asOfDate).setHours(23, 59, 59, 999)).toISOString();

    const [bsRes, details] = await Promise.all([
      supabase.rpc('get_balance_sheet_summary', { p_as_of_date: endISO, p_project_id: pId }),
      getCompanyAndProjectDetails(supabase, projectId)
    ]);

    if (bsRes.error) throw bsRes.error;

    const row = bsRes.data?.[0] || { total_income: 0, total_expenses: 0, total_visit_cost: 0, total_invoiced: 0 };
    const totalIncome = Number(row.total_income || 0);
    const totalExpensesPaid = Number(row.total_expenses || 0) + Number(row.total_visit_cost || 0);
    const totalInvoiced = Number(row.total_invoiced || 0);
    
    const cashOnHand = totalIncome - totalExpensesPaid;
    const accountsReceivable = Math.max(0, totalInvoiced - totalIncome);
    const accountsPayable = 0; // Keeping original logic where it was explicitly calculated from pending expenses which is 0

    const assets = {
      'Cash on Hand': cashOnHand,
      'Accounts Receivable': accountsReceivable
    };

    const liabilities = {
      'Accounts Payable': accountsPayable
    };

    const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);
    const equity = totalAssets - totalLiabilities; // balancing figure

    return {
      success: true,
      data: {
        assets,
        totalAssets,
        liabilities,
        totalLiabilities,
        equity,
        company: details.company,
        project: details.project
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectStatementAction(projectId: string): Promise<ReportResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };

    const supabase: any = await createClient();
    
    const [projectRes, stmtRes, company] = await Promise.all([
      supabase.from('projects').select('name, client_name, client_contact, client_address').eq('id', projectId).single(),
      supabase.rpc('get_project_statement_summary', { p_project_id: projectId }),
      getCompanySettingsAction()
    ]);

    if (projectRes.error || !projectRes.data) return { success: false, error: 'Project not found.' };
    if (stmtRes.error) throw stmtRes.error;

    let totalBilled = 0;
    let totalPaid = 0;

    const timeline = (stmtRes.data || []).map((m: any) => {
      const total = Number(m.total_amount || 0);
      totalBilled += total;
      if (m.status === 'paid') {
        totalPaid += total;
      }

      return {
        id: m.id,
        title: m.title,
        base_amount: Number(m.base_amount || 0),
        gst_amount: Number(m.gst_amount || 0),
        total_amount: total,
        status: m.status,
        due_date: m.due_date
      };
    });

    return {
      success: true,
      data: {
        project: {
          name: projectRes.data.name,
          client_name: projectRes.data.client_name,
          client_contact: projectRes.data.client_contact,
          client_address: projectRes.data.client_address
        },
        company: company || {
          name: 'Malee House',
          address: 'Default Address, City',
          telephone: 'N/A',
          gstin: 'N/A'
        },
        timeline,
        summary: {
          totalBilled,
          totalPaid,
          outstanding: Math.max(0, totalBilled - totalPaid)
        }
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// New Actions for Financial Reports


export async function getProjectBudgetSheetAction(projectId: string): Promise<ReportResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };
    const supabase: any = await createClient();

    const [budgetRes, details, financesData] = await Promise.all([
      supabase.rpc('get_project_budget_sheet_summary', { p_project_id: projectId }),
      getCompanyAndProjectDetails(supabase, projectId),
      supabase.from('project_finances').select('total_quoted_amount').eq('project_id', projectId).single()
    ]);

    if (budgetRes.error) throw budgetRes.error;
    
    const totalQuotationValue = financesData.data?.total_quoted_amount || 0;

    const budgetDetails: any = {};
    const sectionTotals: any = {};
    let totalProjectCosting = 0;

    (budgetRes.data || []).forEach((row: any) => {
      const section = row.category;
      if (!budgetDetails[section]) {
        budgetDetails[section] = [];
        sectionTotals[section] = 0;
      }
      
      const amt = Number(row.amount || 0);
      budgetDetails[section].push({
        particulars: row.description,
        qty: 1,
        rate: amt,
        days: 1,
        amount: amt
      });
      
      sectionTotals[section] += amt;
      totalProjectCosting += amt;
    });

    const netAmount = totalQuotationValue - totalProjectCosting;

    return { 
      success: true, 
      data: { 
        budgetDetails,
        sectionTotals,
        totalQuotationValue,
        totalProjectCosting,
        netAmount,
        company: details.company,
        project: details.project
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getExpensesFundAllocationAction(start: string, end: string): Promise<ReportResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };
    const supabase: any = await createClient();

    const { data: allocations, error } = await supabase
      .from('fund_allocations')
      .select('*, bank_accounts(bank_name)')
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) throw error;

    const formattedAllocations = (allocations || []).map((a: any) => ({
      bankName: a.bank_accounts?.bank_name || 'N/A',
      serviceDivide: a.service_divide,
      day: a.day,
      amount: a.amount,
      remark: a.remark
    }));

    return { 
      success: true, 
      data: { 
        fundAllocations: formattedAllocations 
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectActualSheetAction(projectId: string): Promise<ReportResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };
    const supabase: any = await createClient();

    const [actualRes, details] = await Promise.all([
      supabase.rpc('get_project_actual_sheet_summary', { p_project_id: projectId }),
      getCompanyAndProjectDetails(supabase, projectId)
    ]);

    if (actualRes.error) throw actualRes.error;

    const ledger: any[] = [];
    let totalCredit = 0;
    let totalDebit = 0;

    (actualRes.data || []).forEach((row: any) => {
      ledger.push({
        date: row.date,
        particulars: row.particulars,
        debit: row.debit,
        credit: row.credit
      });
      totalCredit += Number(row.credit || 0);
      totalDebit += Number(row.debit || 0);
    });

    return { 
      success: true, 
      data: { 
        ledger,
        netProfitLoss: totalCredit - totalDebit,
        total: totalCredit,
        company: details.company,
        project: details.project
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllProjectSummaryAction(start: string, end: string): Promise<ReportResponse> {
  try {
    const auth = await requireAuthContext();
    if (auth.error) return { success: false, error: auth.error };
    if (auth.role !== 'admin' && auth.role !== 'accountant') {
      return { success: false, error: 'Access denied. Accountant or Admin only.' };
    }

    const supabase: any = await createClient();

    const company = await getCompanySettingsAction();

    const { data, error } = await supabase.rpc(
      "get_financial_summary_report",
      {
        start_date: new Date(start).toISOString(),
        end_date: new Date(new Date(end).setHours(23, 59, 59, 999)).toISOString(),
      }
    );

    if (error) throw error;

    return {
      success: true,
      data: {
        projects: data ?? [],
        company,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}