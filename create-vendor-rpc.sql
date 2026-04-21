-- Create RPC function to update vendor status in profiles table
CREATE OR REPLACE FUNCTION update_profile_vendor_status(
  user_id UUID,
  is_vendor BOOLEAN,
  subscription_status TEXT,
  phone TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_vendor = is_vendor,
    subscription_status = subscription_status,
    phone = phone,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_profile_vendor_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_vendor_status TO anon;
