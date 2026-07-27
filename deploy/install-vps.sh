#!/usr/bin/env bash
set -Eeuo pipefail

umask 027

RELEASE_DIR="${1:?release directory is required}"
APP_ROOT='/srv/aialra/apps/carreerdojo-proxy'
CURRENT_LINK="$APP_ROOT/current"
UNIT_SOURCE="$RELEASE_DIR/deploy/aialra-carreerdojo-proxy.service"
UNIT_TARGET='/etc/systemd/system/aialra-carreerdojo-proxy.service'
SECRET_CHECK="$RELEASE_DIR/deploy/configure-secrets-vps.sh"
BACKUP_ROOT='/srv/aialra/backups/carreerdojo'
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$BACKUP_ROOT/$STAMP-origin"

if [[ "$(id -u)" -ne 0 ]]; then
  printf 'Run this command as root\n' >&2
  exit 1
fi
for required in \
  "$RELEASE_DIR/deploy/origin-proxy/server.mjs" \
  "$RELEASE_DIR/deploy/origin-proxy/package.json" \
  "$RELEASE_DIR/deploy/origin-proxy/package-lock.json" \
  "$UNIT_SOURCE" \
  "$SECRET_CHECK"; do
  [[ -f "$required" ]]
done

"$SECRET_CHECK" --check
node --check "$RELEASE_DIR/deploy/origin-proxy/server.mjs"

if ss -lntH 'sport = :13110' | grep -q . &&
  ! systemctl is-active --quiet aialra-carreerdojo-proxy.service; then
  printf 'Port 13110 is already occupied by another service\n' >&2
  exit 1
fi

install -d -o root -g root -m 0755 "$APP_ROOT" "$APP_ROOT/releases"
install -d -o root -g root -m 0700 "$BACKUP_DIR"

previous_release=''
if [[ -L "$CURRENT_LINK" ]]; then
  previous_release="$(readlink -f "$CURRENT_LINK")"
  printf '%s\n' "$previous_release" > "$BACKUP_DIR/previous-release.txt"
fi
if [[ -f "$UNIT_TARGET" ]]; then
  cp -a "$UNIT_TARGET" "$BACKUP_DIR/aialra-carreerdojo-proxy.service.before"
fi

rollback() {
  local failure_status="$?"
  trap - ERR
  set +e
  if [[ -n "$previous_release" && -d "$previous_release" ]]; then
    ln -sfn "$previous_release" "$CURRENT_LINK"
    systemctl restart aialra-carreerdojo-proxy.service
  else
    systemctl disable --now aialra-carreerdojo-proxy.service
    unlink "$CURRENT_LINK" 2>/dev/null || true
  fi
  if [[ -f "$BACKUP_DIR/aialra-carreerdojo-proxy.service.before" ]]; then
    cp -a "$BACKUP_DIR/aialra-carreerdojo-proxy.service.before" "$UNIT_TARGET"
    systemctl daemon-reload
  fi
  printf 'Origin proxy deployment failed; the prior service state was restored\n' >&2
  exit "$failure_status"
}
trap rollback ERR

chown -R root:root "$RELEASE_DIR"
find "$RELEASE_DIR" -type d -exec chmod go-w {} +
find "$RELEASE_DIR" -type f -exec chmod go-w {} +
install -o root -g root -m 0644 "$UNIT_SOURCE" "$UNIT_TARGET"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

systemctl daemon-reload
systemctl enable --now aialra-carreerdojo-proxy.service

for attempt in {1..30}; do
  if curl -fsS --max-time 3 \
    http://127.0.0.1:13110/__origin_health >/dev/null; then
    break
  fi
  if [[ "$attempt" -eq 30 ]]; then
    systemctl status --no-pager aialra-carreerdojo-proxy.service >&2 || true
    journalctl -u aialra-carreerdojo-proxy.service -n 50 --no-pager >&2 || true
    false
  fi
  sleep 1
done

curl -fsS --max-time 45 \
  --output /dev/null \
  -H 'X-Aialra-Authenticated: 1' \
  -H 'X-Aialra-Sub: deployment-readiness-check' \
  -H 'X-Aialra-User: Deployment Readiness Check' \
  -H 'X-Aialra-Email: deployment-readiness@local.invalid' \
  http://127.0.0.1:13110/

trap - ERR
printf 'release=%s\n' "$RELEASE_DIR"
printf 'backup=%s\n' "$BACKUP_DIR"
printf 'CARREERDOJO_ORIGIN_PROXY_OK\n'
