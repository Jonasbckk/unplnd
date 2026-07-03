#!/usr/bin/env bash
# Wandelt alle PDFs in diesem Ordner in .md-Dateien um.
# Wird von Claude ausgeführt, sobald die PDFs abgelegt sind.
set -e
cd "$(dirname "$0")"
count=0
for f in *.pdf; do
  [ -e "$f" ] || continue
  out="${f%.pdf}.md"
  pdftotext -layout -enc UTF-8 "$f" "$out"
  echo "  $f  ->  $out"
  count=$((count+1))
done
echo "Fertig: $count PDF(s) umgewandelt."
