export type Chunk = {section: string; content: string};
export function chunkMarkdown(text: string, maxChars = 1800): Chunk[] {
  const result: Chunk[] = []; let section = "Inicio"; let buffer = "";
  const flush = () => { if (buffer.trim()) result.push({section, content: buffer.trim()}); buffer = ""; };
  for (const line of text.normalize("NFC").split(/\r?\n/u)) {
    if (/^#{1,6}\s/u.test(line)) { flush(); section = line.replace(/^#{1,6}\s*/u, "").slice(0, 160); }
    if ((buffer + line).length > maxChars) flush();
    buffer += `${line}\n`;
  }
  flush(); return result;
}
