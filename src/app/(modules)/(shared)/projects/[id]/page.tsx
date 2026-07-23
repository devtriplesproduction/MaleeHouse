import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Hash,
  ChevronRight,
  ShieldCheck,
  LayoutGrid,
  Clock,
  FileText,
  PenTool,
  Truck,
  AlertTriangle,
  Zap,
  Phone,
  Lock
} from "lucide-react";
import Link from "next/link";
import { cn, filterActivityLogsByRole } from "@/lib/utils";
import { WorkflowStepper } from "@/features/workflow/WorkflowStepper";
import { ProjectFileSection } from "@/components/modules/ProjectFileSection";
import { WorkflowCheckpoints } from "@/components/modules/WorkflowCheckpoints";
import { ProjectTeamStack } from "@/components/modules/ProjectTeamStack";
import { ProjectTaskProgress } from "@/components/modules/ProjectTaskProgress";
import { ProjectActivityFeed } from "@/components/modules/ProjectActivityFeed";
import { ProjectBillingSummary } from "@/components/modules/ProjectBillingSummary";


import { SalesActionsPanel } from "@/features/sales/components/SalesActionsPanel";
import { LeadCRMView } from "@/features/sales/components/LeadCRMView";
import { QuotationList } from "@/features/accounts/QuotationList";
import { getProjectQuotationsAction } from "@/actions/quotation.actions";
import { CADRevisionPanel } from "@/components/modules/CADRevisionPanel";
import { FieldReportPanel } from "@/components/modules/FieldReportPanel";
import { DeliveryReadinessPanel } from "@/components/modules/DeliveryReadinessPanel";
import { StageDependentLockBanner } from "@/components/modules/StageDependentLockBanner";
import {
  getCADRevisionsAction,
  getFieldReportsAction,
  getDeliveryChecklistAction,
  getTeamAssignmentsAction,
  getFieldVisitsAction,
} from "@/actions/operations.actions";
import { getMilestonesAction, getAccountantOwnerAction } from "@/actions/finance.actions";
import { getProjectIssuesAction } from "@/actions/issue.actions";
import { calculateProjectHealth, getSLAViolationsCount } from "@/lib/project-health";

import { getUserProfileAction } from "@/actions/auth.actions";
import { ProjectDetailTabs } from "@/components/modules/ProjectDetailTabs";
import { ProjectFinanceTabContent } from "@/components/modules/ProjectFinanceTabContent";
import { SalesProjectPortal } from "@/features/sales/components/SalesProjectPortal";
import { verifyProjectAccess } from "@/lib/permissions/permissions";
import { ProjectDeleteButton } from "@/components/modules/ProjectDeleteButton";

