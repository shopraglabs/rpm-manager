import type { SmsProvider, SendSmsOptions, SmsResult } from "./types"
import { TwilioAdapter } from "./twilio-adapter"

class NoOpSmsProvider implements SmsProvider {
  async send({ to, body }: SendSmsOptions): Promise<SmsResult> {
    console.log(`[sms:noop] To: ${to}\n${body}`)
    return { success: true }
  }
}

function createSmsProvider(): SmsProvider {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  if (sid && !sid.startsWith("AC_placeholder") && token && token !== "your-auth-token" && from) {
    return new TwilioAdapter(sid, token, from)
  }

  return new NoOpSmsProvider()
}

export const smsProvider = createSmsProvider()
export type { SmsProvider, SendSmsOptions, SmsResult }
