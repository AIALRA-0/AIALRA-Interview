import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, repositoryRoot), "utf8");
}

test("origin proxy keeps Sites and Authentik credentials server-side", async () => {
  const proxy = await source("deploy/origin-proxy/server.mjs");
  const nginx = await source("deploy/carreerdojo.aialra.online.conf");
  const service = await source("deploy/aialra-carreerdojo-proxy.service");

  assert.match(proxy, /HOST = "127\.0\.0\.1"/);
  assert.match(proxy, /AIALRA_PROXY_SHARED_SECRET/);
  assert.match(proxy, /x-aialra-proxy-secret/);
  assert.match(proxy, /authorization: `Bearer \$\{sitesBypassBearer\}`/);
  assert.match(proxy, /same_origin_required/);
  assert.match(proxy, /origin === publicOrigin\.origin/);
  assert.match(proxy, /"set-cookie"/);
  assert.match(proxy, /"www-authenticate"/);

  assert.match(nginx, /proxy_set_header Authorization "";/);
  assert.match(nginx, /proxy_set_header Cookie "";/);
  assert.match(nginx, /proxy_set_header X-Aialra-Proxy-Secret "";/);
  assert.match(nginx, /proxy_pass http:\/\/127\.0\.0\.1:13110;/);
  assert.doesNotMatch(nginx, /SITES_BYPASS_BEARER|AIALRA_PROXY_SHARED_SECRET=/);

  assert.match(
    service,
    /EnvironmentFile=\/srv\/aialra\/secrets\/carreerdojo-origin\.env/,
  );
  assert.match(service, /NoNewPrivileges=true/);
  assert.match(service, /ProtectSystem=strict/);
  assert.doesNotMatch(
    service,
    /SITES_BYPASS_BEARER=|AIALRA_PROXY_SHARED_SECRET=/,
  );
});

test("deployment scripts use the exact requested hostname and root-only secrets", async () => {
  const secrets = await source("deploy/configure-secrets-vps.sh");
  const dns = await source("deploy/ensure-cloudflare-dns.sh");
  const auth = await source("deploy/configure-auth-nginx.sh");

  for (const file of [secrets, dns, auth]) {
    assert.match(file, /carreerdojo\.aialra\.online/);
  }
  assert.match(secrets, /umask 077/);
  assert.match(secrets, /chmod 0600/);
  assert.match(auth, /APP_SLUG='carreerdojo'/);
  assert.match(auth, /reconcile_authentik_callbacks\.sh/);
  assert.match(dns, /dns_cloudflare_api_token/);
  assert.doesNotMatch(
    `${secrets}\n${dns}\n${auth}`,
    /(?:Bearer|secret)[=:]["']?[A-Za-z0-9_-]{32,}/i,
  );
});
