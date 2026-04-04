import twilio from "twilio"
import type { SmsProvider, SendSmsOptions, SmsResult } from "./types"

export class TwilioAdapter implements SmsProvider {
  private client: ReturnType<typeof twilio>
  private from: string

  constructor(accountSid: string, authToken: string, from: string) {
    this.client = twilio(accountSid, authToken)
    this.from = from
  }

  async send({ to, body }: SendSmsOptions): Promise<SmsResult> {
    try {
      const msg = await this.client.messages.create({ from: this.from, to, body })
      return { success: true, sid: msg.sid }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("[twilio] send failed:", message)
      return { success: false, error: message }
    }
  }
}
