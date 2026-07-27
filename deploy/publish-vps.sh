#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
SSH_TARGET="${AIALRA_VPS_SSH:-contabo-vps-aialra}"
MODE="${1:-}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
COMMIT="$(git -C "$REPO_ROOT" rev-parse --short=12 HEAD)"
RELEASE_NAME="${STAMP}-${COMMIT}"
REMOTE_RELEASE="/srv/aialra/apps/carreerdojo-proxy/releases/$RELEASE_NAME"
REMOTE_ARCHIVE="/srv/aialra/incoming/carreerdojo-proxy-$RELEASE_NAME.tar.gz"

if [[ ! "$RELEASE_NAME" =~ ^[A-Za-z0-9._-]+$ ]]; then
  printf 'Generated release name is unsafe\n' >&2
  exit 1
fi
for required in \
  "$SCRIPT_DIR/origin-proxy/server.mjs" \
  "$SCRIPT_DIR/install-vps.sh" \
  "$SCRIPT_DIR/prepare-hostname.sh" \
  "$SCRIPT_DIR/configure-auth-nginx.sh"; do
  [[ -f "$required" ]]
done

node --check "$SCRIPT_DIR/origin-proxy/server.mjs"
for script in "$SCRIPT_DIR"/*.sh; do
  bash -n "$script"
done

if [[ "$MODE" == '--dry-run' ]]; then
  printf 'target=%s\n' "$SSH_TARGET"
  printf 'release=%s\n' "$REMOTE_RELEASE"
  printf 'public_url=https://carreerdojo.aialra.online\n'
  printf 'No network or remote changes were made\n'
  exit 0
fi
if [[ -n "$MODE" ]]; then
  printf 'Usage: %s [--dry-run]\n' "$0" >&2
  exit 2
fi

archive_dir="$(mktemp -d)"
archive_path="$archive_dir/carreerdojo-proxy.tar.gz"
trap 'rm -rf "$archive_dir"' EXIT

COPYFILE_DISABLE=1 tar \
  --exclude='._*' \
  -C "$REPO_ROOT" \
  -czf "$archive_path" \
  deploy

ssh "$SSH_TARGET" \
  "install -d -o root -g root -m 0755 /srv/aialra/incoming '$REMOTE_RELEASE'"
scp "$archive_path" "$SSH_TARGET:$REMOTE_ARCHIVE"
ssh -t "$SSH_TARGET" "
  set -Eeuo pipefail
  tar -xzf '$REMOTE_ARCHIVE' -C '$REMOTE_RELEASE'
  rm -f '$REMOTE_ARCHIVE'
  '$REMOTE_RELEASE/deploy/configure-secrets-vps.sh' --check
  '$REMOTE_RELEASE/deploy/prepare-hostname.sh' '$REMOTE_RELEASE'
  '$REMOTE_RELEASE/deploy/install-vps.sh' '$REMOTE_RELEASE'
  '$REMOTE_RELEASE/deploy/configure-auth-nginx.sh' '$REMOTE_RELEASE'
"

printf 'Published https://carreerdojo.aialra.online from %s\n' "$REMOTE_RELEASE"
