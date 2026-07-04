'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuthContext } from '@/lib/permissions/permissions';

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
  const { data: company } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();
  let project = {
    client_name: 'All Projects (Company-wide)',
    client_address: 'N/A',
    client_contact: 'N/A'
  };
  
  if (projectId) {
    const { data: projData } = await supabase.from('projects').select('*').eq('id', projectId).single();
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
    const [paymentsRes, expensesRes, visitsRes] = await Promise.all([
      supabase.from('payments').select('amount, created_at, status, project_id, projects(name)'),
      supabase.from('expenses').select('amount, expense_date, category, project_id'),
      supabase.from('project_visits').select('visit_cost, created_at, status, project_id')
    ]);

    let payments = filterByDate(paymentsRes.data || [], 'created_at', start, end);
    let expenses = filterByDate(expensesRes.data || [], 'expense_date', start, end);
    let visits = filterByDate(visitsRes.data || [], 'created_at', start, end);

    if (projectId) {
      payments = payments.filter((p: any) => p.project_id === projectId);
      expenses = expenses.filter((e: any) => e.project_id === projectId);
      visits = visits.filter((v: any) => v.project_id === projectId);
    }

    let totalRevenue = 0;
    const revenueByProject: Record<string, number> = {};

    payments.forEach((p: any) => {
      if (p.status !== 'rejected') {
        const amt = Number(p.amount || 0);
        totalRevenue += amt;
        const projName = p.projects?.name || 'Company-wide';
        revenueByProject[projName] = (revenueByProject[projName] || 0) + amt;
      }
    });

    let totalCosts = 0;
    const costsByCategory: Record<string, number> = {};

    expenses.forEach((e: any) => {
      const amt = Number(e.amount || 0);
      totalCosts += amt;
      const cat = e.category || 'Other';
      costsByCategory[cat] = (costsByCategory[cat] || 0) + amt;
    });

    visits.forEach((v: any) => {
      const amt = Number(v.visit_cost || 0);
      if (amt > 0) {
        totalCosts += amt;
        costsByCategory['Field Visit'] = (costsByCategory['Field Visit'] || 0) + amt;
      }
    });

    const { company, project } = await getCompanyAndProjectDetails(supabase, projectId);

    return {
      success: true,
      data: {
        totalRevenue,
        totalCosts,
        netProfit: totalRevenue - totalCosts,
        revenueByProject,
        costsByCategory,
        company,
        project
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
    const [paymentsRes] = await Promise.all([
      supabase.from('payments').select('amount, created_at, status, project_id, projects(name)')
    ]);

    let payments = filterByDate(paymentsRes.data || [], 'created_at', start, end);
    if (projectId) {
      payments = payments.filter((p: any) => p.project_id === projectId);
    }

    let totalIncome = 0;
    const incomeByProject: Record<string, number> = {};

    payments.forEach((p: any) => {
      if (p.status !== 'rejected') {
        const amt = Number(p.amount || 0);
        totalIncome += amt;
        const projName = p.projects?.name || 'Company-wide';
        incomeByProject[projName] = (incomeByProject[projName] || 0) + amt;
      }
    });

    const incomeTransactions = payments
      .filter((p: any) => p.status !== 'rejected')
      .map((p: any) => ({
        date: p.created_at,
        project: p.projects?.name || 'Company-wide',
        amount: Number(p.amount || 0)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const { company, project } = await getCompanyAndProjectDetails(supabase, projectId);

    return {
      success: true,
      data: {
        totalIncome,
        incomeByProject,
        incomeTransactions,
        company,
        project
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
    const [expensesRes, visitsRes] = await Promise.all([
      supabase.from('expenses').select('amount, expense_date, category, project_id'),
      supabase.from('project_visits').select('visit_cost, created_at, status, project_id')
    ]);

    let expenses = filterByDate(expensesRes.data || [], 'expense_date', start, end);
    let visits = filterByDate(visitsRes.data || [], 'created_at', start, end);
    if (projectId) {
      expenses = expenses.filter((e: any) => e.project_id === projectId);
      visits = visits.filter((v: any) => v.project_id === projectId);
    }

    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {};

    expenses.forEach((e: any) => {
      const amt = Number(e.amount || 0);
      totalExpenses += amt;
      const cat = e.category || 'Other';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;
    });

    visits.forEach((v: any) => {
      const amt = Number(v.visit_cost || 0);
      if (amt > 0) {
        totalExpenses += amt;
        expensesByCategory['Field Visit'] = (expensesByCategory['Field Visit'] || 0) + amt;
      }
    });

    const { company, project } = await getCompanyAndProjectDetails(supabase, projectId);

    return {
      success: true,
      data: {
        totalExpenses,
        expensesByCategory,
        company,
        project
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
    
    // For balance sheet, we get everything UP TO the asOfDate
    const e = new Date(asOfDate);
    e.setHours(23, 59, 59, 999);
    const timeLimit = e.getTime();

    const [paymentsRes, expensesRes, invoicesRes, visitsRes] = await Promise.all([
      supabase.from('payments').select('amount, created_at, status, project_id'),
      supabase.from('expenses').select('amount, expense_date, project_id'),
      supabase.from('invoices').select('total_amount, created_at, status, project_id'),
      supabase.from('project_visits').select('visit_cost, created_at, status, project_id')
    ]);

    let payments = (paymentsRes.data || []).filter((item: any) => new Date(item.created_at).getTime() <= timeLimit);
    let expenses = (expensesRes.data || []).filter((item: any) => new Date(item.expense_date).getTime() <= timeLimit);
    let invoices = (invoicesRes.data || []).filter((item: any) => new Date(item.created_at).getTime() <= timeLimit);
    let visits = (visitsRes.data || []).filter((item: any) => new Date(item.created_at).getTime() <= timeLimit);

    if (projectId) {
      payments = payments.filter((p: any) => p.project_id === projectId);
      expenses = expenses.filter((e: any) => e.project_id === projectId);
      invoices = invoices.filter((i: any) => i.project_id === projectId);
      visits = visits.filter((v: any) => v.project_id === projectId);
    }

    let totalIncome = 0;
    payments.forEach((p: any) => {
      if (p.status !== 'rejected') totalIncome += Number(p.amount || 0);
    });

    let totalExpensesPaid = 0;
    let totalExpensesPending = 0;
    expenses.forEach((e: any) => {
      const amt = Number(e.amount || 0);
      totalExpensesPaid += amt;
    });

    visits.forEach((v: any) => {
      const amt = Number(v.visit_cost || 0);
      // assuming field visits are 'paid' costs once completed, or treating all as paid for now
      if (v.status !== 'cancelled' && amt > 0) {
        totalExpensesPaid += amt;
      }
    });

    let totalInvoiced = 0;
    invoices.forEach((i: any) => {
      if (i.status !== 'cancelled') totalInvoiced += Number(i.total_amount || 0);
    });

    const cashOnHand = totalIncome - totalExpensesPaid;
    const accountsReceivable = Math.max(0, totalInvoiced - totalIncome);
    const accountsPayable = totalExpensesPending;

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

    const { company, project } = await getCompanyAndProjectDetails(supabase, projectId);

    return {
      success: true,
      data: {
        assets,
        totalAssets,
        liabilities,
        totalLiabilities,
        equity,
        company,
        project
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
    
    // 1. Fetch Project Details
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (pError || !project) return { success: false, error: 'Project not found.' };

    // 2. Fetch Milestones (Payment Timeline)
    const { data: milestones, error: mError } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    // 3. Fetch Company Settings (Malee House Details)
    const { data: company, error: cError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    let totalBilled = 0;
    let totalPaid = 0;

    const timeline = (milestones || []).map((m: any) => {
      const cgst = (m.amount * 9) / 100;
      const sgst = (m.amount * 9) / 100;
      const total = m.amount + cgst + sgst;
      
      totalBilled += total;
      if (m.status === 'paid') {
        totalPaid += total;
      }

      return {
        id: m.id,
        title: m.title,
        base_amount: m.amount,
        gst_amount: cgst + sgst,
        total_amount: total,
        status: m.status,
        due_date: m.due_date
      };
    });

    return {
      success: true,
      data: {
        project: {
          name: project.name,
          client_name: project.client_name,
          client_contact: project.client_contact,
          client_address: project.client_address
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
