import http from "node:http";
import https from "node:https";
import process from "node:process";

const HOST = "127.0.0.1";
const PORT = 13110;
const HEALTH_PATH = "/__origin_health";
const MAX_REQUEST_BYTES = 2 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 90_000;

const requiredEnvironment = [
  "SITES_ORIGIN_URL",
  "SITES_BYPASS_BEARER",
  "AIALRA_PROXY_SHARED_SECRET",
  "PUBLIC_ORIGIN",
];

for (const name of requiredEnvironment) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const sitesOrigin = new URL(process.env.SITES_ORIGIN_URL);
const publicOrigin = new URL(process.env.PUBLIC_ORIGIN);
const sitesBypassBearer = process.env.SITES_BYPASS_BEARER;
const proxySharedSecret = process.env.AIALRA_PROXY_SHARED_SECRET;

if (sitesOrigin.protocol !== "https:" || publicOrigin.protocol !== "https:") {
  throw new Error("Both origin URLs must use HTTPS");
}
if (publicOrigin.hostname !== "carreerdojo.aialra.online") {
  throw new Error("PUBLIC_ORIGIN must be the canonical Career Dojo hostname");
}
if (sitesBypassBearer.length < 20 || proxySharedSecret.length < 32) {
  throw new Error("Origin credentials do not meet the minimum length");
}

const identityHeaders = [
  "x-aialra-sub",
  "x-aialra-user",
  "x-aialra-email",
  "x-aialra-role",
  "x-aialra-groups",
];

const requestHeaderAllowlist = [
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "content-length",
  "content-type",
  "if-match",
  "if-modified-since",
  "if-none-match",
  "if-unmodified-since",
  "pragma",
  "range",
  "user-agent",
];

const responseHeaderBlocklist = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "server",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "www-authenticate",
  "x-powered-by",
]);

const upstreamAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 64,
  maxFreeSockets: 16,
  timeout: UPSTREAM_TIMEOUT_MS,
});

