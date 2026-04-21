-- Vendor Subscriptions Table
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_user_id ON vendor_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor_id ON vendor_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_is_active ON vendor_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_end_date ON vendor_subscriptions(end_date);

-- RLS (Row Level Security) Policies
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON vendor_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON vendor_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON vendor_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_vendor_subscriptions_updated_at 
    BEFORE UPDATE ON vendor_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check and update expired subscriptions
CREATE OR REPLACE FUNCTION deactivate_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE vendor_subscriptions 
    SET is_active = false 
    WHERE is_active = true 
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- You can call this function periodically or set up a cron job
-- SELECT deactivate_expired_subscriptions();
