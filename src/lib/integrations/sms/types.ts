export interface SendSmsOptions {
  to: string
  body: string
}

export interface SmsResult {
  success: boolean
  sid?: string
  error?: string
}

export interface SmsProvider {
  send(options: SendSmsOptions): Promise<SmsResult>
}
