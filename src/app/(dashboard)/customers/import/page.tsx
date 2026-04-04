import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { importCustomers } from "@/modules/customers/import-action"
import { CustomerImportForm } from "./import-form"

export const metadata: Metadata = { title: "Import Customers" }

export default function CustomerImportPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/customers" />}>
          <ChevronLeft className="h-4 w-4" />
          Customers
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Import Customers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a CSV file to bulk-import customers from another system.
        </p>
      </div>

      {/* Format guide */}
      <div className="rounded-xl border bg-card p-5 mb-6">
        <h2 className="font-medium text-sm mb-3">CSV Format</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Your CSV file should have a header row. The following columns are recognized:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border rounded-lg overflow-hidden">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Column name</th>
                <th className="text-left px-3 py-2 font-medium">Required?</th>
                <th className="text-left px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["first_name / firstName", "Yes", "Customer's first name"],
                ["last_name / lastName", "Yes", "Customer's last name"],
                ["email", "No", "Email address"],
                ["phone", "No", "Phone number (any format)"],
                ["address", "No", "Street address"],
                ["city", "No", "City"],
                ["state", "No", "2-letter state code"],
                ["zip", "No", "ZIP code"],
                ["notes", "No", "Any notes about the customer"],
              ].map(([col, req, note]) => (
                <tr key={col} className="bg-card">
                  <td className="px-3 py-2 font-mono text-primary">{col}</td>
                  <td className="px-3 py-2">{req}</td>
                  <td className="px-3 py-2 text-muted-foreground">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Column names are case-insensitive. Extra columns are ignored. Duplicate emails are
          skipped.
        </p>
      </div>

      <CustomerImportForm action={importCustomers} />
    </div>
  )
}
