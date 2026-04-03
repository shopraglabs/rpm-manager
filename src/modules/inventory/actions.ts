"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"

const inventorySchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  brand: z.string().optional().or(z.literal("")),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  quantityOnHand: z.coerce.number().int().min(0).default(0),
  reorderPoint: z.coerce.number().int().min(0).default(0),
  reorderQuantity: z.coerce.number().int().min(0).default(0),
  location: z.string().optional().or(z.literal("")),
})

export async function createInventoryItem(formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "inventory:create")

  const raw = Object.fromEntries(formData)
  const parsed = inventorySchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const existing = await prisma.inventoryItem.findFirst({
    where: { tenantId, partNumber: parsed.data.partNumber },
  })
  if (existing) return { error: "A part with this part number already exists" }

  const item = await prisma.inventoryItem.create({
    data: {
      tenantId,
      ...parsed.data,
      description: parsed.data.description || undefined,
      category: parsed.data.category || undefined,
      brand: parsed.data.brand || undefined,
      location: parsed.data.location || undefined,
    },
  })

  revalidatePath("/inventory")
  redirect(`/inventory/${item.id}`)
}

export async function updateInventoryItem(id: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "inventory:update")

  const existing = await prisma.inventoryItem.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Item not found" }

  const raw = Object.fromEntries(formData)
  const parsed = inventorySchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  // Check part number uniqueness (excluding self)
  const conflict = await prisma.inventoryItem.findFirst({
    where: { tenantId, partNumber: parsed.data.partNumber, NOT: { id } },
  })
  if (conflict) return { error: "Another part already uses this part number" }

  await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...parsed.data,
      description: parsed.data.description || undefined,
      category: parsed.data.category || undefined,
      brand: parsed.data.brand || undefined,
      location: parsed.data.location || undefined,
    },
  })

  revalidatePath(`/inventory/${id}`)
  revalidatePath("/inventory")
  redirect(`/inventory/${id}`)
}

export async function adjustStock(id: string, formData: FormData) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "inventory:update")

  const existing = await prisma.inventoryItem.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Item not found" }

  const adjustment = parseInt(formData.get("adjustment") as string, 10)
  if (isNaN(adjustment)) return { error: "Invalid adjustment value" }

  const newQty = existing.quantityOnHand + adjustment
  if (newQty < 0) return { error: "Stock cannot go below zero" }

  await prisma.inventoryItem.update({
    where: { id },
    data: { quantityOnHand: newQty },
  })

  revalidatePath(`/inventory/${id}`)
  revalidatePath("/inventory")
  return { success: true, newQuantity: newQty }
}

export async function deleteInventoryItem(id: string) {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "inventory:delete")

  const existing = await prisma.inventoryItem.findFirst({ where: { id, tenantId } })
  if (!existing) return { error: "Item not found" }

  await prisma.inventoryItem.delete({ where: { id } })

  revalidatePath("/inventory")
  redirect("/inventory")
}
