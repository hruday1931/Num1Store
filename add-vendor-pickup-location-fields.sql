-- Add pickup location related fields to vendors table
-- Run this migration to support Shiprocket pickup location registration

-- Add pickup_address field to store vendor's pickup location details
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS pickup_address JSONB;

-- Add Shiprocket integration fields
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS shiprocket_pickup_location_id TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS pickup_location_registered BOOLEAN DEFAULT FALSE;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS pickup_location_registered_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on pickup location registration status
CREATE INDEX IF NOT EXISTS idx_vendors_pickup_location_registered 
ON vendors(pickup_location_registered);

-- Add RLS policy for pickup location fields (if RLS is enabled)
-- Allow vendors to see their own pickup location info
CREATE POLICY IF NOT EXISTS "Vendors can view own pickup location" ON vendors
FOR SELECT USING (
  auth.uid() = user_id
);

-- Allow vendors to update their own pickup location info
CREATE POLICY IF NOT EXISTS "Vendors can update own pickup location" ON vendors
FOR UPDATE USING (
  auth.uid() = user_id
);

-- Add comment to document the new fields
COMMENT ON COLUMN vendors.pickup_address IS 'JSON object containing pickup address details for Shiprocket integration';
COMMENT ON COLUMN vendors.shiprocket_pickup_location_id IS 'Shiprocket pickup location identifier (when available)';
COMMENT ON COLUMN vendors.pickup_location_registered IS 'Flag indicating if pickup location has been registered in Shiprocket';
COMMENT ON COLUMN vendors.pickup_location_registered_at IS 'Timestamp when pickup location was registered in Shiprocket';

-- Example pickup_address structure:
-- {
--   "address": "123 Commercial Street",
--   "address_2": "Shop No. 45, First Floor",
--   "city": "Mumbai",
--   "state": "Maharashtra",
--   "country": "India",
--   "pin_code": "400001"
-- }
