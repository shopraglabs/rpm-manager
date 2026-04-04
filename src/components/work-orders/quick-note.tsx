"use client"

import { useRef, useState, useTransition } from "react"
import { MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addWorkOrderNote } from "@/modules/work-orders/actions"

export function QuickNote({ workOrderId }: { workOrderId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addWorkOrderNote(workOrderId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        formRef.current?.reset()
      }
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium text-sm">Internal Notes</h3>
      </div>

      {!open ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setOpen(true)}
        >
          Add note…
        </Button>
      ) : (
        <form ref={formRef} action={handleSubmit} className="space-y-2">
          <textarea
            name="note"
            rows={3}
            autoFocus
            placeholder="Add an internal note (visible to staff only)…"
            className="w-full text-sm rounded-lg border border-input bg-transparent px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none placeholder:text-muted-foreground"
            maxLength={2000}
            required
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="text-xs h-7" disabled={isPending}>
              {isPending ? "Saving…" : "Save Note"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                setOpen(false)
                setError(null)
                formRef.current?.reset()
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
