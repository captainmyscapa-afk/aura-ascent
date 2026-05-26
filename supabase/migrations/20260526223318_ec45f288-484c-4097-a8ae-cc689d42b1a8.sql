REVOKE SELECT (access_token, refresh_token) ON public.social_accounts FROM authenticated;
REVOKE SELECT (access_token, refresh_token) ON public.social_accounts FROM anon;
GRANT SELECT (id, user_id, platform, username, connected_at, created_at, updated_at) ON public.social_accounts TO authenticated;