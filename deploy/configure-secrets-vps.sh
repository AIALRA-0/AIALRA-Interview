#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

SECRETS_DIR='/srv/aialra/secrets'
SECRETS_FILE="$SECRETS_DIR/carreerdojo-origin.env"
DEFAULT_SITES_ORIGIN='https://aialra-career-dojo.aialra0.chatgpt.site'
PUBLIC_ORIGIN='https://carreerdojo.aialra.online'
MODE="${1:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  printf 'Run this command as root\n' >&2
  exit 1
fi

validate_secret_file() {
  [[ -f "$SECRETS_FILE" && ! -L "$SECRETS_FILE" ]]
  [[ "$(stat -c '%U:%G' "$SECRETS_FILE")" == 'root:root' ]]
  [[ "$(stat -c '%a' "$SECRETS_FILE")" == '600' ]]

  local sites_origin bypass_bearer proxy_secret public_origin
  sites_origin="$(awk -F= '$1 == "SITES_ORIGIN_URL" {sub(/^[^=]*=/, ""); print; exit}' "$SECRETS_FILE")"
  bypass_bearer="$(awk -F= '$1 == "SITES_BYPASS_BEARER" {sub(/^[^=]*=/, ""); print; exit}' "$SECRETS_FILE")"
  proxy_secret="$(awk -F= '$1 == "AIALRA_PROXY_SHARED_SECRET" {sub(/^[^=]*=/, ""); print; exit}' "$SECRETS_FILE")"
  public_origin="$(awk -F= '$1 == "PUBLIC_ORIGIN" {sub(/^[^=]*=/, ""); print; exit}' "$SECRETS_FILE")"

  [[ "$sites_origin" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?(/[^[:space:]]*)?$ ]]
  [[ "$bypass_bearer" =~ ^[A-Za-z0-9._~+/=-]{20,}$ ]]
  [[ "$proxy_secret" =~ ^[A-Za-z0-9_-]{32,}$ ]]
  [[ "$public_origin" == "$PUBLIC_ORIGIN" ]]

  sites_origin=''
  bypass_bearer=''
  proxy_secret=''
  public_origin=''
}

if [[ "$MODE" == '--check' ]]; then
  validate_secret_file
  printf 'CARREERDOJO_SECRETS_OK\n'
  exit 0
fi

if [[ -e "$SECRETS_FILE" && "$MODE" != '--replace' ]]; then
  validate_secret_file
  printf 'The existing root-only secret file is valid; use --replace to rotate it\n'
  exit 0
fi

sites_origin="${SITES_ORIGIN_URL:-$DEFAULT_SITES_ORIGIN}"
if [[ ! "$sites_origin" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?(/[^[:space:]]*)?$ ]]; then
  printf 'SITES_ORIGIN_URL must be an HTTPS URL without whitespace\n' >&2
  exit 1
fi

if [[ ! -t 0 ]]; then
  printf 'Secret provisioning requires an interactive terminal\n' >&2
  exit 1
fi

read -r -s -p 'Paste the private Sites bypass bearer: ' bypass_bearer
printf '\n' >&2
read -r -s -p 'Paste the shared proxy secret already stored in Sites: ' proxy_secret
printf '\n' >&2

if [[ ! "$bypass_bearer" =~ ^[A-Za-z0-9._~+/=-]{20,}$ ]]; then
  printf 'The Sites bypass bearer has an unexpected format or is too short\n' >&2
  exit 1
fi
if [[ ! "$proxy_secret" =~ ^[A-Za-z0-9_-]{32,}$ ]]; then
  printf 'The shared proxy secret must contain at least 32 URL-safe characters\n' >&2
  exit 1
fi

install -d -o root -g root -m 0700 "$SECRETS_DIR"
secret_temp="$(mktemp "$SECRETS_DIR/.carreerdojo-origin.env.XXXXXX")"
trap 'rm -f "$secret_temp"' EXIT

{
  printf 'SITES_ORIGIN_URL=%s\n' "$sites_origin"
  printf 'SITES_BYPASS_BEARER=%s\n' "$bypass_bearer"
  printf 'AIALRA_PROXY_SHARED_SECRET=%s\n' "$proxy_secret"
  printf 'PUBLIC_ORIGIN=%s\n' "$PUBLIC_ORIGIN"
} > "$secret_temp"

chown root:root "$secret_temp"
chmod 0600 "$secret_temp"
mv -f "$secret_temp" "$SECRETS_FILE"
trap - EXIT

bypass_bearer=''
proxy_secret=''
validate_secret_file
printf 'Secrets were installed at %s with root:root 0600 permissions\n' "$SECRETS_FILE"
