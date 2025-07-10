
-- Add onboarding_completed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add preferences column to store additional user preferences
ALTER TABLE public.profiles 
ADD COLUMN preferences JSONB DEFAULT NULL;
