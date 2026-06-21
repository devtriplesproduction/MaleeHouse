"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface SOPViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sop: any;
}

export function SOPViewModal({ isOpen, onClose, sop }: SOPViewModalProps) {
  if (!sop) return null;

  const renderInline = (text: string) => {
    if (!text) return null;
    try {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    } catch (e) {
      return text;
    }
  };

  const getFormattedDate = () => {
    if (!sop.created_at) return 'Unknown Date';
    try {
      const parsedDate = new Date(sop.created_at);
      if (isNaN(parsedDate.getTime())) return 'Unknown Date';
      return format(parsedDate, 'MMM dd, yyyy');
    } catch (e) {
      return 'Unknown Date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-[#080b14]">
        {/* Premium Integrated Header */}
        <div className="relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-white/5">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
          
          <div className="relative p-8 flex items-start gap-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {sop.title || 'Untitled Procedure'}
                <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse shrink-0" />
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border-none">
                  {sop.target_role || 'Common'}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{getFormattedDate()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar bg-white dark:bg-transparent">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {(sop.content || 'No content provided.').split('\n').map((line: string, i: number) => {
              try {
                // Handle Headings
                if (line.startsWith('###')) {
                  return <h3 key={i} className="text-lg font-bold text-slate-900 dark:text-indigo-400 mt-6 mb-2">{line.replace(/^###\s*/, '').trim()}</h3>;
                }
                if (line.startsWith('##')) {
                  return <h2 key={i} className="text-xl font-bold text-slate-900 dark:text-indigo-300 mt-8 mb-3">{line.replace(/^##\s*/, '').trim()}</h2>;
                }
                
                // Handle Lists
                if (line.trim().startsWith('- ')) {
                  const content = line.trim().substring(2);
                  return (
                    <li key={i} className="ml-4 text-slate-600 dark:text-slate-300 mb-2 list-none flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                      <span>{renderInline(content)}</span>
                    </li>
                  );
                }

                if (line.trim() === '') return <br key={i} />;

                // Regular paragraph with inline formatting
                return <p key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{renderInline(line)}</p>;
              } catch (err) {
                // Safe fallback for any parsing errors
                return <p key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{line}</p>;
              }
            })}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="bg-slate-50/30 dark:bg-white/5 p-6 border-t border-slate-100 dark:border-white/5">
          <Button 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 shadow-md shadow-indigo-500/10 transition-all active:scale-95 rounded-xl"
          >
            Finished Reading
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
