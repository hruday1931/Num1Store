-- Fix Vendor Schema for Num1Store
-- Run this in Supabase SQL Editor to fix vendor creation issues

-- ===========================================
-- FIX 1: Add missing is_subscribed column to vendors table
-- ===========================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE;

-- ===========================================
-- FIX 2: Ensure RLS policies are properly set for vendors
-- ===========================================

-- Drop existing policies to recreate them (to ensure they're correct)
DROP POLICY IF EXISTS "Vendors can view own vendor info" ON vendors;
DROP POLICY IF EXISTS "Vendors can update own vendor info" ON vendors;
DROP POLICY IF EXISTS "Vendors can insert own vendor info" ON vendors;

-- Recreate policies for vendors with proper INSERT permissions
CREATE POLICY "Vendors can view own vendor info" ON vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vendors can update own vendor info" ON vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can insert own vendor info" ON vendors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- FIX 3: Verify vendor_subscriptions table exists and has proper policies
-- ===========================================

-- Create vendor_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'standard', 'premium')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    price_paid DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on vendor_subscriptions
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing subscription policies to recreate them
DROP POLICY IF EXISTS "Users can view own subscriptions" ON vendor_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON vendor_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON vendor_subscriptions;

-- Recreate policies for vendor_subscriptions
CREATE POLICY "Users can view own subscriptions" ON vendor_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON vendor_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON vendor_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- FIX 4: Create indexes for better performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_is_subscribed ON vendors(is_subscribed);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_user_id ON vendor_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor_id ON vendor_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_is_active ON vendor_subscriptions(is_active);

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Check if is_subscribed column exists in vendors table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'vendors' AND column_name = 'is_subscribed';

-- Check vendors table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
ORDER BY ordinal_position;

-- Check RLS policies on vendors table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vendors';

-- Check vendor_subscriptions table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'vendor_subscriptions' 
ORDER BY ordinal_position;

-- Check RLS policies on vendor_subscriptions table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vendor_subscriptions';
