#!/bin/bash
# DBC22-7612: TEMPORARY. Regenerates America/Vancouver (PCT) and America/Edmonton (MDT),
# loaded ahead of system tzdata in config/settings. Remove this dir once IANA ships these abbreviations.
set -euo pipefail

TZ_VERSION=2026e
OUT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
cd "$WORK_DIR"

echo "Downloading IANA tzdata ${TZ_VERSION}..."
curl -fsSLO --proto '=https' "https://data.iana.org/time-zones/releases/tzcode${TZ_VERSION}.tar.gz"
curl -fsSLO --proto '=https' "https://data.iana.org/time-zones/releases/tzdata${TZ_VERSION}.tar.gz"
tar -xzf "tzcode${TZ_VERSION}.tar.gz"
tar -xzf "tzdata${TZ_VERSION}.tar.gz"

echo "Compiling zic..."
make zic >/dev/null 2>&1

echo "Patching tzdata..."
# Vancouver: Change final UTC-7 rule (MST) to PCT (leaves PDT untouched prior to Nov 1)
# Edmonton:  Change final UTC-6 rule (CST) to MDT
sed -e '/^Zone America\/Vancouver/,/^Zone America\/Dawson_Creek/ s/MST/PCT/g' \
    -e '/^Zone America\/Edmonton/,/^Zone America\/Vancouver/ s/CST/MDT/g' \
    northamerica > northamerica.patched

# Sanity assertions
grep -q 'PCT' northamerica.patched
grep -q 'MDT' northamerica.patched

echo "Building binary zone files..."
./zic -b fat -d out -L /dev/null northamerica.patched

mkdir -p "$OUT_DIR/America"
cp out/America/Vancouver out/America/Edmonton "$OUT_DIR/America/"

echo "Build complete. Output verification:"
for zone in Vancouver Edmonton; do
  printf "\n=== America/%s ===\n" "$zone"
  printf "Before Nov 1: %%s\n" "$(TZ="$OUT_DIR/America/$zone" date -d "2026-10-28" +"%Z (%z)")"
  printf "After Nov 1:  %%s\n" "$(TZ="$OUT_DIR/America/$zone" date -d "2026-11-05" +"%Z (%z)")"
done