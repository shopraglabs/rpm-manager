import type { Metadata } from "next"
import Link from "next/link"
import { ForgotPasswordForm } from "./forgot-password-form"

export const metadata: Metadata = {
  title: "Reset Password",
}

export default function ForgotPasswordPage() {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Reset your password</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        Remembered it?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
