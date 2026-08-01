# MEDOS Environment Diagnostic

- Generated: 2026-08-01T03:09:37+00:00
- Project: /workspace/Medosnew

```text
$ uname -a
Linux localhost 6.17.0-PRoot-Distro #1 SMP PREEMPT_DYNAMIC Fri, 10 Oct 2025 00:00:00 +0000 aarch64 GNU/Linux

$ uname -m
aarch64

$ cat /etc/os-release
PRETTY_NAME="Debian GNU/Linux 13 (trixie)"
NAME="Debian GNU/Linux"
VERSION_ID="13"
VERSION="13 (trixie)"
VERSION_CODENAME=trixie
DEBIAN_VERSION_FULL=13.6
ID=debian
HOME_URL="https://www.debian.org/"
SUPPORT_URL="https://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/"

$ pwd
/workspace/Medosnew

$ git status --short --branch
## feat/medos-sentinel-v1
 M .gitignore
 M docs/continuity/SESSION_MANIFEST.json
 M sentinel-offline/launcher/src/ui/app.ts
 M src/components/assessment/AssessmentShell.astro
?? docs/generated/
?? sentinel-offline/launcher/src/ui/app.js

$ command -v rustc
/data/data/com.termux/files/usr/bin/rustc
$ command -v cargo
/data/data/com.termux/files/usr/bin/cargo
$ command -v go
$ command -v node
/usr/bin/node
$ command -v npm
/usr/bin/npm
$ command -v pnpm
/usr/bin/pnpm
$ command -v python3
/usr/bin/python3
$ command -v docker
$ command -v podman
$ command -v psql
$ command -v redis-server
$ command -v codex
/usr/bin/codex

$ df -h
Filesystem                   Size  Used Avail Use% Mounted on
/dev/block/dm-87             218G   72G  147G  33% /
/dev                         5.1G  2.9M  5.1G   1% /dev
/linkerconfig/ld.config.txt  5.1G  1.1M  5.1G   1% /linkerconfig/ld.config.txt
/vendor                      3.3G  3.3G     0 100% /vendor
/system_ext                  188M  188M     0 100% /system_ext
/system                      8.5G  8.5G     0 100% /system
/product                     1.5G  1.5G     0 100% /product
/odm                         984K  984K     0 100% /odm
/apex                        5.1G   28K  5.1G   1% /apex
/storage/emulated/0          218G   72G  147G  33% /sdcard

$ free -h
               total        used        free      shared  buff/cache   available
Mem:            10Gi       7.7Gi       667Mi        62Mi       2.7Gi       3.2Gi
Swap:           11Gi       4.6Gi       7.4Gi
```
