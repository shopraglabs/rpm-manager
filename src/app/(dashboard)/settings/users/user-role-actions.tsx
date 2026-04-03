"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
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
import { inviteUser, updateUserRole, deactivateUser } from "@/modules/settings/actions"

function SubmitButton({ label, variant = "default", size = "default" }: {
  label: string
  variant?: "default" | "outline" | "destructive"
  size?: "default" | "sm"
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} size={size as never} disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

// ---- Invite mode ----
function InviteForm() {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string; success?: boolean; message?: string } | null, formData: FormData) => {
      const result = await inviteUser(formData)
      return result
    },
    null
  )

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">{state.message}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-xs">First name</Label>
          <Input id="firstName" name="firstName" className="h-8" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-xs">Last name</Label>
          <Input id="lastName" name="lastName" className="h-8" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="inviteEmail" className="text-xs">Email</Label>
          <Input id="inviteEmail" name="email" type="email" className="h-8" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role" className="text-xs">Role</Label>
          <Select name="role" defaultValue="TECHNICIAN">
            <SelectTrigger id="role" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="SERVICE_WRITER">Service Writer</SelectItem>
              <SelectItem value="TECHNICIAN">Technician</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SubmitButton label="Send Invite" size="sm" />
    </form>
  )
}

// ---- Manage mode ----
function ManageForm({ userId, currentRole, isActive }: {
  userId: string
  currentRole: string
  isActive: boolean
}) {
  const updateWithId = updateUserRole.bind(null, userId)

  const [roleState, roleFormAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await updateWithId(formData)
      return result ?? null
    },
    null
  )

  return (
    <div className="flex items-center gap-2">
      {roleState?.error && <p className="text-xs text-destructive">{roleState.error}</p>}

      <form action={roleFormAction} className="flex items-center gap-2">
        <Select name="role" defaultValue={currentRole}>
          <SelectTrigger className="h-7 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="SERVICE_WRITER">Service Writer</SelectItem>
            <SelectItem value="TECHNICIAN">Technician</SelectItem>
          </SelectContent>
        </Select>
        <SubmitButton label="Save" size="sm" variant="outline" />
      </form>

      {isActive && (
        <form
          action={async () => { await deactivateUser(userId) }}
          onSubmit={(e) => {
            if (!confirm("Deactivate this user?")) e.preventDefault()
          }}
        >
          <Button type="submit" variant="destructive" size="sm">
            Deactivate
          </Button>
        </form>
      )}
    </div>
  )
}

export function UserRoleActions(
  props:
    | { mode: "invite" }
    | { mode: "manage"; userId: string; currentRole: string; isActive: boolean }
) {
  if (props.mode === "invite") return <InviteForm />
  return (
    <ManageForm
      userId={props.userId}
      currentRole={props.currentRole}
      isActive={props.isActive}
    />
  )
}
