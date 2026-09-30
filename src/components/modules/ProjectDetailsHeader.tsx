'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deleteProjectAction, updateProjectAction } from '@/actions/project.actions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProjectSchema, type UpdateProjectInput } from '@/validations/project.schema';
import { useToast } from '@/hooks/use-toast';

interface ProjectDetailsHeaderProps {
  project: {
    id: string;
    name: string;
    client_name: string;
    client_contact?: string;
    target_completion_date: string | null;
  };
  userRole?: string;
}

export function ProjectDetailsHeader({ project, userRole }: ProjectDetailsHeaderProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      client_name: project.client_name,
      target_completion_date: project.target_completion_date || '',
    },
  });

  const onUpdate = (data: UpdateProjectInput) => {
    startTransition(async () => {
      const result = await updateProjectAction(project.id, data);
      if (result?.success) {
        setIsEditOpen(false);
        router.refresh();
      } else {
        toast({ title: "Action Failed", description: result?.error || "An error occurred.", variant: "error" });
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      if (result?.success) {
        router.push('/projects');
      } else {
        toast({ title: "Action Failed", description: result?.error || "An error occurred.", variant: "error" });
      }
    });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs nums font-medium text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5">
              {project.id}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {project.name}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <p>
              Client: <span className="text-gray-900 dark:text-gray-200 font-medium">{project.client_name}</span>
            </p>
            {(() => {
              const contactText = project.client_contact || '';
              const phoneMatch = contactText.match(/Phone:\s*([^,]*)/i);
              const phoneVal = phoneMatch ? phoneMatch[1].trim() : '';
              const canSeePhone = ['admin', 'sales', 'accountant', 'engineer'].includes(userRole || '');

              if (phoneVal && canSeePhone) {
                return (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <p className="flex items-center gap-1.5">
                      <span className="text-xs uppercase tracking-wider font-bold">Phone:</span>
                      <span className="text-gray-900 dark:text-gray-200 font-medium">{phoneVal}</span>
                    </p>
                  </>
                );
              }
              return null;
            })()}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-medium"
          >
            Edit Project
          </button>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onUpdate)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Name</label>
              <input
                {...register('client_name')}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.client_name && <p className="text-xs text-red-500 mt-1">{errors.client_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Completion Date</label>
              <input
                type="date"
                {...register('target_completion_date')}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-sm text-gray-500">
            This will mark the project as deleted. This action is irreversible.
          </div>
          <div className="flex justify-end gap-3 p-6 pt-0">
            <button
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              disabled={isPending}
              className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
