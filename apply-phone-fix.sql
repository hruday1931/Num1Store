-- Fix for missing phone_number column in vendors table
-- Run this in Supabase SQL Editor

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' AND column_name = 'phone_number';
