'use client';

import React from 'react';
import { OperationsControlCenter } from './OperationsControlCenter';
import { OperationsFileUploadPanel } from './OperationsFileUploadPanel';

interface ProjectOperationsTabProps {
  projectId: string;
  projectStatus: string;
  userRole: string;
  currentUserId: string;
  teamMembers: any[];
  isFrozen?: boolean;
  files?: any[];
  comments: any[];
  activityLogs: any[];
  workflowHistory: any[];
}

export default function ProjectOperationsTab({
  projectId,
  projectStatus,
  userRole,
  currentUserId,
  teamMembers,
  isFrozen,
  files,
  comments,
  activityLogs,
  workflowHistory,
}: ProjectOperationsTabProps) {
  // Determine if user is operational role
  const isOperational = ['admin', 'engineer', 'cad', 'field', 'qc'].includes(userRole);
  const isAssigned = userRole === 'admin' || teamMembers.some((m: any) => m.userId === currentUserId || m.user_id === currentUserId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. File Uploads */}
      {isOperational && isAssigned && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Project Files
          </h2>
          <OperationsFileUploadPanel
            projectId={projectId}
            files={files || []}
            userRole={userRole}
          />
        </section>
      )}

      {/* 2. Active Operations Center */}
      {isOperational && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Active Control Center
          </h2>
          <OperationsControlCenter
            projectId={projectId}
            projectStatus={projectStatus}
            userRole={userRole}
            currentUserId={currentUserId}
            teamMembers={teamMembers}
            isFrozen={isFrozen}
            files={files}
          />
        </section>
      )}
    </div>
  );
}
