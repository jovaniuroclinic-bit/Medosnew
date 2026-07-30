import type { MailMessage, MailProvider } from "./types.ts";
type CloudflareEmailMessage = InstanceType<
  (typeof import("cloudflare:email"))["EmailMessage"]
>;

type EmailMessageConstructor = new (
  from: string,
  to: string,
  raw: string,
) => CloudflareEmailMessage;

interface EmailBinding {
  send(message: CloudflareEmailMessage): Promise<void>;
}

const cleanHeader = (value: string): string => value.replace(/[\r\n]/g, "").trim();

const createEmailMessage = async (
  from: string,
  to: string,
  raw: string,
): Promise<CloudflareEmailMessage> => {
  const testConstructor = (
    globalThis as typeof globalThis & {
      EmailMessage?: EmailMessageConstructor;
    }
  ).EmailMessage;
  if (testConstructor) return new testConstructor(from, to, raw);

  const { EmailMessage } = await import("cloudflare:email");
  return new EmailMessage(from, to, raw);
};

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
    await this.binding.send(
      await createEmailMessage(message.from, message.to, headers.join("\r\n")),
    );
    return { ok: true, code: "sent" };
  }
}
