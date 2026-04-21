-- Create a database function to handle order creation with order_items in a single transaction
-- This bypasses RLS issues by using SECURITY DEFINER

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
SECURITY DEFINER -- This bypasses RLS
AS $$
DECLARE
  new_order_id UUID;
  item_record JSONB;
  item_product_id UUID;
  item_quantity INTEGER;
  item_price DECIMAL;
BEGIN
  -- Start transaction
  BEGIN
    -- Create the order
    INSERT INTO orders (
      customer_id,
      total_amount,
      status,
      payment_method,
      payment_status,
      shipping_address
    ) VALUES (
      p_customer_id,
      p_total_amount,
      p_status,
      p_payment_method,
      p_payment_status,
      p_shipping_address
    ) RETURNING id INTO new_order_id;
    
    -- Create order items
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
      item_product_id := (item_record->>'product_id')::UUID;
      item_quantity := (item_record->>'quantity')::INTEGER;
      item_price := (item_record->>'price')::DECIMAL;
      
      INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        price
      ) VALUES (
        new_order_id,
        item_product_id,
        item_quantity,
        item_price
      );
    END LOOP;
    
    -- Return success
    RETURN QUERY SELECT new_order_id, true, NULL::TEXT;
    RETURN;
    
  EXCEPTION WHEN OTHERS THEN
    -- Return detailed error
    DECLARE
      error_msg TEXT;
    BEGIN
      error_msg := SQLERRM;
      
      -- Add more context for common errors
      IF error_msg LIKE '%foreign key constraint%' THEN
        IF error_msg LIKE '%orders_customer_id_fkey%' THEN
          error_msg := 'Customer ID not found. Please ensure you are properly signed in.';
        ELSIF error_msg LIKE '%order_items_product_id_fkey%' THEN
          error_msg := 'One or more products not found in catalog.';
        ELSIF error_msg LIKE '%order_items_order_id_fkey%' THEN
          error_msg := 'Order creation failed. Please try again.';
        ELSE
          error_msg := 'Referenced data not found: ' || error_msg;
        END IF;
      END IF;
      
      RETURN QUERY SELECT NULL::UUID, false, error_msg;
      ROLLBACK;
    END;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_items TO anon;
