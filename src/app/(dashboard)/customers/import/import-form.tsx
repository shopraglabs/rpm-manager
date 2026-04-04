"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type ImportResult = {
  imported: number
  skipped: number
  errors: string[]
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <span className="mr-2">Importing…</span>
        </>
      ) : (
        <>
          <Upload className="h-4 w-4 mr-2" />
          Import Customers
        </>
      )}
    </Button>
  )
}

export function CustomerImportForm({
  action,
}: {
  action: (formData: FormData) => Promise<ImportResult | { error: string }>
}) {
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setResult(null)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const res = await action(fd)
    if ("error" in res) {
      setError(res.error)
    } else {
      setResult(res)
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-lg">Import complete</p>
            <p className="text-sm text-muted-foreground">
              {result.imported} customer{result.imported !== 1 ? "s" : ""} imported
              {result.skipped > 0 && `, ${result.skipped} skipped`}
            </p>
          </div>
        </div>

        {result.errors.length > 0 && (
          <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
            <p className="text-sm font-medium text-orange-800 mb-2">
              {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} had issues:
            </p>
            <ul className="space-y-1">
              {result.errors.slice(0, 10).map((err, i) => (
                <li key={i} className="text-xs text-orange-700">
                  • {err}
                </li>
              ))}
              {result.errors.length > 10 && (
                <li className="text-xs text-orange-600 font-medium">
                  …and {result.errors.length - 10} more
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <Button render={<Link href="/customers" />}>View Customers</Button>
          <Button variant="outline" onClick={() => setResult(null)}>
            Import Another File
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-medium text-sm">Upload CSV File</h2>

        <label
          className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
          htmlFor="csv-file"
        >
          {fileName ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground">Click to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select CSV file</p>
              <p className="text-xs text-muted-foreground">or drag and drop</p>
            </div>
          )}
          <input
            id="csv-file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Max 5,000 rows. Existing customers with matching emails will be skipped.
        </p>
        <SubmitButton />
      </div>
    </form>
  )
}
