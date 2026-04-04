"use client"

import { useActionState, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adjustStock } from "@/modules/inventory/actions"

interface StockAdjusterProps {
  itemId: string
  currentQty: number
}

type ActionState = { error: string } | { success: boolean; newQuantity: number } | null

export function StockAdjuster({ itemId, currentQty }: StockAdjusterProps) {
  const [adjustment, setAdjustment] = useState(1)

  const adjustWithId = adjustStock.bind(null, itemId)

  const [state, formAction, pending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      const result = await adjustWithId(formData)
      return result ?? null
    },
    null
  )

  const isSuccess = state && "success" in state

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="font-medium text-sm mb-4">Adjust Stock</h2>

      <form action={formAction} className="flex items-end gap-3">
        <input type="hidden" name="adjustment" value={adjustment} />

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Adjustment</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setAdjustment((v) => v - 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Input
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(parseInt(e.target.value, 10) || 0)}
              className="w-20 text-center tabular-nums h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setAdjustment((v) => v + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-end gap-2 pb-0.5">
          <div className="text-sm text-muted-foreground pb-2">
            {adjustment >= 0 ? "+" : ""}
            {adjustment} →{" "}
            <span className="font-semibold text-foreground">{currentQty + adjustment}</span>
          </div>
          <Button type="submit" size="sm" disabled={pending || adjustment === 0} className="h-9">
            {pending ? "Saving…" : "Apply"}
          </Button>
        </div>
      </form>

      {state && "error" in state && <p className="text-destructive text-xs mt-3">{state.error}</p>}
      {isSuccess && (
        <p className="text-green-600 text-xs mt-3">
          Stock updated to {(state as { success: boolean; newQuantity: number }).newQuantity}
        </p>
      )}
    </div>
  )
}
