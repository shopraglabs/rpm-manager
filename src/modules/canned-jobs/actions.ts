"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { cannedJobSchema } from "./schemas"

export async function createCannedJob(formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "settings:update")

  const raw = Object.fromEntries(formData)
  const parsed = cannedJobSchema.safeParse({
    ...raw,
    taxable: raw.taxable === "on" || raw.taxable === "true",
    isActive: raw.isActive === "on" || raw.isActive === "true" || raw.isActive === undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.cannedJob.create({
    data: {
      tenantId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      type: parsed.data.type,
      unitPrice: parsed.data.unitPrice,
      quantity: parsed.data.quantity,
      taxable: parsed.data.taxable,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
    },
  })

  revalidatePath("/settings/canned-jobs")
  redirect("/settings/canned-jobs")
}

export async function updateCannedJob(id: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "settings:update")

  const existing = await prisma.cannedJob.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Not found" }

  const raw = Object.fromEntries(formData)
  const parsed = cannedJobSchema.safeParse({
    ...raw,
    taxable: raw.taxable === "on" || raw.taxable === "true",
    isActive: raw.isActive === "on" || raw.isActive === "true",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  await prisma.cannedJob.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      type: parsed.data.type,
      unitPrice: parsed.data.unitPrice,
      quantity: parsed.data.quantity,
      taxable: parsed.data.taxable,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
    },
  })

  revalidatePath("/settings/canned-jobs")
  redirect("/settings/canned-jobs")
}

export async function deleteCannedJob(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "settings:update")

  const existing = await prisma.cannedJob.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Not found" }

  await prisma.cannedJob.delete({ where: { id } })
  revalidatePath("/settings/canned-jobs")
}

export async function toggleCannedJobActive(id: string, isActive: boolean) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "settings:update")

  const existing = await prisma.cannedJob.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Not found" }

  await prisma.cannedJob.update({ where: { id }, data: { isActive } })
  revalidatePath("/settings/canned-jobs")
}
