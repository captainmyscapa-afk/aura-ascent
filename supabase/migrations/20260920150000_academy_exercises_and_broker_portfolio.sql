-- Answerable exercises + Yacht Broker Portfolio (Module 1: pages 4, 8, 9, 10)

alter table public.academy_module_pages add column if not exists exercise jsonb;

create table if not exists public.academy_exercise_answers (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  page_id uuid not null references public.academy_module_pages(id) on delete cascade,
  module_id uuid not null references public.academy_modules(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, page_id)
);
alter table public.academy_exercise_answers enable row level security;
drop policy if exists "users read own exercise answers" on public.academy_exercise_answers;
create policy "users read own exercise answers" on public.academy_exercise_answers
  for select to authenticated using (user_id = auth.uid());

create table if not exists public.broker_portfolio_profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  headline text check (char_length(headline) <= 200),
  location text check (char_length(location) <= 120),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 60),
  website text check (char_length(website) <= 200),
  updated_at timestamptz not null default now()
);
alter table public.broker_portfolio_profiles enable row level security;
drop policy if exists "own portfolio profile select" on public.broker_portfolio_profiles;
drop policy if exists "own portfolio profile insert" on public.broker_portfolio_profiles;
drop policy if exists "own portfolio profile update" on public.broker_portfolio_profiles;
create policy "own portfolio profile select" on public.broker_portfolio_profiles for select to authenticated using (user_id = auth.uid());
create policy "own portfolio profile insert" on public.broker_portfolio_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "own portfolio profile update" on public.broker_portfolio_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.save_exercise_answers(p_page_id uuid, p_answers jsonb, p_complete boolean default false)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_page record;
  g jsonb;
  f jsonb;
  v_clean jsonb := '{}'::jsonb;
  v_existing jsonb;
  v_merged jsonb;
  v_missing text[] := '{}';
  v_key text;
  v_val text;
  v_type text;
  v_min int;
  v_ok boolean;
  v_completed boolean;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  select id, module_id, exercise into v_page from public.academy_module_pages where id = p_page_id;
  if not found or v_page.exercise is null then raise exception 'This page has no exercise'; end if;

  select answers into v_existing from public.academy_exercise_answers where user_id = v_user and page_id = p_page_id;
  v_existing := coalesce(v_existing, '{}'::jsonb);

  for g in select value from jsonb_array_elements(coalesce(v_page.exercise -> 'groups', '[]'::jsonb)) loop
    for f in select value from jsonb_array_elements(coalesce(g -> 'fields', '[]'::jsonb)) loop
      v_key := f ->> 'key';
      if p_answers ? v_key then
        v_clean := v_clean || jsonb_build_object(v_key, left(btrim(coalesce(p_answers ->> v_key, '')), 4000));
      end if;
    end loop;
  end loop;
  v_merged := v_existing || v_clean;

  if p_complete then
    for g in select value from jsonb_array_elements(coalesce(v_page.exercise -> 'groups', '[]'::jsonb)) loop
      for f in select value from jsonb_array_elements(coalesce(g -> 'fields', '[]'::jsonb)) loop
        v_key := f ->> 'key';
        v_type := coalesce(f ->> 'type', 'short');
        v_val := coalesce(v_merged ->> v_key, '');
        v_min := coalesce((f ->> 'min')::int, 3);
        if v_type = 'rating' then v_ok := v_val ~ '^[1-5]$';
        elsif v_type = 'choice' then v_ok := coalesce(f -> 'options', '[]'::jsonb) @> to_jsonb(v_val);
        else v_ok := char_length(v_val) >= v_min;
        end if;
        if not v_ok then v_missing := v_missing || v_key; end if;
      end loop;
    end loop;
  end if;

  insert into public.academy_exercise_answers (user_id, page_id, module_id, answers, completed, updated_at)
  values (v_user, p_page_id, v_page.module_id, v_merged, p_complete and cardinality(v_missing) = 0, now())
  on conflict (user_id, page_id) do update set
    answers = excluded.answers,
    completed = public.academy_exercise_answers.completed or excluded.completed,
    updated_at = now()
  returning completed into v_completed;

  return jsonb_build_object('completed', v_completed, 'missing', to_jsonb(v_missing), 'answers', v_merged);
