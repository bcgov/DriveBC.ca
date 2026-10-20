#!/bin/bash
# DBC22-7612: TEMPORARY. Regenerates America/Vancouver (PCT) and America/Edmonton (MDT),
# loaded ahead of system tzdata in config/settings. Remove this dir once IANA ships these abbreviations.
set -euo pipefail

TZ_VERSION=2026e
OUT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
cd "$WORK_DIR"

curl -fsSLO --proto '=https' "https://data.iana.org/time-zones/releases/tzcode${TZ_VERSION}.tar.gz"
curl -fsSLO --proto '=https' "https://data.iana.org/time-zones/releases/tzdata${TZ_VERSION}.tar.gz"
tar -xzf "tzcode${TZ_VERSION}.tar.gz"
tar -xzf "tzdata${TZ_VERSION}.tar.gz"
make zic

sed -e '/^Zone America\/Vancouver/,/^Zone America\/Dawson_Creek/ s/^\([[:space:]]*-7:00[[:space:]]*-[[:space:]]*\)MST/\1PCT/' \
    -e '/^Zone America\/Edmonton/,/^Zone America\/Vancouver/ s/^\([[:space:]]*-6:00[[:space:]]*-[[:space:]]*\)CST/\1MDT/' \
    northamerica > northamerica.patched
sed -n '/^Zone America\/Vancouver/,/^Zone America\/Dawson_Creek/p' northamerica.patched | grep -q 'PCT'
sed -n '/^Zone America\/Edmonton/,/^Zone America\/Vancouver/p' northamerica.patched | grep -qE '^[[:space:]]*-6:00[[:space:]]+-[[:space:]]+MDT'

./zic -b fat -d out -L /dev/null northamerica.patched

mkdir -p "$OUT_DIR/America"
cp out/America/Vancouver out/America/Edmonton "$OUT_DIR/America/"
