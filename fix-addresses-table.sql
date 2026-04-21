-- Fix shipping_addresses table for Num1Store
-- Run this in Supabase SQL Editor to fix the address saving issues

-- Step 1: Alter the shipping_addresses table to set default value for is_default column
ALTER TABLE shipping_addresses ALTER COLUMN is_default SET DEFAULT false;

-- Step 2: Drop existing RLS policies for shipping_addresses table (if they exist)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON shipping_addresses;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON shipping_addresses;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON shipping_addresses;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON shipping_addresses;

-- Step 3: Create proper RLS policies for shipping_addresses table

-- Policy for users to view their own addresses
CREATE POLICY "Enable select for users based on user_id" ON "public"."shipping_addresses" 
FOR SELECT USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own addresses
CREATE POLICY "Enable insert for authenticated users only" ON "public"."shipping_addresses" 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own addresses
CREATE POLICY "Enable update for users based on user_id" ON "public"."shipping_addresses" 
FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own addresses
CREATE POLICY "Enable delete for users based on user_id" ON "public"."shipping_addresses" 
FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Ensure RLS is enabled on the shipping_addresses table
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Step 5: Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_is_default ON shipping_addresses(is_default);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Shipping addresses table fixed successfully!';
  RAISE NOTICE '1. Added default value (false) for is_default column';
  RAISE NOTICE '2. Created proper RLS policies for authenticated users';
  RAISE NOTICE '3. Users can now insert, select, update, and delete their own addresses';
  RAISE NOTICE '4. Added performance indexes';
END $$;
