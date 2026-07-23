'use client';

import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { generateProjectReport } from '@/lib/pdf-generator';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectReportButtonProps {
  projectId: string;
}

export function ProjectReportButton({ projectId }: ProjectReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const supabase: any = createClient();
      
      // Fetch full project data
      const { data: project } = await supabase
        .from('projects')
        .select('id, project_number, status, budget')
        .eq('id', projectId)
        .single();

      // Fetch team
      const { data: team } = await supabase
        .from('project_assignments')
        .select('id, project_id, user_id, role, assigned_by, assigned_at, removed_at, profiles:user_id(id, email, role, first_name, last_name, phone_number, dob, gender, personal_email, emergency_contact, profile_photo, address, employee_id, department, designation, joining_date, employment_type, salary, experience, location, status, is_active, branch, office_location, operational_zone, reporting_manager_id, department_head_id, escalation_chain, approval_authority, force_password_reset, temp_password_expires_at, documents, created_at, updated_at, deleted_at)')
        .eq('project_id', projectId);

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, project_id, title, description, status, assigned_to, created_by, created_at, due_date')
        .eq('project_id', projectId);

      if (project && team && tasks) {
        generateProjectReport({ project, team, tasks });
      } else {
        toast({ title: "Report Generation Failed", description: "Failed to fetch all data for report.", variant: "error" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Report Generation Failed", description: "An error occurred during PDF generation.", variant: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium h-11 px-6 shadow-md shadow-indigo-500/10 transition-all active:scale-95 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 stroke-[2.5]" />
      )}
      Download Summary
    </button>
  );
}
