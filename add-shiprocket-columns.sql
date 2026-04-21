-- Add Shiprocket integration columns to orders table
-- This script adds tracking and shipping integration fields

-- Add AWB/tracking column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS awb_code TEXT;

-- Add Shiprocket order ID column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;

-- Add shipment ID column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipment_id BIGINT;

-- Add courier name column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS courier_name TEXT;

-- Add pickup request status column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_status TEXT DEFAULT 'pending' CHECK (pickup_status IN ('pending', 'requested', 'scheduled', 'picked'));

-- Add shipping method column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_method TEXT DEFAULT 'standard' CHECK (shipping_method IN ('standard', 'express'));

-- Add estimated delivery date
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;

-- Add actual delivery date
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Add payment method column (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online' CHECK (payment_method IN ('online', 'cod'));

-- Add payment status column (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_awb_code ON orders(awb_code);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON orders(shiprocket_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_id ON orders(shipment_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_name ON orders(courier_name);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_status ON orders(pickup_status);

-- Update RLS policies to allow vendors to update shipping fields
CREATE POLICY "Vendors can update shipping fields" ON orders FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM vendors WHERE is_approved = TRUE
  )
);

COMMENT ON COLUMN orders.awb_code IS 'AWB (Air Waybill) code from Shiprocket for tracking';
COMMENT ON COLUMN orders.shiprocket_order_id IS 'Shiprocket internal order ID';
COMMENT ON COLUMN orders.shipment_id IS 'Shiprocket shipment ID for tracking';
COMMENT ON COLUMN orders.courier_name IS 'Name of the courier service assigned by Shiprocket';
COMMENT ON COLUMN orders.pickup_status IS 'Status of pickup request with Shiprocket';
COMMENT ON COLUMN orders.shipping_method IS 'Shipping method selected (standard/express)';
COMMENT ON COLUMN orders.estimated_delivery IS 'Estimated delivery date from Shiprocket';
COMMENT ON COLUMN orders.delivered_at IS 'Actual delivery timestamp when order is marked delivered';
