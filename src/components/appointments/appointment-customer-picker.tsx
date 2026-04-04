"use client"

import { useState, useTransition } from "react"
import { ChevronsUpDown, UserPlus, Car, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  phone: string | null
  email: string | null
  vehicles: {
    id: string
    year: number | null
    make: string
    model: string
    trim: string | null
    licensePlate: string | null
  }[]
}

type Props = {
  customers: Customer[]
  defaultCustomerName?: string
  defaultCustomerPhone?: string
  defaultCustomerEmail?: string
  defaultVehicleId?: string
}

export function AppointmentCustomerPicker({
  customers,
  defaultCustomerName = "",
  defaultCustomerPhone = "",
  defaultCustomerEmail = "",
  defaultVehicleId = "",
}: Props) {
  const [customerOpen, setCustomerOpen] = useState(false)
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [vehicleId, setVehicleId] = useState(defaultVehicleId)

  const [nameVal, setNameVal] = useState(defaultCustomerName)
  const [phoneVal, setPhoneVal] = useState(defaultCustomerPhone)
  const [emailVal, setEmailVal] = useState(defaultCustomerEmail)

  const [, startTransition] = useTransition()

  const vehicles = selectedCustomer?.vehicles ?? []
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)

  function vehicleLabel(v: { year: number | null; make: string; model: string; trim: string | null; licensePlate: string | null }) {
    return `${v.year ? `${v.year} ` : ""}${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}${v.licensePlate ? ` (${v.licensePlate})` : ""}`
  }

  function selectCustomer(c: Customer) {
    startTransition(() => {
      setSelectedCustomer(c)
      setNameVal(`${c.firstName} ${c.lastName}`)
      setPhoneVal(c.phone ?? "")
      setEmailVal(c.email ?? "")
      setVehicleId("")
      setCustomerOpen(false)
    })
  }

  function clearCustomer() {
    setSelectedCustomer(null)
    setVehicleId("")
  }

  return (
    <div className="space-y-4">
      {/* Existing customer picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Look up existing customer</Label>
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
              : "Search existing customers… (optional)"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search by name…" />
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
                      data-checked={selectedCustomer?.id === c.id ? true : undefined}
                      onSelect={() => selectCustomer(c)}
                    >
                      <div>
                        <p className="text-sm">{c.firstName} {c.lastName}</p>
                        {c.phone && (
                          <p className="text-xs text-muted-foreground">{c.phone}</p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedCustomer && (
          <button
            type="button"
            onClick={clearCustomer}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕ Clear selection
          </button>
        )}
      </div>

      {/* Vehicle picker — only when customer selected */}
      {selectedCustomer && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Vehicle</Label>
            <Link
              href={`/customers/${selectedCustomer.id}/vehicles/new`}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              tabIndex={-1}
            >
              <Plus className="h-3 w-3" />
              Add vehicle
            </Link>
          </div>
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <Popover open={vehicleOpen} onOpenChange={setVehicleOpen}>
            <Button
              type="button"
              variant="outline"
              render={<PopoverTrigger />}
              className="w-full justify-between font-normal"
              disabled={vehicles.length === 0}
            >
              {selectedVehicle
                ? vehicleLabel(selectedVehicle)
                : vehicles.length === 0
                  ? "No vehicles on file"
                  : "Select vehicle (optional)"}
              <Car className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandList>
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
      )}

      {/* If no customer selected, keep vehicleId empty */}
      {!selectedCustomer && <input type="hidden" name="vehicleId" value="" />}

      {/* Customer name / phone / email — editable, pre-filled when customer selected */}
      <div className="space-y-2">
        <Label htmlFor="customerName">Name *</Label>
        <Input
          id="customerName"
          name="customerName"
          required
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          placeholder="Customer name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerPhone">Phone</Label>
          <Input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            value={phoneVal}
            onChange={(e) => setPhoneVal(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            name="customerEmail"
            type="email"
            value={emailVal}
            onChange={(e) => setEmailVal(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
