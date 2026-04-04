"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Wrench, FileText, Receipt, Car, X, Loader2 } from "lucide-react"
import type { SearchResult } from "@/app/api/search/route"

const TYPE_ICONS: Record<SearchResult["type"], React.ComponentType<{ className?: string }>> = {
  customer: Users,
  "work-order": Wrench,
  estimate: FileText,
  invoice: Receipt,
  vehicle: Car,
}

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  customer: "Customer",
  "work-order": "Work Order",
  estimate: "Estimate",
  invoice: "Invoice",
  vehicle: "Vehicle",
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = (await res.json()) as { results: SearchResult[] }
        setResults(data.results)
        setSelected(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
  }, [])

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === "Enter" && results[selected]) {
      navigate(results[selected].href)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted"
        title="Search (⌘K)"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden sm:inline text-[10px] bg-muted border rounded px-1 py-0.5 font-mono">
          ⌘K
        </kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/50">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-card rounded-xl border shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          {loading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              search(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search customers, work orders, estimates, invoices…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("")
                setResults([])
                inputRef.current?.focus()
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd
            className="text-[10px] text-muted-foreground bg-muted border rounded px-1.5 py-0.5 font-mono cursor-pointer"
            onClick={() => setOpen(false)}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="py-2 max-h-80 overflow-y-auto">
            {results.map((r, i) => {
              const Icon = TYPE_ICONS[r.type]
              return (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === selected ? "bg-muted" : "hover:bg-muted/60"
                    }`}
                    onClick={() => navigate(r.href)}
                    onMouseEnter={() => setSelected(i)}
                  >
                    <div className="h-8 w-8 rounded-md bg-background border flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{TYPE_LABELS[r.type]}</p>
                      {r.meta && (
                        <p className="text-xs text-muted-foreground/70 capitalize">{r.meta}</p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : query.length >= 2 && !loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results for &ldquo;{query}&rdquo;
          </div>
        ) : query.length < 2 && query.length > 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Keep typing…</div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Start typing to search
          </div>
        )}

        {/* Footer hints */}
        <div className="border-t px-4 py-2 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="bg-muted border rounded px-1 font-mono">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted border rounded px-1 font-mono">↵</kbd> open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted border rounded px-1 font-mono">ESC</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
