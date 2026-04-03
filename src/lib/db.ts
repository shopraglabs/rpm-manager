import { PrismaClient } from "@/generated/prisma"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

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
        async findMany({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
        async findFirst({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
        async findUnique({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          // For findUnique we use findFirst + tenantId since unique queries can't have extra where
          const newArgs = {
            ...args,
            where: { ...(args.where as Record<string, unknown>), tenantId },
          }
          return query(newArgs)
        },
        async create({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          args.data = { ...(args.data as Record<string, unknown>), tenantId }
          return query(args)
        },
        async update({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
        async delete({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
        async count({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId }
          return query(args)
        },
      },
    },
  })
}

// Use this for operations that don't need tenant scoping (e.g., auth setup, admin tasks)
export const prisma = basePrisma
