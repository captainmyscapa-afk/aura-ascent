
UPDATE public.live_intelligence SET category = 'yachting' WHERE category IS NULL AND (source ILIKE '%maritime%' OR source ILIKE '%yacht%' OR title ILIKE '%yacht%');
UPDATE public.live_intelligence SET category = 'aviation' WHERE category IS NULL AND (source ILIKE '%aviation%' OR title ILIKE '%jet%' OR title ILIKE '%aviation%' OR title ILIKE '%terminal%');
UPDATE public.live_intelligence SET category = 'automotive' WHERE category IS NULL AND (source ILIKE '%automotive%' OR source ILIKE '%motor%');
UPDATE public.live_intelligence SET category = 'property' WHERE category IS NULL AND (source ILIKE '%property%' OR source ILIKE '%real estate%' OR title ILIKE '%chalet%' OR title ILIKE '%villa%');
