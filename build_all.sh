#!/bin/bash
set -euo pipefail

echo "🚀 Starting Scheduled full build"
ROOT="$(pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$ROOT/builds/$STAMP"
LOG="$OUT/build.log"
mkdir -p "$OUT"
exec > >(tee -a "$LOG") 2>&1

# 1) Environment
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
export NODE_OPTIONS=--openssl-legacy-provider
echo "✅ JAVA_HOME=$JAVA_HOME"

# 2) Clean & deps
echo "🧹 Cleaning caches and node_modules"
rm -rf ~/.gradle/caches ~/.gradle/wrapper android/.gradle android/app/build node_modules
npm install

# 3) Gradle config (native access)
mkdir -p ~/.gradle
cat > ~/.gradle/gradle.properties <<'EOGP'
org.gradle.jvmargs=-Xmx4g -Dfile.encoding=UTF-8 --enable-native-access=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED
EOGP

# 4) Android AAB
echo "📦 Building Android .aab"
pushd android >/dev/null
./gradlew --version
./gradlew clean
./gradlew bundleRelease -x lint
AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
test -f "$AAB_PATH" || { echo "❌ AAB not found"; exit 1; }
popd >/dev/null
cp "android/$AAB_PATH" "$OUT/Scheduled-$STAMP.aab"
echo "✅ AAB -> $OUT/Scheduled-$STAMP.aab"

# 5) Web export
echo "🌐 Building web export"
npx expo export --platform web
test -d "dist" || { echo "❌ Web dist/ missing"; exit 1; }
(cd dist && zip -r "../$OUT/ScheduledWeb-$STAMP.zip" .)
echo "✅ Web ZIP -> $OUT/ScheduledWeb-$STAMP.zip"

# 6) (Optional) iOS run — non-fatal if not set up
echo "🍎 iOS build (best-effort)"
npx expo run:ios || echo "⚠️ Skipped/failed iOS build (see above)."

# 7) Summary
echo "🎉 Done. Artifacts:"
echo "  - $OUT/Scheduled-$STAMP.aab"
echo "  - $OUT/ScheduledWeb-$STAMP.zip"
echo "📝 Full log: $LOG"
