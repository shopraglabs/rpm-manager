import type { EmailProvider } from "./types"
import { ResendAdapter } from "./resend-adapter"

/** No-op provider used in development when RESEND_API_KEY is not set. */
class NoOpEmailProvider implements EmailProvider {
  async send(options: { to: string; subject: string }) {
    console.log(
      `[email] (no-op) Would have sent "${options.subject}" to ${options.to}. Set RESEND_API_KEY to enable.`
    )
    return { success: true }
  }
}

function createEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === "re_...") {
    return new NoOpEmailProvider()
  }
  return new ResendAdapter(apiKey)
}

export const emailProvider = createEmailProvider()
export type { SendEmailOptions, EmailResult, EmailProvider } from "./types"
export { estimateEmail, invoiceEmail, inspectionEmail } from "./templates"
