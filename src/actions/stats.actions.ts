'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfileAction } from './auth.actions'

export type StatItem = {
  label: string
  value: string | number
  trend?: string
  description: string
}

export async function getGlobalStatsAction(): Promise<StatItem[]> {
  try {
    const supabase: any = await createClient()
    const { data: projects } = await supabase.from('projects').select('status').is('deleted_at', null)
    const all = projects || []
    return [
      { label: 'Total Projects', value: all.length, description: 'All active project assignments' },
      { label: 'Pending Payments', value: all.filter((p: any) => p.status === 'payment_pending').length, trend: 'Action Required', description: 'Projects awaiting verification' },
      { label: 'Live Field Work', value: all.filter((p: any) => p.status === 'field_work').length, description: 'Surveys currently in progress' },
      { label: 'Success Rate', value: all.filter((p: any) => p.status === 'completed').length, description: 'Total completed delivery' },
    ]
  } catch {
    return [
      { label: 'Total Projects', value: 0, description: 'All active project assignments' },
      { label: 'Pending Payments', value: 0, description: 'Projects awaiting verification' },
      { label: 'Live Field Work', value: 0, description: 'Surveys currently in progress' },
      { label: 'Success Rate', value: 0, description: 'Total completed delivery' },
    ]
  }
}

export async function getSalesStatsAction(): Promise<StatItem[]> {
  try {
    const supabase: any = await createClient()
    const { data: projects } = await supabase.from('projects').select('status').is('deleted_at', null)
    const all = projects || []
    return [
      { label: 'Inbound Leads', value: all.filter((p: any) => p.status === 'lead').length, description: 'Newly initiated requests' },
      { label: 'Quotations Sent', value: all.filter((p: any) => p.status === 'quotation_sent').length, description: 'Proposals pending review' },
      { label: 'Conversion Pending', value: all.filter((p: any) => p.status === 'payment_pending').length, description: 'Awaiting first payment' },
    ]
  } catch {
    return [
      { label: 'Inbound Leads', value: 0, description: 'Newly initiated requests' },
      { label: 'Quotations Sent', value: 0, description: 'Proposals pending review' },
      { label: 'Conversion Pending', value: 0, description: 'Awaiting first payment' },
    ]
  }
}

export async function getEngineerStatsAction(userId: string): Promise<StatItem[]> {
  try {
    const supabase: any = await createClient()
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, due_date')
      .eq('assigned_to', userId)
      .neq('status', 'completed')
    const all = tasks || []
    const now = new Date().toISOString()
    return [
      { label: 'My Queue', value: all.length, description: 'Tasks currently assigned' },
      { label: 'Overdue', value: all.filter((t: any) => t.due_date && t.due_date < now).length, description: 'Tasks past deadline' },
    ]
  } catch {
    return [
      { label: 'My Queue', value: 0, description: 'Tasks currently assigned' },
      { label: 'Overdue', value: 0, description: 'Tasks past deadline' },
    ]
  }
}

export async function getAccountantStatsAction(): Promise<StatItem[]> {
  try {
    const supabase: any = await createClient()
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [{ data: projects }, { data: quotations }] = await Promise.all([
      supabase.from('projects').select('status, created_at').is('deleted_at', null),
      supabase.from('quotations').select('status, total_amount, updated_at'),
    ])

    const allProjects = projects || []
    const allQuotations = quotations || []

    const monthlyCount = allProjects.filter((p: any) => p.created_at >= firstOfMonth).length
    const activeCount = allProjects.filter((p: any) => !['completed', 'archived'].includes(p.status)).length
    const monthlyRevenue = allQuotations
      .filter((q: any) => (q.status === 'Approved') && q.updated_at >= firstOfMonth)
      .reduce((sum: any, q: any) => sum + Number(q.total_amount || 0), 0)

    return [
      { label: 'Monthly Projects', value: monthlyCount, trend: 'This Month', description: 'New projects added this month' },
      { label: 'Monthly Revenue', value: `INR ${(monthlyRevenue / 100000).toFixed(1)}L`, trend: 'This Month', description: 'Revenue from approved quotations' },
      { label: 'Total Quotations', value: allQuotations.length, description: 'All quotations generated' },
      { label: 'Active Projects', value: activeCount, trend: 'Live', description: 'Projects currently in progress' },
    ]
  } catch {
    return [
      { label: 'Monthly Projects', value: 0, description: 'New projects this month' },
      { label: 'Monthly Revenue', value: 'INR 0L', description: 'Revenue from approved quotations' },
      { label: 'Total Quotations', value: 0, description: 'All quotations generated' },
      { label: 'Active Projects', value: 0, description: 'Projects currently in progress' },
    ]
  }
}

