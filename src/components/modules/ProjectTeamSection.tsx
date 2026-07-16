"use client";

import React, { useState } from "react";
import { Users, UserPlus, Shield, X, Trash2 } from "lucide-react";
import { assignUserToProjectAction, removeUserFromProjectAction } from "@/actions/assignment.actions";
import { Select, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface ProjectTeamSectionProps {
  projectId: string;
  assignments: any[];
  staff: StaffMember[];
  canAssign: boolean;
}

const ASSIGNMENT_ROLES = [
  { id: 'cad', label: 'CAD Designer' },
  { id: 'field', label: 'Field Crew' },
];

const ROLE_COLORS: Record<string, string> = {
  engineer: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  field_engineer: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
  employee: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400',
  field: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

function getInitials(firstName?: string | null, lastName?: string | null) {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (!f && !l) return 'U';
  return `${f[0] || ''}${l[0] || ''}`.toUpperCase();
}

export function ProjectTeamSection({ projectId, assignments, staff, canAssign }: ProjectTeamSectionProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ASSIGNMENT_ROLES[0].id);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);

  console.log("DEBUG TEAM SECTION:", { staffCount: staff.length, staffSample: staff.slice(0, 3), selectedRole });

  const handleAssign = async () => {
    if (!selectedUser) {
      toast.error("Please select a staff member");
      return;
    }
    setLoading(true);
    try {
      const result = await assignUserToProjectAction(projectId, selectedUser, selectedRole);
      if (result?.success) {
        toast.success("Team member assigned");
        setSelectedUser(""); // Keep form open to allow assigning multiple people
      } else {
        toast.error(result?.error || "Assignment failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string, roleKey: string) => {
    if (!confirm(`Are you sure you want to remove this ${roleKey}?`)) return;
    setLoading(true);
    try {
      const result = await removeUserFromProjectAction(userId, projectId);
      if (result?.success !== false) {
        toast.success("Team member removed");
      } else {
        toast.error(result?.error || "Failed to remove member");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((a: any) => a.role !== 'admin');

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white tracking-tight">
            Project Team
          </h3>
          {assignments.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
              {assignments.length}
            </span>
          )}
        </div>
        {canAssign && !isAssigning && (
          <button
            onClick={() => setIsAssigning(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            title="Assign Member"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign
          </button>
        )}
      </div>

      {/* Assign Form */}
      {isAssigning && (
        <div className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">New Assignment</span>
            <button onClick={() => setIsAssigning(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</label>
              <Select
                value={selectedRole}
                onValueChange={(val) => {
                  setSelectedRole(val);
                  setSelectedUser("");
                }}
              >
                {ASSIGNMENT_ROLES.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staff Member</label>
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
                placeholder="Select..."
              >
                {staff
                  .filter((s: any) => s.role === selectedRole || (selectedRole === 'field' && s.role === 'field_engineer'))
                  .map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
          <button
            disabled={loading}
            onClick={handleAssign}
            className="w-full py-2.5 mt-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold tracking-wide transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? "Assigning…" : "Confirm Assignment"}
          </button>
        </div>
      )}

      {/* Member List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm">
          No team members assigned yet.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssignments.map((a, i) => {
            // Support both data shapes: { firstName, lastName } and { profiles: { first_name, last_name } }
            const firstName = a.firstName ?? a.profiles?.first_name ?? '';
            const lastName  = a.lastName  ?? a.profiles?.last_name  ?? '';
            const roleKey   = (a.role || '').replace('_', ' ');
            const colorClass = ROLE_COLORS[a.role] || 'bg-slate-100 dark:bg-white/5 text-slate-500';

            return (
              <div
                key={a.id || a.userId || i}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {getInitials(firstName, lastName)}
                  </span>
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'}
                  </p>
                </div>

                {/* Role badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${colorClass}`}>
                  {roleKey}
                </span>

                {canAssign && (
                  <button
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(a.userId || a.id, roleKey);
                    }}
                    className="ml-2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50 shrink-0"
                    title="Remove Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
