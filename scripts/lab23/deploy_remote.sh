#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-$HOME/apps/itmo-acs-backend}"
REPO_URL="${REPO_URL:-https://github.com/pxdkxvan/ITMO-ACS-Backend-2026-A.git}"
BRANCH="${BRANCH:-main}"
LAB23_DIR="$APP_ROOT/БР1.2/Алексеев Андрей/labs/lab23"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required" >&2
  exit 1
fi

mkdir -p "$(dirname "$APP_ROOT")"

if [ ! -d "$APP_ROOT/.git" ]; then
  if [ -d "$APP_ROOT" ]; then
    rm -rf "$APP_ROOT"
  fi
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_ROOT"
fi

git -C "$APP_ROOT" fetch origin "$BRANCH"
git -C "$APP_ROOT" checkout "$BRANCH"
git -C "$APP_ROOT" pull --ff-only origin "$BRANCH"

cd "$LAB23_DIR"
docker compose down --remove-orphans || true
docker compose pull --ignore-buildable || true
docker compose up -d --build --remove-orphans

docker compose ps
curl -fsS http://127.0.0.1:8080/actuator/health
