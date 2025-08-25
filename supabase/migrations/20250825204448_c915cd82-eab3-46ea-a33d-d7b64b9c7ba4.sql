-- Fix the function search path security issue
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
SET search_path = public
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