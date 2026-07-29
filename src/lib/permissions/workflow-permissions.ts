import { Role } from "./roles";
import { PERMISSIONS } from "./constants";
import { AccessCheckResult } from "./project-access";

/**
 * Validates if the user's role permits transitioning the project to the target stage.
 */
export function canUpdateProjectStage(role: Role, newStage: string): AccessCheckResult {
  const allowedStages = PERMISSIONS.STAGE_UPDATE[role] || [];
  const isAllowed = allowedStages.includes('*') || allowedStages.includes(newStage);

  if (!isAllowed) {
    return {
      isAllowed: false,
      error: `Role '${role}' does not have permission to transition to '${newStage}'.`
    };
  }
  return { isAllowed: true };
}

/**
 * Validates if the user's role permits uploading a specific file category.
 */
export function canUploadFileCategory(role: Role, category: string): AccessCheckResult {
  const allowedCategories = PERMISSIONS.FILE_UPLOAD[role] || [];
  const isAllowed = allowedCategories.includes('*') || allowedCategories.includes(category);

  if (!isAllowed) {
    return {
      isAllowed: false,
      error: `Role '${role}' does not have permission to upload '${category}'.`
    };
  }
  return { isAllowed: true };
}
