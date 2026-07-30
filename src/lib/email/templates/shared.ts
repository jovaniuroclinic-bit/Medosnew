export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const layout = (title: string, body: string): string => `<!doctype html>
<html lang="es-MX"><body style="margin:0;background:#f4f8fb;color:#102637;font-family:Arial,sans-serif">
<div style="max-width:640px;margin:auto;padding:32px 20px">
<div style="padding:24px;border-radius:16px;background:#fff;border:1px solid #d9e5ec">
<p style="color:#0879b5;font-weight:bold">UROCLINIC · Dr. Jovani</p>
<h1 style="color:#032f4b;font-size:24px">${escapeHtml(title)}</h1>${body}
</div></div></body></html>`;
