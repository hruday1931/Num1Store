-- Add phone_number column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add is_subscribed column to vendors table for tracking subscription status
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE;

-- Update RLS policies to allow users to view their own vendor subscription status
CREATE POLICY "Users can view own subscription status" ON vendors
    FOR SELECT USING (auth.uid() = user_id);

-- Create index for better performance on phone_number
CREATE INDEX IF NOT EXISTS idx_vendors_phone_number ON vendors(phone_number);

-- Create index for better performance on is_subscribed
CREATE INDEX IF NOT EXISTS idx_vendors_is_subscribed ON vendors(is_subscribed);
