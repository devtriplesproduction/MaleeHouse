'use client';

import React from 'react';
import { FollowUpManager } from './crm/FollowUpManager';
import { RequirementSystem } from './crm/RequirementSystem';
import { LeadTimeline } from './crm/LeadTimeline';
import { 
  ShieldCheck, 
  Target, 
  MessageSquare, 
  ClipboardList 
} from 'lucide-react';

interface LeadCRMViewProps {
  projectId: string;
  projectStatus: string;
  events: any[]; // Timeline events
  comments?: any[];
  tasks?: any[];
}

export function LeadCRMView({ projectId, projectStatus, events, comments = [], tasks = [] }: LeadCRMViewProps) {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Follow-up Section */}
      <div className="glass-card p-8 border-white/10">
        <FollowUpManager projectId={projectId} comments={comments} tasks={tasks} />
      </div>

      {/* Requirement System Section */}
      <div className="glass-card p-8 border-white/10">
        <RequirementSystem projectId={projectId} projectStatus={projectStatus} />
      </div>

      {/* Timeline Section */}
      <div className="glass-card p-8 border-white/10">
        <LeadTimeline events={events} />
      </div>
    </div>
  );
}
