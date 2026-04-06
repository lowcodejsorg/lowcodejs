#!/bin/sh
set -e
chown -R 1001:1001 /app/_storage 2>/dev/null || true
exec su-exec 1001 "$@"
