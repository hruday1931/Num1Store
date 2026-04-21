-- QUICK FIX: Remove function overload conflict
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Step 1: Drop BOTH conflicting function versions
DROP FUNCTION IF EXISTS create_order_with_items(
  p_customer_id UUID,
  p_order_items JSONB,
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_shipping_address JSONB,
  p_status TEXT,
  p_total_amount NUMERIC
);

DROP FUNCTION IF EXISTS create_order_with_items(
  p_customer_id UUID,
  p_order_items JSONB,
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_shipping_address TEXT,
  p_status TEXT,
  p_total_amount NUMERIC
);

-- Step 2: Create the single correct version (TEXT shipping_address)
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_customer_id UUID,
  p_total_amount DECIMAL,
  p_status TEXT DEFAULT 'pending',
  p_payment_method TEXT DEFAULT 'cod',
  p_payment_status TEXT DEFAULT 'pending',
  p_shipping_address TEXT,
  p_order_items JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE(
  order_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id UUID;
  item_record JSONB;
  item_product_id UUID;
  item_quantity INTEGER;
  item_price DECIMAL;
  product_exists BOOLEAN;
BEGIN
  BEGIN
    -- Validate customer exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_customer_id) INTO product_exists;
    IF NOT product_exists THEN
      RETURN QUERY SELECT NULL::UUID, false, 'Customer profile not found.'::TEXT;
      RETURN;
    END IF;
    
    -- Create the order
    INSERT INTO orders (
      customer_id, total_amount, status, payment_method, payment_status, shipping_address
    ) VALUES (
      p_customer_id, p_total_amount, p_status, p_payment_method, p_payment_status, p_shipping_address
    ) RETURNING id INTO new_order_id;
    
    -- Create order items
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
      item_product_id := (item_record->>'product_id')::UUID;
      item_quantity := (item_record->>'quantity')::INTEGER;
      item_price := (item_record->>'price')::DECIMAL;
      
      -- Validate product exists and is active
      SELECT EXISTS(SELECT 1 FROM products WHERE id = item_product_id AND is_active = true) INTO product_exists;
      IF NOT product_exists THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Product not found or inactive.'::TEXT;
        RETURN;
      END IF;
      
      -- Validate quantity
      IF item_quantity <= 0 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Invalid quantity.'::TEXT;
        RETURN;
      END IF;
      
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (new_order_id, item_product_id, item_quantity, item_price);
    END LOOP;
    
    -- Return success
    RETURN QUERY SELECT new_order_id, true, NULL::TEXT;
    RETURN;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, false, SQLERRM::TEXT;
    ROLLBACK;
  END;
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_items TO anon;

-- Step 4: Verify only one function exists
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'create_order_with_items';
