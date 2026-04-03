"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "./input"

interface SearchBarProps {
  placeholder?: string
  initialValue?: string
  /** Extra query params to preserve when searching (e.g. view=board) */
  preserveParams?: string[]
}

export function SearchBar({
  placeholder = "Search…",
  initialValue = "",
  preserveParams = [],
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Keep value in sync when initial changes (page navigation)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  function navigate(search: string) {
    const sp = new URLSearchParams()
    if (search) sp.set("search", search)
    // Preserve specified params
    preserveParams.forEach((key) => {
      const v = searchParams.get(key)
      if (v) sp.set(key, v)
    })
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`)
    })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(next), 350)
  }

  function handleClear() {
    setValue("")
    navigate("")
  }

  return (
    <div className={`relative w-full max-w-sm ${isPending ? "opacity-70" : ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
