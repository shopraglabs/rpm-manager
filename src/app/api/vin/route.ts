import { NextRequest, NextResponse } from "next/server"

export interface VinDecodeResult {
  year: number | null
  make: string | null
  model: string | null
  trim: string | null
  engineSize: string | null
  transmission: "AUTOMATIC" | "MANUAL" | "CVT" | null
}

/** Maps NHTSA transmission strings to our enum values. */
function mapTransmission(raw: string | null): VinDecodeResult["transmission"] {
  if (!raw) return null
  const upper = raw.toUpperCase()
  if (upper.includes("MANUAL") && !upper.includes("AUTOMATED")) return "MANUAL"
  if (upper.includes("CVT") || upper.includes("CONTINUOUSLY VARIABLE")) return "CVT"
  if (upper.includes("AUTOMATIC") || upper.includes("AUTOMATED") || upper.includes("AMT"))
    return "AUTOMATIC"
  return null
}

/** Builds an engine size string like "2.5L I4" from NHTSA fields. */
function buildEngineSize(displacement: string | null, cylinders: string | null): string | null {
  if (!displacement && !cylinders) return null
  const parts: string[] = []
  if (displacement) {
    const liters = parseFloat(displacement)
    if (!isNaN(liters)) parts.push(`${liters.toFixed(1)}L`)
  }
  if (cylinders) {
    const cyl = parseInt(cylinders, 10)
    if (!isNaN(cyl)) {
      const config = cyl === 4 ? "I4" : cyl === 6 ? "V6" : cyl === 8 ? "V8" : `${cyl}cyl`
      parts.push(config)
    }
  }
  return parts.length > 0 ? parts.join(" ") : null
}

export async function GET(request: NextRequest) {
  const vin = request.nextUrl.searchParams.get("vin")?.trim().toUpperCase()

  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: "VIN must be exactly 17 characters" }, { status: 400 })
  }

  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
    const res = await fetch(url, { next: { revalidate: 86400 } }) // cache 24h

    if (!res.ok) {
      return NextResponse.json({ error: "NHTSA API unavailable" }, { status: 502 })
    }

    const data = await res.json()
    const result = data?.Results?.[0]

    if (!result || result.ErrorCode !== "0") {
      return NextResponse.json({ error: "VIN not recognized" }, { status: 404 })
    }

    const year = result.ModelYear ? parseInt(result.ModelYear, 10) : null
    const make = result.Make ? toTitleCase(result.Make) : null
    const model = result.Model ? toTitleCase(result.Model) : null
    const trim = result.Trim || null
    const engineSize = buildEngineSize(result.DisplacementL ?? null, result.EngineCylinders ?? null)
    const transmission = mapTransmission(result.TransmissionStyle ?? null)

    const decoded: VinDecodeResult = {
      year: year && !isNaN(year) ? year : null,
      make,
      model,
      trim,
      engineSize,
      transmission,
    }

    return NextResponse.json(decoded)
  } catch {
    return NextResponse.json({ error: "Failed to decode VIN" }, { status: 500 })
  }
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/[\s-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
