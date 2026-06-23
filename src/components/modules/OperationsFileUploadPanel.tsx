'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Loader2,
  FolderOpen,
  Send,
  Plus,
  Download,
  Eye,
  BookOpen,
  PenTool,
  Trash2,
  Bell,
  MapPin,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { uploadProjectFile } from '@/lib/supabase/storage';
import { updateProjectStageAction } from '@/actions/workflow.actions';
import { submitCADRevisionAction, reviewFieldSurveyAction, reviewLatestCADRevisionAction } from '@/actions/operations.actions';
import { deleteFileAction, registerFileAction } from '@/actions/file.actions';
import { notifySupplementalUploadAction } from '@/actions/notification.actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

function CollapsibleWidget({ title, icon: Icon, defaultExpanded = true, children, rightAction, badgeCount }: any) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  return (
    <div className="glass-card border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm transition-all bg-white dark:bg-slate-900">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">{title}</h3>
            {badgeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black tracking-wider">
                {badgeCount} {badgeCount === 1 ? 'FILE' : 'FILES'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {rightAction}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-400"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-5 pb-6 animate-in slide-in-from-top-2 duration-300">
          <div className="h-px w-full bg-slate-100 dark:bg-white/5 mb-5" />
          {children}
        </div>
      )}
    </div>
  );
}

interface OperationsFileUploadPanelProps {
  projectId: string;
  files: any[];
  userRole: string;
  projectStatus?: string;
}

