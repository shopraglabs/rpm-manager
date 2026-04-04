"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "@/modules/auth/actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create Account"}
    </Button>
  )
}

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, { error: null })

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" placeholder="Jane" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" placeholder="Smith" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shopName">Shop name</Label>
        <Input id="shopName" name="shopName" placeholder="Smith's Auto Repair" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="jane@smithsauto.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <SubmitButton />

      <p className="text-xs text-muted-foreground text-center">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
