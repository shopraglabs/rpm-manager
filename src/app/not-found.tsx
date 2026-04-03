import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-muted-foreground/30 mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
