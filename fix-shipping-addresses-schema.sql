-- Fix shipping_addresses table schema for Num1Store
-- Run this in Supabase SQL Editor to fix column errors

-- Drop table if it exists with wrong schema and recreate with correct schema
DROP TABLE IF EXISTS shipping_addresses CASCADE;

-- Recreate shipping_addresses table with exact column names
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

-- Create RLS policies
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'shipping_addresses table recreated with correct schema!';
  RAISE NOTICE 'Columns: full_name, street_address, city, state, pin_code, phone_number, is_default';
  RAISE NOTICE 'Address saving should now work correctly.';
END $$;
