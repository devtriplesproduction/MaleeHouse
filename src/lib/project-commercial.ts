/**
 * Shared commercial / dispatch stage helpers.
 * Keeps Client Approvals, finance transitions, and KPIs on one status model.
 */

/** Stages before the project is active in engineering/ops. */
export const PRE_OPS_STATUSES = [
  'lead',
  'lead_created',
  'requirement_gathering',
  'quotation_requested',
  'quotation_sent',
  'payment_pending',
  'payment_done',
  'ready_for_dispatch',
] as const;

/**
 * Stages that belong on Engineer / CAD / Field ops dashboards
 * (after accounts dispatches → project_created / "Active in Ops").
 */
export const OPS_ACTIVE_STATUSES = [
  'project_created',
  'data_collection',
  'prototype',
  'review',
  'field_assigned',
  'field_work',
  'data_sync',
  'final_review',
] as const;

/** Quotation statuses that appear on Client Approvals (not Draft). */
export const CLIENT_APPROVAL_STATUSES = [
  'Sent',
  'Viewed',
  'Revision Requested',
  'Approved',
  'Rejected',
] as const;

/** Still waiting for client response on a sent quote. */
export const AWAITING_CLIENT_STATUSES = [
  'Sent',
  'Viewed',
  'Revision Requested',
] as const;

export function isProjectDispatchedToOps(status?: string | null): boolean {
  if (!status) return false;
  return !(PRE_OPS_STATUSES as readonly string[]).includes(status);
}

export function isReadyForDispatch(status?: string | null): boolean {
  return status === 'ready_for_dispatch';
}

/** Active (non-archived) milestones for UI gating. */
export function hasActiveMilestones(
  milestones?: Array<{ title?: string | null }> | null
): boolean {
  if (!milestones?.length) return false;
  return milestones.some((m) => m && !String(m.title || '').includes('[Archived]'));
}

export function isClientApprovalStatus(status?: string | null): boolean {
  if (!status) return false;
  return (CLIENT_APPROVAL_STATUSES as readonly string[]).includes(status);
}

export function isAwaitingClientStatus(status?: string | null): boolean {
  if (!status) return false;
  return (AWAITING_CLIENT_STATUSES as readonly string[]).includes(status);
}
