#!/usr/bin/env bash
set -Eeuo pipefail

umask 027

RELEASE_DIR="${1:?release directory is required}"
HOSTNAME='carreerdojo.aialra.online'
AVAILABLE='/srv/aialra/config/nginx/sites-available'
ENABLED='/srv/aialra/config/nginx/sites-enabled'
HTTP_SOURCE="$RELEASE_DIR/deploy/carreerdojo.aialra.online.http.conf"
TARGET="$AVAILABLE/$HOSTNAME.conf"
LINK="$ENABLED/$HOSTNAME.conf"
SYSTEM_LINK="/etc/nginx/sites-enabled/$HOSTNAME.conf"
BACKUP_ROOT='/srv/aialra/backups/carreerdojo'
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$BACKUP_ROOT/$STAMP-hostname"
DNS_SCRIPT="$RELEASE_DIR/deploy/ensure-cloudflare-dns.sh"

if [[ "$(id -u)" -ne 0 ]]; then
  printf 'Run this command as root\n' >&2
  exit 1
fi
for required in "$HTTP_SOURCE" "$DNS_SCRIPT"; do
  [[ -f "$required" ]]
done

"$DNS_SCRIPT"

install -d -o root -g root -m 0755 "$AVAILABLE" "$ENABLED"
install -d -o root -g root -m 0700 "$BACKUP_DIR"
target_existed=0
if [[ -e "$TARGET" ]]; then
  target_existed=1
  cp -a "$TARGET" "$BACKUP_DIR/nginx.conf.before"
fi

rollback() {
  local failure_status="$?"
  trap - ERR
  set +e
  if [[ "$target_existed" == '1' ]]; then
    cp -a "$BACKUP_DIR/nginx.conf.before" "$TARGET"
  else
    rm -f "$TARGET" "$LINK" "$SYSTEM_LINK"
  fi
  nginx -t >/dev/null 2>&1 && systemctl reload nginx
  printf 'Hostname preparation failed; the prior Nginx state was restored\n' >&2
  exit "$failure_status"
}
trap rollback ERR

target_temp="$(mktemp "$AVAILABLE/.carreerdojo-http.XXXXXX")"
install -o root -g root -m 0644 "$HTTP_SOURCE" "$target_temp"
mv -f "$target_temp" "$TARGET"

link_temp="$ENABLED/.carreerdojo-link.$STAMP"
ln -s "$TARGET" "$link_temp"
mv -Tf "$link_temp" "$LINK"
if [[ ! -e "$SYSTEM_LINK" && ! -L "$SYSTEM_LINK" ]]; then
  ln -s "$LINK" "$SYSTEM_LINK"
fi
[[ "$(readlink -f "$SYSTEM_LINK")" == "$(readlink -f "$TARGET")" ]]
nginx -t
systemctl reload nginx

if [[ ! -s "/etc/letsencrypt/live/$HOSTNAME/fullchain.pem" ]]; then
  certbot certonly \
    --dns-cloudflare \
    --dns-cloudflare-credentials /etc/letsencrypt/cloudflare-aialra.ini \
    --dns-cloudflare-propagation-seconds 30 \
    --domain "$HOSTNAME" \
    --cert-name "$HOSTNAME" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email
fi

openssl x509 \
  -in "/etc/letsencrypt/live/$HOSTNAME/fullchain.pem" \
  -noout \
  -checkend 604800 >/dev/null

trap - ERR
printf 'backup=%s\n' "$BACKUP_DIR"
printf 'CARREERDOJO_HOSTNAME_READY\n'
