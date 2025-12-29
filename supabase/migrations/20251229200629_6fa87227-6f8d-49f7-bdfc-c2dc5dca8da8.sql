-- Update profiles table so customers don't need approval (is_approved defaults to true)
ALTER TABLE public.profiles 
ALTER COLUMN is_approved SET DEFAULT true;

-- Update existing unapproved profiles to be approved (for non-admin users)
UPDATE public.profiles 
SET is_approved = true 
WHERE is_approved = false;