import workflowConfig from "@/config/workflow_config.json";
import { Role } from "./permissions/roles";

export interface StageConfig {
  display_name: string;
  allowed_roles: string[];
  transitions_to: string[];
  task_generation: string[];
  payment_gate: string | null;
  required_files: string[];
  allow_rollback: boolean;
}

export interface TemplateConfig {
  display_name: string;
  pipeline: string[];
  billing_milestones: string[];
}

export interface WorkflowConfigType {
  stages: Record<string, StageConfig>;
  templates: Record<string, TemplateConfig>;
}

const typedWorkflowConfig = workflowConfig as WorkflowConfigType;

/**
 * Gets all stages defined in the configuration.
 */
export function getStagesRegistry(): Record<string, StageConfig> {
  return typedWorkflowConfig.stages;
}

/**
 * Gets a specific stage configuration.
 */
export function getStageConfig(stage: string): StageConfig | undefined {
  return typedWorkflowConfig.stages[stage];
}

/**
 * Gets all templates defined in the configuration.
 */
export function getTemplatesRegistry(): Record<string, TemplateConfig> {
  return typedWorkflowConfig.templates;
}

/**
 * Gets a specific template configuration.
 */
export function getTemplateConfig(template: string): TemplateConfig | undefined {
  return typedWorkflowConfig.templates[template];
}

/**
 * Validates whether a project can transition from currentStage to targetStage.
 */
export function validateStageTransitionRule(
  currentStage: string,
  targetStage: string,
  userRole: Role,
  context: {
    unpaidMilestones: string[];
    pendingTasks: string[];
    missingFiles: string[];
  }
): { allowed: boolean; reason?: string } {
  const currentCfg = getStageConfig(currentStage);
  if (!currentCfg) {
    return { allowed: false, reason: `Current stage '${currentStage}' is not recognized in system configuration.` };
  }

  // 1. Check allowed roles (Admins always override)
  if (userRole !== "admin" && !currentCfg.allowed_roles.includes(userRole)) {
    return { allowed: false, reason: `Role '${userRole}' is not authorized to transition the project out of stage '${currentStage}'.` };
  }

  // 2. Check transition pathway
  const targetCfg = getStageConfig(targetStage);
  if (!targetCfg) {
    return { allowed: false, reason: `Target stage '${targetStage}' is not recognized in system configuration.` };
  }

  const isDirectAdvance = currentCfg.transitions_to.includes(targetStage);
  const isRollback = targetCfg.transitions_to.includes(currentStage) && currentCfg.allow_rollback;

  if (!isDirectAdvance && !isRollback) {
    return { allowed: false, reason: `Transition path from '${currentStage}' to '${targetStage}' is not registered.` };
  }

  // If it's a rollback, bypass standard forward validation checks (allow hotfixes)
  if (isRollback) {
    return { allowed: true };
  }

  // 3. Check Stage Payment Locks
  if (currentCfg.payment_gate && context.unpaidMilestones.includes(currentCfg.payment_gate)) {
    return { allowed: false, reason: `Blocked: Milestone payment for '${currentCfg.payment_gate}' must be paid and verified.` };
  }

  // 4. Check Required Tasks
  if (context.pendingTasks.length > 0) {
    return { allowed: false, reason: `Prerequisite Tasks Overdue: [${context.pendingTasks.join(", ")}] are incomplete.` };
  }

  // 5. Check Required Files
  if (context.missingFiles.length > 0) {
    return { allowed: false, reason: `Missing Required Deliverables in Vault: [${context.missingFiles.join(", ")}] are missing.` };
  }

  return { allowed: true };
}

/**
 * Returns the list of tasks to generate automatically when entering a stage.
 */
export function getTasksForStage(stage: string): string[] {
  const cfg = getStageConfig(stage);
  return cfg ? cfg.task_generation : [];
}
