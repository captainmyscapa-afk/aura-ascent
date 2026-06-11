/**
 * Server-side auth guard for createServerFn handlers.
 * Call `await requireServerAuth()` at the top of every AI handler.
 * Throws "Unauthorized" if the request has no valid Bearer token.
 */
import { getRequest } from "@tanstack/react-start/server";

type JwtClaims = {
  sub?: string;
  email?: string;
  aud?: string | string[];
  exp?: number;
};

type Jwk = JsonWebKey & { kid?: string; alg?: string };

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJwtPart(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(part))) as Record<string, unknown>;
}

// Module-scope cache so we don't refetch the JWKS on every request, but a
// failed lookup (e.g. a newly-rotated key) forces a one-time refresh.
let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 10 * 60 * 1000;

async function getJwks(supabaseUrl: string, forceRefresh = false): Promise<Jwk[]> {
  const now = Date.now();
  if (!forceRefresh && jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`jwks fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as { keys?: Jwk[] };
  jwksCache = { keys: data.keys ?? [], fetchedAt: now };
  return jwksCache.keys;
}

/**
 * Verify a Supabase-issued ES256 (asymmetric) access token locally against
 * the project's JWKS. This avoids depending on Supabase's `/auth/v1/user`
 * endpoint, whose internal key-verification cache can lag behind the public
 * JWKS document on some edge nodes (causing spurious "unrecognized JWT kid"
 * errors even for valid, current tokens).
 */
async function verifyEs256Jwt(token: string, supabaseUrl: string): Promise<JwtClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("malformed JWT");
  }
  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];
  const header = decodeJwtPart(headerB64) as { alg?: string; kid?: string };
  const payload = decodeJwtPart(payloadB64) as JwtClaims;

  if (header.alg !== "ES256") {
    throw new Error(`unsupported alg: ${String(header.alg)}`);
  }

  let keys = await getJwks(supabaseUrl);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    keys = await getJwks(supabaseUrl, true);
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) {
    throw new Error(`no matching JWKS key for kid ${String(header.kid)}`);
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );

  const signature = base64UrlDecode(sigB64);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    signature as BufferSource,
    data as BufferSource,
  );
  if (!valid) {
    throw new Error("signature verification failed");
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) {
    throw new Error("token expired");
  }

  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (payload.aud && !aud.includes("authenticated")) {
    throw new Error(`unexpected audience: ${String(payload.aud)}`);
  }

  if (!payload.sub) {
    throw new Error("missing sub claim");
  }

  return payload;
}

export async function requireServerAuth(): Promise<{ id: string; email: string | undefined }> {
  const request = getRequest();

  if (!request?.headers) {
    throw new Error("Unauthorized: no request context");
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: missing or invalid Authorization header");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    throw new Error("Unauthorized: empty token");
  }

  const supabaseUrl = process.env["SUPABASE_URL"] ?? "";
  if (!supabaseUrl) {
    throw new Error("Unauthorized: invalid or expired token (SUPABASE_URL not set)");
  }

  // Primary path: verify the token's signature locally against the
  // project's JWKS. This is the most reliable path for ES256 (asymmetric)
  // tokens, since it doesn't depend on Supabase's /auth/v1/user endpoint
  // having an up-to-date verification cache.
  let localVerifyError = "";
  try {
    const claims = await verifyEs256Jwt(token, supabaseUrl);
    if (claims.sub) {
      return { id: claims.sub, email: claims.email };
    }
    localVerifyError = "no sub claim after verification";
  } catch (e) {
    localVerifyError = e instanceof Error ? e.message : String(e);
    console.warn("requireServerAuth: local JWT verification failed, falling back:", localVerifyError);
  }

  const apikey =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  if (!apikey) {
    throw new Error(
      "Unauthorized: invalid or expired token (SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY not set)",
    );
  }

  // Fallback: ask Supabase Auth's REST endpoint to validate the token
  // directly. Covers non-ES256 tokens and any other edge cases not handled
  // by local verification above.
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey,
        Accept: "application/json",
        "User-Agent": "AuraAscent-Server/1.0 (+https://aurum-ascend.lovable.app)",
      },
    });

    if (res.ok) {
      const user = (await res.json()) as { id?: string; email?: string };
      if (user?.id) {
        return { id: user.id, email: user.email };
      }
      throw new Error("Unauthorized: invalid or expired token (no user id in response)");
    }

    const body = await res.text().catch(() => "");
    const headerInfo = `ct=${res.headers.get("content-type") ?? "?"};cf-ray=${res.headers.get("cf-ray") ?? "?"};cf-mitigated=${res.headers.get("cf-mitigated") ?? "?"};server=${res.headers.get("server") ?? "?"}`;
    console.error(
      "requireServerAuth: /auth/v1/user failed:",
      res.status,
      headerInfo,
      body.slice(0, 300),
    );
    const detail = body.replace(/\s+/g, " ").trim().slice(0, 200);
    throw new Error(
      `Unauthorized: invalid or expired token (local: ${localVerifyError}; auth/v1/user returned ${res.status}; ${headerInfo}${detail ? "; body=" + detail : ""})`,
    );
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Unauthorized")) throw e;
    const reason = e instanceof Error ? e.message : String(e);
    console.error("requireServerAuth: request to /auth/v1/user failed:", reason);
    throw new Error(
      `Unauthorized: invalid or expired token (local: ${localVerifyError}; request failed: ${reason})`,
    );
  }
}
