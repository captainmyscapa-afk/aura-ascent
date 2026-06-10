/**
 * Server-side auth guard for createServerFn handlers.
 * Call `await requireServerAuth()` at the top of every AI handler.
 * Throws "Unauthorized" if the request has no valid Bearer token.
 */
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

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

  const supabase = createClient(
    process.env["SUPABASE_URL"] ?? "",
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "",
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    }
  );

  // Use getUser() instead of getClaims(): getClaims() verifies the JWT locally
  // against a cached JWKS, which can go stale in long-lived Worker isolates
  // after a signing-key rotation (causing "unrecognized JWT kid" errors even
  // for valid tokens). getUser() validates directly against Supabase Auth.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    if (error) console.error("requireServerAuth: getUser failed:", error.message);
    throw new Error("Unauthorized: invalid or expired token");
  }

  return {
    id: data.user.id,
    email: data.user.email,
  };
}
