-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily workout generation at 12:00 AM UTC
SELECT cron.schedule(
  'generate-daily-workouts',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://uxxiesfbrpjxxmnftdsx.supabase.co/functions/v1/generate-daily-workouts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eGllc2ZicnBqeHhtbmZ0ZHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDc2ODQsImV4cCI6MjA2NzI4MzY4NH0.bsODTQ_3XT4m49JPA_G3TKIqEXDf_uPrFk0vNWCoDOA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);