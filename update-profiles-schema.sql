-- Update profiles table to add is_vendor and subscription_status fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));

-- Update RLS policies to include new fields
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable insert for authentication" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users" ON profiles FOR UPDATE USING (auth.uid() = id);
