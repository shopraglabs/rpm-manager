import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { requireAuth } from "@/lib/auth/session"
import { requirePermission } from "@/lib/auth/permissions"
import { prisma } from "@/lib/db"
import { UserRoleActions } from "./user-role-actions"

export const metadata: Metadata = { title: "Manage Users" }

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  SERVICE_WRITER: "Service Writer",
  TECHNICIAN: "Technician",
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-50 text-purple-700 border-purple-200",
  MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
  SERVICE_WRITER: "bg-cyan-50 text-cyan-700 border-cyan-200",
  TECHNICIAN: "bg-muted text-muted-foreground",
}

export default async function UsersPage() {
  const { tenantId, id: currentUserId, role } = await requireAuth()
  requirePermission(role, "users:manage")

  const users = await prisma.user.findMany({
    where: { tenantId },
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { firstName: "asc" }],
  })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/settings" />}>
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {users.filter((u) => u.isActive).length} active ·{" "}
            {users.filter((u) => !u.isActive).length} inactive
          </p>
        </div>
      </div>

      {/* Invite form */}
      <div className="rounded-xl border bg-card p-5 mb-6">
        <h2 className="font-medium text-sm mb-4">Invite Team Member</h2>
        <UserRoleActions mode="invite" />
      </div>

      {/* Users list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <ul className="divide-y">
          {users.map((u) => (
            <li
              key={u.id}
              className={`px-5 py-4 flex items-center justify-between gap-4 ${!u.isActive ? "opacity-60" : ""}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">
                    {u.firstName} {u.lastName}
                    {u.id === currentUserId && (
                      <span className="text-xs text-muted-foreground ml-1">(you)</span>
                    )}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[u.role] ?? ""}`}
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                  </Badge>
                  {!u.isActive && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground"
                    >
                      {u.supabaseUid.startsWith("pending_") ? "Invited" : "Inactive"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
              </div>

              {u.id !== currentUserId && u.role !== "OWNER" && (
                <UserRoleActions
                  mode="manage"
                  userId={u.id}
                  currentRole={u.role}
                  isActive={u.isActive}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
