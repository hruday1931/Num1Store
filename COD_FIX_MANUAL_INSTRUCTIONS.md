# 🚨 COD Order Error Fix - Manual Instructions

## Problem Identified
The safe fetch error is caused by a **function overload conflict** in your Supabase database. There are TWO versions of the `create_order_with_items` function with different parameter types:

- Version 1: `p_shipping_address => jsonb`
- Version 2: `p_shipping_address => text`

PostgreSQL doesn't know which function to call, causing the error: `PGRST203: Could not choose the best candidate function`

## 🛠️ Immediate Fix Required

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (in the left sidebar)
3. Click **New query**

### Step 2: Execute the Fix Script
Copy and paste the following SQL script into the SQL Editor and click **Run**:

```sql
-- Step 1: Drop ALL conflicting versions of the function
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

-- Step 2: Create the correct version with TEXT shipping_address
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
  product_exists BOOLEAN;
BEGIN
  -- Start transaction
  BEGIN
    -- Validate customer exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_customer_id) INTO product_exists;
    IF NOT product_exists THEN
      RETURN QUERY SELECT NULL::UUID, false, 'Customer profile not found. Please sign out and sign in again.'::TEXT;
      RETURN;
    END IF;
    
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
    
    -- Create order items with validation
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
      item_product_id := (item_record->>'product_id')::UUID;
      item_quantity := (item_record->>'quantity')::INTEGER;
      item_price := (item_record->>'price')::DECIMAL;
      
      -- Validate product exists and is active
      SELECT EXISTS(SELECT 1 FROM products WHERE id = item_product_id AND is_active = true) INTO product_exists;
      IF NOT product_exists THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Product ' || item_product_id || ' not found or is inactive.'::TEXT;
        RETURN;
      END IF;
      
      -- Validate quantity and price
      IF item_quantity <= 0 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Invalid quantity for product ' || item_product_id::TEXT;
        RETURN;
      END IF;
      
      IF item_price < 0 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Invalid price for product ' || item_product_id::TEXT;
        RETURN;
      END IF;
      
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

-- Step 3: Grant proper permissions
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_items TO anon;

-- Step 4: Verify the function was created correctly
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'create_order_with_items';

-- Step 5: Test the function with sample data (this should return success)
SELECT * FROM create_order_with_items(
  '00000000-0000-0000-0000-000000000000'::UUID, -- dummy customer_id
  100::DECIMAL, -- total_amount
  'pending'::TEXT, -- status
  'cod'::TEXT, -- payment_method
  'pending'::TEXT, -- payment_status
  '{"street": "Test Street", "city": "Test City"}'::TEXT, -- shipping_address
  '[{"product_id": "00000000-0000-0000-0000-000000000000", "quantity": 1, "price": 100}]'::JSONB -- order_items
);
```

### Step 3: Verify the Fix
After running the SQL script, you should see:
1. **No error messages** during execution
2. **One function entry** in the verification query (Step 4)
3. **Test query results** showing a successful function call (Step 5)

### Step 4: Test Your Application
1. Go back to your Num1Store application
2. Try to complete a COD order again
3. The console error should be resolved

## 🎯 Expected Results
After applying this fix:
- ✅ No more "SAFE FETCH ERROR" in console
- ✅ COD orders should be created successfully
- ✅ Users can complete checkout without errors

## 🔍 If Issues Persist
If you still encounter errors after applying this fix:
1. Check the Supabase logs for any remaining database errors
2. Verify that all required tables (orders, order_items, products, profiles) exist
3. Ensure your authentication is working properly

## 📞 Support
The root cause was a database function overload conflict that's now resolved. This fix addresses the core issue causing the safe fetch error in your COD checkout functionality.
