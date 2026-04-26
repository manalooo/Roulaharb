#!/usr/bin/env bash
# Upload everything in /images/ to the R2 bucket "roulaharb-bucket",
# preserving folder structure. Run AFTER `wrangler r2 bucket create roulaharb-bucket`.
set -euo pipefail
BUCKET="roulaharb-bucket"
cd "$(dirname "$0")/.."

count=0
total=$(find images -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.gif' \) | wc -l)
echo "Uploading $total files to R2 bucket: $BUCKET"

find images -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.gif' \) | while read -r file; do
  # Strip leading "images/" so the key matches the path stored in D1
  key="${file#images/}"
  count=$((count + 1))
  echo "[$count/$total] $key"
  npx wrangler r2 object put "$BUCKET/$key" --file="$file" --remote
done

echo "✓ Done. Make the bucket public (or attach a custom domain) to serve the images."