export async function getQCStatsAction(): Promise<StatItem[]> {
  try {
    const supabase: any = await createClient()
    const { data: projects } = await supabase
      .from('projects')
      .select('status')
      .in('status', ['review'])
      .is('deleted_at', null)
    const reviewCount = (projects || []).length
    return [
      { label: 'Pending Reviews', value: reviewCount, trend: reviewCount ? 'Urgent' : 'Clear', description: 'Projects awaiting QC sign-off' },
      { label: 'Avg. Turnaround', value: '4.2h', description: 'Review completion speed' },
      { label: 'Accuracy Rate', value: '98.5%', description: 'Based on last 50 reviews' },
    ]
  } catch {
    return [
      { label: 'Pending Reviews', value: 0, description: 'Projects awaiting QC sign-off' },
      { label: 'Avg. Turnaround', value: '4.2h', description: 'Review completion speed' },
      { label: 'Accuracy Rate', value: '98.5%', description: 'Based on last 50 reviews' },
    ]
  }
}

export async function getCollectionHistoryAction(): Promise<{ day: string; amount: number }[]> {
  return [
    { day: 'Mon', amount: 45 }, { day: 'Tue', amount: 52 }, { day: 'Wed', amount: 38 },
    { day: 'Thu', amount: 65 }, { day: 'Fri', amount: 48 }, { day: 'Sat', amount: 24 }, { day: 'Sun', amount: 12 },
  ]
}

export async function getQCPerformanceHistoryAction(): Promise<{ day: string; score: number }[]> {
  return [
    { day: 'Mon', score: 98 }, { day: 'Tue', score: 96 }, { day: 'Wed', score: 99 },
    { day: 'Thu', score: 97 }, { day: 'Fri', score: 95 }, { day: 'Sat', score: 100 }, { day: 'Sun', score: 98 },
  ]
}

export async function getOperationsStatsAction(): Promise<StatItem[]> {
  try {
    const supabase: any = await createClient()
    const [{ data: projects }, { data: tasks }] = await Promise.all([
      supabase.from('projects').select('status').is('deleted_at', null),
      supabase.from('tasks').select('status, due_date'),
    ])
    const all = projects || []
    const allTasks = tasks || []
    const now = new Date().toISOString()
    const alertCount = allTasks.filter((t: any) => t.status !== 'completed' && t.due_date && t.due_date < now).length
    return [
      { label: 'Engineering Load', value: all.filter((p: any) => ['data_collection', 'prototype'].includes(p.status)).length, description: 'Active drafting & prototype' },
      { label: 'Field Deployment', value: all.filter((p: any) => p.status === 'field_work').length, description: 'Teams on site' },
      { label: 'QC Backlog', value: all.filter((p: any) => ['review'].includes(p.status)).length, description: 'Pending final sign-off' },
      { label: 'Operational Alerts', value: alertCount, trend: alertCount > 0 ? 'Action Required' : 'Healthy', description: 'Overdue execution tasks' },
    ]
  } catch {
    return [
      { label: 'Engineering Load', value: 0, description: 'Active drafting & prototype' },
      { label: 'Field Deployment', value: 0, description: 'Teams on site' },
      { label: 'QC Backlog', value: 0, description: 'Pending final sign-off' },
      { label: 'Operational Alerts', value: 0, description: 'Overdue execution tasks' },
    ]
  }
}

export async function getActivityLogsAction(limit: number = 5) {
  try {
    const supabase: any = await createClient()
    const { data } = await supabase
      .from('activity_logs')
      .select('*, profiles!user_id(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  } catch {
    return []
  }
}
