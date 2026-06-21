"use client";

import React, { useState } from "react";
import { WorkflowStepper, type ProjectStage } from "./WorkflowStepper";
import { updateProjectStageAction } from "@/actions/workflow.actions";
import { toast } from "sonner";

interface WorkflowControlProps {
  projectId: string;
  currentStage: ProjectStage;
}

export function WorkflowControl({ projectId, currentStage }: WorkflowControlProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleAdvance = async (nextStage: ProjectStage) => {
    setIsAdvancing(true);
    try {
      const result = await updateProjectStageAction(projectId, nextStage);
      if (result.success) {
        toast.success(`Project moved to ${nextStage.replace('_', ' ')}`);
      } else {
        toast.error(result.error || "Failed to advance stage");
      }
    } catch (error) {
      toast.error("An unexpected error occurred during workflow transition.");
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Project Lifecycle</h2>
      <div className="glass-card p-8 border-white/10 overflow-hidden">
        <WorkflowStepper 
          currentStage={currentStage} 
          onAdvance={handleAdvance}
          isAdvancing={isAdvancing}
        />
      </div>
    </div>
  );
}
