import { z } from "zod"

export const lineItemSchema = z.object({
  type: z.enum(["LABOR", "PART", "SUBLET", "FEE", "DISCOUNT"]),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
  laborHours: z.coerce.number().min(0).optional().nullable(),
  partNumber: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional().default(0),
})

export const estimateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  notes: z.string().optional().or(z.literal("")),
  internalNotes: z.string().optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
})

export type LineItemInput = z.infer<typeof lineItemSchema>
export type EstimateInput = z.infer<typeof estimateSchema>
