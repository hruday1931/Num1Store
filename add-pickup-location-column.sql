-- Add pickup_location_id column to vendors table
-- This column will store the Shiprocket pickup location ID for each vendor

-- First check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        AND column_name = 'pickup_location_id'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE vendors 
        ADD COLUMN pickup_location_id TEXT;
        
        RAISE NOTICE 'Added pickup_location_id column to vendors table';
    ELSE
        RAISE NOTICE 'pickup_location_id column already exists in vendors table';
    END IF;
END $$;

-- Optional: Add index for better performance if this column will be queried frequently
CREATE INDEX IF NOT EXISTS idx_vendors_pickup_location_id ON vendors(pickup_location_id);

-- Optional: Add comment to document the column
COMMENT ON COLUMN vendors.pickup_location_id IS 'Shiprocket pickup location ID for automated shipping';

-- Verify the column was added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name = 'pickup_location_id';
