-- Create a function to check if a column exists in a table
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = lower(table_name)
        AND column_name = lower(column_name)
    );
END;
$$;

-- Create a function to get available columns for a table
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TABLE(column_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT column_name::TEXT
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = lower(table_name)
    ORDER BY ordinal_position;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION column_exists TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_table_columns TO authenticated, anon, service_role;

-- Test the functions
SELECT column_exists('profiles', 'address') as has_address_column;
SELECT column_exists('orders', 'customer_id') as has_customer_id_column;
SELECT column_exists('orders', 'user_id') as has_user_id_column;

-- Show all columns for each table
SELECT 'profiles' as table_name, column_name FROM get_table_columns('profiles');
SELECT 'orders' as table_name, column_name FROM get_table_columns('orders');
SELECT 'order_items' as table_name, column_name FROM get_table_columns('order_items');
