"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { slugify } from "@/lib/utils/format"

// ─── Sign In ────────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type ActionState = { error: string | null }

export async function signIn(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData)
  const parsed = signInSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: "Invalid email or password" }
  }

  redirect("/")
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function signUp(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData)
  const parsed = signUpSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { firstName, lastName, shopName, email, password } = parsed.data

  // Create Supabase auth user
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error || !data.user) {
    if (error?.message?.includes("already registered")) {
      return { error: "An account with this email already exists." }
    }
    return { error: error?.message ?? "Failed to create account" }
  }

  // Create tenant + user records in our database
  const slug = await uniqueSlug(shopName)

  await prisma.tenant.create({
    data: {
      name: shopName,
      slug,
      email,
      users: {
        create: {
          supabaseUid: data.user.id,
          email,
          firstName,
          lastName,
          role: "OWNER",
        },
      },
    },
  })

  redirect("/")
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect("/login")
}

// ─── Reset Password ───────────────────────────────────────────────────────────

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

type ResetState = { error: string | null; success: boolean }

export async function resetPassword(
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const raw = Object.fromEntries(formData)
  const parsed = resetPasswordSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", success: false }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: "Failed to send reset email. Please try again.", success: false }
  }

  return { error: null, success: true }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name)
  let slug = base
  let i = 1
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`
  }
  return slug
}
