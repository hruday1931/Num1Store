-- Add location_tag field to vendors table for Shiprocket integration
-- This field will store the Shiprocket pickup location tag/identifier

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS location_tag TEXT;

-- Add comment to document the new field
COMMENT ON COLUMN vendors.location_tag IS 'Shiprocket pickup location tag/identifier for automated shipment creation';

-- Create index for faster queries on location_tag
CREATE INDEX IF NOT EXISTS idx_vendors_location_tag 
ON vendors(location_tag);

-- Update existing vendors with registered pickup locations to use location_tag
UPDATE vendors 
SET location_tag = shiprocket_pickup_location_id 
WHERE pickup_location_registered = true 
AND shiprocket_pickup_location_id IS NOT NULL;

-- Add RLS policy for location_tag field (if RLS is enabled)
-- Allow vendors to see their own location_tag
CREATE POLICY IF NOT EXISTS "Vendors can view own location_tag" ON vendors
FOR SELECT USING (
  auth.uid() = user_id
);

-- Allow vendors to update their own location_tag
CREATE POLICY IF NOT EXISTS "Vendors can update own location_tag" ON vendors
FOR UPDATE USING (
  auth.uid() = user_id
);
