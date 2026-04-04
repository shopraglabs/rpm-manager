export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<EmailResult>
}
