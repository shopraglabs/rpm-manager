"use client"

import { useState, useTransition } from "react"
import { ChevronsUpDown, Plus, UserPlus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

type Customer = {
  id: string
  firstName: string
  lastName: string
}

type Vehicle = {
  id: string
  year?: number | null
  make: string
  model: string
  trim?: string | null
  licensePlate?: string | null
}

type Props = {
  customers: Customer[]
  defaultCustomerId?: string
  defaultVehicleId?: string
  customerVehicles: Record<string, Vehicle[]>
  /** The current page path so "add customer" can redirect back here */
  returnPath?: string
}

export function CustomerVehicleSelector({
  customers,
  defaultCustomerId,
  defaultVehicleId,
  customerVehicles,
  returnPath,
}: Props) {
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "")
  const [vehicleId, setVehicleId] = useState(defaultVehicleId ?? "")
  const [customerOpen, setCustomerOpen] = useState(false)
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const [, startTransition] = useTransition()

  const selectedCustomer = customers.find((c) => c.id === customerId)
  const vehicles = customerId ? (customerVehicles[customerId] ?? []) : []
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)

  function vehicleLabel(v: Vehicle) {
    return `${v.year ? `${v.year} ` : ""}${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}${v.licensePlate ? ` (${v.licensePlate})` : ""}`
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Hidden inputs */}
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="vehicleId" value={vehicleId} />

      {/* Customer picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Customer *</label>
          <Link
            href="/customers/new"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
            tabIndex={-1}
          >
            <UserPlus className="h-3 w-3" />
            New customer
          </Link>
        </div>
        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
          <Button
            type="button"
            variant="outline"
            render={<PopoverTrigger />}
            className="w-full justify-between font-normal"
          >
            {selectedCustomer
              ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
              : "Select customer…"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search customers…" />
              <CommandList>
                <CommandEmpty>
                  <div className="py-2 text-center">
                    <p className="text-xs text-muted-foreground mb-2">No customers found</p>
                    <Link
                      href="/customers/new"
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                    >
                      <UserPlus className="h-3 w-3" />
                      Create new customer
                    </Link>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.firstName} ${c.lastName}`}
                      data-checked={customerId === c.id ? true : undefined}
                      onSelect={() => {
                        startTransition(() => {
                          setCustomerId(c.id)
                          setVehicleId("")
                          setCustomerOpen(false)
                        })
                      }}
                    >
                      {c.firstName} {c.lastName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Vehicle picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Vehicle *</label>
          {customerId && (
            <Link
              href={`/customers/${customerId}/vehicles/new`}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              tabIndex={-1}
            >
              <Plus className="h-3 w-3" />
              Add vehicle
            </Link>
          )}
        </div>
        <Popover open={vehicleOpen} onOpenChange={setVehicleOpen}>
          <Button
            type="button"
            variant="outline"
            render={<PopoverTrigger />}
            className="w-full justify-between font-normal"
            disabled={!customerId}
          >
            {selectedVehicle
              ? vehicleLabel(selectedVehicle)
              : vehicles.length === 0 && customerId
                ? "No vehicles — add one above"
                : "Select vehicle…"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>
                  <div className="py-2 text-center">
                    <p className="text-xs text-muted-foreground mb-2">No vehicles on file</p>
                    {customerId && (
                      <Link
                        href={`/customers/${customerId}/vehicles/new`}
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                      >
                        <Plus className="h-3 w-3" />
                        Add a vehicle
                      </Link>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {vehicles.map((v) => (
                    <CommandItem
                      key={v.id}
                      value={vehicleLabel(v)}
                      data-checked={vehicleId === v.id ? true : undefined}
                      onSelect={() => {
                        setVehicleId(v.id)
                        setVehicleOpen(false)
                      }}
                    >
                      {vehicleLabel(v)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
