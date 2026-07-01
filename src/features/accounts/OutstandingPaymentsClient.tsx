"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  AlertCircle, ChevronDown, ChevronRight, ChevronLeft, FileText, 
  Target, UserPlus, Award, CheckCircle2 
} from "lucide-react";
import { AddExpenseModal } from "@/features/accounts/AddExpenseModal";
import Link from "next/link";

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  budget: number;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  totalExpenses: number;
  currentProfit: number;
}

export function OutstandingPaymentsClient({ initialProjects }: { initialProjects: ProjectSummary[] }) {
  const formatRupee = (amount: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<'labor' | 'material' | 'other'>('labor');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalOutstanding = initialProjects.reduce((sum, p) => sum + p.outstanding, 0);
  const totalReceivable = initialProjects.reduce((sum, p) => sum + p.totalBilled, 0);

  const toggleExpand = (id: string) => {
    setExpandedProjectId(prev => prev === id ? null : id);
  };

  const handleAllocate = (projectId: string, category: 'labor' | 'material') => {
    setSelectedProjectId(projectId);
    setExpenseCategory(category);
    setExpenseModalOpen(true);
  };

  // Filter and Pagination Logic
  const filteredProjects = initialProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + pageSize);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // reset to first page on search
  };

  return (
    <div className="space-y-6">
      {/* Global Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Total Outstanding
            </h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatRupee(totalOutstanding)}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Total Billed
            </h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatRupee(totalReceivable)}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Active Projects
            </h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {initialProjects.length}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all"
          />
        </div>
      </div>

      {/* Master List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-4 w-10"></th>
              <th className="p-4">Project Name</th>
              <th className="p-4">Total Billed</th>
              <th className="p-4">Outstanding</th>
              <th className="p-4">Net Profit</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.map((project) => (
              <React.Fragment key={project.id}>
                <tr 
                  className={cn(
                    "border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition cursor-pointer",
                    expandedProjectId === project.id ? "bg-slate-50 dark:bg-slate-800/20" : ""
                  )}
                  onClick={() => toggleExpand(project.id)}
                >
                  <td className="p-4 text-slate-400">
                    {expandedProjectId === project.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    {project.name}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {formatRupee(project.totalBilled)}
                  </td>
                  <td className="p-4 font-bold text-rose-500">
                    {formatRupee(project.outstanding)}
                  </td>
                  <td className={cn("p-4 font-bold", project.currentProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {formatRupee(project.currentProfit)}
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                      href={`/projects/${project.id}?tab=finance`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg text-xs transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Open Finance Tab
                    </Link>
                  </td>
                </tr>

                {/* Expanded Project P&L View */}
                {expandedProjectId === project.id && (
                  <tr className="bg-slate-50/50 dark:bg-slate-800/10 border-b border-slate-200 dark:border-slate-800">
                    <td colSpan={6} className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* P&L Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-indigo-500" />
                            Project P&L (Profit & Loss)
                          </h4>
                          <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">Total Billed (Income)</span>
                              <span className="font-semibold text-slate-900 dark:text-white">{formatRupee(project.totalBilled)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">Total Expenses</span>
                              <span className="font-semibold text-slate-900 dark:text-white">{formatRupee(project.totalExpenses)}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                              <span className="font-bold text-slate-900 dark:text-white">Net Profit</span>
                              <span className={cn("text-lg font-black", project.currentProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                {formatRupee(project.currentProfit)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="hidden">
                          </div>
                        </div>

                        {/* Budget vs Actual Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" />
                            Budget vs Actual
                          </h4>
                          <div className="space-y-4 mt-2">
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Actual Spent</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatRupee(project.totalExpenses)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500 mb-1">Total Budget</p>
                                <p className="text-base font-bold text-slate-900 dark:text-white">{formatRupee(project.budget || 0)}</p>
                              </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-500", 
                                  (project.budget || 0) === 0 ? "bg-slate-400" :
                                  project.totalExpenses > (project.budget || 0) ? "bg-rose-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${Math.min(100, (project.budget || 0) > 0 ? (project.totalExpenses / project.budget) * 100 : (project.totalExpenses > 0 ? 100 : 0))}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-2">
                              {project.budget > 0 ? `${((project.totalExpenses / project.budget) * 100).toFixed(1)}% of budget utilized` : 'No budget set for this project.'}
                            </p>
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {paginatedProjects.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-sm text-slate-500">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredProjects.length)} of {filteredProjects.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {selectedProjectId && (
        <AddExpenseModal
          isOpen={expenseModalOpen}
          onClose={() => setExpenseModalOpen(false)}
          projectId={selectedProjectId}
          initialCategory={expenseCategory}
          onSuccess={() => {
            // Ideally revalidate or refresh data here.
            // A hard refresh works or router.refresh()
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
