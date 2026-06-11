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

  const supabaseUrl = process.env["SUPABASE_URL"] ?? "";
  const reasons: string[] = [];
  if (!supabaseUrl) reasons.push("SUPABASE_URL not set");

  // Primary path (unchanged from the previous fix): validate the token via
  // /auth/v1/user using the publishable (anon) key. This is what worked on
  // localhost.
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  if (publishableKey) {
    const client = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (!error && data?.user?.id) {
      return { id: data.user.id, email: data.user.email };
    }
    if (error) {
      console.error("requireServerAuth: getUser via publishable key failed:", error.message);
      reasons.push("publishable: " + error.message);
    }
  } else {
    console.error("requireServerAuth: SUPABASE_PUBLISHABLE_KEY is not set");
    reasons.push("SUPABASE_PUBLISHABLE_KEY not set");
  }

  // Fallback path: only runs if the primary path above failed or
  // SUPABASE_PUBLISHABLE_KEY was missing. Lovable Cloud also injects
  // SUPABASE_SERVICE_ROLE_KEY, so retry with that as the apikey. This is
  // additive - if it's not set (e.g. local dev), it's skipped entirely and
  // behavior is identical to before.
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  if (serviceRoleKey) {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await adminClient.auth.getUser(token);
    if (!error && data?.user?.id) {
      return { id: data.user.id, email: data.user.email };
    }
    if (error) {
      console.error("requireServerAuth: getUser via service-role key failed:", error.message);
      reasons.push("service-role: " + error.message);
    }
  } else {
    reasons.push("SUPABASE_SERVICE_ROLE_KEY not set");
  }

  throw new Error("Unauthorized: invalid or expired token (" + reasons.join("; ") + ")");
}
