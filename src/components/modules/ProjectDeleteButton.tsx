'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProjectAction } from '@/actions/project.actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectDeleteButtonProps {
  projectId: string;
  iconOnly?: boolean;
  disabled?: boolean;
}

export function ProjectDeleteButton({ projectId, iconOnly, disabled }: ProjectDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteProjectAction(projectId);
      if (result?.success) {
        toast({ title: 'Success', description: 'Project deleted successfully.', variant: 'default' });
        router.push('/projects');
      } else {
        toast({ title: 'Error', description: result?.error || 'Failed to delete project.', variant: 'error' });
      }
    });
  };

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!disabled) setIsOpen(true); 
          }}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all",
            disabled 
              ? "text-slate-200 dark:text-slate-700 opacity-50 cursor-not-allowed"
              : "text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          )}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!disabled) setIsOpen(true); 
          }}
          className={cn(
            "group px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all duration-300",
            disabled
              ? "bg-slate-50 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-slate-600 dark:border-white/10 opacity-50 cursor-not-allowed"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20"
          )}
        >
          <Trash2 className={cn("w-4 h-4", !disabled && "transition-transform group-hover:scale-110")} />
          Delete Project
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-white/10 shadow-2xl bg-white dark:bg-[#111111] rounded-2xl">
          <div className="relative p-6 pt-8 flex flex-col items-center text-center">
            {/* Warning Icon Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-50 pointer-events-none" />
            
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4 ring-8 ring-red-50 dark:ring-red-500/10 z-10">
              <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            
            <DialogHeader className="z-10">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Project</DialogTitle>
            </DialogHeader>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm z-10 mb-6">
              Are you sure you want to delete this project? All associated data will be permanently removed. This action cannot be undone.
            </p>

            <div className="flex w-full gap-3 z-10">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 hover:shadow-red-600/40 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
