import { test as base, type Page } from "@playwright/test"

/**
 * Logs in using PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars.
 * Skips the test automatically if credentials are not provided.
 */
export async function loginIfCredentials(page: Page): Promise<boolean> {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD

  if (!email || !password) {
    return false
  }

  await page.goto("/login")
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 })
  return true
}

/** Fixture that provides a logged-in page, skipping if no credentials. */
export const authenticatedTest = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use, testInfo) => {
    const loggedIn = await loginIfCredentials(page)
    if (!loggedIn) {
      testInfo.skip(true, "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run authenticated tests")
    }
    await use(page)
  },
})
