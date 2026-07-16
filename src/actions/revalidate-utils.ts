'use server';

import { revalidatePath } from 'next/cache';

/**
 * revalidateAccountsPaths
 * Utility to aggressively revalidate and purge Next.js App Router caches across
 * Projects, Sales, and Accountant portals. This guarantees that role-based state
 * transitions (e.g. Sales handover to Accounts) reflect immediately in real-time.
 */
export async function revalidateAccountsPaths(projectId?: string) {
  try {
    if (projectId) {
      revalidatePath(`/projects/${projectId}`);
    }
    
    // Core routes
    revalidatePath('/projects');
    revalidatePath('/sales');
    revalidatePath('/accounts');
    
    // Accounts specific subpages
    revalidatePath('/accounts/intake');
    revalidatePath('/accounts/billing');
    revalidatePath('/accounts/approvals');
    revalidatePath('/accounts/verification');
    revalidatePath('/accounts/reports');
    revalidatePath('/accounts/quotations');
    revalidatePath('/accounts/milestones');
    
    // Operations specific subpages
    revalidatePath('/engineer');
    revalidatePath('/cad');
    revalidatePath('/field');
    
    // Force revalidation of route group layouts
    revalidatePath('/(modules)/accounts', 'layout');
    revalidatePath('/(modules)/(operations)/engineer', 'layout');
    revalidatePath('/(modules)/(operations)/cad', 'layout');
    revalidatePath('/accounts', 'layout');
    
    console.log(`[Revalidation] Cleared App Router caches for sales, projects, and accountant subpaths${projectId ? ` (Project: ${projectId})` : ''}`);
  } catch (error) {
    console.error('[Revalidation] Failed to execute path revalidations:', error);
  }
}
