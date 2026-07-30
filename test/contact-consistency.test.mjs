import assert from "node:assert/strict";
import { glob, readFile } from "node:fs/promises";
import test from "node:test";

test("todo el código público usa un único teléfono", async () => {
  const files = [];
  for await (const file of glob("src/**/*.{astro,ts}")) files.push(file);
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  const numbers = [...source.matchAll(/(?:\+?52)?\s*871[\s().-]*\d{3}[\s.-]*\d{4}/g)]
    .map((match) => match[0].replace(/\D/g, "").replace(/^52/, ""));
  assert.ok(numbers.length > 0);
  assert.ok(numbers.every((number) => number === "8712657523"));
  const whatsappNumbers = [...source.matchAll(/wa\.me\/(\d+)/g)].map((match) => match[1]);
  assert.ok(whatsappNumbers.every((number) => number === "528712657523"));
});
