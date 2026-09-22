-- Remember where each learner stopped in an Academy module so the reader resumes on that page.
alter table public.user_module_progress add column if not exists last_page integer;
comment on column public.user_module_progress.last_page is 'Zero-based index of the reader page the learner last viewed in this module, so the reader resumes there.';