export function OperationsFileUploadPanel({
  projectId,
  files,
  userRole,
  projectStatus
}: OperationsFileUploadPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean, type: 'survey' | 'final' | 'prototype' | null }>({ isOpen: false, type: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionComments, setRejectionComments] = useState('');
  const [rejectionInstructions, setRejectionInstructions] = useState('');

  const isAdmin = userRole === 'admin';
  const isEngineer = userRole === 'engineer';
  const isCad = userRole === 'cad';
  const isField = userRole === 'field' || userRole === 'field_engineer';

  const isProjectClosed = projectStatus === 'completed' || projectStatus === 'archived';
  const isMidstage = projectStatus && projectStatus !== 'project_created' && projectStatus !== 'data_collection';

  const clientDocs = files.filter((f: any) => f.category === 'requirements' || f.category === 'intake_document');
  const prototypeDocs = files.filter((f: any) => f.category === 'prototype' || f.category === 'cad_drawing');
  const controlPointDocs = files.filter((f: any) => f.category === 'control_point_image');
  const surveyDocs = files.filter((f: any) => f.category === 'survey_data' || f.category === 'control_point_csv');
  const finalDocs = files.filter((f: any) => f.category === 'final_file');

  const handleUploadPrototype = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(40);
      const uploadResult = await uploadProjectFile(file, projectId);
      setUploadProgress(70);

      const registerResult = await registerFileAction({
        project_id: projectId,
        category: 'prototype',
        file_name: uploadResult.fileName,
        file_url: uploadResult.publicUrl,
        mime_type: uploadResult.mimeType,
        file_size: uploadResult.fileSize,
        storage_bucket: 'project-assets',
      });

      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Failed to register file in database');
      }

      setUploadProgress(100);
      toast({
        title: 'Upload Successful',
        description: `${file.name} uploaded successfully.`,
        variant: 'success'
      });

      handleSendUpdate();
      router.refresh();

    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message,
        variant: 'error'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadControlPoint = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(40);
      const uploadResult = await uploadProjectFile(file, projectId);
      setUploadProgress(70);

      const registerResult = await registerFileAction({
        project_id: projectId,
        category: 'control_point_image',
        file_name: uploadResult.fileName,
        file_url: uploadResult.publicUrl,
        mime_type: uploadResult.mimeType,
        file_size: uploadResult.fileSize,
        storage_bucket: 'project-assets',
      });

      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Failed to register file in database');
      }

      setUploadProgress(100);
      toast({
        title: 'Upload Successful',
        description: `"${file.name}" uploaded successfully.`,
        variant: 'success'
      });

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        router.refresh();
      }, 600);

    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      toast({
        title: 'Upload Failed',
        description: err.message || 'File upload failed.',
        variant: 'error'
      });
    }
  };

  const handleUploadClientDoc = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(40);
      const uploadResult = await uploadProjectFile(file, projectId);
      setUploadProgress(70);

      const registerResult = await registerFileAction({
        project_id: projectId,
        category: 'requirements',
        file_name: uploadResult.fileName,
        file_url: uploadResult.publicUrl,
        mime_type: uploadResult.mimeType,
        file_size: uploadResult.fileSize,
        storage_bucket: 'project-assets',
      });

      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Failed to register file in database');
      }

      setUploadProgress(100);
      toast({
        title: 'Upload Successful',
        description: `"${file.name}" uploaded to Client Documents.`,
        variant: 'success'
      });

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        router.refresh();
      }, 600);

    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      toast({
        title: 'Upload Failed',
        description: err.message || 'File upload failed.',
        variant: 'error'
      });
    }
  };

  const handleSendToCAD = () => {
    startTransition(async () => {
      const res = await updateProjectStageAction(
        projectId,
        'prototype',
        'Client documents uploaded. Dispatched to CAD engineer for prototype drawing.'
      );
      if (res?.success) {
        toast({
          title: 'Dispatched to CAD',
          description: 'Project moved to CAD Prototype stage successfully.',
          variant: 'success'
        });
        router.refresh();
      } else {
        toast({
          title: 'Dispatch Failed',
          description: res?.error || 'An error occurred.',
          variant: 'error'
        });
      }
    });
  };

  const handleSendUpdate = () => {
    startTransition(async () => {
      const res = await notifySupplementalUploadAction(projectId);
      if (res.success) {
        toast({
          title: 'Update Sent',
          description: 'Notification sent to next stage accounts regarding the new file upload.',
          variant: 'success'
        });
      } else {
        toast({
          title: 'Notification Failed',
          description: res.error || 'Failed to send notifications.',
          variant: 'error'
        });
      }
    });
  };

  const handleSubmitPrototype = () => {
    startTransition(async () => {
      const latestProto = prototypeDocs[0];
      if (!latestProto) {
        toast({
          title: 'Submission Failed',
          description: 'Please upload a prototype file first.',
          variant: 'error'
        });
        return;
      }

      const revRes = await submitCADRevisionAction(
        projectId,
        latestProto.file_name,
        latestProto.file_url,
        'Initial CAD Prototype submission'
      );

      if (!revRes.success) {
        toast({
          title: 'Submission Failed',
          description: revRes.error || 'Failed to submit CAD revision.',
          variant: 'error'
        });
        return;
      }

      const stageRes = await updateProjectStageAction(
        projectId,
        'review',
        'CAD Prototype submitted for review.'
      );

      if (stageRes?.success) {
        toast({
          title: 'Submitted for Review',
          description: 'Project moved to CAD Review stage.',
          variant: 'success'
        });
        router.refresh();
      } else {
        toast({
          title: 'Stage Update Failed',
          description: stageRes?.error || 'An error occurred.',
          variant: 'error'
        });
      }
    });
  };

  const handleUploadSurveyData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(40);
      const uploadResult = await uploadProjectFile(file, projectId);
      setUploadProgress(70);

      const registerResult = await registerFileAction({
        project_id: projectId,
        category: 'survey_data',
        file_name: uploadResult.fileName,
        file_url: uploadResult.publicUrl,
        mime_type: uploadResult.mimeType,
        file_size: uploadResult.fileSize,
        storage_bucket: 'project-assets',
      });

      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Failed to register file in database');
      }

      setUploadProgress(100);
      toast({
        title: 'Upload Successful',
        description: `"${file.name}" uploaded to Survey Data.`,
        variant: 'success'
      });

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        router.refresh();
      }, 600);

    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      toast({
        title: 'Upload Failed',
        description: err.message || 'File upload failed.',
        variant: 'error'
      });
    }
  };

  const handleUploadFinalDoc = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(40);
      const uploadResult = await uploadProjectFile(file, projectId);
      setUploadProgress(70);

      const registerResult = await registerFileAction({
        project_id: projectId,
        category: 'final_file',
        file_name: uploadResult.fileName,
        file_url: uploadResult.publicUrl,
        mime_type: uploadResult.mimeType,
        file_size: uploadResult.fileSize,
        storage_bucket: 'project-assets',
      });

      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Failed to register file in database');
      }

      setUploadProgress(100);
      toast({
        title: 'Upload Successful',
        description: `"${file.name}" uploaded to Final Deliverables.`,
        variant: 'success'
      });

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        router.refresh();
      }, 600);

    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      toast({
        title: 'Upload Failed',
        description: err.message || 'File upload failed.',
        variant: 'error'
      });
    }
  };

  const handleSubmitFinalReport = () => {
    startTransition(async () => {
      if (finalDocs.length === 0) {
        toast({
          title: 'Submission Failed',
          description: 'Please upload a final deliverable first.',
          variant: 'error'
        });
        return;
      }

      const latestFinal = finalDocs[0];
      const revRes = await submitCADRevisionAction(
        projectId,
        latestFinal.file_name,
        latestFinal.file_url,
        'Final CAD Deliverable submission'
      );

      if (!revRes.success) {
        toast({
          title: 'Submission Failed',
          description: revRes.error || 'Failed to submit final deliverable revision.',
          variant: 'error'
        });
        return;
      }

      const stageRes = await updateProjectStageAction(
        projectId,
        'cad_finalization',
        'CAD Final Deliverable submitted for engineering validation.'
      );

      if (stageRes?.success) {
        toast({
          title: 'Submitted for Validation',
          description: 'Project moved to Engineer Review stage.',
          variant: 'success'
        });
        router.refresh();
      } else {
        toast({
          title: 'Stage Update Failed',
          description: stageRes?.error || 'An error occurred.',
          variant: 'error'
        });
      }
    });
  };

  const handleReviewSurveyInline = (isApproved: boolean) => {
    if (isApproved) {
      startTransition(async () => {
        const res = await reviewFieldSurveyAction(projectId, true, "");
        if (res.success) {
          toast({
            title: 'Survey Validated',
            description: 'Project moved to CAD Drafting.',
            variant: 'success'
          });
          router.refresh();
        } else {
          toast({
            title: 'Action Failed',
            description: res.error || 'Failed to review survey.',
            variant: 'error'
          });
        }
      });
    } else {
      setRejectionReason('');
      setRejectionModal({ isOpen: true, type: 'survey' });
    }
  };

  const handleReviewFinalDeliverableInline = (isApproved: boolean) => {
    if (isApproved) {
      if (!confirm("Are you sure you want to approve this final CAD package and complete the project?")) return;
      startTransition(async () => {
        const { engineerReviewFinalCADAction } = await import("@/actions/review.actions");
        const res = await engineerReviewFinalCADAction(projectId, true);
        if (res.success) {
          toast({
            title: 'Final Deliverable Approved',
            description: 'Project marked as Completed.',
            variant: 'success'
          });
          router.refresh();
        } else {
          toast({
            title: 'Approval Failed',
            description: res.error || 'An error occurred.',
            variant: 'error'
          });
        }
      });
    } else {
      setRejectionReason('');
      setRejectionComments('');
      setRejectionInstructions('');
      setRejectionModal({ isOpen: true, type: 'final' });
    }
  };

  const handleReviewPrototypeInline = (isApproved: boolean) => {
    if (isApproved) {
      startTransition(async () => {
        const res = await reviewLatestCADRevisionAction(projectId, true, "");
        if (res.success) {
          toast({
            title: 'Prototype Approved',
            description: 'Project moved to Field Work stage.',
            variant: 'success'
          });
          router.refresh();
        } else {
          toast({
            title: 'Action Failed',
            description: res.error || 'Failed to review prototype.',
            variant: 'error'
          });
        }
      });
    } else {
      setRejectionReason('');
      setRejectionModal({ isOpen: true, type: 'prototype' });
    }
  };

  const submitRejection = () => {
    if (!rejectionReason.trim()) {
      toast({ title: 'Validation', description: 'Rejection reason is required.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      if (rejectionModal.type === 'prototype') {
        const res = await reviewLatestCADRevisionAction(projectId, false, rejectionReason);
        if (res.success) {
          toast({ title: 'Prototype Rejected', description: 'Sent back to CAD team.', variant: 'success' });
          router.refresh();
        } else {
          toast({ title: 'Action Failed', description: res.error || 'Failed to review prototype.', variant: 'error' });
        }
      } else if (rejectionModal.type === 'survey') {
        const res = await reviewFieldSurveyAction(projectId, false, rejectionReason);
        if (res.success) {
          toast({ title: 'Survey Sent for Rework', description: 'Sent back to field team.', variant: 'success' });
          router.refresh();
        } else {
          toast({ title: 'Action Failed', description: res.error || 'Failed to review survey.', variant: 'error' });
        }
      } else if (rejectionModal.type === 'final') {
        const { engineerReviewFinalCADAction } = await import("@/actions/review.actions");
        const res = await engineerReviewFinalCADAction(projectId, false, rejectionReason, rejectionComments, rejectionInstructions);
        if (res.success) {
          toast({ title: 'Final Deliverable Rejected', description: 'Project returned to CAD Finalization stage.', variant: 'success' });
          router.refresh();
        } else {
          toast({ title: 'Rejection Failed', description: res.error || 'An error occurred.', variant: 'error' });
        }
      }
      setRejectionModal({ isOpen: false, type: null });
    });
  };

  const handleSubmitSurveyData = () => {
    startTransition(async () => {
      if (surveyDocs.length === 0) {
        toast({
          title: 'Submission Failed',
          description: 'Please upload survey data first.',
          variant: 'error'
        });
        return;
      }

      const stageRes = await updateProjectStageAction(
        projectId,
        'data_sync',
        'Survey data uploaded. Ready for CAD verification.'
      );

      if (stageRes?.success) {
        toast({
          title: 'Submitted Survey Data',
          description: 'Project moved to Data Sync stage.',
          variant: 'success'
        });
        router.refresh();
      } else {
        toast({
          title: 'Submission Failed',
          description: stageRes?.error || 'An error occurred.',
          variant: 'error'
        });
      }
    });
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    startTransition(async () => {
      const res = await deleteFileAction(fileId, projectId);
      if (res.success) {
        toast({
          title: 'Deleted',
          description: 'File has been deleted.',
          variant: 'success'
        });
        router.refresh();
      } else {
        toast({
          title: 'Delete Failed',
          description: res.error || 'Could not delete file.',
          variant: 'error'
        });
      }
    });
  };

  if (!isAdmin && !isEngineer && !isCad && !isField) return null;

  return (
    <div className="flex flex-col gap-5">
      <Dialog open={rejectionModal.isOpen} onOpenChange={(open) => !open && setRejectionModal({ isOpen: false, type: null })}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <XCircle className="w-6 h-6 text-rose-500" />
              Provide Rejection Reason
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Please explain why this document is being rejected so the team can rework it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Required explanation..."
                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-800 dark:text-white min-h-[100px] resize-none"
              />
            </div>
            {rejectionModal.type === 'final' && (
              <>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Comments (Optional)</label>
                  <textarea
                    value={rejectionComments}
                    onChange={(e) => setRejectionComments(e.target.value)}
                    placeholder="Any additional comments..."
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-800 dark:text-white min-h-[60px] resize-none"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Revision Instructions (Optional)</label>
                  <textarea
                    value={rejectionInstructions}
                    onChange={(e) => setRejectionInstructions(e.target.value)}
                    placeholder="Specific instructions for revision..."
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-800 dark:text-white min-h-[60px] resize-none"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="mt-6 flex gap-3 sm:gap-0">
            <button
              disabled={isPending}
              onClick={() => setRejectionModal({ isOpen: false, type: null })}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isPending || !rejectionReason.trim()}
              onClick={submitRejection}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Reject Document
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-bold tracking-wider flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Uploading to secure vault...
            </span>
            <span className="font-bold text-indigo-600">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Top Section: Reference Documents */}
      <CollapsibleWidget
        title={isCad ? 'Reference Documents' : 'Client Documents'}
        icon={BookOpen}
        defaultExpanded={false}
        badgeCount={clientDocs.length}
        rightAction={
          (isAdmin || isEngineer) && !isProjectClosed && (
            <label className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 cursor-pointer transition flex items-center gap-2 shadow-sm text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">
              <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Upload</span>
              <input type="file" className="hidden" onChange={handleUploadClientDoc} disabled={isUploading} />
            </label>
          )
        }
      >
        <div className="space-y-3">
          {clientDocs.map((file: any) => (
            <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 truncate" title={file.file_name}>
                  {file.file_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a href={file.file_url} target="_blank" rel="noreferrer noopener" title="Preview" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition">
                  <Eye className="w-4 h-4" />
                </a>
                <a href={file.file_url} download={file.file_name} title="Download" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition">
                  <Download className="w-4 h-4" />
                </a>
                {(isAdmin || isEngineer) && !isProjectClosed && (
                  <button onClick={() => handleDeleteFile(file.id, file.file_name)} disabled={isPending} title="Delete" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {clientDocs.length === 0 && (
            isProjectClosed ? (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-slate-50/50 dark:bg-white/5 opacity-60">
                <FolderOpen className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No Client Documents Uploaded</p>
              </div>
            ) : (
              <label className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-slate-50/50 dark:bg-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <FolderOpen className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-500">{(isAdmin || isEngineer) ? "Click to upload Client Document" : "No Client Documents Uploaded Yet"}</p>
                {(isAdmin || isEngineer) && <input type="file" className="hidden" onChange={handleUploadClientDoc} disabled={isUploading} />}
              </label>
            )
          )}

          {/* Action Button */}
          {!isCad && isEngineer && (
            isMidstage ? (
              <button
                onClick={handleSendUpdate}
                disabled={isPending || clientDocs.length === 0}
                className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3 border-2 border-indigo-600/20 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 dark:border-indigo-400/20 dark:hover:border-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl text-sm disabled:opacity-50 transition-all shadow-sm group"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4 group-hover:animate-bounce" />}
                Notify Team of Supplemental Documents
              </button>
            ) : (
              <button
                onClick={handleSendToCAD}
                disabled={isPending || files.length === 0}
                className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-all shadow-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send to CAD
              </button>
            )
          )}
        </div>
      </CollapsibleWidget>

      {/* Second Section: Prototype Submission */}
      <CollapsibleWidget
        title="CAD Prototypes"
        icon={PenTool}
        defaultExpanded={false}
        badgeCount={prototypeDocs.length}
        rightAction={
          isCad && !isProjectClosed && (
            <label className="px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 cursor-pointer transition flex items-center gap-2 shadow-sm text-xs font-bold border border-violet-100 dark:border-violet-500/20">
              <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Upload</span>
              <input type="file" className="hidden" onChange={handleUploadPrototype} disabled={isUploading} />
            </label>
          )
        }
      >
        <div className="space-y-3">
          {prototypeDocs.map((file: any) => (
            <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-violet-500" />
                </div>
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 truncate" title={file.file_name}>
                  {file.file_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a href={file.file_url} target="_blank" rel="noreferrer noopener" title="Preview" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-white dark:hover:bg-slate-800 transition">
                  <Eye className="w-4 h-4" />
                </a>
                <a href={file.file_url} download={file.file_name} title="Download" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-white dark:hover:bg-slate-800 transition">
                  <Download className="w-4 h-4" />
                </a>
                {(isAdmin || isCad) && !isProjectClosed && (
                  <button onClick={() => handleDeleteFile(file.id, file.file_name)} disabled={isPending} title="Delete" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {prototypeDocs.length === 0 && (
            isProjectClosed ? (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-slate-50/50 dark:bg-white/5 opacity-60">
                <FolderOpen className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No Prototype Uploaded</p>
              </div>
            ) : isCad ? (
              <label className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-slate-50/50 dark:bg-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <FolderOpen className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-500">Click to upload Prototype</p>
                <input type="file" className="hidden" onChange={handleUploadPrototype} disabled={isUploading} />
              </label>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-slate-50/50 dark:bg-white/5 opacity-60">
                <FolderOpen className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No Prototype Uploaded Yet</p>
              </div>
            )
          )}

          {/* Submit Prototype Button */}
          {isCad && projectStatus === "prototype" && (
            <button
              onClick={handleSubmitPrototype}
              disabled={isPending || prototypeDocs.length === 0}
              className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-all shadow-sm"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Prototype
            </button>
          )}

          {/* Engineer Review Buttons for Prototype */}
          {(isEngineer || isAdmin) && projectStatus === "review" && prototypeDocs.length > 0 && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleReviewPrototypeInline(true)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve
              </button>
              <button
                onClick={() => handleReviewPrototypeInline(false)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
            </div>
          )}
        </div>
      </CollapsibleWidget>

      {/* Third Section: Field Survey Data */}
      <CollapsibleWidget
        title="Field Survey Data"
        icon={MapPin}
        defaultExpanded={false}
        badgeCount={surveyDocs.length + controlPointDocs.length}
      >
        <div className="space-y-8">
          {/* Part 1: Control Points */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                1. Control Point Images <span className="text-rose-500 text-xs uppercase font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20">Required</span>
              </h4>
              {(isAdmin || (isField && (projectStatus === 'field_work' || projectStatus === 'field_assigned'))) && !isProjectClosed && (
                <label className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 cursor-pointer transition flex items-center gap-2 shadow-sm text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
                  <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Upload Control Point</span>
                  <input type="file" className="hidden" onChange={handleUploadControlPoint} disabled={isUploading} accept="image/*" />
                </label>
              )}
            </div>

            <div className="space-y-3">
              {controlPointDocs.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 truncate" title={file.file_name}>
                      {file.file_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={file.file_url} target="_blank" rel="noreferrer noopener" title="Preview" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition">
                      <Eye className="w-4 h-4" />
                    </a>
                    <a href={file.file_url} download={file.file_name} title="Download" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition">
                      <Download className="w-4 h-4" />
                    </a>
                    {(isAdmin || (isField && (projectStatus === 'field_work' || projectStatus === 'field_assigned'))) && !isProjectClosed && (
                      <button onClick={() => handleDeleteFile(file.id, file.file_name)} disabled={isPending} title="Delete" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {controlPointDocs.length === 0 && (
                <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 flex items-center gap-3">
                  <p className="text-sm font-medium">Control point images must be uploaded before you can provide the survey data.</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-white/10" />

          {/* Part 2: Survey Data */}
          <div className={controlPointDocs.length === 0 ? "opacity-50 pointer-events-none relative" : ""}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                2. Survey Data
              </h4>
              {(isAdmin || (isField && (projectStatus === 'field_work' || projectStatus === 'field_assigned'))) && !isProjectClosed && (
                <label className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 cursor-pointer transition flex items-center gap-2 shadow-sm text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
                  <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Upload Survey Data</span>
                  <input type="file" className="hidden" onChange={handleUploadSurveyData} disabled={isUploading} />
                </label>
              )}
            </div>
            <div className="space-y-3">
              {surveyDocs.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <FileText className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 truncate" title={file.file_name}>
                      {file.file_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={file.file_url} target="_blank" rel="noreferrer noopener" title="Preview" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition">
                      <Eye className="w-4 h-4" />
                    </a>
                    <a href={file.file_url} download={file.file_name} title="Download" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition">
                      <Download className="w-4 h-4" />
                    </a>
                    {(isAdmin || (isField && (projectStatus === 'field_work' || projectStatus === 'field_assigned'))) && !isProjectClosed && (
                      <button onClick={() => handleDeleteFile(file.id, file.file_name)} disabled={isPending} title="Delete" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {surveyDocs.length === 0 && (
                <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-slate-50/50 dark:bg-white/5 opacity-60">
                  <FolderOpen className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No Survey Data Uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* CAD/Engineer Survey Validation Buttons */}
          {(isCad || isEngineer || isAdmin) && ["field_assigned", "field_work", "data_sync"].includes(projectStatus || "") && surveyDocs.length > 0 && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleReviewSurveyInline(false)}
                disabled={isPending}
                className="flex-1 py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 disabled:opacity-50 text-sm font-black rounded-xl transition flex justify-center items-center gap-2"
              >
                Survey Collection (Rework)
              </button>
              <button
                onClick={() => handleReviewSurveyInline(true)}
                disabled={isPending}
                className="flex-[2] py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 text-sm font-black rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Survey Validation (Accept)
              </button>
            </div>
          )}

          {/* Submit Survey Data Button */}
          {isField && ["field_assigned", "field_work", "data_sync"].includes(projectStatus || "") && (
            <button
              onClick={handleSubmitSurveyData}
              disabled={isPending || surveyDocs.length === 0 || controlPointDocs.length === 0 || projectStatus === "data_sync"}
              className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (projectStatus === "data_sync" ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
              {projectStatus === "data_sync" ? "Survey Submitted for CAD Review" : "Send to CAD"}
            </button>
          )}
        </div>
      </CollapsibleWidget>

      {/* Bottom Section: Final Deliverables */}
      <CollapsibleWidget
        title="Final Deliverables"
        icon={BookOpen}
        defaultExpanded={false}
        badgeCount={finalDocs.length}
        rightAction={
          (isCad || isAdmin) && !isProjectClosed && (
            <label className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer transition flex items-center gap-2 shadow-sm text-xs font-bold border border-blue-100 dark:border-blue-500/20">
              <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Upload</span>
              <input type="file" className="hidden" onChange={handleUploadFinalDoc} disabled={isUploading} />
            </label>
          )
        }
      >
        <div className="space-y-3">
          {finalDocs.map((file: any) => (
            <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <FileText className="w-4 h-4 text-violet-500" />
                </div>
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 truncate" title={file.file_name}>
                  {file.file_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a href={file.file_url} target="_blank" rel="noreferrer noopener" title="Preview" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-white dark:hover:bg-slate-800 transition">
                  <Eye className="w-4 h-4" />
                </a>
                <a href={file.file_url} download={file.file_name} title="Download" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-white dark:hover:bg-slate-800 transition">
                  <Download className="w-4 h-4" />
                </a>
                {(isAdmin || isCad) && !isProjectClosed && (
                  <button onClick={() => handleDeleteFile(file.id, file.file_name)} disabled={isPending} title="Delete" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {finalDocs.length === 0 && (
            isProjectClosed ? (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-slate-50/50 dark:bg-white/5 opacity-60">
                <FolderOpen className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No Final Deliverables Uploaded</p>
              </div>
            ) : (isCad || isAdmin) ? (
              <label className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-slate-50/50 dark:bg-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <FolderOpen className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-500">Click to upload Final Deliverable</p>
                <input type="file" className="hidden" onChange={handleUploadFinalDoc} disabled={isUploading} />
              </label>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center bg-slate-50/50 dark:bg-white/5 opacity-60">
                <FolderOpen className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No Final Deliverables Uploaded Yet</p>
              </div>
            )
          )}

          {/* Engineer Final Deliverable Validation Buttons */}
          {(isEngineer || isAdmin) && projectStatus === "cad_finalization" && finalDocs.length > 0 && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleReviewFinalDeliverableInline(true)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve
              </button>
              <button
                onClick={() => handleReviewFinalDeliverableInline(false)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
            </div>
          )}

          {/* Submit Final Report Button */}
          {isCad && projectStatus === "cad_finalization" && (
            <button
              onClick={handleSubmitFinalReport}
              disabled={isPending || finalDocs.length === 0}
              className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-all shadow-sm"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Final Report & Send for Validation
            </button>
          )}
        </div>
      </CollapsibleWidget>

    </div>
  );
}
