"use client"

import { useState, useTransition } from "react"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
}

export function CustomerVehicleSelector({
  customers,
  defaultCustomerId,
  defaultVehicleId,
  customerVehicles,
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
        <label className="text-sm font-medium">Customer *</label>
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
                <CommandEmpty>No customers found.</CommandEmpty>
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
        <label className="text-sm font-medium">Vehicle *</label>
        <Popover open={vehicleOpen} onOpenChange={setVehicleOpen}>
          <Button
            type="button"
            variant="outline"
            render={<PopoverTrigger />}
            className="w-full justify-between font-normal"
            disabled={!customerId || vehicles.length === 0}
          >
            {selectedVehicle
              ? vehicleLabel(selectedVehicle)
              : vehicles.length === 0 && customerId
              ? "No vehicles on file"
              : "Select vehicle…"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>No vehicles found.</CommandEmpty>
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
