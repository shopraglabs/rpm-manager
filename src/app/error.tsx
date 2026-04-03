"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
