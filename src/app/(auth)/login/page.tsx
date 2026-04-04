import type { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Log In",
}

export default function LoginPage() {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-1">Sign in to your shop account</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Create one free
        </Link>
      </p>
    </div>
  )
}
