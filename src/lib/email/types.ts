export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

export interface MailMessage extends EmailContent {
  from: string;
  to: string;
  replyTo?: string;
}

export interface MailProvider {
  send(message: MailMessage): Promise<{ ok: boolean; code: string }>;
}
