-- Create shipping_addresses table for Num1Store
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shipping_addresses (
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

-- Create policies for shipping_addresses
CREATE POLICY "Users can view own shipping addresses" ON shipping_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shipping addresses" ON shipping_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shipping addresses" ON shipping_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shipping addresses" ON shipping_addresses FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_is_default ON shipping_addresses(is_default);

-- Add constraint to ensure only one default address per user
ALTER TABLE shipping_addresses ADD CONSTRAINT unique_default_address 
  EXCLUDE (user_id WITH =) WHERE (is_default = TRUE);
