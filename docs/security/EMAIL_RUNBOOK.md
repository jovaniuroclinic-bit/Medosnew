# Email runbook

Workers secrets: `MAIL_FROM`, `MAIL_REPLY_TO`, `MAIL_TO_CITAS`, `MAIL_TO_CONTACTO`, `MAIL_TO_PRIVACIDAD`, `MAIL_TO_SOPORTE`. Delivery destinations must be Cloudflare-verified and currently route to the approved Proton mailbox. Institutional aliases may be validated Reply-To addresses but must not be assumed to be verified sending destinations.

For failure, inspect binding availability, verified destination, permitted sender, Email Routing, MX/SPF/DKIM/DMARC, and sanitized Worker events. Send only one synthetic appointment and one contact message. Confirm Inbox and Spam manually. Do not publish full headers.

Messages use fixed subjects, escaped text/HTML, no tracking pixels, no user-built links, and no clinical content. Advise recipients not to reply with diagnoses, studies, photographs, or sensitive clinical information.
