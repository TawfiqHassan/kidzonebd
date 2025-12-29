-- Fix 1: Add is_public column to site_settings and update RLS policies
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Mark common public settings as public (hero, announcement_bar, footer, navbar)
UPDATE public.site_settings SET is_public = true WHERE key IN ('hero', 'announcement_bar', 'footer', 'navbar');

-- Drop old permissive policy
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;

-- Create new selective policies
CREATE POLICY "Public can view public settings" 
  ON public.site_settings 
  FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Admins can view all settings" 
  ON public.site_settings 
  FOR SELECT 
  USING (is_admin());

-- Fix 3: Enhance handle_new_user() with better validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name text;
  v_phone text;
  v_city text;
  v_username text;
  v_email text;
BEGIN
  -- Validate and sanitize inputs with length limits
  v_full_name := TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '') FROM 1 FOR 100));
  v_phone := TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'phone', '') FROM 1 FOR 20));
  v_city := TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'city', '') FROM 1 FOR 100));
  v_username := TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'username', '') FROM 1 FOR 50));
  v_email := TRIM(SUBSTRING(COALESCE(NEW.email, '') FROM 1 FOR 255));
  
  -- Basic XSS prevention - reject if contains script tags or dangerous patterns
  IF v_full_name ~* '<script|javascript:|on\w+=' OR
     v_phone ~* '<script|javascript:|on\w+=' OR
     v_city ~* '<script|javascript:|on\w+=' OR
     v_username ~* '<script|javascript:|on\w+=' THEN
    RAISE EXCEPTION 'Invalid characters detected in user data';
  END IF;
  
  -- Email format validation (basic check)
  IF v_email != '' AND v_email !~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Phone format validation (allow common formats, reject dangerous characters)
  IF v_phone != '' AND v_phone !~ '^[+]?[0-9\s\-\(\)]{7,20}$' THEN
    v_phone := NULL; -- Silently ignore invalid phone rather than blocking registration
  END IF;
  
  -- Username format validation (alphanumeric and underscores only)
  IF v_username != '' AND v_username !~ '^[A-Za-z0-9_]{3,50}$' THEN
    v_username := NULL; -- Silently ignore invalid username
  END IF;
  
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    phone, 
    city, 
    username,
    security_question,
    security_answer
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NULLIF(v_full_name, ''),
    NULLIF(v_phone, ''),
    NULLIF(v_city, ''),
    NULLIF(v_username, ''),
    NULL,
    NULL
  );
  RETURN NEW;
END;
$function$;