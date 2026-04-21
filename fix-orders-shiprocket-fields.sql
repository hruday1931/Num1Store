-- Add missing customer address fields to orders table for Shiprocket integration
-- This script adds the required fields that the Shiprocket service expects

-- Add customer name field
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add customer email field  
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add customer phone field
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add billing address fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pincode TEXT;

-- Add comments for documentation
COMMENT ON COLUMN orders.customer_name IS 'Customer full name for shipping';
COMMENT ON COLUMN orders.customer_email IS 'Customer email address for notifications';
COMMENT ON COLUMN orders.customer_phone IS 'Customer phone number for delivery contact';
COMMENT ON COLUMN orders.address IS 'Street address for delivery';
COMMENT ON COLUMN orders.city IS 'City for delivery address';
COMMENT ON COLUMN orders.state IS 'State for delivery address';
COMMENT ON COLUMN orders.country IS 'Country for delivery address';
COMMENT ON COLUMN orders.pincode IS 'Postal code for delivery address';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_pincode ON orders(pincode);

-- Update RLS policies to allow vendors to read customer shipping info
CREATE POLICY "Vendors can read customer shipping info" ON orders FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM vendors WHERE is_approved = TRUE
  )
);

-- Function to populate customer info from shipping_addresses during order creation
CREATE OR REPLACE FUNCTION populate_order_customer_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Get customer info from the most recent shipping address
  SELECT 
    sa.full_name,
    sa.phone_number,
    sa.street_address,
    sa.city,
    sa.state,
    sa.pin_code
  INTO 
    NEW.customer_name,
    NEW.customer_phone,
    NEW.address,
    NEW.city,
    NEW.state,
    NEW.pincode
  FROM shipping_addresses sa
  WHERE sa.user_id = NEW.customer_id AND sa.is_default = TRUE
  LIMIT 1;
  
  -- Get customer email from profiles
  SELECT 
    p.email
  INTO 
    NEW.customer_email
  FROM profiles p
  WHERE p.id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate customer info
DROP TRIGGER IF EXISTS trigger_populate_order_customer_info ON orders;
CREATE TRIGGER trigger_populate_order_customer_info
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION populate_order_customer_info();

-- Update existing orders with customer info (if possible)
UPDATE orders o
SET 
  customer_name = COALESCE(o.customer_name, sa.full_name),
  customer_phone = COALESCE(o.customer_phone, sa.phone_number),
  address = COALESCE(o.address, sa.street_address),
  city = COALESCE(o.city, sa.city),
  state = COALESCE(o.state, sa.state),
  pincode = COALESCE(o.pincode, sa.pin_code),
  customer_email = COALESCE(o.customer_email, p.email)
FROM shipping_addresses sa
JOIN profiles p ON p.id = o.customer_id
WHERE sa.user_id = o.customer_id 
  AND sa.is_default = TRUE
  AND (o.customer_name IS NULL OR o.customer_phone IS NULL OR o.customer_email IS NULL);
