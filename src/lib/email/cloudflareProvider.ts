import type { MailMessage, MailProvider } from "./types.ts";

declare const EmailMessage: { new (from: string, to: string, raw: string): EmailMessage };

interface EmailBinding {
  send(message: EmailMessage): Promise<void>;
}

const cleanHeader = (value: string): string => value.replace(/[\r\n]/g, "").trim();

export class CloudflareMailProvider implements MailProvider {
  private readonly binding?: EmailBinding;

  constructor(binding?: EmailBinding) {
    this.binding = binding;
  }

  async send(message: MailMessage): Promise<{ ok: boolean; code: string }> {
    if (!this.binding) return { ok: false, code: "provider_unavailable" };
    const boundary = `medos-${crypto.randomUUID()}`;
    const headers = [
      `From: ${cleanHeader(message.from)}`,
      `To: ${cleanHeader(message.to)}`,
      `Subject: ${cleanHeader(message.subject)}`,
      ...(message.replyTo ? [`Reply-To: ${cleanHeader(message.replyTo)}`] : []),
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      message.text,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      message.html,
      `--${boundary}--`,
    ];
    await this.binding.send(new EmailMessage(message.from, message.to, headers.join("\r\n")));
    return { ok: true, code: "sent" };
  }
}
