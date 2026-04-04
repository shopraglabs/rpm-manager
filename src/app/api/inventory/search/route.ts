import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export type InventorySearchResult = {
  id: string
  partNumber: string
  name: string
  brand: string | null
  price: number
  quantityOnHand: number
}

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await requireAuth()
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
    if (q.length < 1) return NextResponse.json({ results: [] })

    const contains = { contains: q, mode: "insensitive" as const }

    const items = await prisma.inventoryItem.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: contains },
          { partNumber: contains },
          { brand: contains },
          { description: contains },
        ],
      },
      take: 8,
      orderBy: { name: "asc" },
      select: {
        id: true,
        partNumber: true,
        name: true,
        brand: true,
        price: true,
        quantityOnHand: true,
      },
    })

    const results: InventorySearchResult[] = items.map((item) => ({
      id: item.id,
      partNumber: item.partNumber,
      name: item.name,
      brand: item.brand,
      price: item.price.toNumber(),
      quantityOnHand: item.quantityOnHand,
    }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
