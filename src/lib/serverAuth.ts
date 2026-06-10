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

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    const reason = error?.message ?? "no claims returned";
    const hasUrl = !!process.env["SUPABASE_URL"];
    const hasKey = !!process.env["SUPABASE_PUBLISHABLE_KEY"];
    throw new Error(
      `Unauthorized: invalid or expired token (${reason}) [env: url=${hasUrl}, key=${hasKey}]`
    );
  }

  return {
    id: data.claims.sub as string,
    email: data.claims.email as string | undefined,
  };
}
