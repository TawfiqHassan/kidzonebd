-- Fix guest checkout: allow inserting order_items for guest orders without requiring SELECT access to orders

-- 1) Security definer helper to check if an order belongs to the current user OR is a guest order (user_id IS NULL)
CREATE OR REPLACE FUNCTION public.can_insert_order_item(_order_id uuid)
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
      AND (
        (o.user_id = auth.uid())
        OR (o.user_id IS NULL AND auth.uid() IS NULL)
      )
  );
$$;

-- 2) Replace the INSERT policy on order_items to use the helper (avoids RLS blocking the orders subquery)
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;

CREATE POLICY "Users can create order items for their orders"
ON public.order_items
FOR INSERT
WITH CHECK (public.can_insert_order_item(order_id));
