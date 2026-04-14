
-- 1. Fix orders: Drop the overly permissive "Anyone can view orders by email" policy
DROP POLICY IF EXISTS "Anyone can view orders by email" ON public.orders;

-- 2. Fix order_items: Drop the overly permissive "Anyone can view order items for accessible orders" policy
DROP POLICY IF EXISTS "Anyone can view order items for accessible orders" ON public.order_items;

-- 3. Create secure RPC for guest order tracking (returns order by email + id prefix)
CREATE OR REPLACE FUNCTION public.lookup_order_by_email(_email text, _order_prefix text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_prefix text;
BEGIN
  -- Validate and sanitize inputs
  v_email := LOWER(TRIM(_email));
  v_prefix := LOWER(TRIM(_order_prefix));
  
  IF v_email = '' OR v_prefix = '' THEN
    RETURN;
  END IF;
  
  -- Require at least 6 chars of order prefix to prevent enumeration
  IF LENGTH(v_prefix) < 6 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT row_to_json(t) FROM (
    SELECT 
      o.id,
      o.created_at,
      o.status,
      o.payment_status,
      o.payment_method,
      o.customer_name,
      o.customer_email,
      o.shipping_address,
      o.city,
      o.subtotal,
      o.shipping_cost,
      o.discount,
      o.total,
      (
        SELECT json_agg(row_to_json(oi))
        FROM (
          SELECT oi2.id, oi2.product_name, oi2.quantity, oi2.unit_price, oi2.total_price
          FROM public.order_items oi2
          WHERE oi2.order_id = o.id
        ) oi
      ) AS order_items
    FROM public.orders o
    WHERE LOWER(o.customer_email) = v_email
      AND LOWER(o.id::text) LIKE (v_prefix || '%')
    LIMIT 1
  ) t;
END;
$$;

-- 4. Remove plaintext security Q&A columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS security_question;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS security_answer;

-- 5. Remove "Profiles require authentication" policy (too broad - lets any authed user see ALL profiles)
DROP POLICY IF EXISTS "Profiles require authentication" ON public.profiles;
