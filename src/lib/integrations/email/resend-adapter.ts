import { Resend } from "resend"
import type { EmailProvider, SendEmailOptions, EmailResult } from "./types"

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ?? "RPM Manager <noreply@updates.rpmmanager.app>"

export class ResendAdapter implements EmailProvider {
  private client: Resend

  constructor(apiKey: string) {
    this.client = new Resend(apiKey)
  }

  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: FROM_ADDRESS,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
      })

      if (error) {
        console.error("[email] Resend error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown email error"
      console.error("[email] Unexpected error:", message)
      return { success: false, error: message }
    }
  }
}
