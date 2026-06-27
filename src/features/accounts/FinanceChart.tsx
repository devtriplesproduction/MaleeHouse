'use client';

import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { BarChart3 } from 'lucide-react';

export type ChartType = 
  | 'income-vs-expense' 
  | 'revenue-trend' 
  | 'expense-categories' 
  | 'cash-flow' 
  | 'profit-trend' 
  | 'project-profitability';

interface FinanceChartProps {
  title: string;
  subtitle?: string;
  type: ChartType;
  data: any[];
  loading?: boolean;
}

// Richer, more vibrant colors for a premium look
const COLORS = {
  emerald: '#10b981', // keeping emerald bright for profit/income
  rose: '#f43f5e',    // keeping rose bright for expenses
  indigo: '#4f46e5',  // deeper indigo for revenue
  amber: '#f59e0b',
  sky: '#0284c7',     // deeper sky blue for cash flow
  slate: '#64748b'
};

const PIE_COLORS = [COLORS.indigo, COLORS.sky, COLORS.amber, COLORS.emerald, COLORS.rose, COLORS.slate];

const formatCurrency = (value: number) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value}`;
};

export function FinanceChart({ title, subtitle, type, data, loading }: FinanceChartProps) {
  
  const hasData = data && data.length > 0;

  return (
    <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col min-h-96 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mb-6 relative z-10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>

      <div className="w-full flex-1 relative min-h-72 h-72">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl"></div>
          </div>
        ) : !hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Not enough data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(type, data)}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function renderChart(type: ChartType, data: any[]) {
  const commonAxisProps = {
    stroke: '#cbd5e1',
    fontSize: 12,
    fontWeight: 500,
    tickLine: false,
    axisLine: false
  };

  const tooltipStyle = { 
    borderRadius: '16px', 
    border: '1px solid rgba(255,255,255,0.2)', 
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    padding: '12px 16px'
  };

  switch (type) {
    case 'income-vs-expense':
      return (
        <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-white/5" />
          <XAxis dataKey="month" {...commonAxisProps} tickMargin={10} />
          <YAxis tickFormatter={formatCurrency} {...commonAxisProps} tickMargin={12} width={60} />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
            contentStyle={tooltipStyle}
            formatter={(value: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
            labelStyle={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
          <Bar dataKey="income" name="Income" fill={COLORS.emerald} radius={[6, 6, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expense" name="Expense" fill={COLORS.rose} radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      );
      
    case 'revenue-trend':
      return (
        <AreaChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-white/5" />
          <XAxis dataKey="month" {...commonAxisProps} tickMargin={10} />
          <YAxis tickFormatter={formatCurrency} {...commonAxisProps} tickMargin={12} width={60} />
          <Tooltip 
            contentStyle={tooltipStyle}
            formatter={(value: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
            labelStyle={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Area type="monotone" dataKey="income" name="Revenue" stroke={COLORS.indigo} strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 8, strokeWidth: 0, fill: COLORS.indigo }} />
        </AreaChart>
      );

    case 'cash-flow':
      const cashFlowData = data.map(d => ({ ...d, net: (Number(d.income) || 0) - (Number(d.expense) || 0) }));
      return (
        <AreaChart data={cashFlowData} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.sky} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.sky} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-white/5" />
          <XAxis dataKey="month" {...commonAxisProps} tickMargin={10} />
          <YAxis tickFormatter={formatCurrency} {...commonAxisProps} tickMargin={10} />
          <YAxis tickFormatter={formatCurrency} {...commonAxisProps} tickMargin={12} width={60} />
          <Tooltip 
            contentStyle={tooltipStyle}
            formatter={(value: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
            labelStyle={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Area type="monotone" dataKey="net" name="Net Cash Flow" stroke={COLORS.sky} strokeWidth={4} fillOpacity={1} fill="url(#colorNet)" activeDot={{ r: 8, strokeWidth: 0, fill: COLORS.sky }} />
        </AreaChart>
      );

    case 'profit-trend':
      const profitData = data.map(d => ({ ...d, profit: (Number(d.income) || 0) - (Number(d.expense) || 0) }));
      return (
        <AreaChart data={profitData} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-white/5" />
          <XAxis dataKey="month" {...commonAxisProps} tickMargin={10} />
          <YAxis tickFormatter={formatCurrency} {...commonAxisProps} tickMargin={10} />
          <YAxis tickFormatter={formatCurrency} {...commonAxisProps} tickMargin={12} width={60} />
          <Tooltip 
            contentStyle={tooltipStyle}
            formatter={(value: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
            labelStyle={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Area type="monotone" dataKey="profit" name="Profit" stroke={COLORS.emerald} strokeWidth={4} fillOpacity={1} fill="url(#colorProfit)" activeDot={{ r: 8, strokeWidth: 0, fill: COLORS.emerald }} />
        </AreaChart>
      );

    case 'project-profitability':
      return (
        <BarChart data={data.slice(0, 10)} margin={{ top: 20, right: 20, left: 20, bottom: 0 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-white/5" />
          <XAxis type="number" tickFormatter={formatCurrency} {...commonAxisProps} tickMargin={10} />
          <YAxis dataKey="name" type="category" width={110} tickFormatter={(val: string) => val.length > 14 ? val.substring(0, 14) + '...' : val} {...commonAxisProps} />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
            contentStyle={tooltipStyle}
            formatter={(value: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
            labelStyle={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px', fontSize: '14px' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
          <Bar dataKey="invoiced" name="Invoiced" fill={COLORS.sky} radius={[0, 8, 8, 0]} maxBarSize={16} />
          <Bar dataKey="expenses" name="Expenses" fill={COLORS.rose} radius={[0, 8, 8, 0]} maxBarSize={16} />
          <Bar dataKey="margin" name="Margin" fill={COLORS.emerald} radius={[0, 8, 8, 0]} maxBarSize={16} />
        </BarChart>
      );

    case 'expense-categories':
      return (
        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <Tooltip 
            contentStyle={tooltipStyle}
            formatter={(value: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
            itemStyle={{ fontWeight: 'bold', padding: '4px 0' }}
          />
          <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      );

    default:
      return null;
  }
}
