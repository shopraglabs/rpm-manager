"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  ClipboardCheck,
  CalendarDays,
  Package,
  Receipt,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { signOut } from "@/modules/auth/actions"
import type { SessionUser } from "@/lib/auth/session"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Estimates", href: "/estimates", icon: FileText },
  { label: "Work Orders", href: "/work-orders", icon: Wrench },
  { label: "Inspections", href: "/inspections", icon: ClipboardCheck },
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Reports", href: "/reports", icon: BarChart2 },
]

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  const pathname = usePathname()
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={href} />} isActive={isActive}>
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ user }: { user: SessionUser }) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">RPM Manager</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem href="/settings" icon={Settings} label="Settings" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3 px-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {user.role.replace("_", " ").toLowerCase()}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
