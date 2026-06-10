/**
 * Server-side auth guard for createServerFn handlers.
 * Call `await requireServerAuth()` at the top of every AI handler.
 * Throws "Unauthorized" if the request has no valid Bearer token.
 */
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

  // Use the admin (service-role) client for getUser() rather than building a
  // fresh client from SUPABASE_PUBLISHABLE_KEY. getUser() hits the protected
  // /auth/v1/user endpoint, which requires a valid `apikey` header - if
  // SUPABASE_PUBLISHABLE_KEY is missing or misconfigured in this deploy
  // environment, that call fails even for a perfectly valid user token.
  // supabaseAdmin already throws loudly at construction if its env vars
  // (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are missing, so reusing it
  // here removes that failure mode. Note: getUser(token) still validates the
  // *user's token* - using the service-role key only affects the apikey
  // header, it does not bypass per-user auth.
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) {
    if (error) console.error("requireServerAuth: getUser failed:", error.message);
    throw new Error("Unauthorized: invalid or expired token");
  }

  return {
    id: data.user.id,
    email: data.user.email,
  };
}
