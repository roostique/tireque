#!/bin/sh
# Builds the client and packs everything Plesk needs into jazylu-plesk.zip.
# In Plesk: Application root = folder with this zip's contents,
#           Document root    = public,
#           Startup file     = server/app.cjs
set -e
cd "$(dirname "$0")/.."
npm run build
OUT=build/plesk
rm -rf "$OUT" jazylu-plesk.zip
mkdir -p "$OUT/server"
cp server/*.js server/*.cjs server/package.json "$OUT/server/"
cp -R client/dist "$OUT/public"
EXPRESS=$(node -p "require('./server/package.json').dependencies.express")
cat > "$OUT/package.json" <<JSON
{
  "name": "jazylu",
  "private": true,
  "engines": { "node": ">=22.13" },
  "dependencies": { "express": "$EXPRESS" }
}
JSON
(cd "$OUT" && zip -qr ../../jazylu-plesk.zip .)
echo "Ready: $(pwd)/jazylu-plesk.zip"
