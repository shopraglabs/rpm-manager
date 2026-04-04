import type { Metadata } from "next"
import { TrendingUp, Wrench, DollarSign, CheckCircle2 } from "lucide-react"
import { getReportData } from "@/modules/reports/queries"
import { formatCurrency } from "@/lib/utils/format"
import { RevenueChart, WorkOrderVolumeChart } from "./revenue-chart"

export const metadata: Metadata = { title: "Reports" }

export default async function ReportsPage() {
  const data = await getReportData(12)
  const { summary, monthlyRevenue, workOrderVolume, topServices, techStats } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Last 12 months</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(summary.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1.5">payments collected</p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Work Orders</p>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold tabular-nums">{summary.totalWOs}</p>
          <p className="text-xs text-muted-foreground mt-1.5">{summary.completedWOs} completed</p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Avg Repair Order</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold tabular-nums">
            {formatCurrency(summary.avgRepairOrder)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">per work order</p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold tabular-nums">{summary.completionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1.5">of work orders completed</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-medium mb-1">Revenue by Month</h2>
          <p className="text-xs text-muted-foreground mb-4">Payments collected</p>
          {monthlyRevenue.every((m) => m.revenue === 0) ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No payment data yet</p>
            </div>
          ) : (
            <RevenueChart data={monthlyRevenue} />
          )}
        </div>

        {/* Work order volume chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-medium mb-1">Work Order Volume</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/40" />
              Total
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary" />
              Completed
            </span>
          </div>
          {workOrderVolume.every((m) => m.count === 0) ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No work order data yet</p>
            </div>
          ) : (
            <WorkOrderVolumeChart data={workOrderVolume} />
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top services */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-medium">Top Services</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Labor line items by revenue</p>
          </div>
          {topServices.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No invoice data yet
            </div>
          ) : (
            <div className="divide-y">
              {topServices.map((svc, i) => {
                const maxRevenue = topServices[0]?.revenue ?? 1
                const pct = Math.round((svc.revenue / maxRevenue) * 100)
                return (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium truncate max-w-[60%]">{svc.description}</p>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(svc.revenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">{svc.count}×</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Technician stats */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-medium">Technician Performance</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Assigned work orders</p>
          </div>
          {techStats.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No technician assignments yet
            </div>
          ) : (
            <div className="divide-y">
              {techStats.map((tech, i) => {
                const rate =
                  tech.workOrders > 0 ? Math.round((tech.completed / tech.workOrders) * 100) : 0
                return (
                  <div key={i} className="px-5 py-3 flex items-center gap-4">
                    {/* Avatar initial */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                      {tech.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{tech.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {rate}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums">{tech.completed}</p>
                      <p className="text-xs text-muted-foreground">/ {tech.workOrders}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
