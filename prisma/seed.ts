/**
 * prisma/seed.ts
 *
 * Development seed: creates a demo shop with realistic data.
 *
 * Usage:
 *   pnpm db:seed
 *
 * After seeding:
 *   1. Sign up at /signup with email "owner@example.com"
 *   2. In Supabase dashboard, copy the auth UID for that user
 *   3. Run this SQL to link it:
 *        UPDATE users SET supabase_uid = '<uid>'
 *        WHERE email = 'owner@example.com';
 *   OR set SEED_SUPABASE_UID=<uid> in .env.local and re-run pnpm db:seed
 */

import "dotenv/config"
import { PrismaClient, Prisma } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database…")

  // ── Tenant ────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-shop" },
    create: {
      name: "Demo Auto Repair",
      slug: "demo-shop",
      phone: "(555) 867-5309",
      email: "service@demoauto.com",
      address: "123 Main Street",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      timezone: "America/Chicago",
      taxRate: new Prisma.Decimal("0.0825"),
      laborRate: new Prisma.Decimal("120"),
    },
    update: { name: "Demo Auto Repair" },
  })
  console.log("✓ Tenant:", tenant.name)

  // ── Owner user ────────────────────────────────────────────
  const ownerSupabaseUid = process.env.SEED_SUPABASE_UID ?? "pending_owner_uid_" + Date.now()

  let owner = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "owner@example.com" },
  })
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        supabaseUid: ownerSupabaseUid,
        email: "owner@example.com",
        firstName: "Alex",
        lastName: "Rivera",
        role: "OWNER",
        isActive: true,
      },
    })
  } else if (process.env.SEED_SUPABASE_UID) {
    owner = await prisma.user.update({
      where: { id: owner.id },
      data: { supabaseUid: process.env.SEED_SUPABASE_UID },
    })
  }
  console.log("✓ Owner:", owner.firstName, owner.lastName)

  // Tech user
  let tech = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "tech@example.com" },
  })
  if (!tech) {
    tech = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        supabaseUid: "pending_tech_uid_" + Date.now(),
        email: "tech@example.com",
        firstName: "Jordan",
        lastName: "Kim",
        role: "TECHNICIAN",
        isActive: true,
      },
    })
  }
  console.log("✓ Technician:", tech.firstName, tech.lastName)

  // ── Customers ─────────────────────────────────────────────
  const customerData = [
    {
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@example.com",
      phone: "(555) 201-3344",
      address: "456 Oak Ave",
      city: "Springfield",
      state: "IL",
      zip: "62702",
    },
    {
      firstName: "Marcus",
      lastName: "Johnson",
      email: "marcus.johnson@example.com",
      phone: "(555) 444-9876",
    },
    {
      firstName: "Priya",
      lastName: "Patel",
      email: "priya.patel@example.com",
      phone: "(555) 712-0011",
    },
  ]

  const customers = await Promise.all(
    customerData.map(async (cd) => {
      const existing = await prisma.customer.findFirst({
        where: { tenantId: tenant.id, email: cd.email },
      })
      if (existing) return existing
      return prisma.customer.create({ data: { tenantId: tenant.id, ...cd } })
    })
  )
  console.log("✓ Customers:", customers.length)

  // ── Vehicles ──────────────────────────────────────────────
  const vehicleData = [
    {
      customerId: customers[0].id,
      year: 2021,
      make: "Honda",
      model: "Accord",
      trim: "Sport",
      color: "Lunar Silver",
      vin: "1HGBH41JXMN109186",
      licensePlate: "ABC1234",
      mileage: 42500,
      engineSize: "1.5T",
      transmission: "AUTOMATIC" as const,
    },
    {
      customerId: customers[1].id,
      year: 2019,
      make: "Toyota",
      model: "Tundra",
      trim: "SR5",
      color: "Barcelona Red",
      vin: "5TFBW5F18AX104123",
      licensePlate: "TRK9988",
      mileage: 78000,
      engineSize: "5.7L V8",
      transmission: "AUTOMATIC" as const,
    },
    {
      customerId: customers[2].id,
      year: 2022,
      make: "BMW",
      model: "330i",
      trim: "xDrive",
      color: "Mineral Grey",
      vin: "WBANE535X5CM79789",
      licensePlate: "BMW2022",
      mileage: 18000,
      engineSize: "2.0T",
      transmission: "AUTOMATIC" as const,
    },
  ]

  const vehicles = await Promise.all(
    vehicleData.map(async (vd) => {
      const existing = await prisma.vehicle.findFirst({
        where: { tenantId: tenant.id, vin: vd.vin },
      })
      if (existing) return existing
      return prisma.vehicle.create({ data: { tenantId: tenant.id, ...vd } })
    })
  )
  console.log("✓ Vehicles:", vehicles.length)

  // ── Inventory ─────────────────────────────────────────────
  const partsData = [
    {
      partNumber: "OIL-5W30-5QT",
      name: "Motor Oil 5W-30 5qt",
      category: "Engine",
      brand: "Castrol",
      cost: 18.99,
      price: 34.99,
      qty: 24,
      reorderPoint: 4,
      reorderQty: 6,
    },
    {
      partNumber: "FLTR-OIL-HONDA",
      name: "Oil Filter - Honda/Acura",
      category: "Filters",
      brand: "Denso",
      cost: 5.49,
      price: 12.99,
      qty: 18,
      reorderPoint: 3,
      reorderQty: 6,
    },
    {
      partNumber: "FLTR-AIR-ACC",
      name: "Air Filter - Honda Accord",
      category: "Filters",
      brand: "OEM",
      cost: 12.99,
      price: 24.99,
      qty: 8,
      reorderPoint: 2,
      reorderQty: 4,
    },
    {
      partNumber: "BRAKE-PAD-F-ACC",
      name: "Front Brake Pads - Honda Accord",
      category: "Brakes",
      brand: "Bosch",
      cost: 42.5,
      price: 89.99,
      qty: 6,
      reorderPoint: 2,
      reorderQty: 4,
    },
    {
      partNumber: "BRAKE-ROTOR-F",
      name: "Front Brake Rotor - Pair",
      category: "Brakes",
      brand: "ACDelco",
      cost: 78.0,
      price: 159.99,
      qty: 4,
      reorderPoint: 1,
      reorderQty: 2,
    },
    {
      partNumber: "SPARK-PLUG-NGK",
      name: "Spark Plug NGK Iridium",
      category: "Ignition",
      brand: "NGK",
      cost: 8.99,
      price: 18.99,
      qty: 32,
      reorderPoint: 8,
      reorderQty: 16,
    },
    {
      partNumber: "COOLANT-OAT-1G",
      name: "Coolant OAT Pre-Mixed 1gal",
      category: "Fluids",
      brand: "Prestone",
      cost: 11.49,
      price: 22.99,
      qty: 12,
      reorderPoint: 3,
      reorderQty: 6,
    },
    {
      partNumber: "WIPER-18-20",
      name: 'Wiper Blade Set 18/20"',
      category: "Accessories",
      brand: "Bosch",
      cost: 14.99,
      price: 29.99,
      qty: 1,
      reorderPoint: 2,
      reorderQty: 4,
    },
  ]

  const parts = await Promise.all(
    partsData.map(
      async ({ partNumber, name, category, brand, cost, price, qty, reorderPoint, reorderQty }) => {
        const existing = await prisma.inventoryItem.findFirst({
          where: { tenantId: tenant.id, partNumber },
        })
        if (existing) return existing
        return prisma.inventoryItem.create({
          data: {
            tenantId: tenant.id,
            partNumber,
            name,
            category,
            brand,
            cost: new Prisma.Decimal(cost),
            price: new Prisma.Decimal(price),
            quantityOnHand: qty,
            reorderPoint,
            reorderQuantity: reorderQty,
          },
        })
      }
    )
  )
  console.log("✓ Inventory:", parts.length, "parts")

  // ── Work orders ───────────────────────────────────────────
  const workOrderData = [
    {
      orderNumber: "WO-0001",
      customerId: customers[0].id,
      vehicleId: vehicles[0].id,
      assignedToId: tech.id,
      status: "IN_PROGRESS" as const,
      priority: "NORMAL" as const,
      mileageIn: 42500,
      notes: "Oil change + tire rotation. Customer reports slight vibration at highway speeds.",
      subtotal: new Prisma.Decimal("164.97"),
      taxAmount: new Prisma.Decimal("13.61"),
      total: new Prisma.Decimal("178.58"),
    },
    {
      orderNumber: "WO-0002",
      customerId: customers[1].id,
      vehicleId: vehicles[1].id,
      assignedToId: tech.id,
      status: "WAITING_PARTS" as const,
      priority: "HIGH" as const,
      mileageIn: 78000,
      notes: "Front brake pads and rotors. Customer said brakes are grinding.",
      subtotal: new Prisma.Decimal("439.97"),
      taxAmount: new Prisma.Decimal("36.30"),
      total: new Prisma.Decimal("476.27"),
    },
    {
      orderNumber: "WO-0003",
      customerId: customers[2].id,
      vehicleId: vehicles[2].id,
      status: "READY_FOR_PICKUP" as const,
      priority: "NORMAL" as const,
      mileageIn: 18000,
      notes: "Annual service. Oil change, air filter, cabin filter, tire rotation.",
      subtotal: new Prisma.Decimal("329.94"),
      taxAmount: new Prisma.Decimal("27.22"),
      total: new Prisma.Decimal("357.16"),
    },
  ]

  for (const wd of workOrderData) {
    const existing = await prisma.workOrder.findFirst({
      where: { tenantId: tenant.id, orderNumber: wd.orderNumber },
    })
    if (!existing) {
      await prisma.workOrder.create({ data: { tenantId: tenant.id, ...wd } })
      console.log("✓ Work order:", wd.orderNumber, wd.status)
    } else {
      console.log("✓ Work order:", wd.orderNumber, "(already exists)")
    }
  }

  // ── Appointments ──────────────────────────────────────────
  const apptCount = await prisma.appointment.count({ where: { tenantId: tenant.id } })
  if (apptCount === 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    await prisma.appointment.createMany({
      data: [
        {
          tenantId: tenant.id,
          title: "Oil Change",
          customerName: "Sarah Chen",
          customerPhone: "(555) 201-3344",
          customerEmail: "sarah.chen@example.com",
          startTime: new Date(today.getTime() + 9 * 3600000),
          endTime: new Date(today.getTime() + 10 * 3600000),
          status: "CONFIRMED",
          assignedToId: tech.id,
          vehicleId: vehicles[0].id,
        },
        {
          tenantId: tenant.id,
          title: "Brake Inspection",
          customerName: "Marcus Johnson",
          customerPhone: "(555) 444-9876",
          startTime: new Date(today.getTime() + 13 * 3600000),
          endTime: new Date(today.getTime() + 14.5 * 3600000),
          status: "SCHEDULED",
          assignedToId: tech.id,
        },
        {
          tenantId: tenant.id,
          title: "Annual Service + Inspection",
          customerName: "Priya Patel",
          customerPhone: "(555) 712-0011",
          startTime: new Date(tomorrow.getTime() + 10 * 3600000),
          endTime: new Date(tomorrow.getTime() + 12 * 3600000),
          status: "SCHEDULED",
          vehicleId: vehicles[2].id,
        },
      ],
    })
    console.log("✓ Appointments: 3 created")
  } else {
    console.log("✓ Appointments:", apptCount, "already exist")
  }

  console.log("\n✅ Seed complete!")
  console.log("\nNext steps:")
  console.log("  1. Sign up at /signup with email: owner@example.com")
  console.log("  2. Copy the Supabase UID from Auth > Users in Supabase dashboard")
  console.log("  3. Set SEED_SUPABASE_UID=<uid> in .env.local and run: pnpm db:seed")
  console.log("     (or run the SQL directly on your database)")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
