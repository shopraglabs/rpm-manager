import { z } from "zod"

export const cannedJobSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  type: z.enum(["LABOR", "PART", "SUBLET", "FEE", "DISCOUNT"]),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
  quantity: z.coerce.number().min(0.01, "Quantity must be positive"),
  taxable: z.coerce.boolean().default(true),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
})

export type CannedJobFormValues = z.infer<typeof cannedJobSchema>
