import type { Metadata } from "next"
import Link from "next/link"
import { Briefcase, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EstimateFormShell } from "@/components/estimates/estimate-form-shell"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { updateShopProfile, updateUserProfile } from "@/modules/settings/actions"

export const metadata: Metadata = { title: "Settings" }

const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
]

export default async function SettingsPage() {
  const { tenantId, id: userId, role } = await requireAuth()

  const [tenant, user] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ])

  const canEditShop = role === "OWNER"

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<Link href="/settings/canned-jobs" />}>
            <Briefcase className="h-4 w-4 mr-2" />
            Canned Jobs
          </Button>
          {(role === "OWNER" || role === "MANAGER") && (
            <Button variant="outline" size="sm" render={<Link href="/settings/users" />}>
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          )}
        </div>
      </div>

      {/* Shop Profile */}
      {canEditShop && (
        <section>
          <h2 className="font-medium mb-4">Shop Profile</h2>
          <div className="rounded-xl border bg-card p-6">
            <EstimateFormShell action={updateShopProfile} submitLabel="Save Shop Settings">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Shop name *</Label>
                  <Input id="name" name="name" defaultValue={tenant?.name ?? ""} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" defaultValue={tenant?.phone ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={tenant?.email ?? ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street address</Label>
                  <Input id="address" name="address" defaultValue={tenant?.address ?? ""} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" defaultValue={tenant?.city ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      maxLength={2}
                      placeholder="TX"
                      defaultValue={tenant?.state ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP</Label>
                    <Input id="zip" name="zip" defaultValue={tenant?.zip ?? ""} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default tax rate (%)</Label>
                    <Input
                      id="taxRate"
                      name="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      defaultValue={
                        tenant?.taxRate ? (tenant.taxRate.toNumber() * 100).toFixed(2) : "0"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="laborRate">Default labor rate ($/hr)</Label>
                    <Input
                      id="laborRate"
                      name="laborRate"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={tenant?.laborRate?.toNumber() ?? "0"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    name="timezone"
                    defaultValue={tenant?.timezone ?? "America/New_York"}
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {US_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </EstimateFormShell>
          </div>
        </section>
      )}

      {/* My Profile */}
      <section>
        <h2 className="font-medium mb-4">My Profile</h2>
        <div className="rounded-xl border bg-card p-6">
          <EstimateFormShell action={updateUserProfile} submitLabel="Save Profile">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={user?.firstName ?? ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={user?.lastName ?? ""}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profilePhone">Phone</Label>
                <Input id="profilePhone" name="phone" type="tel" defaultValue={user?.phone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <p className="text-sm text-muted-foreground capitalize px-1">
                  {user?.role?.toLowerCase().replace("_", " ") ?? "—"}
                </p>
              </div>
            </div>
          </EstimateFormShell>
        </div>
      </section>
    </div>
  )
}
