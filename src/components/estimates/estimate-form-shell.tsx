"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormAction = (formData: FormData) => Promise<{ error?: string } | void | any> | void

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

export function EstimateFormShell({
  action,
  submitLabel = "Save",
  children,
  cancelSlot,
  deleteSlot,
}: {
  action: FormAction
  submitLabel?: string
  children: React.ReactNode
  cancelSlot?: React.ReactNode
  deleteSlot?: React.ReactNode
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

      {children}

      <div className="flex items-center justify-between">
        <div>{deleteSlot}</div>
        <div className="flex gap-3">
          {cancelSlot}
          <SubmitButton label={submitLabel} />
        </div>
      </div>
    </form>
  )
}