end;
$function$;
revoke all on function public.save_exercise_answers(uuid, jsonb, boolean) from public, anon;
grant execute on function public.save_exercise_answers(uuid, jsonb, boolean) to authenticated;

-- Quiz gate: quick checks AND exercises must be done
create or replace function public.submit_module_quiz(p_module_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_score int := 0;
  v_total int := 0;
  v_passed boolean;
  v_attempts int;
  v_prev_passed boolean;
  v_correct_map jsonb := '{}'::jsonb;
  v_missing int;
  q record;
  v_correct_option uuid;
  v_submitted_option uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin() then
    select count(*) into v_missing
    from public.academy_module_pages pg
    where pg.module_id = p_module_id
      and (
        (pg.checkpoint_question_id is not null and not exists (
          select 1 from public.academy_checkpoint_responses r
          where r.user_id = v_user and r.page_id = pg.id))
        or
        (pg.exercise is not null and not exists (
          select 1 from public.academy_exercise_answers a
          where a.user_id = v_user and a.page_id = pg.id and a.completed))
      );
    if v_missing > 0 then
      raise exception 'Complete all pages, quick checks and exercises before taking the quiz';
    end if;
  end if;

  for q in
    select id from public.academy_quiz_questions
    where module_id = p_module_id and stage = 'final'
  loop
    v_total := v_total + 1;
    select id into v_correct_option
    from public.academy_quiz_options
    where question_id = q.id and is_correct = true
    limit 1;

    v_correct_map := v_correct_map || jsonb_build_object(q.id::text, v_correct_option);

    v_submitted_option := nullif(p_answers ->> q.id::text, '')::uuid;
    if v_submitted_option is not null and v_submitted_option = v_correct_option then
      v_score := v_score + 1;
    end if;
  end loop;

  v_passed := v_total > 0 and v_score >= ceil(v_total * 0.6);

  select quiz_passed, attempts into v_prev_passed, v_attempts
  from public.user_module_progress
  where user_id = v_user and module_id = p_module_id;

  v_attempts := coalesce(v_attempts, 0) + 1;

  insert into public.user_module_progress
    (user_id, module_id, video_watched, quiz_passed, quiz_score, attempts, completed_at)
  values
    (v_user, p_module_id, true, v_passed or coalesce(v_prev_passed, false), v_score, v_attempts,
     case when v_passed then now() else null end)
  on conflict (user_id, module_id) do update set
    video_watched = true,
    quiz_passed = excluded.quiz_passed or public.user_module_progress.quiz_passed,
    quiz_score = excluded.quiz_score,
    attempts = excluded.attempts,
    completed_at = case
      when excluded.quiz_passed or public.user_module_progress.quiz_passed
        then coalesce(public.user_module_progress.completed_at, excluded.completed_at)
      else public.user_module_progress.completed_at
    end;

  return jsonb_build_object(
    'score', v_score,
    'total', v_total,
    'passed', v_passed,
    'correctOptions', v_correct_map
  );
end;
$function$;

-- Module 1 (Yachts): pages 4, 8, 9, 10 become exercises instead of quick checks
do $do$
declare
  v_mod uuid;
  v_qids uuid[];
begin
  select id into v_mod from public.academy_modules where track = 'yachts' and title = 'Welcome to Yachting' limit 1;
  if v_mod is null then raise notice 'Module not found, skipping'; return; end if;

  select coalesce(array_agg(checkpoint_question_id), '{}') into v_qids
  from public.academy_module_pages
  where module_id = v_mod and page_number in (4, 8, 9, 10) and checkpoint_question_id is not null;

  update public.academy_module_pages set checkpoint_question_id = null
  where module_id = v_mod and page_number in (4, 8, 9, 10);

  delete from public.academy_checkpoint_responses
  where page_id in (select id from public.academy_module_pages where module_id = v_mod and page_number in (4, 8, 9, 10));
  delete from public.academy_quiz_options where question_id = any(v_qids);
  delete from public.academy_quiz_questions where id = any(v_qids);

  update public.academy_module_pages set
    exercise = '{"intro": "Rate your initial curiosity from 1 (low) to 5 (high) for each area. Don''t overthink it: it''s a snapshot, and you''ll revisit it later.", "groups": [{"title": "Industry curiosity map", "section": "market", "fields": [{"key": "rate_brokerage", "label": "Yacht Brokerage", "type": "rating"}, {"key": "rate_charter", "label": "Charter", "type": "rating"}, {"key": "rate_management", "label": "Yacht Management", "type": "rating"}, {"key": "rate_shipyards", "label": "Shipyards", "type": "rating"}, {"key": "rate_design", "label": "Design", "type": "rating"}, {"key": "rate_naval", "label": "Naval Architecture", "type": "rating"}, {"key": "rate_crew", "label": "Crew / Yacht Operations", "type": "rating"}, {"key": "rate_survey", "label": "Survey / Technical", "type": "rating"}, {"key": "rate_finance", "label": "Finance", "type": "rating"}, {"key": "rate_legal", "label": "Legal / Corporate", "type": "rating"}]}]}'::jsonb,
    body_html = regexp_replace(body_html, '<p>Rate your initial curiosity.*?Legal / Corporate: __ /5</p>', '<p>Rate your initial curiosity from 1 to 5 for each area in the exercise that follows. Your ratings are saved to your Broker Portfolio.</p>')
  where module_id = v_mod and page_number = 4;

  update public.academy_module_pages set
    exercise = '{"intro": "Your client has an €8M budget, a young family, no yacht experience and a wish for something \"impressive\". Write what you would ask before recommending anything.", "groups": [{"title": "The ten questions I would ask", "section": "services", "fields": [{"key": "q1", "label": "Question 1", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}, {"key": "q2", "label": "Question 2", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}, {"key": "q3", "label": "Question 3", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}, {"key": "q4", "label": "Question 4", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}, {"key": "q5", "label": "Question 5", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}, {"key": "q6", "label": "Question 6", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}, {"key": "q7", "label": "Question 7", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}, {"key": "q8", "label": "Question 8", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}, {"key": "q9", "label": "Question 9", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}, {"key": "q10", "label": "Question 10", "type": "short", "min": 8, "placeholder": "Write the question as you would ask it"}]}, {"title": "The three that matter most", "section": "services", "fields": [{"key": "top3", "label": "Which three questions are most important, and why?", "type": "long", "min": 40, "placeholder": "Name the three and explain your reasoning"}]}, {"title": "Module reflection", "section": "profile", "fields": [{"key": "refl_before", "label": "Before this module, I thought yacht brokerage was...", "type": "short", "min": 10}, {"key": "refl_now", "label": "Now I understand that yacht brokerage is...", "type": "short", "min": 10}, {"key": "refl_most", "label": "The part of the industry that interests me most is...", "type": "short", "min": 5}, {"key": "refl_least", "label": "The part that interests me least is...", "type": "short", "min": 5}, {"key": "refl_surprise", "label": "One thing that surprised me was...", "type": "short", "min": 5}, {"key": "refl_learn", "label": "One thing I want to learn more about is...", "type": "short", "min": 5}, {"key": "interest_level", "label": "My interest in exploring yacht brokerage is currently...", "type": "choice", "options": ["Much lower", "Slightly lower", "About the same", "Slightly higher", "Much higher"]}, {"key": "interest_why", "label": "And why?", "type": "long", "min": 15}]}]}'::jsonb,
    body_html = regexp_replace(
      replace(body_html, '<p>Write your answers in your own notes. You will want them for your portfolio.</p>', '<p>You will write your answers on the next screen. They are saved to your Broker Portfolio.</p>'),
      '<p><b>Reflection</b></p>.*$', '<p><b>Reflection</b></p><p>After the ten questions, you will reflect on what this module has changed for you.</p>')
  where module_id = v_mod and page_number = 8;

  update public.academy_module_pages set
    exercise = '{"intro": "Your one-page Yacht World Map. This becomes the first page of your Broker Portfolio, so write it as you''d be happy to show it.", "groups": [{"title": "Yacht types I have discovered", "section": "yachts", "fields": [{"key": "type1", "label": "1", "type": "short", "min": 3}, {"key": "type2", "label": "2", "type": "short", "min": 3}, {"key": "type3", "label": "3", "type": "short", "min": 3}]}, {"title": "Features I find interesting", "section": "yachts", "fields": [{"key": "feat1", "label": "1", "type": "short", "min": 3}, {"key": "feat2", "label": "2", "type": "short", "min": 3}, {"key": "feat3", "label": "3", "type": "short", "min": 3}]}, {"title": "Questions I still have", "section": "profile", "fields": [{"key": "ques1", "label": "1", "type": "short", "min": 3}, {"key": "ques2", "label": "2", "type": "short", "min": 3}, {"key": "ques3", "label": "3", "type": "short", "min": 3}]}, {"title": "The parts of yachting that interest me", "section": "market", "fields": [{"key": "areas", "label": "List the major areas of yachting that interest you, and say why.", "type": "long", "min": 15}]}, {"title": "Strengths I already have", "section": "profile", "fields": [{"key": "strength1", "label": "1", "type": "short", "min": 3}, {"key": "strength2", "label": "2", "type": "short", "min": 3}, {"key": "strength3", "label": "3", "type": "short", "min": 3}]}, {"title": "Skills I may need to develop", "section": "profile", "fields": [{"key": "skill1", "label": "1", "type": "short", "min": 3}, {"key": "skill2", "label": "2", "type": "short", "min": 3}, {"key": "skill3", "label": "3", "type": "short", "min": 3}]}, {"title": "My current career hypothesis", "section": "profile", "fields": [{"key": "hyp_curious", "label": "At this stage, I am curious about yacht brokerage because...", "type": "long", "min": 15}, {"key": "hyp_question", "label": "The biggest question I still have is...", "type": "long", "min": 10}]}]}'::jsonb,
    body_html = regexp_replace(
      regexp_replace(body_html, '<p>Create a one-page document.*?The biggest question I still have is\.\.\.</em></p>', '<p>Build your one-page map on the next screen: the yachts you have discovered, the parts of the industry that interest you, your potential fit and your current career hypothesis.</p>'),
      '<p>Keep this document\..*?</p>', '<p>This is saved automatically as the first page of your <b>Broker Portfolio</b>, which you will find next to Task Control on your dashboard. You will return to it later.</p>')
  where module_id = v_mod and page_number = 9;

  update public.academy_module_pages set
    exercise = '{"intro": "Explain the job to an intelligent friend who knows nothing about yachting. No jargon, no clichés, no brochure language. If it sounds like advertising, rewrite it.", "groups": [{"title": "What a yacht broker actually does", "section": "profile", "fields": [{"key": "friend_pitch", "label": "Your two-minute explanation: the industry, what a broker does, who they work with, what makes it difficult, what makes it interesting, who might enjoy it, and why to explore before deciding.", "type": "long", "min": 120, "placeholder": "Write it as you would say it out loud"}]}, {"title": "Where I stand today", "section": "profile", "fields": [{"key": "final_stance", "label": "Fascinated? Uncertain? Drawn more to the commercial side than the yachts? Write your honest answer. We are going to test it.", "type": "long", "min": 30}]}]}'::jsonb
  where module_id = v_mod and page_number = 10;
end
$do$;
