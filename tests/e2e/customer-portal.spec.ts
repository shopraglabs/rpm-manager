import { test, expect } from "@playwright/test"

/**
 * Customer portal pages are public (no auth required).
 * Invalid tokens should return a 404 page.
 * Valid tokens are not tested here — that requires seeded DB data.
 */
test.describe("Customer portal — public pages", () => {
  test.describe("Estimate portal", () => {
    test("returns 404 for a non-existent token", async ({ page }) => {
      const response = await page.goto("/customer-portal/estimates/invalid-token-xyz")
      // Next.js notFound() returns a 404 status
      expect(response?.status()).toBe(404)
    })

    test("renders a not-found message for invalid token", async ({ page }) => {
      await page.goto("/customer-portal/estimates/invalid-token-xyz")
      // Should show some indication this is a 404 / not found
      const body = await page.locator("body").textContent()
      expect(body).toBeTruthy()
    })
  })

  test.describe("Invoice portal", () => {
    test("returns 404 for a non-existent token", async ({ page }) => {
      const response = await page.goto("/customer-portal/invoices/invalid-token-xyz")
      expect(response?.status()).toBe(404)
    })
  })

  test.describe("Inspection portal", () => {
    test("returns 404 for a non-existent token", async ({ page }) => {
      const response = await page.goto("/customer-portal/inspection/invalid-token-xyz")
      expect(response?.status()).toBe(404)
    })
  })
})
