'use client';

import React from 'react';
import { 
  FileText, 
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
  Building2,
  CalendarDays
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  name: string;
  client_name: string;
  client_contact?: string;
  target_completion_date: string | null;
  services?: string[];
  plot_area?: string;
  site_type?: string;
  survey_requirements?: string;
  requirement_checklist?: Record<string, boolean>;
  files: any[];
}

interface QuotationActionWidgetProps {
  queue: Project[];
  onCreateQuote: (project: Project) => void;
  onViewAll: () => void;
}

export function QuotationActionWidget({ queue, onCreateQuote, onViewAll }: QuotationActionWidgetProps) {
  // Sort queue by urgency
  const sortedQueue = [...queue].sort((a: any, b: any) => {
    const dateA = a.target_completion_date ? new Date(a.target_completion_date).getTime() : Infinity;
    const dateB = b.target_completion_date ? new Date(b.target_completion_date).getTime() : Infinity;
    return dateA - dateB;
  });

  const displayQueue = sortedQueue.slice(0, 5); // Show top 5

  const calculateReadiness = (project: Project) => {
    let score = 0;
    const total = 9;
    
    if (project.client_name) score++;
    if (project.client_contact) score++;
    if (project.survey_requirements) score++;
    if (project.services && project.services.length > 0) score++;
    if (project.target_completion_date) score++;
    if (project.files?.some((f: any) => f.category === 'requirements')) score++;
    if (project.plot_area) score++;
    if (project.site_type) score++;
    if (project.requirement_checklist && Object.values(project.requirement_checklist).some((v: any) => v)) score++;
    
    return { score, total, percentage: Math.round((score / total) * 100) };
  };

  const getUrgencyConfig = (date: string | null) => {
    if (!date) return { color: 'bg-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Normal' };
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return { color: 'bg-indigo-600', text: 'text-rose-600', bg: 'bg-rose-50', label: 'Overdue' };
    if (days <= 3) return { color: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', label: 'Critical' };
    if (days <= 7) return { color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Urgent' };
    return { color: 'bg-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Normal' };
  };

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden relative group">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-white leading-tight">Action Required</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">New intakes ready for quotation</p>
          </div>
        </div>
        <div className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-100 dark:border-indigo-500/20">
          {queue.length} Pending
        </div>
      </div>

      <div className="flex-1 p-5 space-y-4 relative z-10 overflow-y-auto">
        {displayQueue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-10">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Queue is clear</p>
            <p className="text-xs text-slate-500 mt-0.5">All intakes have been processed</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden" animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-3"
          >
            {displayQueue.map((project) => {
              const readiness = calculateReadiness(project);
              const urgency = getUrgencyConfig(project.target_completion_date);
              
              return (
                <motion.div 
                  key={project.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all hover:shadow-sm group/card relative overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${urgency.color}`} />
                  
                  <div className="flex items-center gap-4 pl-2">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">{project.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Building2 className="w-3.5 h-3.5" />
                          {project.client_name}
                        </span>
                        {project.target_completion_date && (
                          <span className={cn("flex items-center gap-1 font-medium", urgency.text)}>
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(project.target_completion_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Compact Readiness Bar */}
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[10px] font-semibold text-slate-400 tracking-wider">READINESS {readiness.percentage}%</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: readiness.total }).map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "w-1.5 h-1 rounded-sm transition-colors",
                              i < readiness.score 
                                ? readiness.percentage >= 80 ? 'bg-emerald-500' : readiness.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                : "bg-slate-200 dark:bg-slate-700"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      onClick={() => onCreateQuote(project)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm gap-1.5 text-xs font-semibold"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Quote</span>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
      
      {queue.length > 5 && (
        <div className="p-3.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
          <Button 
            variant="ghost" 
            onClick={onViewAll}
            className="w-full text-xs font-medium text-slate-500 hover:text-indigo-600"
          >
            View All {queue.length} Projects <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
