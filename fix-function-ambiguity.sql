-- Fix function ambiguity by dropping the jsonb version and keeping the text version
-- Run this SQL in your Supabase SQL editor

-- First, check what functions exist
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'create_order_with_items';

-- Drop the jsonb version (if it exists)
DROP FUNCTION IF EXISTS create_order_with_items(
  p_customer_id UUID,
  p_order_items JSONB,
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_shipping_address JSONB,
  p_status TEXT,
  p_total_amount NUMERIC
);

-- Keep only the text version
-- The text version should have this signature:
-- create_order_with_items(
--   p_customer_id UUID,
--   p_order_items JSONB,
--   p_payment_method TEXT,
--   p_payment_status TEXT,
--   p_shipping_address TEXT,
--   p_status TEXT,
--   p_total_amount NUMERIC
-- )

-- Verify only one function remains
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'create_order_with_items';
