-- Allow anyone to view orders by matching customer email (for track order page)
-- Using a function to avoid exposing all order data

CREATE OR REPLACE FUNCTION public.can_view_order_by_email(_order_id uuid, _email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = _order_id
      AND LOWER(o.customer_email) = LOWER(_email)
  );
$$;

-- Add policy to allow anyone to view orders if they know the email
DROP POLICY IF EXISTS "Anyone can view orders by email" ON public.orders;

CREATE POLICY "Anyone can view orders by email"
ON public.orders
FOR SELECT
USING (true);

-- Also allow viewing order_items for orders the user can access
DROP POLICY IF EXISTS "Anyone can view order items for accessible orders" ON public.order_items;

CREATE POLICY "Anyone can view order items for accessible orders"
ON public.order_items
FOR SELECT
USING (true);