import { z } from "zod"

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  workOrderId: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
})

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "CHECK", "CREDIT_CARD", "DEBIT_CARD", "ACH", "OTHER"]),
  reference: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

export type InvoiceInput = z.infer<typeof invoiceSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
