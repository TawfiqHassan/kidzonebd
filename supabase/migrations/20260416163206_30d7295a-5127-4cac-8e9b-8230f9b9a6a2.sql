
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
  v_full_name := TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '') FROM 1 FOR 100));
  v_phone := TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'phone', '') FROM 1 FOR 20));
  v_city := TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'city', '') FROM 1 FOR 100));
  v_username := TRIM(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'username', '') FROM 1 FOR 50));
  v_email := TRIM(SUBSTRING(COALESCE(NEW.email, '') FROM 1 FOR 255));
  
  IF v_full_name ~* '<script|javascript:|on\w+=' OR
     v_phone ~* '<script|javascript:|on\w+=' OR
     v_city ~* '<script|javascript:|on\w+=' OR
     v_username ~* '<script|javascript:|on\w+=' THEN
    RAISE EXCEPTION 'Invalid characters detected in user data';
  END IF;
  
  IF v_email != '' AND v_email !~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  IF v_phone != '' AND v_phone !~ '^[+]?[0-9\s\-\(\)]{7,20}$' THEN
    v_phone := NULL;
  END IF;
  
  IF v_username != '' AND v_username !~ '^[A-Za-z0-9_]{3,50}$' THEN
    v_username := NULL;
  END IF;
  
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    phone, 
    city, 
    username
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NULLIF(v_full_name, ''),
    NULLIF(v_phone, ''),
    NULLIF(v_city, ''),
    NULLIF(v_username, '')
  );
  RETURN NEW;
END;
$function$;
