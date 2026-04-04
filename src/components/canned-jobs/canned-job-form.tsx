"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CannedJobModel } from "@/generated/prisma/models/CannedJob"
type CannedJob = CannedJobModel

const LINE_TYPES = [
  { value: "LABOR", label: "Labor" },
  { value: "PART", label: "Part" },
  { value: "SUBLET", label: "Sublet" },
  { value: "FEE", label: "Fee" },
  { value: "DISCOUNT", label: "Discount" },
] as const

type Props = {
  action: (formData: FormData) => Promise<{ error: string } | void>
  defaultValues?: Partial<CannedJob>
  submitLabel?: string
}

export function CannedJobForm({ action, defaultValues, submitLabel = "Save" }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await action(formData)
      return result ?? null
    },
    null
  )

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Oil Change – Conventional"
          defaultValue={defaultValues?.name ?? ""}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Optional internal notes or details"
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type *</Label>
          <Select name="type" defaultValue={defaultValues?.type ?? "LABOR"}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={defaultValues?.sortOrder ?? 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Default Quantity *</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={0.01}
            step={0.01}
            defaultValue={defaultValues?.quantity?.toNumber() ?? 1}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="unitPrice">Unit Price *</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            min={0}
            step={0.01}
            defaultValue={defaultValues?.unitPrice?.toNumber() ?? 0}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pt-1">
        <div className="flex items-center gap-2">
          <input
            id="taxable"
            name="taxable"
            type="checkbox"
            defaultChecked={defaultValues?.taxable ?? true}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <Label htmlFor="taxable" className="cursor-pointer font-normal">
            Taxable
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={defaultValues?.isActive ?? true}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <Label htmlFor="isActive" className="cursor-pointer font-normal">
            Active
          </Label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Button variant="outline" render={<Link href="/settings/canned-jobs" />}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
