import type { Metadata } from "next"
import Link from "next/link"
import { SignupForm } from "./signup-form"

export const metadata: Metadata = {
  title: "Create Account",
}

export default function SignupPage() {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Create your account</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Start managing your shop for free
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
