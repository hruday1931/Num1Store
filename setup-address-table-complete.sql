-- Complete setup for shipping_addresses table for Num1Store
-- Run this in Supabase SQL Editor if you're getting address loading errors

-- First, drop the table if it exists (to ensure clean setup)
DROP TABLE IF EXISTS shipping_addresses CASCADE;

-- Create shipping_addresses table
CREATE TABLE shipping_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own shipping addresses" ON shipping_addresses;
DROP POLICY IF EXISTS "Users can insert own shipping addresses" ON shipping_addresses;
DROP POLICY IF EXISTS "Users can update own shipping addresses" ON shipping_addresses;
DROP POLICY IF EXISTS "Users can delete own shipping addresses" ON shipping_addresses;

-- Create comprehensive RLS policies for shipping_addresses
CREATE POLICY "Users can view own shipping addresses" ON shipping_addresses 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shipping addresses" ON shipping_addresses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shipping addresses" ON shipping_addresses 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shipping addresses" ON shipping_addresses 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX idx_shipping_addresses_is_default ON shipping_addresses(is_default);
CREATE INDEX idx_shipping_addresses_user_default ON shipping_addresses(user_id, is_default);

-- Add constraint to ensure only one default address per user
-- This uses a more compatible approach than EXCLUDE
ALTER TABLE shipping_addresses ADD CONSTRAINT unique_default_address_per_user 
  UNIQUE (user_id) WHERE (is_default = TRUE);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shipping_addresses_updated_at 
  BEFORE UPDATE ON shipping_addresses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle setting default address
CREATE OR REPLACE FUNCTION set_default_address(address_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Update all other addresses to non-default
  UPDATE shipping_addresses 
  SET is_default = FALSE 
  WHERE user_id = current_user_id AND id != address_id;
  
  -- Set the selected address as default
  UPDATE shipping_addresses 
  SET is_default = TRUE 
  WHERE id = address_id AND user_id = current_user_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error setting default address: %', SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON shipping_addresses TO authenticated;
GRANT SELECT ON shipping_addresses TO anon;

-- Test the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'shipping_addresses' 
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'shipping_addresses table created successfully with RLS policies';
  RAISE NOTICE 'You can now use the address management features in Num1Store';
END $$;
