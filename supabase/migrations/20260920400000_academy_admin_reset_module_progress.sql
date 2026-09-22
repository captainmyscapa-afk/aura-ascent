create or replace function public.admin_reset_module_progress(p_module_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin only';
  end if;
  delete from public.academy_checkpoint_responses where user_id = auth.uid() and module_id = p_module_id;
  update public.academy_exercise_answers set completed = false, updated_at = now() where user_id = auth.uid() and module_id = p_module_id;
  update public.user_module_progress
    set quiz_passed = false, quiz_score = null, attempts = 0, completed_at = null, last_page = 0, video_watched = false
    where user_id = auth.uid() and module_id = p_module_id;
end;
$$;
revoke all on function public.admin_reset_module_progress(uuid) from public, anon;
grant execute on function public.admin_reset_module_progress(uuid) to authenticated;
