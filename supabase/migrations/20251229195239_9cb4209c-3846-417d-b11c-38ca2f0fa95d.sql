-- Fix 1: Update order_items INSERT policy to validate order ownership
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Allow users to create order items only for their own orders
CREATE POLICY "Users can create order items for their orders"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        (orders.user_id = auth.uid()) OR 
        (orders.user_id IS NULL AND auth.uid() IS NULL)
      )
    )
  );

-- Fix 2: Add explicit authentication requirement for profiles SELECT
-- This ensures anonymous users are explicitly blocked even if they know user_id values
CREATE POLICY "Profiles require authentication"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix 3: Add similar protection to customer_addresses (contains PII)
CREATE POLICY "Addresses require authentication"
  ON public.customer_addresses
  FOR SELECT
  USING (auth.uid() IS NOT NULL);