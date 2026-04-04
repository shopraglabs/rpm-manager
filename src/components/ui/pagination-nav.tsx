import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationNavProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  /** Build the href for a given page number (receives existing searchParams) */
  buildHref: (page: number) => string
}

export function PaginationNav({
  page,
  totalPages,
  total,
  pageSize,
  buildHref,
}: PaginationNavProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pages: (number | "ellipsis")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("ellipsis")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border hover:bg-muted transition-colors text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border opacity-40 cursor-not-allowed">
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </span>
        )}

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1.5">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              className={`px-2.5 py-1.5 rounded-md border transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              {p}
            </Link>
          )
        )}

        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border hover:bg-muted transition-colors text-foreground"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border opacity-40 cursor-not-allowed">
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  )
}
