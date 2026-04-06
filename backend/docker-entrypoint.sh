#!/bin/sh
set -e
chown -R nodejs:nodejs /app/_storage 2>/dev/null || true
exec su-exec nodejs "$@"
