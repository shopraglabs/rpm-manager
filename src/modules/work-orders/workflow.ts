import type { WorkOrderStatus } from "@/generated/prisma/enums"

/**
 * Valid status transitions for work orders.
 * Key = current status, Value = allowed next statuses.
 */
export const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["IN_PROGRESS", "WAITING_PARTS", "WAITING_APPROVAL", "CANCELLED"],
  IN_PROGRESS: ["WAITING_PARTS", "WAITING_APPROVAL", "QUALITY_CHECK", "CANCELLED"],
  WAITING_PARTS: ["IN_PROGRESS", "CANCELLED"],
  WAITING_APPROVAL: ["IN_PROGRESS", "CANCELLED"],
  QUALITY_CHECK: ["COMPLETED", "IN_PROGRESS"],
  COMPLETED: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
}

/**
 * Returns true if moving from `from` to `to` is a valid transition.
 */
export function isValidTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Throws if the transition is not allowed.
 */
export function assertValidTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus
): void {
  if (!isValidTransition(from, to)) {
    throw new Error(
      `Invalid status transition: ${from} → ${to}. Allowed: [${VALID_TRANSITIONS[from]?.join(", ") ?? "none"}]`
    )
  }
}

/**
 * Returns all valid next statuses from the current status.
 */
export function getNextStatuses(current: WorkOrderStatus): WorkOrderStatus[] {
  return VALID_TRANSITIONS[current] ?? []
}

/**
 * Returns true if the work order is in a terminal state (no further transitions).
 */
export function isTerminalStatus(status: WorkOrderStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0
}

/**
 * Returns true if the work order has been completed (can generate invoice).
 */
export function canGenerateInvoice(status: WorkOrderStatus): boolean {
  return ["COMPLETED", "READY_FOR_PICKUP", "DELIVERED"].includes(status)
}
