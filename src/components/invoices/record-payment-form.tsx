"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { recordPayment } from "@/modules/invoices/actions"
import { formatCurrency } from "@/lib/utils/format"

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHECK: "Check",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  ACH: "ACH / Bank Transfer",
  OTHER: "Other",
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Recording…" : "Record Payment"}
    </Button>
  )
}

export function RecordPaymentForm({
  invoiceId,
  amountDue,
}: {
  invoiceId: string
  amountDue: number
}) {
  const recordWithId = recordPayment.bind(null, invoiceId)

  const [state, formAction] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await recordWithId(formData)
      return result ?? null
    },
    null
  )

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-medium text-sm mb-3">Record Payment</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Balance due:{" "}
        <span className="font-semibold text-foreground">{formatCurrency(amountDue)}</span>
      </p>

      {state?.error && <p className="text-sm text-destructive mb-3">{state.error}</p>}

      <form action={formAction} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs">
            Amount
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            max={amountDue}
            defaultValue={amountDue.toFixed(2)}
            required
            className="h-8"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="method" className="text-xs">
            Method
          </Label>
          <Select name="method" defaultValue="CASH">
            <SelectTrigger id="method" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reference" className="text-xs">
            Reference / Check #
          </Label>
          <Input id="reference" name="reference" placeholder="Optional" className="h-8" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">
            Notes
          </Label>
          <Textarea id="notes" name="notes" rows={2} className="text-xs" />
        </div>

        <SubmitButton />
      </form>
    </div>
  )
}
