# Career Dojo production edge

This directory publishes the private Sites deployment at the exact public
hostname `https://carreerdojo.aialra.online` without moving its application
state out of Sites D1.

## Request path

```text
browser
  -> Cloudflare A record
  -> VPS Nginx TLS
  -> AIALRA Auth Gateway / Authentik
  -> 127.0.0.1:13110 origin proxy
  -> private Sites deployment + Sites D1
```

The Auth Gateway is the only component that can establish an AIALRA identity.
Nginx replaces all browser-supplied `X-Aialra-*` headers, consumes the
Authentik Cookie for `auth_request`, and sends no browser Cookie or
Authorization header to the origin proxy. The proxy builds a new allowlisted
request, forwards the trusted identity, adds `X-Aialra-Proxy-Secret`, and uses
the private Sites bypass bearer as its upstream Authorization value.

The application must compare `X-Aialra-Proxy-Secret` with the secret Sites
environment variable using a timing-safe comparison before trusting any
forwarded `X-Aialra-*` identity. Direct Sites requests without that shared
secret must not be allowed to claim an Authentik identity.

## One-time secret provisioning

Create one URL-safe random shared secret of at least 32 characters and store
the same value as a secret Sites runtime variable named
`AIALRA_PROXY_SHARED_SECRET`. Obtain the private deployment's Sites bypass
bearer from Sites access control. Never place either value in Git, a command
argument, shell history, Nginx, or the systemd unit.

Copy only the non-secret prompt script and enter both values through its hidden
terminal prompts:

```bash
scp deploy/configure-secrets-vps.sh contabo-vps-aialra:/tmp/
ssh -t contabo-vps-aialra \
  'sudo bash /tmp/configure-secrets-vps.sh && sudo rm -f /tmp/configure-secrets-vps.sh'
```

The script writes `/srv/aialra/secrets/carreerdojo-origin.env` as
`root:root 0600`. Re-running it validates the existing file; pass `--replace`
only for an intentional credential rotation. Rotate the Sites secret and VPS
copy together.

## Publish

First inspect the release plan without changing local or remote state:

```bash
deploy/publish-vps.sh --dry-run
```

Then publish:

```bash
deploy/publish-vps.sh
```

The publisher contains no secrets. It packages `deploy/`, uploads an immutable
release, and runs these idempotent stages:

1. `ensure-cloudflare-dns.sh` creates or updates the exact Cloudflare A record
   to the VPS public IPv4. Set `VPS_IPV4` only if automatic discovery is wrong;
   set `CLOUDFLARE_PROXIED=true` only when proxying is intentional.
2. `prepare-hostname.sh` atomically enables the HTTP host, validates Nginx, and
   obtains a DNS-01 certificate with the existing root-only Cloudflare
   credentials.
3. `install-vps.sh` installs and verifies the hardened, loopback-only systemd
   origin proxy.
4. `configure-auth-nginx.sh` backs up `apps.json`, idempotently adds
   `carreerdojo`, invokes `reconcile_authentik_callbacks.sh` to create the exact
   callback/access group, atomically enables TLS Nginx, and verifies that an
   anonymous request is redirected to sign-in.

Each mutating stage creates a timestamped backup below
`/srv/aialra/backups/carreerdojo` and restores the previous service/config on
failure. The private `GET /__origin_health` endpoint is available only on
`127.0.0.1:13110`; Nginx deliberately returns 404 for that path.

## Manual verification

On the VPS:

```bash
sudo deploy/configure-secrets-vps.sh --check
sudo systemctl status aialra-carreerdojo-proxy.service
curl -fsS http://127.0.0.1:13110/__origin_health
curl -skI --resolve carreerdojo.aialra.online:443:127.0.0.1 \
  https://carreerdojo.aialra.online/
```

The last anonymous request must return a `302` Authentik sign-in redirect.
After signing in, confirm the application persists a harmless test change,
reloads it from Sites D1, and exports no Authentik Cookie, Sites bypass bearer,
or proxy secret to browser-visible responses.
