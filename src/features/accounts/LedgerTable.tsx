'use client';

import React, { useState, useMemo } from 'react';
import { 
  Download, Search, Filter, Calendar, ChevronLeft, ChevronRight, 
  BarChart3, FileText, CheckCircle2, AlertCircle, Clock, Landmark
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchableSelect } from '@/components/ui/searchable-select';
import * as XLSX from 'xlsx';

export type LedgerType = 'income' | 'expense';

export interface LedgerItem {
  id: string;
  date: string;
  project_id?: string;
  project_name: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  added_by?: string;
  receipt_url?: string;
  source: 'invoice' | 'payment' | 'expense';
  bank_name?: string;
}

interface LedgerTableProps {
  data: LedgerItem[];
  type: LedgerType;
  projects: { id: string; name: string }[];
}

export function LedgerTable({ data, type, projects }: LedgerTableProps) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 15;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    data.forEach(item => cats.add(item.category));
    return Array.from(cats).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    let result = data;
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item => 
        item.description.toLowerCase().includes(q) || 
        item.project_name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    if (projectFilter) {
      if (projectFilter === 'company-wide') {
        result = result.filter(item => !item.project_id || item.project_id === 'company-wide');
      } else {
        result = result.filter(item => item.project_id === projectFilter);
      }
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom).getTime();
      result = result.filter(item => {
        const d = new Date(item.date).getTime();
        return !isNaN(d) && d >= fromDate;
      });
    }
    
    if (dateTo) {
      // Add one day to include the end date fully
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        const d = new Date(item.date).getTime();
        return !isNaN(d) && d <= toDate.getTime();
      });
    }
    
    // Sort descending by date
    return result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [data, search, categoryFilter, projectFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const headers = type === 'income' 
        ? ['Date', 'Project', 'Description', 'Category', 'Amount', 'Status']
        : ['Date', 'Project', 'Category', 'Description', 'Amount', 'Added By'];
        
      const rows = filteredData.map(item => {
        if (type === 'income') {
          const d = new Date(item.date);
          const dateStr = isNaN(d.getTime()) ? '-' : format(d, 'yyyy-MM-dd');
          return [
            dateStr,
            item.project_name,
            item.description,
            item.category,
            item.amount,
            item.status
          ];
        } else {
          const d = new Date(item.date);
          const dateStr = isNaN(d.getTime()) ? '-' : format(d, 'yyyy-MM-dd');
          return [
            dateStr,
            item.project_name,
            item.category,
            item.description,
            item.amount,
            item.added_by || ''
          ];
        }
      });
      
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');
      
      XLSX.writeFile(workbook, `${type}_ledger_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'approved' || s === 'verified') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> {status}</span>;
    }
    if (s === 'pending' || s === 'sent') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"><Clock className="w-3 h-3" /> {status}</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20">{status}</span>;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const projectOptions = useMemo(() => [
    { label: "All Projects", value: "" },
    { label: "Company-wide", value: "company-wide" },
    ...projects.map(p => ({ label: p.name, value: p.id }))
  ], [projects]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col xl:flex-row items-center gap-4 bg-white/60 dark:bg-[#0c101b]/60 backdrop-blur-2xl p-5 rounded-3xl border border-white/40 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="relative w-full xl:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search descriptions..."
            className="w-full pl-9 pr-4 h-11 rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all dark:text-white placeholder:text-slate-400 shadow-sm"
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all dark:text-white shadow-sm"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all dark:text-white shadow-sm"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="h-11 px-4 rounded-2xl bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all dark:text-white appearance-none cursor-pointer w-full sm:w-40 shrink-0 shadow-sm"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="w-full sm:w-64 shrink-0">
            <SearchableSelect
              value={projectFilter}
              onValueChange={(val) => { setProjectFilter(val); setCurrentPage(1); }}
              options={projectOptions}
              placeholder="All Projects"
              searchPlaceholder="Search projects..."
            />
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isExporting || filteredData.length === 0}
            className="h-11 px-5 shrink-0 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 dark:shadow-none hover:shadow-xl hover:shadow-slate-900/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10">
                <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Date</th>
                <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Project</th>
                {type === 'income' ? (
                  <>
                    <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Description</th>
                    <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Category</th>
                    <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Amount</th>
                    <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</th>
                  </>
                ) : (
                  <>
                    <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Category</th>
                    <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Description</th>
                    <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Amount</th>
                    <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap">Added By</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <EmptyState 
                      icon={BarChart3} 
                      message="No records found for the given filters." 
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr 
                    key={`${item.id}-${idx}`} 
                    className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                      {!item.date || isNaN(new Date(item.date).getTime()) ? '-' : format(new Date(item.date), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {item.project_name}
                      </span>
                    </td>
                    
                    {type === 'income' ? (
                      <>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-white max-w-[250px] truncate">
                          {item.description}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 capitalize">
                          {item.category}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatAmount(item.amount)}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(item.status)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 capitalize whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-white max-w-[250px] truncate">
                          {item.description}
                          {item.bank_name && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Landmark className="w-3 h-3" /> {item.bank_name}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold tabular-nums text-right text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {formatAmount(item.amount)}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                          {item.added_by || '-'}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{filteredData.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
