-- Emergency Schema Fix for Checkout Issues
-- Run this immediately in Supabase SQL Editor

-- Step 1: Force PostgREST to reload schema cache multiple times
NOTIFY pgrst, 'reload schema';
-- Wait a moment and reload again
SELECT pg_sleep(0.1);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(0.1);
NOTIFY pgrst, 'reload schema';

-- Step 2: Verify and fix profiles table
DO $$
BEGIN
    -- Add address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'address'
    ) THEN
        ALTER TABLE profiles ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to profiles';
    END IF;
    
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to profiles';
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles';
    END IF;
END $$;

-- Step 3: Verify and fix orders table
DO $$
BEGIN
    -- Add customer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added customer_id column to orders';
    END IF;
    
    -- Also add user_id as fallback if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added user_id column to orders as fallback';
    END IF;
    
    -- Add total_amount if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        RAISE NOTICE 'Added total_amount column to orders';
    END IF;
    
    -- Add status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'status'
    ) THEN
        ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));
        RAISE NOTICE 'Added status column to orders';
    END IF;
    
    -- Add shipping_address if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_address TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added shipping_address column to orders';
    END IF;
END $$;

-- Step 4: Verify and fix order_items table
DO $$
BEGIN
    -- Add order_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'order_id'
    ) THEN
        ALTER TABLE order_items ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added order_id column to order_items';
    END IF;
    
    -- Add product_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_id UUID REFERENCES products(id);
        RAISE NOTICE 'Added product_id column to order_items';
    END IF;
    
    -- Add quantity if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added quantity column to order_items';
    END IF;
    
    -- Add price if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'price'
    ) THEN
        ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
        RAISE NOTICE 'Added price column to order_items';
    END IF;
END $$;

-- Step 5: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Step 6: Recreate all policies to ensure they're correct
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users" ON profiles;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON order_items;

-- Recreate policies
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable insert for authentication" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable delete for users" ON profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can create own order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Step 7: Final schema cache reload
NOTIFY pgrst, 'reload schema';

-- Step 8: Verification queries
SELECT 'Profiles table columns:' as table_info;
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;

SELECT 'Orders table columns:' as table_info;
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;

SELECT 'Order_items table columns:' as table_info;
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'order_items' ORDER BY ordinal_position;

SELECT 'Current policies:' as table_info;
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('profiles', 'orders', 'order_items') ORDER BY tablename, policyname;
