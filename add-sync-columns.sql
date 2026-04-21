-- Add sync tracking columns to orders table
-- This script adds fields to track automatic synchronization with Shiprocket

-- Add sync timestamp column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- Add current location column for tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS current_location TEXT;

-- Create index for sync status
CREATE INDEX IF NOT EXISTS idx_orders_synced_at ON orders(synced_at);
CREATE INDEX IF NOT EXISTS idx_orders_current_location ON orders(current_location);

-- Add comments
COMMENT ON COLUMN orders.synced_at IS 'Timestamp when order was automatically synced with Shiprocket';
COMMENT ON COLUMN orders.current_location IS 'Current location of shipment from tracking data';

-- Update existing orders that have shiprocket_order_id but no sync timestamp
UPDATE orders 
SET synced_at = created_at 
WHERE shiprocket_order_id IS NOT NULL AND synced_at IS NULL;
