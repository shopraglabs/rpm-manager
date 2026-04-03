"use client"

import { useTransition, useState } from "react"
import { updateInspectionItem } from "@/modules/inspections/actions"
import { CONDITION_LABELS, CONDITION_COLORS } from "@/modules/inspections/templates"

const CONDITIONS = ["GOOD", "FAIR", "POOR", "URGENT"] as const

interface InspectionItemRowProps {
  item: {
    id: string
    name: string
    condition: string
    notes: string | null
  }
  readOnly?: boolean
}

export function InspectionItemRow({ item, readOnly = false }: InspectionItemRowProps) {
  const [condition, setCondition] = useState(item.condition)
  const [notes, setNotes] = useState(item.notes ?? "")
  const [showNotes, setShowNotes] = useState(!!item.notes)
  const [isPending, startTransition] = useTransition()

  const updateWithId = updateInspectionItem.bind(null, item.id)

  function handleConditionChange(newCondition: string) {
    if (readOnly || newCondition === condition) return
    const prev = condition
    setCondition(newCondition)

    const fd = new FormData()
    fd.set("condition", newCondition)
    fd.set("notes", notes)

    startTransition(async () => {
      const result = await updateWithId(fd)
      if (result && "error" in result) {
        setCondition(prev) // revert on error
      }
    })
  }

  function handleNotesBlur() {
    if (readOnly) return
    const fd = new FormData()
    fd.set("condition", condition)
    fd.set("notes", notes)

    startTransition(async () => {
      await updateWithId(fd)
    })
  }

  const colors = CONDITION_COLORS[condition] ?? CONDITION_COLORS.GOOD

  return (
    <div className={`px-4 py-3 ${isPending ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Item name */}
        <span className="flex-1 text-sm">{item.name}</span>

        {/* Condition buttons */}
        {!readOnly && (
          <div className="flex gap-1 shrink-0">
            {CONDITIONS.map((c) => {
              const isActive = condition === c
              const btnColors = CONDITION_COLORS[c]
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleConditionChange(c)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    isActive
                      ? `${btnColors.bg} ${btnColors.text} ${btnColors.border}`
                      : "bg-transparent text-muted-foreground border-transparent hover:border-border hover:bg-muted/40"
                  }`}
                >
                  {CONDITION_LABELS[c]}
                </button>
              )
            })}
          </div>
        )}

        {/* Read-only badge */}
        {readOnly && (
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
            {CONDITION_LABELS[condition] ?? condition}
          </span>
        )}

        {/* Notes toggle */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            {showNotes ? "hide note" : "note"}
          </button>
        )}
      </div>

      {/* Notes input */}
      {showNotes && !readOnly && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add note…"
          rows={2}
          className="mt-2 w-full text-xs bg-muted/40 border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      )}

      {/* Read-only notes */}
      {readOnly && item.notes && (
        <p className="mt-1 text-xs text-muted-foreground pl-0">{item.notes}</p>
      )}
    </div>
  )
}
