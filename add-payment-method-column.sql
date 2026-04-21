-- Add payment_method and payment_status columns to orders table for COD support
-- Run this in Supabase SQL Editor

-- Add payment_method column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online' 
CHECK (payment_method IN ('online', 'cod'));

-- Add payment_status column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid' 
CHECK (payment_status IN ('paid', 'unpaid', 'refunded'));

-- Update existing orders to have correct payment status
UPDATE orders 
SET payment_status = 'paid' 
WHERE payment_method = 'online' AND payment_status IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Update RLS policies to allow vendors to see payment info
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM vendors WHERE is_approved = TRUE)
);

-- Grant necessary permissions
GRANT ALL ON orders TO authenticated;
GRANT SELECT ON orders TO anon;