function singleHeader(request, name) {
  const value = request.headers[name];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function safeIdentityValue(value, maxLength) {
  if (
    typeof value !== "string" ||
    value.length > maxLength ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return "";
  }
  return value.trim();
}

function trustedIdentity(request) {
  if (singleHeader(request, "x-aialra-authenticated") !== "1") {
    return null;
  }

  const identity = Object.fromEntries(
    identityHeaders.map((name) => [
      name,
      safeIdentityValue(
        singleHeader(request, name),
        name === "x-aialra-groups" ? 4096 : 1024,
      ),
    ]),
  );

  if (!identity["x-aialra-sub"]) {
    return null;
  }
  return identity;
}

function hasTrustedMutationOrigin(request) {
  if (request.method === "GET" || request.method === "HEAD") {
    return true;
  }
  const origin = singleHeader(request, "origin");
  if (origin === publicOrigin.origin) {
    return true;
  }
  const referer = singleHeader(request, "referer");
  if (!origin && referer) {
    try {
      return new URL(referer).origin === publicOrigin.origin;
    } catch {
      return false;
    }
  }
  return false;
}

function upstreamUrlFor(requestTarget) {
  if (
    typeof requestTarget !== "string" ||
    !requestTarget.startsWith("/") ||
    requestTarget.startsWith("//") ||
    requestTarget.includes("\u0000")
  ) {
    return null;
  }

  const parsed = new URL(requestTarget, "http://loopback.invalid");
  const target = new URL(sitesOrigin);
  const originPrefix =
    sitesOrigin.pathname === "/"
      ? ""
      : sitesOrigin.pathname.replace(/\/$/u, "");
  target.pathname = `${originPrefix}${parsed.pathname}`;
  target.search = parsed.search;
  target.hash = "";
  return target;
}

function rewriteLocation(location) {
  if (typeof location !== "string") {
    return location;
  }
  try {
    const parsed = new URL(location, sitesOrigin);
    if (parsed.origin !== sitesOrigin.origin) {
      return location;
    }
    const rewritten = new URL(publicOrigin);
    rewritten.pathname = parsed.pathname;
    rewritten.search = parsed.search;
    rewritten.hash = parsed.hash;
    return rewritten.toString();
  } catch {
    return location;
  }
}

function writeJson(response, statusCode, body) {
  const encoded = Buffer.from(JSON.stringify(body));
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-length": encoded.length,
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(encoded);
}

function proxyRequest(request, response) {
  if (request.method === "CONNECT" || request.method === "TRACE") {
    writeJson(response, 405, { error: "method_not_allowed" });
    return;
  }

  if (request.method === "GET" && request.url === HEALTH_PATH) {
    writeJson(response, 200, { ok: true });
    return;
  }

  const identity = trustedIdentity(request);
  if (!identity) {
    writeJson(response, 401, { error: "trusted_identity_required" });
    return;
  }
  if (!hasTrustedMutationOrigin(request)) {
    writeJson(response, 403, { error: "same_origin_required" });
    return;
  }

  const target = upstreamUrlFor(request.url);
  if (!target) {
    writeJson(response, 400, { error: "invalid_request_target" });
    return;
  }

  const declaredLength = Number(singleHeader(request, "content-length") || 0);
  if (
    !Number.isFinite(declaredLength) ||
    declaredLength < 0 ||
    declaredLength > MAX_REQUEST_BYTES
  ) {
    writeJson(response, 413, { error: "request_too_large" });
    return;
  }

  const outgoingHeaders = {
    authorization: `Bearer ${sitesBypassBearer}`,
    host: sitesOrigin.host,
    origin: publicOrigin.origin,
    referer: `${publicOrigin.origin}/`,
    "x-aialra-authenticated": "1",
    "x-aialra-proxy-secret": proxySharedSecret,
    "x-forwarded-host": publicOrigin.host,
    "x-forwarded-proto": "https",
  };

  for (const name of requestHeaderAllowlist) {
    const value = singleHeader(request, name);
    if (value) {
      outgoingHeaders[name] = value;
    }
  }
  for (const [name, value] of Object.entries(identity)) {
    if (value) {
      outgoingHeaders[name] = value;
    }
  }

  const upstreamRequest = https.request(
    target,
    {
      agent: upstreamAgent,
      headers: outgoingHeaders,
      method: request.method,
      rejectUnauthorized: true,
      servername: sitesOrigin.hostname,
    },
    (upstreamResponse) => {
      const responseHeaders = {};
      for (const [name, value] of Object.entries(upstreamResponse.headers)) {
        if (responseHeaderBlocklist.has(name) || value === undefined) {
          continue;
        }
        responseHeaders[name] =
          name === "location" ? rewriteLocation(value) : value;
      }

      responseHeaders["cache-control"] =
        upstreamResponse.headers["cache-control"] ?? "private, no-store";
      responseHeaders["x-content-type-options"] = "nosniff";
      response.writeHead(upstreamResponse.statusCode ?? 502, responseHeaders);
      upstreamResponse.pipe(response);
    },
  );

  let receivedBytes = 0;
  request.on("data", (chunk) => {
    receivedBytes += chunk.length;
    if (receivedBytes > MAX_REQUEST_BYTES) {
      request.unpipe(upstreamRequest);
      upstreamRequest.destroy();
      if (!response.headersSent) {
        writeJson(response, 413, { error: "request_too_large" });
      } else {
        response.destroy();
      }
    }
  });

  upstreamRequest.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
    upstreamRequest.destroy(new Error("upstream_timeout"));
  });
  upstreamRequest.on("error", () => {
    if (!response.headersSent) {
      writeJson(response, 502, { error: "origin_unavailable" });
    } else {
      response.destroy();
    }
  });
  request.pipe(upstreamRequest);
}

const server = http.createServer(proxyRequest);
server.keepAliveTimeout = 5_000;
server.headersTimeout = 15_000;
server.requestTimeout = 95_000;
server.maxHeadersCount = 100;

server.on("clientError", (_error, socket) => {
  if (socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write(
    `Career Dojo origin proxy listening on ${HOST}:${PORT}\n`,
  );
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
