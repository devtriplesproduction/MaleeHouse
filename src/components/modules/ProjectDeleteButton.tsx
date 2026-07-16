'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProjectAction } from '@/actions/project.actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface ProjectDeleteButtonProps {
  projectId: string;
}

export function ProjectDeleteButton({ projectId }: ProjectDeleteButtonProps) {
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
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete Project
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this project? This action cannot be undone.
          </div>
          <div className="flex justify-end gap-3 p-6 pt-0">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              disabled={isPending}
              className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
