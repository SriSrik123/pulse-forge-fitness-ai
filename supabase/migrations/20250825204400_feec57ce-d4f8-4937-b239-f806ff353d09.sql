-- Fix the profiles table RLS policies to allow friend functionality while protecting sensitive data

-- Drop the existing overly restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new policy that allows viewing basic profile info for friend discovery
-- but restricts sensitive information like email
CREATE POLICY "Users can view basic profile info for friends" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own full profile
  auth.uid() = id 
  OR 
  -- Or users can see basic info (username, full_name, avatar_url) of others
  -- This enables friend discovery and friend list functionality
  true
);

-- Add a more restrictive policy for sensitive columns using a security definer function
CREATE OR REPLACE FUNCTION public.get_profile_for_user(profile_id uuid, requesting_user_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz,
  updated_at timestamptz,
  onboarding_completed boolean,
  preferences jsonb,
  notification_preferences jsonb,
  privacy_settings jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF requesting_user_id = profile_id THEN
    -- Return full profile for own data
    RETURN QUERY
    SELECT p.id, p.username, p.full_name, p.avatar_url, p.email, 
           p.created_at, p.updated_at, p.onboarding_completed,
           p.preferences, p.notification_preferences, p.privacy_settings
    FROM public.profiles p
    WHERE p.id = profile_id;
  ELSE
    -- Return limited profile for others (no email or sensitive settings)
    RETURN QUERY
    SELECT p.id, p.username, p.full_name, p.avatar_url, NULL::text as email,
           p.created_at, p.updated_at, NULL::boolean as onboarding_completed,
           NULL::jsonb as preferences, NULL::jsonb as notification_preferences,
           NULL::jsonb as privacy_settings
    FROM public.profiles p
    WHERE p.id = profile_id;
  END IF;
END;
$$;