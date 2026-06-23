'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  MapPin, 
  Calendar, 
  FileText, 
  Edit3, 
  Check, 
  X, 
  Users, 
  Shield, 
  PenTool, 
  Briefcase,
  AlertTriangle,
  Loader2,
  Trash2,
  Phone,
  Mail,
  FolderOpen,
  Send,
  ChevronRight,
  Plus,
  Download,
  Upload,
  Eye,
  Activity,
  UserPlus,
  Share2,
  MoreHorizontal,
  Pencil,
  Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateProjectAction } from '@/actions/project.actions';
import { assignUserToProjectAction, removeUserFromProjectAction } from '@/actions/assignment.actions';
import { useToast } from '@/hooks/use-toast';
import { OperationsFileUploadPanel } from './OperationsFileUploadPanel';
import { CADRevisionPanel } from './CADRevisionPanel';
import { ProjectTeamSection } from './ProjectTeamSection';
import { OperationsControlCenter } from './OperationsControlCenter';

interface ProjectOverviewTabProps {
  project: any;
  userRole: string;
  currentUserId: string;
  teamMembers: any[];
  allUsers: any[];
  files?: any[];
  cadRevisions?: any[];
}

export default function ProjectOverviewTab({
  project,
  userRole,
  currentUserId,
  teamMembers,
  allUsers,
  files = [],
  cadRevisions = []
}: ProjectOverviewTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  // Parse contact person and details from client_contact
  const contactText = project.client_contact || '';
  const phoneMatch = contactText.match(/Phone:\s*([^,]*)/i);
  const emailMatch = contactText.match(/Email:\s*(.*)/i);
  const phoneVal = phoneMatch ? phoneMatch[1].trim() : '';
  const emailVal = emailMatch ? emailMatch[1].trim() : '';

  // Form states
  const [name, setName] = useState(project.name || '');
  const [clientName, setClientName] = useState(project.client_name || '');
  const [clientAddress, setClientAddress] = useState(project.client_address || '');
  const [contactPhone, setContactPhone] = useState(phoneVal);
  const [contactEmail, setContactEmail] = useState(emailVal);
  const [siteType, setSiteType] = useState(project.site_type || 'residential');
  const [siteCoordinates, setSiteCoordinates] = useState(project.site_coordinates || '');
  const [surveyRequirements, setSurveyRequirements] = useState(project.survey_requirements || '');
  const [targetCompletionDate, setTargetCompletionDate] = useState(project.target_completion_date || '');

  // Role permissions checks
  const isAdmin = userRole === 'admin';
  const isAccountant = userRole === 'accountant';
  const isEngineer = userRole === 'engineer';
  const isCad = userRole === 'cad';
  const isQc = userRole === 'qc';
  const isSales = userRole === 'sales';

  const isSalesAndHandedOver = project.status !== 'lead_created' && project.status !== 'quotation_requested';
  
  const isClaimedByMe = teamMembers.some((m: any) => m.userId === currentUserId);
  const needsClaiming = isEngineer && !isClaimedByMe && !isAdmin;

  const isProjectClosed = project.status === 'completed' || project.status === 'archived';
  const canEditAll = (isAdmin || isAccountant || isSales) && !isProjectClosed;
  const canEditPartial = false; // Engineers no longer have edit access
  const canEditAny = canEditAll || canEditPartial;

  // Assignment states & actions
  const [selectedCAD, setSelectedCAD] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedEngineer, setSelectedEngineer] = useState('');

  // Group users by role
  const cadUsers = allUsers.filter((u: any) => u.role === 'cad');
  const fieldUsers = allUsers.filter((u: any) => u.role === 'field');
  const engineerUsers = allUsers.filter((u: any) => u.role === 'engineer');

  const assignedEngineer = teamMembers.find((m: any) => m.role === 'engineer');
  const assignedCADs = teamMembers.filter((m: any) => m.role === 'cad');
  const assignedFields = teamMembers.filter((m: any) => m.role === 'field' || m.role === 'field_engineer');

  const handleSave = () => {
    startTransition(async () => {
      // Reconstruct client_contact
      const client_contact = `Phone: ${contactPhone}, Email: ${contactEmail}`;
      const payload: any = {};

      if (canEditAll) {
        payload.name = name;
        payload.client_name = clientName;
        payload.client_address = clientAddress;
        payload.client_contact = client_contact;
        payload.site_type = siteType;
      }
      
      // Both accountant/admin and engineer can edit coordinates, summary, and target date
      payload.site_coordinates = siteCoordinates;
      payload.survey_requirements = surveyRequirements;
      payload.target_completion_date = targetCompletionDate;

      const res = await updateProjectAction(project.id, payload);
      if (res?.success) {
        toast({ title: 'Overview Updated', description: 'Project details updated successfully.', variant: 'success' });
        setIsEditing(false);
        router.refresh();
      } else {
        toast({ title: 'Update Failed', description: res?.error || 'An error occurred.', variant: 'error' });
      }
    });
  };

  const handleAssign = (userId: string, role: string) => {
    if (!userId) return;
    startTransition(async () => {
      const res = await assignUserToProjectAction(project.id, userId, role);
      if (res?.success) {
        toast({ title: 'Member Assigned', description: `User assigned as ${role.toUpperCase()} successfully.`, variant: 'success' });
        if (role === 'cad') setSelectedCAD('');
        if (role === 'field') setSelectedField('');
        if (role === 'engineer') setSelectedEngineer('');
        router.refresh();
      } else {
        toast({ title: 'Assignment Failed', description: res?.error || 'An error occurred.', variant: 'error' });
      }
    });
  };

  const handleRemoveAssignment = (userId: string) => {
    startTransition(async () => {
      const res = await removeUserFromProjectAction(userId, project.id);
      if (res?.success) {
        toast({ title: 'Assignment Removed', description: 'User has been unassigned.', variant: 'success' });
        router.refresh();
      } else {
        toast({ title: 'Removal Failed', description: res?.error || 'An error occurred.', variant: 'error' });
      }
    });
  };

  const isField = userRole === 'field' || userRole === 'field_engineer';

  const hasAccessToOps = isAdmin || isClaimedByMe || ((isEngineer || isCad || isField || isQc) && !isProjectClosed);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pb-10">
      
      {/* LEFT COLUMN: Project Details & Team (40%) */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Project Details Block */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              Project Details
            </h3>
            {canEditAny && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          {isEditing && (
            <div className="mb-6 p-6 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Project Name</label>
                    <input type="text" disabled={!canEditAll} value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Client Name</label>
                    <input type="text" disabled={!canEditAll} value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Contact Phone</label>
                    <input type="text" disabled={!canEditAll} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Contact Email</label>
                    <input type="text" disabled={!canEditAll} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Client Address</label>
                  <input type="text" disabled={!canEditAll} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Site Type</label>
                    <select disabled={!canEditAll} value={siteType} onChange={(e) => setSiteType(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500">
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="infrastructure">Infrastructure</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Target Completion Date</label>
                    <input type="date" value={targetCompletionDate} onChange={(e) => setTargetCompletionDate(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Project Summary</label>
                  <textarea rows={4} value={surveyRequirements} onChange={(e) => setSurveyRequirements(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none" />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 text-sm font-semibold transition">Cancel</button>
                  <button onClick={handleSave} disabled={isPending} className="px-5 py-2.5 rounded-2xl bg-[#a4bcf8] hover:bg-[#8eaaf0] text-white font-semibold text-sm flex items-center gap-2 transition">
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div className="flex items-center justify-between group">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-0.5">Project Name</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{project.name}</p>
                </div>
              </div>
            </div>

            {emailVal && (
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-0.5">Email</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{emailVal}</p>
                </div>
              </div>
            )}

            {phoneVal && (
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-0.5">Phone</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{phoneVal}</p>
                </div>
              </div>
            )}

            {project.client_address && (
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-0.5">Address</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{project.client_address}</p>
                </div>
              </div>
            )}

            {project.created_at && (
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-0.5">Started At</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {new Date(project.created_at).toLocaleDateString()} at {new Date(project.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            )}
          </div>

          {project.survey_requirements && (
            <div className="mt-6 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project Overview</h4>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {project.survey_requirements}
              </p>
            </div>
          )}
        </div>

        {/* Project Team */}
        <ProjectTeamSection 
          projectId={project.id}
          assignments={teamMembers || []}
          staff={allUsers || []}
          canAssign={(isAdmin || (isEngineer && teamMembers.some((m: any) => m.userId === currentUserId))) && !isProjectClosed}
        />

      </div>

      {/* RIGHT COLUMN: Operations & CAD (60%) */}
      <div className="lg:col-span-3 space-y-8">
        {(!isAdmin && isEngineer && !teamMembers.some((m: any) => m.userId === currentUserId)) ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="relative overflow-hidden p-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 space-y-8 group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50" />
              
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/10 group-hover:scale-105 transition-transform duration-500">
                  <Shield className="w-7 h-7 text-indigo-500" />
                </div>
                <div className="space-y-2 pt-1">
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
                    Action Required: Claim Project
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                    You are viewing a restricted workspace. To unlock active operational tools including File Uploads, CAD Transfers, and Team Management, you must officially accept this assignment.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  startTransition(async () => {
                    const res = await assignUserToProjectAction(project.id, currentUserId, 'engineer');
                    if (res?.success) {
                      toast({ title: 'Project Accepted', description: 'You have claimed this assignment.', variant: 'success' });
                      window.location.reload();
                    } else {
                      toast({ title: 'Acceptance Failed', description: res?.error || 'An error occurred.', variant: 'error' });
                    }
                  });
                }}
                disabled={isPending}
                className="relative w-full overflow-hidden py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0 text-base"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Accept Assignment & Unlock Workspace
              </button>
            </div>
          </div>
        ) : (
          hasAccessToOps && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* OperationsControlCenter removed as per user request */}

              <OperationsFileUploadPanel
                projectId={project.id}
                files={files || []}
                userRole={userRole}
                projectStatus={project.status}
              />
              
              {(isAdmin || isCad || isEngineer) && (
                <CADRevisionPanel
                  projectId={project.id}
                  revisions={cadRevisions}
                  userRole={userRole}
                  currentUserId={currentUserId}
                />
              )}

            </div>
          )
        )}
      </div>

    </div>
  );
}
