"use client"

import { useState, useActionState } from "react"
import { MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { sendCustomerSms } from "@/modules/customers/actions"

type Props = {
  customerId: string
  customerName: string
}

export function SendSmsDialog({ customerId, customerName }: Props) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await sendCustomerSms(customerId, formData.get("message") as string)
      if (!result?.error) {
        setMessage("")
        setOpen(false)
      }
      return result ?? null
    },
    null
  )

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquare className="h-4 w-4 mr-2" />
        Send SMS
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card rounded-xl border shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Send SMS to {customerName}</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {state?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-3">
          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message…"
            rows={4}
            maxLength={160}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{message.length}/160</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending || !message.trim()}>
                {isPending ? "Sending…" : "Send SMS"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
