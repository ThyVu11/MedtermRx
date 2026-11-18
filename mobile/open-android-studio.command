#!/bin/zsh -l
set -eu

# Finder does not supply the same PATH as Terminal. Expo's Gradle plugins
# invoke `node` themselves, independently of NODE_BINARY in build.gradle.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
node_path="${NODE_BINARY:-$(command -v node || true)}"
if [[ -z "$node_path" || ! -x "$node_path" ]]; then
  print -u2 'Node.js was not found. Set NODE_BINARY to your Node executable and try again.'
  exit 1
fi
export NODE_BINARY="$node_path"
export PATH="${node_path:h}:$PATH"

studio="/Applications/Android Studio.app/Contents/MacOS/studio"
if [[ ! -x "$studio" ]]; then
  print -u2 "Android Studio was not found at $studio"
  exit 1
fi

print 'Quit any already-running Android Studio instance before using this launcher.'
exec "$studio" "${0:A:h}/android"
