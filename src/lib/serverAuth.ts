/**
 * Server-side auth guard for createServerFn handlers.
 * Call `await requireServerAuth()` at the top of every AI handler.
 * Throws "Unauthorized" if the request has no valid Bearer token.
 */
import { getRequest } from "@tanstack/react-start/server";

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

  const apikey =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  if (!apikey) {
    throw new Error(
      "Unauthorized: invalid or expired token (SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY not set)",
    );
  }

  // Validate the token directly against Supabase Auth's REST endpoint.
  // This always performs server-side verification on Supabase's end and
  // avoids supabase-js's local JWKS-based verification, which can fail in
  // edge runtimes (e.g. "unrecognized JWT kid ... for algorithm ES256")
  // when the JWKS fetch/cache doesn't pick up newer asymmetric signing keys.
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey,
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
    console.error("requireServerAuth: /auth/v1/user failed:", res.status, body.slice(0, 300));
    throw new Error(
      `Unauthorized: invalid or expired token (auth/v1/user returned ${res.status})`,
    );
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Unauthorized")) throw e;
    const reason = e instanceof Error ? e.message : String(e);
    console.error("requireServerAuth: request to /auth/v1/user failed:", reason);
    throw new Error(`Unauthorized: invalid or expired token (request failed: ${reason})`);
  }
}
