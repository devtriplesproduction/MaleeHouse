'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProjectTeamManager } from './ProjectTeamManager';

interface TeamManagementWrapperProps {
  projectId: string;
  initialTeam: any[];
}

export function TeamManagementWrapper({ projectId, initialTeam }: TeamManagementWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full py-3 rounded-xl border border-dashed border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 group"
      >
        <UserPlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        Manage Team Squad
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-transparent border-none">
          <ProjectTeamManager 
            projectId={projectId} 
            initialTeam={initialTeam} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
