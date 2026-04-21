-- IMMEDIATE FIX: Drop the conflicting jsonb version of the function
-- Run this in Supabase SQL Editor

DROP FUNCTION IF EXISTS create_order_with_items(
  p_customer_id UUID,
  p_order_items JSONB,
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_shipping_address JSONB,
  p_status TEXT,
  p_total_amount NUMERIC
);

-- Verify only the text version remains
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'create_order_with_items';
