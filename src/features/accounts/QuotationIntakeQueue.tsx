'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Building2,
  Calendar,
  Zap,
  Clock,
  Search,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Paperclip,
  UserCheck,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  client_name: string;
  client_contact?: string;
  updated_at: string;
  target_completion_date: string | null;
  services?: string[];
  plot_area?: string;
  site_type?: string;
  survey_requirements?: string;
  budget_notes?: string;
  requirement_checklist?: Record<string, boolean>;
  priority?: string;
  creator: { first_name: string; last_name: string; email: string };
  files: any[];
}

interface QuotationIntakeQueueProps {
  projects: Project[];
  hideSearch?: boolean;
}

function getReadinessScore(project: Project): number {
  const checks = [
    Boolean(project.client_name),
    Boolean(project.client_contact),
    Boolean(project.survey_requirements),
    Boolean(project.services?.length),
    Boolean(project.target_completion_date),
    Boolean(project.files?.filter((f) => f.category === 'requirements').length),
    Boolean(project.plot_area),
    Boolean(project.site_type),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getDaysLeft(project: Project): number | null {
  if (!project.target_completion_date) return null;
  return differenceInDays(new Date(project.target_completion_date), new Date());
}

function ReadinessBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-500'
      : score >= 50
      ? 'bg-amber-500'
      : 'bg-rose-500';
  const textColor =
    score >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : score >= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Intake Readiness
        </span>
        <span className={cn('text-xs font-semibold', textColor)}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function QuotationIntakeQueue({
  projects,
  hideSearch = false,
}: QuotationIntakeQueueProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const enriched = useMemo(
    () => projects.map((p) => ({ ...p, readiness: getReadinessScore(p), daysLeft: getDaysLeft(p) })),
    [projects]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter(
      (p) =>
          !search ||
          p.name.toLowerCase().includes(q) ||
          p.client_name.toLowerCase().includes(q)
    );
  }, [enriched, search]);

  return (
    <div className="space-y-6">
          {/* Search */}
          {!hideSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects or clients..."
              className="w-full pl-9 pr-4 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
            />
          </div>
          )}


      {/* List */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No projects in the intake queue.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filtered.map((project) => {
              const isExpanded = expandedId === project.id;
              const reqFiles = project.files?.filter((f) => f.category === 'requirements') || [];
              const isUrgent = project.daysLeft !== null && project.daysLeft <= 7;

              return (
                <div
                  key={project.id}
                  className={cn(
                    'bg-white dark:bg-white/[0.03] border rounded-2xl overflow-hidden transition-all duration-200',
                    isUrgent
                      ? 'border-amber-200 dark:border-amber-500/20'
                      : 'border-slate-200 dark:border-white/10',
                    isExpanded && 'ring-1 ring-indigo-500/20'
                  )}
                >
                  {/* Card Main Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Left: Icon + Title */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {project.name}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Building2 className="w-3 h-3" />
                            {project.client_name}
                          </span>
                          {project.target_completion_date ? (
                            <span
                              className={cn(
                                'flex items-center gap-1 text-xs font-medium',
                                isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                              )}
                            >
                              <Calendar className="w-3 h-3" />
                              {format(new Date(project.target_completion_date), 'MMM d')}
                              {project.daysLeft !== null && ` (${project.daysLeft}d)`}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3" />
                              Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
                            </span>
                          )}
                          {reqFiles.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Paperclip className="w-3 h-3" />
                              {reqFiles.length} doc{reqFiles.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Readiness + Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0 pl-12 sm:pl-0">
                      {project.readiness >= 80 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : project.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </button>

                      <Button
                        onClick={() => router.push(`/accounts/quotations?project=${project.id}&mode=create`)}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 h-8 rounded-lg gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Quote
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-white/5 space-y-4">
                          {/* Readiness bar */}
                          <ReadinessBar score={project.readiness} />

                          {/* Details grid */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-slate-400 dark:text-slate-500 mb-0.5 font-medium">Sales Account</p>
                              <p className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                {Array.isArray(project.creator) ? project.creator[0]?.first_name : project.creator?.first_name} {Array.isArray(project.creator) ? project.creator[0]?.last_name : project.creator?.last_name}
                              </p>
                            </div>
                            {project.site_type && (
                              <div>
                                <p className="text-slate-400 dark:text-slate-500 mb-0.5 font-medium">Site Type</p>
                                <p className="text-slate-700 dark:text-slate-300 font-medium">{project.site_type}</p>
                              </div>
                            )}
                            {project.plot_area && (
                              <div>
                                <p className="text-slate-400 dark:text-slate-500 mb-0.5 font-medium">Plot Area</p>
                                <p className="text-slate-700 dark:text-slate-300 font-medium">{project.plot_area}</p>
                              </div>
                            )}
                            {project.services?.length ? (
                              <div className="col-span-2">
                                <p className="text-slate-400 dark:text-slate-500 mb-1 font-medium">Services</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {project.services.map((s) => (
                                    <span
                                      key={s}
                                      className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          {project.survey_requirements && (
                            <div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 font-medium">Survey Requirements</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {project.survey_requirements}
                              </p>
                            </div>
                          )}

                          {project.budget_notes && (
                            <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15 rounded-xl p-3">
                              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                💡 {project.budget_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

