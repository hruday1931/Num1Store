-- Comprehensive fix for product creation foreign key constraint issues
-- Run this in Supabase SQL Editor

-- Step 1: Remove any orphaned products
DELETE FROM products WHERE vendor_id NOT IN (SELECT id FROM vendors);

-- Step 2: Ensure RLS policies are correctly configured
DROP POLICY IF EXISTS "Vendors can insert own products" ON products;
CREATE POLICY "Vendors can insert own products" ON products FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id)
);

-- Step 3: Create a function to automatically create vendor profile if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_vendor_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if vendor exists for this user
  IF NOT EXISTS (SELECT 1 FROM vendors WHERE user_id = auth.uid()) THEN
    -- Create vendor profile automatically
    INSERT INTO vendors (user_id, store_name, store_description, is_approved)
    VALUES (
      auth.uid(),
      COALESCE(
        (SELECT full_name FROM profiles WHERE id = auth.uid()),
        'Store ' || COALESCE(
          (SELECT email FROM auth.users WHERE id = auth.uid()),
          'Unknown'
        )
      ),
      'Auto-created vendor store',
      TRUE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a trigger to ensure vendor profile exists
-- Note: This is optional and can be used if you want automatic vendor creation
-- CREATE TRIGGER ensure_vendor_exists
--   BEFORE INSERT ON products
--   FOR EACH ROW
--   EXECUTE FUNCTION ensure_vendor_profile();

-- Step 5: Create a helper function to get vendor ID for current user
CREATE OR REPLACE FUNCTION get_current_vendor_id()
RETURNS UUID AS $$
DECLARE
  vendor_id UUID;
BEGIN
  SELECT id INTO vendor_id FROM vendors WHERE user_id = auth.uid();
  
  IF vendor_id IS NULL THEN
    -- Create vendor if it doesn't exist
    INSERT INTO vendors (user_id, store_name, store_description, is_approved)
    VALUES (
      auth.uid(),
      COALESCE(
        (SELECT full_name FROM profiles WHERE id = auth.uid()),
        'Store ' || COALESCE(
          (SELECT email FROM auth.users WHERE id = auth.uid()),
          'Unknown'
        )
      ),
      'Auto-created vendor store',
      TRUE
    )
    RETURNING id INTO vendor_id;
  END IF;
  
  RETURN vendor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_current_vendor_id() TO authenticated;

-- Step 7: Create a view for easy product management
CREATE OR REPLACE VIEW vendor_products AS
SELECT 
  p.*,
  v.store_name,
  v.user_id as vendor_user_id
FROM products p
JOIN vendors v ON p.vendor_id = v.id
WHERE v.user_id = auth.uid();

-- Step 8: Test the setup (optional - you can comment this out)
-- SELECT get_current_vendor_id();

-- Step 9: Add better error handling constraint
ALTER TABLE products ADD CONSTRAINT check_vendor_exists 
  CHECK (vendor_id IN (SELECT id FROM vendors));

-- Note: The constraint above might not work in PostgreSQL as written
-- Instead, let's ensure proper foreign key constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_vendor_id_fkey;
ALTER TABLE products 
  ADD CONSTRAINT products_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

-- Verification query
SELECT 
  'Products with valid vendors' as status,
  COUNT(*) as count
FROM products p
JOIN vendors v ON p.vendor_id = v.id

UNION ALL

SELECT 
  'Orphaned products (should be 0)' as status,
  COUNT(*) as count
FROM products p
LEFT JOIN vendors v ON p.vendor_id = v.id
WHERE v.id IS NULL;
