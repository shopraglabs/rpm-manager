import { authenticatedTest as test, loginIfCredentials } from "./fixtures/auth"
import { test as base, expect } from "@playwright/test"

/**
 * These tests require PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD.
 * They are automatically skipped when those env vars are absent.
 */
test.describe("Dashboard (authenticated)", () => {
  test("shows the dashboard with KPI cards", async ({ authedPage: page }) => {
    await page.goto("/")
    // KPI cards are rendered as links/divs with stat numbers
    await expect(page.locator("text=Open Work Orders")).toBeVisible()
    await expect(page.locator("text=Unpaid Invoices")).toBeVisible()
    await expect(page.locator("text=Revenue Today")).toBeVisible()
    await expect(page.locator("text=Revenue This Month")).toBeVisible()
  })

  test("shows recent work orders section", async ({ authedPage: page }) => {
    await page.goto("/")
    await expect(page.locator("text=Recent Work Orders")).toBeVisible()
  })

  test("shows recent invoices section", async ({ authedPage: page }) => {
    await page.goto("/")
    await expect(page.locator("text=Recent Invoices")).toBeVisible()
  })
})

test.describe("Customers (authenticated)", () => {
  test("shows the customers list page", async ({ authedPage: page }) => {
    await page.goto("/customers")
    await expect(page.locator("h1")).toContainText("Customers")
  })

  test("has an Add Customer button", async ({ authedPage: page }) => {
    await page.goto("/customers")
    await expect(page.locator("text=Add Customer")).toBeVisible()
  })

  test("search bar is present", async ({ authedPage: page }) => {
    await page.goto("/customers")
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })
})

test.describe("Work Orders (authenticated)", () => {
  test("shows the work orders list page", async ({ authedPage: page }) => {
    await page.goto("/work-orders")
    await expect(page.locator("h1")).toContainText("Work Orders")
  })

  test("has List and Board view toggle", async ({ authedPage: page }) => {
    await page.goto("/work-orders")
    await expect(page.locator("text=Board")).toBeVisible()
    await expect(page.locator("text=List")).toBeVisible()
  })

  test("board view shows kanban columns", async ({ authedPage: page }) => {
    await page.goto("/work-orders?view=board")
    await expect(page.locator("h1")).toContainText("Work Orders")
    // Board column headers
    await expect(page.locator("text=Pending")).toBeVisible()
    await expect(page.locator("text=In Progress")).toBeVisible()
  })

  test("has a New Work Order button", async ({ authedPage: page }) => {
    await page.goto("/work-orders")
    await expect(page.locator("text=New Work Order")).toBeVisible()
  })
})

test.describe("Invoices (authenticated)", () => {
  test("shows the invoices list page", async ({ authedPage: page }) => {
    await page.goto("/invoices")
    await expect(page.locator("h1")).toContainText("Invoices")
  })

  test("has a New Invoice button", async ({ authedPage: page }) => {
    await page.goto("/invoices")
    await expect(page.locator("text=New Invoice")).toBeVisible()
  })
})

test.describe("Inventory (authenticated)", () => {
  test("shows the inventory list page", async ({ authedPage: page }) => {
    await page.goto("/inventory")
    await expect(page.locator("h1")).toContainText("Inventory")
  })

  test("has an Add Part button", async ({ authedPage: page }) => {
    await page.goto("/inventory")
    await expect(page.locator("text=Add Part")).toBeVisible()
  })
})

test.describe("Settings (authenticated)", () => {
  test("shows the settings page", async ({ authedPage: page }) => {
    await page.goto("/settings")
    await expect(page.locator("h1")).toContainText("Settings")
  })
})

test.describe("Estimates (authenticated)", () => {
  test("shows the estimates list page", async ({ authedPage: page }) => {
    await page.goto("/estimates")
    await expect(page.locator("h1")).toContainText("Estimates")
  })

  test("has a New Estimate button", async ({ authedPage: page }) => {
    await page.goto("/estimates")
    await expect(page.locator("text=New Estimate")).toBeVisible()
  })
})

// ── Navigation smoke test ───────────────────────────────────────────────────
test.describe("Sidebar navigation (authenticated)", () => {
  test("sidebar links are present", async ({ authedPage: page }) => {
    await page.goto("/")
    // These text labels are in the sidebar nav
    await expect(page.locator('a[href="/customers"]')).toBeVisible()
    await expect(page.locator('a[href="/work-orders"]')).toBeVisible()
    await expect(page.locator('a[href="/invoices"]')).toBeVisible()
    await expect(page.locator('a[href="/inventory"]')).toBeVisible()
  })
})
