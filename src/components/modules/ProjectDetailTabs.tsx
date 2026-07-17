'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, 
  FolderOpen, 
  Briefcase,
  DollarSign,
  GitBranch,
  MessageSquare,
  Activity 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import tab components
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectDocumentsTab from './ProjectDocumentsTab';
import ProjectOperationsTab from './ProjectOperationsTab';
import ProjectWorkflowTab from './ProjectWorkflowTab';
import ProjectCommunicationTab from './ProjectCommunicationTab';
import ProjectActivityLogTab from './ProjectActivityLogTab';
import { ProjectFinanceTabContent } from './ProjectFinanceTabContent';
import { ProjectFinanceDashboardTab } from './ProjectFinanceDashboardTab';

interface ProjectDetailTabsProps {
  project: any;
  userRole: string;
  currentUserId: string;
  history: any[];
  activityLogs: any[];
  comments: any[];
  files: any[];
  teamMembers: any[];
  milestones: any[];
  visits: any[];
  accountantOwner: any;
  activeQuotation?: any;
  allUsers: any[];
  cadRevisions?: any[];
  fieldReports?: any[];
  theme: {
    primary: string;
    hover: string;
    text: string;
    bg: string;
    border: string;
    glow: string;
  };
}

export function ProjectDetailTabs({
  project,
  userRole,
  currentUserId,
  history,
  activityLogs,
  comments,
  files,
  teamMembers,
  milestones,
  visits,
  accountantOwner,
  activeQuotation,
  allUsers,
  cadRevisions,
  fieldReports,
  theme
}: ProjectDetailTabsProps) {
  
  const showFinanceTab = userRole === 'admin' || userRole === 'accountant';

  // Define available tabs based on permissions
  const tabs = [
    {
      id: 'overview',
      label: 'Overview & Operations',
      icon: LayoutGrid,
      description: 'Project details, operations workspace, and team resources.'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FolderOpen,
      description: 'Centralized document vault with folder level upload permissions.'
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: GitBranch,
      description: 'Track workflow progression and phase changes.'
    },
    ...(userRole !== 'accountant' ? [{
      id: 'communications',
      label: 'Communications',
      icon: MessageSquare,
      description: 'Project discussions, updates, and communication logs.'
    }] : []),
    ...(showFinanceTab ? [{
      id: 'billing',
      label: 'Billing',
      icon: DollarSign,
      description: 'Commercial invoice ledger, milestone gates, lockout history, and details.'
    }, {
      id: 'finance',
      label: 'Finance',
      icon: Activity,
      description: 'Project financial performance, budget tracking, and detailed P&L.'
    }] : [])
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="space-y-6">
      {/* Old Simple Tab Header */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 p-1.5 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 rounded-full w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200",
                isActive 
                  ? cn("bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-white/5", theme.text) 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Icon className={cn(
                "w-4 h-4",
                isActive ? theme.text : "text-slate-400 dark:text-slate-500"
              )} />
              {tab.label}
            </button>
          );
        })}
      </div>



      {/* Tab Panels with Premium Slide/Fade Animation */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.995 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {activeTab === 'overview' && (
              <div className="animate-in fade-in duration-300">
                <ProjectOverviewTab 
                  project={project}
                  userRole={userRole}
                  currentUserId={currentUserId}
                  teamMembers={teamMembers}
                  allUsers={allUsers}
                  files={files}
                  cadRevisions={cadRevisions}
                />
              </div>
            )}
            
            {activeTab === 'documents' && (
              <div className="animate-in fade-in duration-300">
                <ProjectDocumentsTab 
                  projectId={project.id}
                  files={files}
                  userRole={userRole}
                />
              </div>
            )}
            
            {activeTab === 'workflow' && (
              <div className="animate-in fade-in duration-300">
                <ProjectWorkflowTab 
                  projectId={project.id}
                  projectStatus={project.status}
                  userRole={userRole}
                  isFrozen={project.is_frozen}
                  history={history}
                />
              </div>
            )}
            
            {activeTab === 'communications' && (
              <div className="animate-in fade-in duration-300">
                <ProjectCommunicationTab 
                  projectId={project.id}
                  comments={comments}
                  userRole={userRole}
                  currentUserId={currentUserId}
                />
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="animate-in fade-in duration-300">
                <ProjectActivityLogTab 
                  activityLogs={activityLogs}
                  workflowHistory={history}
                />
              </div>
            )}

            {activeTab === 'operations' && (
              <div className="animate-in fade-in duration-300">
                <ProjectOperationsTab 
                  projectId={project.id}
                  projectStatus={project.status}
                  userRole={userRole}
                  currentUserId={currentUserId}
                  teamMembers={teamMembers}
                  isFrozen={project.is_frozen}
                  files={files}
                  comments={comments}
                  activityLogs={activityLogs}
                  workflowHistory={history}
                />
              </div>
            )}
            
            {activeTab === 'billing' && showFinanceTab && (
              <div className="animate-in fade-in duration-300">
                <ProjectFinanceTabContent 
                  projectId={project.id}
                  project={project}
                  milestones={milestones}
                  visits={visits}
                  accountantOwner={accountantOwner}
                  role={userRole}
                  theme={theme}
                  quotation={activeQuotation}
                  activityLogs={activityLogs}
                />
              </div>
            )}
            
            {activeTab === 'finance' && showFinanceTab && (
              <div className="animate-in fade-in duration-300">
                <ProjectFinanceDashboardTab projectId={project.id} theme={theme} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
