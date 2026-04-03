import { z } from "zod"

export const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
})

export type CustomerInput = z.infer<typeof customerSchema>

// Normalize empty strings to undefined before saving
export function normalizeCustomerInput(data: CustomerInput) {
  return {
    ...data,
    email: data.email || undefined,
    phone: data.phone || undefined,
    address: data.address || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    zip: data.zip || undefined,
    notes: data.notes || undefined,
  }
}
