import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const basePrisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma

/**
 * Returns a Prisma client scoped to a specific tenant.
 * All queries automatically include tenantId in WHERE clauses.
 * This is the application-layer enforcement of tenant isolation.
 */
export function createTenantPrisma(tenantId: string) {
  return basePrisma.$extends({
    query: {
      $allModels: {
        async findMany({
          args,
          query,
        }: {
          args: Record<string, unknown>
          query: (args: Record<string, unknown>) => unknown
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
        async findFirst({
          args,
          query,
        }: {
          args: Record<string, unknown>
          query: (args: Record<string, unknown>) => unknown
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
        async create({
          args,
          query,
        }: {
          args: Record<string, unknown>
          query: (args: Record<string, unknown>) => unknown
        }) {
          args.data = { ...(args.data as Record<string, unknown>), tenantId }
          return query(args)
        },
        async update({
          args,
          query,
        }: {
          args: Record<string, unknown>
          query: (args: Record<string, unknown>) => unknown
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
        async delete({
          args,
          query,
        }: {
          args: Record<string, unknown>
          query: (args: Record<string, unknown>) => unknown
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
        async count({
          args,
          query,
        }: {
          args: Record<string, unknown>
          query: (args: Record<string, unknown>) => unknown
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
      },
    },
  })
}

// Use this for operations that don't need tenant scoping (e.g., auth setup, admin)
export const prisma = basePrisma
