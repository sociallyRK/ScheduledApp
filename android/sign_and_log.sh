#!/bin/bash
set -e
LOG="$HOME/ScheduledApp/builds/signing_usage.log"
date '+%Y-%m-%d %H:%M:%S' >> "$LOG"
echo bundleRelease >> "$LOG"
./gradlew bundleRelease \
-Pandroid.injected.signing.store.file="$HOME/ScheduledApp/keystore.jks" \
-Pandroid.injected.signing.store.password=change_me \
-Pandroid.injected.signing.key.alias=scheduled \
-Pandroid.injected.signing.key.password=change_me
echo OK >> "$LOG"
