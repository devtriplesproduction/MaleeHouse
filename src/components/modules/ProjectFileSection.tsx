'use client';

import React from 'react';
import { DigitalVault } from './DigitalVault';

interface ProjectFileSectionProps {
  projectId: string;
  files: any[];
  userRole?: string;
}

export function ProjectFileSection({ projectId, files, userRole = 'admin' }: ProjectFileSectionProps) {
  return (
    <DigitalVault 
      projectId={projectId} 
      files={files} 
      userRole={userRole} 
    />
  );
}
