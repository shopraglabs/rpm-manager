import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("redirects unauthenticated users from / to /login", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("redirects unauthenticated users from /customers to /login", async ({ page }) => {
    await page.goto("/customers")
    await expect(page).toHaveURL(/\/login/)
  })

  test("redirects unauthenticated users from /work-orders to /login", async ({ page }) => {
    await page.goto("/work-orders")
    await expect(page).toHaveURL(/\/login/)
  })

  test("redirects unauthenticated users from /invoices to /login", async ({ page }) => {
    await page.goto("/invoices")
    await expect(page).toHaveURL(/\/login/)
  })

  test("redirects unauthenticated users from /inventory to /login", async ({ page }) => {
    await page.goto("/inventory")
    await expect(page).toHaveURL(/\/login/)
  })

  test("redirects unauthenticated users from /settings to /login", async ({ page }) => {
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/login/)
  })

  test.describe("Login page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login")
    })

    test("renders email and password fields", async ({ page }) => {
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
    })

    test("renders a submit button", async ({ page }) => {
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test("has a link to the signup page", async ({ page }) => {
      const signupLink = page.locator('a[href="/signup"]')
      await expect(signupLink).toBeVisible()
    })

    test("has a forgot password link", async ({ page }) => {
      const forgotLink = page.locator('a[href="/forgot-password"]')
      await expect(forgotLink).toBeVisible()
    })

    test("email field has correct type", async ({ page }) => {
      const emailInput = page.locator('input[name="email"]')
      await expect(emailInput).toHaveAttribute("type", "email")
    })

    test("password field has correct type", async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]')
      await expect(passwordInput).toHaveAttribute("type", "password")
    })
  })

  test.describe("Signup page", () => {
    test("renders signup form fields", async ({ page }) => {
      await page.goto("/signup")
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
    })

    test("has a link back to login", async ({ page }) => {
      await page.goto("/signup")
      const loginLink = page.locator('a[href="/login"]')
      await expect(loginLink).toBeVisible()
    })
  })
})
