/**
 * Format a number as USD currency.
 * Handles Prisma Decimal objects (which have a toString() method).
 */
export function formatCurrency(
  amount: number | string | { toString(): string } | null | undefined
): string {
  const value = amount == null ? 0 : Number(amount.toString())
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

/**
 * Format a date as a readable string.
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-US", options).format(new Date(date))
}

/**
 * Format a date + time.
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * Format a phone number to (555) 867-5309 style.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—"
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "…"
}

/**
 * Convert a string to a URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}
