-- Create the vendor record with the specific ID needed for product creation
-- Run this in Supabase SQL Editor

-- First, let's check if the vendor already exists
SELECT * FROM vendors WHERE id = '266be90a-76e1-405d-ac63-0f592a43f866';

-- Insert the vendor record if it doesn't exist
INSERT INTO vendors (
  id,
  user_id,
  store_name,
  store_description,
  is_approved,
  created_at,
  updated_at
) VALUES (
  '266be90a-76e1-405d-ac63-0f592a43f866',
  '266be90a-76e1-405d-ac63-0f592a43f866',
  'Test Store',
  'Test vendor store for product creation',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Also create a profile record for the user
INSERT INTO profiles (
  id,
  full_name,
  phone,
  created_at,
  updated_at
) VALUES (
  '266be90a-76e1-405d-ac63-0f592a43f866',
  'Test Vendor',
  '1234567890',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the vendor was created
SELECT * FROM vendors WHERE id = '266be90a-76e1-405d-ac63-0f592a43f866';
