#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

HOSTNAME='carreerdojo.aialra.online'
ZONE_NAME='aialra.online'
CREDENTIALS_FILE='/etc/letsencrypt/cloudflare-aialra.ini'
PROXIED="${CLOUDFLARE_PROXIED:-false}"

if [[ "$(id -u)" -ne 0 ]]; then
  printf 'Run this command as root\n' >&2
  exit 1
fi
for command_name in curl jq; do
  command -v "$command_name" >/dev/null
done
[[ -f "$CREDENTIALS_FILE" && ! -L "$CREDENTIALS_FILE" ]]

api_token="$(
  awk -F= '
    /^[[:space:]]*dns_cloudflare_api_token[[:space:]]*=/ {
      sub(/^[^=]*=[[:space:]]*/, "")
      sub(/[[:space:]]*$/, "")
      print
      exit
    }
  ' "$CREDENTIALS_FILE"
)"
if [[ -z "$api_token" ]]; then
  printf 'No dns_cloudflare_api_token was found in %s\n' "$CREDENTIALS_FILE" >&2
  exit 1
fi
if [[ "$PROXIED" != 'true' && "$PROXIED" != 'false' ]]; then
  printf 'CLOUDFLARE_PROXIED must be true or false\n' >&2
  exit 1
fi

vps_ipv4="${VPS_IPV4:-}"
if [[ -z "$vps_ipv4" ]]; then
  vps_ipv4="$(curl -fsS --max-time 15 https://api.ipify.org)"
fi
if [[ ! "$vps_ipv4" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
  printf 'Unable to determine a valid public VPS IPv4 address\n' >&2
  exit 1
fi
IFS=. read -r -a octets <<<"$vps_ipv4"
for octet in "${octets[@]}"; do
  if (( octet < 0 || octet > 255 )); then
    printf 'The public VPS IPv4 address is invalid\n' >&2
    exit 1
  fi
done

auth_config="$(mktemp)"
zone_response="$(mktemp)"
record_response="$(mktemp)"
write_response="$(mktemp)"
payload_file="$(mktemp)"
trap 'rm -f "$auth_config" "$zone_response" "$record_response" "$write_response" "$payload_file"' EXIT
printf 'header = "Authorization: Bearer %s"\n' "$api_token" > "$auth_config"
chmod 0600 "$auth_config"
api_token=''

cloudflare_request() {
  local method="$1"
  local url="$2"
  local output="$3"
  local data_file="${4:-}"
  local arguments=(
    --config "$auth_config"
    --fail
    --silent
    --show-error
    --request "$method"
    --header 'Content-Type: application/json'
    --output "$output"
    "$url"
  )
  if [[ -n "$data_file" ]]; then
    arguments+=(--data-binary "@$data_file")
  fi
  curl "${arguments[@]}"
}

cloudflare_request \
  GET \
  "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME&status=active" \
  "$zone_response"
zone_id="$(jq -r '.result | if length == 1 then .[0].id else empty end' "$zone_response")"
if [[ -z "$zone_id" ]]; then
  printf 'Cloudflare did not return exactly one active zone for %s\n' "$ZONE_NAME" >&2
  exit 1
fi

cloudflare_request \
  GET \
  "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records?type=A&name=$HOSTNAME" \
  "$record_response"
record_count="$(jq -r '.result | length' "$record_response")"
if (( record_count > 1 )); then
  printf 'Multiple A records already exist for %s; refusing an ambiguous update\n' "$HOSTNAME" >&2
  exit 1
fi
record_id="$(jq -r '.result[0].id // empty' "$record_response")"
current_ipv4="$(jq -r '.result[0].content // empty' "$record_response")"
current_proxied="$(jq -r '.result[0].proxied // empty' "$record_response")"

jq -n \
  --arg name "$HOSTNAME" \
  --arg content "$vps_ipv4" \
  --argjson proxied "$PROXIED" \
  '{type:"A",name:$name,content:$content,ttl:300,proxied:$proxied}' \
  > "$payload_file"

if [[ "$current_ipv4" == "$vps_ipv4" && "$current_proxied" == "$PROXIED" ]]; then
  printf 'Cloudflare A record is already current for %s\n' "$HOSTNAME"
elif [[ -n "$record_id" ]]; then
  cloudflare_request \
    PUT \
    "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records/$record_id" \
    "$write_response" \
    "$payload_file"
  jq -e '.success == true' "$write_response" >/dev/null
  printf 'Cloudflare A record was updated for %s\n' "$HOSTNAME"
else
  cloudflare_request \
    POST \
    "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
    "$write_response" \
    "$payload_file"
  jq -e '.success == true' "$write_response" >/dev/null
  printf 'Cloudflare A record was created for %s\n' "$HOSTNAME"
fi

printf 'CARREERDOJO_DNS_OK\n'
