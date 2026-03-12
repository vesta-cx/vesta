#!/usr/bin/env bash
# Migrate from vesta-quality-survey-* to vesta-sona-* (D1 + R2)
# Run from apps/sona with: ./scripts/migrate-to-sona.sh

set -e

SOURCE_DB="vesta-quality-survey-db"
SOURCE_BUCKET="vesta-quality-survey-audio"
TARGET_DB="vesta-sona-db"
TARGET_BUCKET="vesta-sona-audio"
BACKUP_FILE=".migrate-d1-backup.sql"

echo "=== 1. Create new D1 database: $TARGET_DB ==="
if pnpm wrangler d1 create "$TARGET_DB" 2>/dev/null; then
  echo ""
  echo ">>> Copy the database_id above and update wrangler.jsonc d1_databases[0].database_id"
  echo ">>> Then press Enter to continue..."
  read -r
else
  echo "D1 create failed or DB already exists. Continue with export/import? (y/N)"
  read -r resp
  [[ "$resp" == "y" || "$resp" == "Y" ]] || exit 1
fi

echo ""
echo "=== 2. Create new R2 bucket: $TARGET_BUCKET ==="
pnpm wrangler r2 bucket create "$TARGET_BUCKET" || echo "(Bucket may already exist)"

echo ""
echo "=== 3. Export D1 from $SOURCE_DB ==="
pnpm wrangler d1 export "$SOURCE_DB" --remote --output "$BACKUP_FILE"

echo ""
echo "=== 4. Import D1 into $TARGET_DB ==="
pnpm wrangler d1 execute "$TARGET_DB" --remote --file "$BACKUP_FILE"

echo ""
echo "=== 5. R2 bucket copy (manual) ==="
echo "Wrangler cannot copy R2 bucket-to-bucket. Use one of:"
echo ""
echo "  Option A - rclone (needs R2 API token from dashboard):"
echo "    1. Dashboard → R2 → Manage R2 API Tokens → Create API token"
echo "    2. Add to ~/.config/rclone/rclone.conf (replace ACCOUNT_ID from wrangler):"
echo "       [r2]"
echo "       type = s3"
echo "       provider = Cloudflare"
echo "       access_key_id = <ACCESS_KEY_ID>"
echo "       secret_access_key = <SECRET_ACCESS_KEY>"
echo "       endpoint = https://ACCOUNT_ID.r2.cloudflarestorage.com"
echo "       acl = private"
echo "    3. Copy: rclone copy r2:$SOURCE_BUCKET r2:$TARGET_BUCKET -P"
echo ""
echo "  Option B - Super Slurper (Dashboard):"
echo "    Dashboard → R2 → Data migration → Migrate files"
echo "    Source: Cloudflare R2; Destination: $TARGET_BUCKET"
echo ""

rm -f "$BACKUP_FILE"
echo "=== Done ==="
echo "Update wrangler.jsonc: set d1_databases[0].database_id from the create output above."
