import { z } from "zod"

export const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(
      z
        .number()
        .int()
        .min(1900)
        .max(new Date().getFullYear() + 1)
        .optional()
    ),
  trim: z.string().optional().or(z.literal("")),
  vin: z.string().optional().or(z.literal("")),
  licensePlate: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  engineSize: z.string().optional().or(z.literal("")),
  transmission: z
    .enum(["AUTOMATIC", "MANUAL", "CVT", "OTHER"])
    .optional()
    .or(z.literal("")),
  mileage: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().min(0).optional()),
  notes: z.string().optional().or(z.literal("")),
})

export type VehicleInput = z.infer<typeof vehicleSchema>

export function normalizeVehicleInput(data: VehicleInput) {
  return {
    ...data,
    trim: data.trim || undefined,
    vin: data.vin || undefined,
    licensePlate: data.licensePlate || undefined,
    color: data.color || undefined,
    engineSize: data.engineSize || undefined,
    transmission: data.transmission || undefined,
    notes: data.notes || undefined,
  }
}