const ROLE_THEME: Record<string, { primary: string; hover: string; text: string; bg: string; border: string; glow: string }> = {
  admin: { primary: "indigo-600", hover: "hover:text-indigo-600 dark:hover:text-indigo-400", text: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", glow: "bg-indigo-600/10" },
  sales: { primary: "indigo-600", hover: "hover:text-indigo-600 dark:hover:text-indigo-400", text: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", glow: "bg-indigo-600/10" },
  accountant: { primary: "violet-600", hover: "hover:text-violet-600 dark:hover:text-violet-400", text: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "bg-violet-600/10" },
  engineer: { primary: "amber-600", hover: "hover:text-amber-600 dark:hover:text-amber-400", text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "bg-indigo-600/10" },
  cad: { primary: "blue-600", hover: "hover:text-blue-600 dark:hover:text-blue-400", text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "bg-indigo-600/10" },
  field: { primary: "emerald-600", hover: "hover:text-emerald-600 dark:hover:text-emerald-400", text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "bg-emerald-600/10" },
};

const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/admin",
  sales: "/sales",
  accountant: "/accounts",
  engineer: "/engineer",
  cad: "/cad",
  field: "/field",
};

const getNextRequiredAction = (status: string, files: any[], assignments: any[], activityLogs: any[]) => {
  const isQcRejected = activityLogs.some((l: any) => l.action === "QC_REJECTED") &&
    !activityLogs.some((l: any) => l.action === "QC_APPROVED") &&
    (status === "data_sync" || status === "prototype" || status === "review");

  if (isQcRejected) {
    return {
      title: "QC Rework Request",
      description: "Address the QC reviewer's rejection notes, coordinate corrections with CAD/Field teams, and re-submit drawings.",
      badge: "Returned By QC",
      color: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-450 dark:bg-rose-500/[0.05]"
    };
  }

  switch (status) {
    case 'project_created':
    case 'data_collection':
      const intakeFiles = files.filter((f: any) => ['requirements', 'quotation', 'receipt', 'intake_document'].includes(f.category));
      const hasCAD = assignments.some((a: any) => a.role === 'cad');

      if (intakeFiles.length === 0) {
        return {
          title: "Collect Client Documents",
          description: "Upload necessary client site measurements, requirements, receipts, and intake documentation in the Operations tab.",
          badge: status === 'project_created' ? "Requires Client Contact" : "Document Collection",
          color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-500/[0.05]"
        };
      } else if (!hasCAD) {
        return {
          title: "Assign CAD Specialist",
          description: "Assign a CAD Specialist from the Operations tab to work on the blueprints.",
          badge: "Document Collection",
          color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-500/[0.05]"
        };
      } else {
        return {
          title: "Transmit to CAD Prototype",
          description: "Authorize transmission of client documents to the assigned CAD Specialist to start drafting.",
          badge: "Document Collection",
          color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-450 dark:bg-emerald-500/[0.05]"
        };
      }
    case 'prototype':
      return {
        title: "CAD Prototype Prep",
        description: "CAD Specialist is currently preparing the preliminary draft layout and CAD blueprints.",
        badge: "In Progress",
        color: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-450 dark:bg-blue-500/[0.05]"
      };
    case 'review':
      return {
        title: "Review CAD Deliverables",
        description: "Examine CAD Prototype drawings, provide feedback, and coordinate DGPS benchmark field work.",
        badge: "CAD Review Required",
        color: "text-orange-600 bg-orange-500/10 border-orange-500/20 dark:text-orange-450 dark:bg-orange-500/[0.05]"
      };
    case 'field_assigned':
    case 'field_work':
      return {
        title: "Field Surveying & GPS Mapping",
        description: "Field Engineers are gathering site benchmark points and GPS survey data.",
        badge: "Survey In Progress",
        color: "text-sky-600 bg-sky-500/10 border-sky-500/20 dark:text-sky-450 dark:bg-sky-500/[0.05]"
      };
    case 'data_sync':
      const hasFinalDoc = activityLogs?.some((l: any) => l.action === "FILE_UPLOADED" && l.details?.category === "final_file");
      if (hasFinalDoc) {
        return {
          title: "Engineer Final Review",
          description: "Lead Engineer to approve final CAD deliverable.",
          badge: "Engineer Review Required",
          color: "text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-450 dark:bg-purple-500/[0.05]"
        };
      }
      return {
        title: "Validate Survey Data & Finalize CAD",
        description: "CAD Specialist to compare field data and produce final deliverable.",
        badge: "In Progress",
        color: "text-cyan-600 bg-cyan-500/10 border-cyan-500/20 dark:text-cyan-450 dark:bg-cyan-500/[0.05]"
      };
    case 'qc_review':
      return {
        title: "Engineer Final Review",
        description: "Lead Engineer is reviewing final CAD drawings for final approval or rejection.",
        badge: "Under Review",
        color: "text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-450 dark:bg-purple-500/[0.05]"
      };
    case 'qc_approved':
      return {
        title: "Finalize & Deliver Project",
        description: "Billing validation, payment confirmation, and dispatching finalized files to client.",
        badge: "Ready For Delivery",
        color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-450 dark:bg-emerald-500/[0.05]"
      };
    default:
      return null;
  }
};

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

async function ProjectContentWrapper({ project, profile, user, role, theme, params }: any) {
  const supabase: any = await createClient();
  const supabaseAdmin: any = await import('@/lib/supabase/admin').then(m => m.createAdminClient());

  const [
    historyRes,
    commentsRes,
    filesRes,
    tasksRes,
    assignmentsRes,
    quotationsRes,
    milestonesRes,
    visitsRes,
    accountantRes,
    issuesRes,
    activityLogsRes,
    allUsersRes
  ] = await Promise.all([
    supabase.from('workflow_history').select('id, project_id, from_stage, to_stage, comment, changed_by, created_at, changed_by_profile:profiles!changed_by(first_name, last_name, email)').eq('project_id', params.id).order('created_at', { ascending: false }).limit(100),
    supabase.from('comments').select('id, project_id, user_id, content, mentions, created_at, updated_at, deleted_at, author_profile:profiles!user_id(first_name, last_name, email, role)').eq('project_id', params.id).is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('files').select('id, name, url, size, type, uploaded_by, created_at, project_id, uploaded_at, file_path, file_name, file_size, file_type').eq('project_id', params.id).order('uploaded_at', { ascending: false }).limit(200),
    supabase.from('tasks').select('id, project_id, title, description, status, assigned_to, created_by, created_at, due_date').eq('project_id', params.id),
    supabaseAdmin.from('project_assignments').select('id, project_id, user_id, role, assigned_by, assigned_at, removed_at, profiles!project_assignments_user_id_fkey(first_name, last_name, email, role)').eq('project_id', params.id),
    role !== 'sales' ? getProjectQuotationsAction(params.id) : Promise.resolve({ data: [] }),
    getMilestonesAction(params.id),
    getFieldVisitsAction(params.id),
    getAccountantOwnerAction(params.id).catch(() => ({ success: true, data: null })),
    getProjectIssuesAction(params.id),
    supabase.from('activity_logs').select('id, project_id, user_id, action, details, created_at, actor_profile:profiles!user_id(first_name, last_name, role)').eq('project_id', params.id).order('created_at', { ascending: false }).limit(100),
    supabaseAdmin.from('profiles').select('id, first_name, last_name, email, role, designation')
  ]);

  const history = historyRes.data || [];
  const comments = commentsRes.data || [];
  const files = filesRes.data || [];
  if (filesRes.error) console.error("Files Fetch Error:", filesRes.error);
  const projectTasks = tasksRes.data || [];
  const assignments = assignmentsRes.data || [];
  if (assignmentsRes.error) console.error("Assignments Fetch Error:", assignmentsRes.error);
  const quotations = quotationsRes.data || [];
  const milestones = milestonesRes.data || [];
  const visits = visitsRes.data || [];
  const accountantOwner = accountantRes.data || null;
  const projectIssues = issuesRes.data || [];
  const rawActivityLogs = activityLogsRes.data || [];
  const activityLogs = filterActivityLogsByRole(rawActivityLogs, profile?.role || 'user');
  const allUsers = allUsersRes.data || [];

  const isStageBlocked = (milestones || []).some(
    (m: any) => m.status !== 'paid' && (m.linked_stage === project.status || m.block_after_stage === project.status)
  );
  const isOperationsFrozen = project.is_frozen || isStageBlocked;

  const activeQuotation = quotations.find((q: any) => q.status === 'Sent' || q.status === 'Viewed' || q.status === 'Approved' || q.status === 'Draft');

  // Fetch operational data from local DB for technical roles
  const isOperationalRole = ['admin', 'engineer', 'cad', 'field'].includes(profile?.role || '');
  const [cadResult, fieldResult, checklistResult, localAssignmentsResult] = isOperationalRole
    ? await Promise.all([
      getCADRevisionsAction(params.id),
      getFieldReportsAction(params.id),
      getDeliveryChecklistAction(params.id),
      getTeamAssignmentsAction(params.id),
    ])
    : [{ data: [] }, { data: [] }, { data: null }, { data: [] }];

  const cadRevisions = cadResult.data || [];
  const fieldReports = fieldResult.data || [];
  const deliveryChecklist = checklistResult.data || null;
  const localAssignments = localAssignmentsResult.data || [];

  const teamMembers = (assignments || []).map((a: any) => ({
    userId: a.user_id,
    firstName: a.profiles?.first_name,
    lastName: a.profiles?.last_name,
    email: a.profiles?.email,
    role: a.profiles?.role || a.role
  }));

  const isQcRejected = activityLogs.some((l: any) => l.action === "QC_REJECTED") &&
    !activityLogs.some((l: any) => l.action === "QC_APPROVED");

  return (
    <>
      {/* STAGE DEPENDENT DYNAMIC LOCK BANNER */}
      <StageDependentLockBanner
        projectId={project.id}
        isFrozen={project.is_frozen}
        freezeReason={project.freeze_reason}
        frozenAt={project.frozen_at}
        milestones={milestones}
        currentStage={project.status}
        isQcRejected={isQcRejected}
        dispatchOverrideRequested={project.dispatch_override_requested}
        dispatchOverrideApproved={project.dispatch_override_approved}
      />

      {/* Central Clean Tab-based Layout */}
      <div className="w-full space-y-8 animate-in fade-in duration-700 mt-5">
        {project.is_frozen ? (
          <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-red-200 dark:border-red-500/20 rounded-3xl bg-red-50/50 dark:bg-red-500/5 mt-10">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Lock className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Project Access Locked</h2>
            <p className="text-sm font-medium text-slate-500 text-center max-w-md">
              All tabs, files, tasks, and communications are restricted while this project is frozen.
            </p>
          </div>
        ) : (
          <ProjectDetailTabs
            project={project}
            userRole={role}
            currentUserId={user.id}
            history={history}
            activityLogs={activityLogs}
            comments={comments}
            files={files}
            teamMembers={teamMembers}
            milestones={milestones}
            visits={visits}
            accountantOwner={accountantOwner}
            activeQuotation={activeQuotation}
            allUsers={allUsers}
            cadRevisions={cadRevisions}
            fieldReports={fieldReports}
            theme={theme}
          />
        )}
      </div>
    </>
  );
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const supabase: any = await createClient();

  // 1. Fetch Core Project Data
  const { data: project } = await supabase.from('projects').select('id, project_number, status, budget').eq('id', params.id).is('deleted_at', null).single() as { data: any };

  if (!project) return notFound();

  // 2. Fetch Supporting Data
  const profile = await getUserProfileAction();
  if (!profile) return notFound();
  const user = { id: profile.id, email: profile.email };

  const role = profile?.role || "admin";
  const theme = ROLE_THEME[role] || ROLE_THEME.admin;
  const backLink = ROLE_REDIRECTS[role] || "/projects";

  // Layer 1 Security: Application-level check
  const accessCheck = await verifyProjectAccess(params.id, user.id, role as any, true);
  if (!accessCheck.isAllowed) {
    redirect('/unauthorized');
  }

  if (role === 'sales') {
    const isLead = ['lead_created', 'requirement_gathering', 'follow_up_pending'].includes(project.status);
    if (!isLead) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
            <p className="text-slate-500 max-w-sm">This project has been pushed to accounts. You no longer have access to its details.</p>
          </div>
          <Link href="/sales" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm">
            Return to Dashboard
          </Link>
        </div>
      );
    }
  }

  const canArchive = profile?.role === 'admin' || profile?.role === 'accountant';
  const isSalesAndHandedOver = role === 'sales' && !['lead_created', 'quotation_requested'].includes(project.status);

  const statusColors: Record<string, string> = {
    lead_created: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    quotation_requested: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    quotation_sent: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    payment_pending: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    payment_done: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    project_created: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    data_collection: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    prototype: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    review: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    field_work: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    completed: "text-emerald-600 bg-indigo-600/10 border-emerald-600/20",
    archived: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  };

  const displayStatus = isSalesAndHandedOver
    ? "Submitted to Accounts / Operational Execution"
    : project.status.replace("_", " ");

  const displayStatusColor = isSalesAndHandedOver
    ? "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
    : (statusColors[project.status] || "text-gray-500 bg-gray-500/10 border-gray-500/20");

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Unified Page Header */}
      <div className="relative overflow-hidden">
        <div className="relative z-10">
          {/* Breadcrumb row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <Link href={backLink} className={cn("group flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors", theme.hover)}>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Directory
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
            <span className={cn("text-sm nums font-medium flex items-center gap-1", theme.text)}>
              <Hash className="w-3.5 h-3.5" />{project.id}
            </span>
          </div>

          {/* Title + Actions row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/5 pb-6">

            {/* Left Side: Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {project.name}
              </h1>
            </div>

            {/* Right Side: Meta Info & Actions */}
            <div className="flex flex-col lg:items-end gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span>
                  {project.client_name || "Direct Client"}
                </span>
                {(() => {
                  const contactText = project.client_contact || '';
                  const phoneMatch = contactText.match(/Phone:\s*([^,]*)/i);
                  const phoneVal = phoneMatch ? phoneMatch[1].trim() : '';
                  const canSeePhone = ['admin', 'sales', 'accountant', 'engineer'].includes(role || '');

                  if (phoneVal && canSeePhone) {
                    return (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="flex items-center gap-1.5 font-medium" title="Client Phone">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {phoneVal}
                        </span>
                      </>
                    );
                  }
                  return null;
                })()}
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                  displayStatusColor
                )}>
                  {displayStatus}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                {(role === 'admin' || role === 'accountant') && (
                  <ProjectDeleteButton projectId={project.id} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-64 space-y-4 mt-10">
          <div className="w-10 h-10 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Project Modules...</p>
        </div>
      }>
        <ProjectContentWrapper project={project} profile={profile} user={user} role={role} theme={theme} params={params} />
      </Suspense>
    </div>
  );
}
