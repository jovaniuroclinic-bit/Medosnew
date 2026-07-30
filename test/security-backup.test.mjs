import assert from "node:assert/strict";
import { chmod, cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = resolve(".");
const run = (script, env = {}, args = []) =>
  spawnSync(join(root, script), args, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });

test("GitHub backup rejects missing and in-repository destinations", () => {
  assert.notEqual(run("scripts/security/backup-github.sh", { MEDOS_BACKUP_DIR: "" }).status, 0);
  assert.notEqual(run("scripts/security/backup-github.sh", { MEDOS_BACKUP_DIR: join(root, "forbidden-backup") }).status, 0);
});

test("GitHub mirror, checksum, fsck and corruption detection", async () => {
  const work = await mkdtemp(join(tmpdir(), "medos-backup-test-"));
  const source = join(work, "source");
  const backup = join(work, "backup");
  assert.equal(spawnSync("git", ["init", source], { encoding: "utf8" }).status, 0);
  await writeFile(join(source, "README.md"), "synthetic backup fixture\n");
  spawnSync("git", ["-C", source, "add", "README.md"]);
  assert.equal(
    spawnSync("git", ["-C", source, "-c", "user.name=Test", "-c", "user.email=test@example.test", "commit", "-m", "fixture"], { encoding: "utf8" }).status,
    0,
  );
  spawnSync("git", ["-C", source, "tag", "backup-test"]);
  const created = run("scripts/security/backup-github.sh", {
    MEDOS_BACKUP_DIR: backup,
    MEDOS_GITHUB_REMOTE: source,
    MEDOS_BACKUP_RETENTION: "2",
  });
  assert.equal(created.status, 0, created.stderr);
  const archive = created.stdout.match(/Backup created: (.+)/)?.[1];
  assert.ok(archive);
  assert.equal(run("scripts/security/verify-github-backup.sh", {}, [archive]).status, 0);
  const corrupt = `${archive}.corrupt`;
  await cp(archive, corrupt);
  await cp(`${archive}.sha256`, `${corrupt}.sha256`);
  await writeFile(corrupt, "corrupt");
  assert.notEqual(run("scripts/security/verify-github-backup.sh", {}, [corrupt]).status, 0);
});

test("Cloudflare export requires a token and tolerates section-level 403", async () => {
  assert.notEqual(run("scripts/security/export-cloudflare-dns.sh", { MEDOS_BACKUP_DIR: tmpdir(), CLOUDFLARE_API_TOKEN: "" }).status, 0);
  const work = await mkdtemp(join(tmpdir(), "medos-cf-test-"));
  const bin = join(work, "bin");
  await mkdir(bin);
  const fakeCurl = join(bin, "curl");
  await writeFile(
    fakeCurl,
    `#!/usr/bin/env bash
out=""
url=""
while (($#)); do
  case "$1" in
    --output) out="$2"; shift 2;;
    http*) url="$1"; shift;;
    *) shift;;
  esac
done
if [[ "$url" == *rulesets* ]]; then printf '{"success":false}' >"$out"; printf 403; exit; fi
if [[ "$url" == */zones/test-zone ]]; then printf '{"result":{"id":"test-zone","account":{"id":"test-account"}}}' >"$out"; else printf '{"result":[]}' >"$out"; fi
printf 200
`,
  );
  await chmod(fakeCurl, 0o755);
  const exported = run("scripts/security/export-cloudflare-dns.sh", {
    PATH: `${bin}:${process.env.PATH}`,
    MEDOS_BACKUP_DIR: join(work, "backup"),
    CLOUDFLARE_API_TOKEN: "synthetic-test-token",
    CLOUDFLARE_ZONE_ID: "test-zone",
    CLOUDFLARE_ZONE_NAME: "example.test",
  });
  assert.equal(exported.status, 0, exported.stderr);
  assert.doesNotMatch(`${exported.stdout}${exported.stderr}`, /synthetic-test-token/);
  const archive = exported.stdout.match(/created: (.+)/)?.[1];
  assert.ok(archive);
  assert.equal(run("scripts/security/verify-cloudflare-backup.sh", {}, [archive]).status, 0);
});

test("generated backups are outside Git and ignored by policy", async () => {
  const ignore = await readFile(join(root, ".gitignore"), "utf8");
  assert.match(ignore, /dist|node_modules/);
  const tracked = spawnSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).stdout;
  assert.doesNotMatch(tracked, /\.(?:tar\.gz|gpg|sha256)$/m);
});
