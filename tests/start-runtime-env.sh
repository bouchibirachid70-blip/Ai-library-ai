#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT

make_runtime() {
  local runtime="$1"
  mkdir -p "$runtime/next-service-dist"
  cp "$ROOT/.zscripts/start.sh" "$runtime/start.sh"
  printf '#!/bin/sh\nexit 0\n' > "$runtime/next-service-dist/server.js"
  chmod +x "$runtime/start.sh"
}

RUNTIME="$TEST_ROOT/missing-url"
make_runtime "$RUNTIME"
if (cd "$RUNTIME" && env -u DATABASE_URL sh ./start.sh) >"$TEST_ROOT/missing.log" 2>&1; then
  echo "expected startup to reject missing DATABASE_URL" >&2
  exit 1
fi
grep -F "DATABASE_URL is required" "$TEST_ROOT/missing.log" >/dev/null

RUNTIME="$TEST_ROOT/sqlite-url"
make_runtime "$RUNTIME"
if (cd "$RUNTIME" && DATABASE_URL='file:/app/db/custom.db' sh ./start.sh) >"$TEST_ROOT/sqlite.log" 2>&1; then
  echo "expected startup to reject SQLite DATABASE_URL" >&2
  exit 1
fi
grep -F "must be a PostgreSQL URL" "$TEST_ROOT/sqlite.log" >/dev/null

echo "start runtime environment tests passed"
