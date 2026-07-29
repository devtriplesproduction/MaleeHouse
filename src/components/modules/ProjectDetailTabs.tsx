'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, 
  FolderOpen, 
  Briefcase,
  DollarSign,
  GitBranch,
  MessageSquare,
  Activity,
  AlertCircle
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
import { getProjectFinanceTabDataAction } from '@/actions/finance.actions';

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
  serverRenderTime?: number;
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
  allUsers,
  cadRevisions,
  fieldReports,
  theme,
  serverRenderTime = 0
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
  const [financeData, setFinanceData] = useState<any>(null);
  const [isFinanceLoading, setIsFinanceLoading] = useState(false);
  const [financeFetchError, setFinanceFetchError] = useState(false);
  const [lastRenderTime, setLastRenderTime] = useState(serverRenderTime);

  // Post-render synchronization for cache invalidation
  useEffect(() => {
    if (serverRenderTime !== lastRenderTime) {
      setLastRenderTime(serverRenderTime);
      setFinanceData(null);
      setFinanceFetchError(false);
    }
  }, [serverRenderTime, lastRenderTime]);

  useEffect(() => {
    if ((activeTab === 'billing' || activeTab === 'finance') && !financeData && !isFinanceLoading && !financeFetchError) {
      setIsFinanceLoading(true);
      getProjectFinanceTabDataAction(project.id).then((res) => {
        if (res.success) {
          setFinanceData(res.data);
          setFinanceFetchError(false);
        } else {
          setFinanceFetchError(true);
        }
        setIsFinanceLoading(false);
      }).catch(() => {
        setFinanceFetchError(true);
        setIsFinanceLoading(false);
      });
    }
  }, [activeTab, financeData, isFinanceLoading, financeFetchError, project.id]);

  const handleRetryFinance = () => {
    setFinanceFetchError(false);
  };

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
                {financeFetchError ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Failed to load Billing Data</p>
                    <button 
                      onClick={handleRetryFinance}
                      className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : isFinanceLoading || !financeData ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-10 h-10 rounded-full border-[3px] border-slate-500 border-t-transparent animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Billing Data...</p>
                  </div>
                ) : (
                  <ProjectFinanceTabContent 
                    projectId={project.id}
                    project={project}
                    milestones={milestones}
                    visits={financeData.visits}
                    accountantOwner={financeData.accountantOwner}
                    role={userRole}
                    theme={theme}
                    quotation={financeData.activeQuotation}
                    activityLogs={activityLogs}
                    projectExpenses={financeData.projectExpenses}
                  />
                )}
              </div>
            )}
            
            {activeTab === 'finance' && showFinanceTab && (
              <div className="animate-in fade-in duration-300">
                {financeFetchError ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Failed to load Finance Data</p>
                    <button 
                      onClick={handleRetryFinance}
                      className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : isFinanceLoading || !financeData ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-10 h-10 rounded-full border-[3px] border-slate-500 border-t-transparent animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Finance Data...</p>
                  </div>
                ) : (
                  <ProjectFinanceDashboardTab 
                    projectId={project.id} 
                    theme={theme}
                    projectFinances={financeData.projectFinances}
                    projectInvoices={financeData.projectInvoices}
                    projectPayments={financeData.projectPayments}
                    projectExpenses={financeData.projectExpenses}
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
