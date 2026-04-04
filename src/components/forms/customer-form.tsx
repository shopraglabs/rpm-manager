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
import { US_STATES } from "@/lib/utils/constants"

function SubmitButton({ label = "Save Customer" }: { label?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

type DefaultValues = {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  notes?: string | null
}

type FormAction = (formData: FormData) => Promise<{ error: string } | void> | void

export function CustomerForm({
  action,
  defaultValues,
  deleteAction,
}: {
  action: FormAction
  defaultValues?: DefaultValues
  deleteAction?: FormAction
}) {
  const [state, formAction] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await action(formData)
      return result ?? null
    },
    null
  )

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name *</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={defaultValues?.firstName}
            placeholder="Jane"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name *</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={defaultValues?.lastName}
            placeholder="Smith"
            required
          />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaultValues?.phone ?? ""}
            placeholder="(555) 867-5309"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            placeholder="jane@example.com"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Street address</Label>
        <Input
          id="address"
          name="address"
          defaultValue={defaultValues?.address ?? ""}
          placeholder="123 Main St"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            defaultValue={defaultValues?.city ?? ""}
            placeholder="Springfield"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select name="state" defaultValue={defaultValues?.state ?? ""}>
            <SelectTrigger id="state">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.value} — {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP</Label>
          <Input id="zip" name="zip" defaultValue={defaultValues?.zip ?? ""} placeholder="62701" />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Any special notes about this customer…"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {deleteAction ? (
          <form
            action={async (fd) => {
              await deleteAction(fd)
            }}
            onSubmit={(e) => {
              if (!confirm("Delete this customer? This cannot be undone.")) {
                e.preventDefault()
              }
            }}
          >
            <Button type="submit" variant="destructive" size="sm">
              Delete Customer
            </Button>
          </form>
        ) : (
          <div />
        )}
        <SubmitButton label={defaultValues ? "Save Changes" : "Create Customer"} />
      </div>
    </form>
  )
}
