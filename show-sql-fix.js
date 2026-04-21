const fs = require('fs');

console.log('🔧 COD Order Error Fix');
console.log('======================');
console.log('');
console.log('❌ Error: "Could not find the payment_method column of orders in the schema cache"');
console.log('');
console.log('✅ Solution: Run this SQL in your Supabase SQL Editor:');
console.log('');

try {
  const sqlScript = fs.readFileSync('./add-payment-method-column.sql', 'utf8');
  console.log(sqlScript);
} catch (err) {
  console.log('Could not read add-payment-method-column.sql file');
  console.log('Please run this SQL manually:');
  console.log(`
-- Add payment_method column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online' 
CHECK (payment_method IN ('online', 'cod'));

-- Add payment_status column  
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid' 
CHECK (payment_status IN ('paid', 'unpaid', 'refunded'));

-- Update existing orders
UPDATE orders 
SET payment_status = 'paid' 
WHERE payment_method = 'online' AND payment_status IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
`);
}

console.log('📋 Steps to fix:');
console.log('1. Open your Supabase project dashboard');
console.log('2. Go to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run"');
console.log('5. Try the COD order again');
console.log('');
console.log('🎯 This will add the missing payment_method and payment_status columns to the orders table.');
