#!/bin/sh
set -e
cd "/app/${SERVICE_DIR}"
if [ -f "prisma/schema.prisma" ]; then
  bunx prisma db push
fi
exec bun src/index.ts
