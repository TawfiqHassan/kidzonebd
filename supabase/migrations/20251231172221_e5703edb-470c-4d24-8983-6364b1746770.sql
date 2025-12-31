-- Create a function to validate cart item prices against the products table
-- This prevents price manipulation attacks where users modify cart prices client-side
CREATE OR REPLACE FUNCTION public.validate_cart_item_price()
RETURNS TRIGGER AS $$
DECLARE
  actual_price numeric;
  flash_sale_price numeric;
BEGIN
  -- First check if product exists and get its price
  SELECT price INTO actual_price
  FROM public.products
  WHERE id = NEW.product_id::uuid
  AND is_active = true;
  
  -- If product not found, reject the operation
  IF actual_price IS NULL THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;
  
  -- Check for active flash sale price
  SELECT fsp.sale_price INTO flash_sale_price
  FROM public.flash_sale_products fsp
  INNER JOIN public.flash_sales fs ON fs.id = fsp.flash_sale_id
  WHERE fsp.product_id = NEW.product_id::uuid
    AND fs.is_active = true
    AND fs.start_time <= now()
    AND fs.end_time >= now()
  LIMIT 1;
  
  -- Use flash sale price if available, otherwise use regular price
  IF flash_sale_price IS NOT NULL THEN
    actual_price := flash_sale_price;
  END IF;
  
  -- Validate that the submitted price matches the actual price
  IF NEW.unit_price != actual_price THEN
    -- Auto-correct the price to prevent manipulation
    NEW.unit_price := actual_price;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to validate prices on INSERT and UPDATE
DROP TRIGGER IF EXISTS validate_cart_price_trigger ON public.cart_items;
CREATE TRIGGER validate_cart_price_trigger
BEFORE INSERT OR UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_cart_item_price();

-- Also add validation for order items to prevent checkout manipulation
CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS TRIGGER AS $$
DECLARE
  actual_price numeric;
  flash_sale_price numeric;
BEGIN
  -- Get product price
  SELECT price INTO actual_price
  FROM public.products
  WHERE id = NEW.product_id
  AND is_active = true;
  
  -- If product not found, allow insert (for historical orders with deleted products)
  IF actual_price IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check for active flash sale price
  SELECT fsp.sale_price INTO flash_sale_price
  FROM public.flash_sale_products fsp
  INNER JOIN public.flash_sales fs ON fs.id = fsp.flash_sale_id
  WHERE fsp.product_id = NEW.product_id
    AND fs.is_active = true
    AND fs.start_time <= now()
    AND fs.end_time >= now()
  LIMIT 1;
  
  -- Use flash sale price if available
  IF flash_sale_price IS NOT NULL THEN
    actual_price := flash_sale_price;
  END IF;
  
  -- Auto-correct prices to prevent manipulation
  IF NEW.unit_price != actual_price THEN
    NEW.unit_price := actual_price;
    NEW.total_price := actual_price * NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for order items
DROP TRIGGER IF EXISTS validate_order_price_trigger ON public.order_items;
CREATE TRIGGER validate_order_price_trigger
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_item_price();