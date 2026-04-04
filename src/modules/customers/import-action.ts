"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"

type ImportResult = {
  imported: number
  skipped: number
  errors: string[]
}

/** Parse a raw CSV string into rows of key→value objects. */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0)

  if (lines.length < 2) return []

  // Parse header — handle quoted fields
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase())

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim()
    })
    rows.push(row)
  }
  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function getField(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const val = row[key]?.trim()
    if (val) return val
  }
  return ""
}

export async function importCustomers(formData: FormData): Promise<ImportResult | { error: string }> {
  const { tenantId, role } = await requireAuth()
  requirePermission(role, "customers:create")

  const file = formData.get("file")
  if (!file || typeof file === "string") {
    return { error: "No file uploaded" }
  }

  const text = await (file as File).text()
  if (!text.trim()) return { error: "File is empty" }

  const rows = parseCSV(text)
  if (rows.length === 0) return { error: "No data rows found in CSV" }
  if (rows.length > 5000) return { error: "File exceeds 5,000 row limit" }

  // Load existing emails to detect duplicates
  const existingEmails = new Set(
    (
      await prisma.customer.findMany({
        where: { tenantId },
        select: { email: true },
      })
    )
      .map((c) => c.email?.toLowerCase())
      .filter(Boolean) as string[]
  )

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because row 1 is header and we're 0-indexed

    const firstName = getField(row, "first_name", "firstname", "first name")
    const lastName = getField(row, "last_name", "lastname", "last name")

    if (!firstName || !lastName) {
      errors.push(`Row ${rowNum}: missing first_name or last_name — skipped`)
      skipped++
      continue
    }

    const email = getField(row, "email")?.toLowerCase() || undefined

    if (email && existingEmails.has(email)) {
      errors.push(`Row ${rowNum}: ${firstName} ${lastName} (${email}) — email already exists`)
      skipped++
      continue
    }

    const phone = getField(row, "phone") || undefined
    const address = getField(row, "address") || undefined
    const city = getField(row, "city") || undefined
    const state = getField(row, "state")?.toUpperCase().slice(0, 2) || undefined
    const zip = getField(row, "zip") || undefined
    const notes = getField(row, "notes") || undefined

    try {
      await prisma.customer.create({
        data: {
          tenantId,
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          notes: notes || null,
        },
      })
      if (email) existingEmails.add(email)
      imported++
    } catch {
      errors.push(`Row ${rowNum}: ${firstName} ${lastName} — failed to import`)
      skipped++
    }
  }

  revalidatePath("/customers")

  return { imported, skipped, errors }
}
