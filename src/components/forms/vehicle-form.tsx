"use client"

import { useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { VinDecodeResult } from "@/app/api/vin/route"

function SubmitButton({ label = "Save Vehicle" }: { label?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  )
}

type DefaultValues = {
  make?: string
  model?: string
  year?: number | null
  trim?: string | null
  vin?: string | null
  licensePlate?: string | null
  color?: string | null
  engineSize?: string | null
  transmission?: string | null
  mileage?: number | null
  notes?: string | null
}

type FormAction = (formData: FormData) => Promise<{ error: string } | void> | void

export function VehicleForm({
  action,
  defaultValues,
  deleteAction,
}: {
  action: FormAction
  defaultValues?: DefaultValues
  deleteAction?: FormAction
}) {
  const [state, formAction] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await action(formData)
      return result ?? null
    },
    null
  )

  // VIN decode state
  const vinRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)
  const makeRef = useRef<HTMLInputElement>(null)
  const modelRef = useRef<HTMLInputElement>(null)
  const trimRef = useRef<HTMLInputElement>(null)
  const engineRef = useRef<HTMLInputElement>(null)
  const [transmission, setTransmission] = useState<string>(defaultValues?.transmission ?? "")
  const [decoding, setDecoding] = useState(false)
  const [decodeError, setDecodeError] = useState<string | null>(null)
  const [decodeSuccess, setDecodeSuccess] = useState(false)

  async function decodeVin() {
    const vin = vinRef.current?.value.trim()
    if (!vin || vin.length !== 17) {
      setDecodeError("Enter a 17-character VIN first")
      return
    }

    setDecoding(true)
    setDecodeError(null)
    setDecodeSuccess(false)

    try {
      const res = await fetch(`/api/vin?vin=${encodeURIComponent(vin)}`)
      const data: VinDecodeResult | { error: string } = await res.json()

      if (!res.ok || "error" in data) {
        setDecodeError("error" in data ? data.error : "Could not decode VIN")
        return
      }

      // Fill in decoded fields
      if (data.year && yearRef.current) yearRef.current.value = String(data.year)
      if (data.make && makeRef.current) makeRef.current.value = data.make
      if (data.model && modelRef.current) modelRef.current.value = data.model
      if (data.trim && trimRef.current) trimRef.current.value = data.trim
      if (data.engineSize && engineRef.current) engineRef.current.value = data.engineSize
      if (data.transmission) setTransmission(data.transmission)

      setDecodeSuccess(true)
    } catch {
      setDecodeError("Network error — check your connection")
    } finally {
      setDecoding(false)
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* VIN / License Plate — VIN first now with decoder */}
      <div className="space-y-2">
        <Label htmlFor="vin">VIN</Label>
        <div className="flex gap-2">
          <Input
            ref={vinRef}
            id="vin"
            name="vin"
            defaultValue={defaultValues?.vin ?? ""}
            placeholder="1HGBH41JXMN109186"
            className="font-mono uppercase"
            maxLength={17}
            onChange={() => {
              setDecodeError(null)
              setDecodeSuccess(false)
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={decoding}
            onClick={decodeVin}
          >
            {decoding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Scan className="h-3.5 w-3.5" />
            )}
            Decode
          </Button>
        </div>
        {decodeError && <p className="text-xs text-destructive">{decodeError}</p>}
        {decodeSuccess && (
          <p className="text-xs text-green-600">
            ✓ VIN decoded — fields pre-filled from NHTSA database
          </p>
        )}
      </div>

      {/* Year / Make / Model */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            ref={yearRef}
            id="year"
            name="year"
            type="number"
            min={1900}
            max={new Date().getFullYear() + 1}
            defaultValue={defaultValues?.year ?? ""}
            placeholder="2022"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="make">Make *</Label>
          <Input
            ref={makeRef}
            id="make"
            name="make"
            defaultValue={defaultValues?.make}
            placeholder="Toyota"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input
            ref={modelRef}
            id="model"
            name="model"
            defaultValue={defaultValues?.model}
            placeholder="Camry"
            required
          />
        </div>
      </div>

      {/* Trim / Color */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trim">Trim</Label>
          <Input
            ref={trimRef}
            id="trim"
            name="trim"
            defaultValue={defaultValues?.trim ?? ""}
            placeholder="XLE"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            name="color"
            defaultValue={defaultValues?.color ?? ""}
            placeholder="Silver"
          />
        </div>
      </div>

      {/* License Plate */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="licensePlate">License plate</Label>
          <Input
            id="licensePlate"
            name="licensePlate"
            defaultValue={defaultValues?.licensePlate ?? ""}
            placeholder="ABC-1234"
          />
        </div>
      </div>

      {/* Engine / Transmission / Mileage */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="engineSize">Engine</Label>
          <Input
            ref={engineRef}
            id="engineSize"
            name="engineSize"
            defaultValue={defaultValues?.engineSize ?? ""}
            placeholder="2.5L I4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transmission">Transmission</Label>
          <Select
            name="transmission"
            value={transmission}
            onValueChange={(v) => setTransmission(v ?? "")}
          >
            <SelectTrigger id="transmission">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTOMATIC">Automatic</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
              <SelectItem value="CVT">CVT</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage">Mileage</Label>
          <Input
            id="mileage"
            name="mileage"
            type="number"
            min={0}
            defaultValue={defaultValues?.mileage ?? ""}
            placeholder="45000"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Any notes about this vehicle…"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {deleteAction ? (
          <form
            action={async (fd) => {
              await deleteAction(fd)
            }}
            onSubmit={(e) => {
              if (!confirm("Delete this vehicle? This cannot be undone.")) {
                e.preventDefault()
              }
            }}
          >
            <Button type="submit" variant="destructive" size="sm">
              Delete Vehicle
            </Button>
          </form>
        ) : (
          <div />
        )}
        <SubmitButton label={defaultValues ? "Save Changes" : "Add Vehicle"} />
      </div>
    </form>
  )
}
