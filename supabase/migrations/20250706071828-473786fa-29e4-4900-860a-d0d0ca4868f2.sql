
-- Add journal and feeling columns to the workouts table
ALTER TABLE public.workouts 
ADD COLUMN journal_entry TEXT,
ADD COLUMN feeling TEXT;
