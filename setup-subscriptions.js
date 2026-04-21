const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSubscriptions() {
  try {
    console.log('Setting up vendor subscriptions table...');
    
    // Create the vendor_subscriptions table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_user_id ON vendor_subscriptions(user_id);
        CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor_id ON vendor_subscriptions(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_is_active ON vendor_subscriptions(is_active);
        CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_end_date ON vendor_subscriptions(end_date);
        
        -- Enable RLS
        ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;
        
        -- RLS Policies
        CREATE POLICY IF NOT EXISTS "Users can view own subscriptions" ON vendor_subscriptions
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY IF NOT EXISTS "Users can insert own subscriptions" ON vendor_subscriptions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY IF NOT EXISTS "Users can update own subscriptions" ON vendor_subscriptions
            FOR UPDATE USING (auth.uid() = user_id);
      `
    });
    
    if (error) {
      console.error('Error creating table:', error);
      return;
    }
    
    console.log('Vendor subscriptions table created successfully!');
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Check if this is being run directly
if (require.main === module) {
  console.log('Please set your environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.log('\nThen run: node setup-subscriptions.js');
} else {
  module.exports = { setupSubscriptions };
}
