import { z } from "zod"

export const workOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  estimateId: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  mileageIn: z.coerce.number().int().min(0).optional().or(z.literal("")),
  promisedDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  internalNotes: z.string().optional().or(z.literal("")),
})

export const statusTransitionSchema = z.object({
  toStatus: z.enum([
    "PENDING",
    "CHECKED_IN",
    "IN_PROGRESS",
    "WAITING_PARTS",
    "WAITING_APPROVAL",
    "QUALITY_CHECK",
    "COMPLETED",
    "READY_FOR_PICKUP",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().optional().or(z.literal("")),
})

export type WorkOrderInput = z.infer<typeof workOrderSchema>
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>
