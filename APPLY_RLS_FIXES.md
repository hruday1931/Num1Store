# Fix Vendor Dashboard Console Error

## Problem
The vendor dashboard is showing console errors when fetching recent orders because the Row Level Security (RLS) policies are too restrictive. Vendors cannot access order_items and orders data for their products.

## Solution
Apply the RLS fixes by running the SQL commands in your Supabase SQL Editor.

## Steps to Fix

### 1. Open Supabase SQL Editor
- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Create a new query

### 2. Run the Following SQL

```sql
-- Fix RLS policies for order_items and orders tables to allow vendors to see their product orders
-- This fixes the console errors in vendor dashboard when fetching orders count and recent orders

-- =====================================================
-- FIX ORDER_ITEMS TABLE POLICIES
-- =====================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

-- Create comprehensive policies for order_items
-- 1. Customers can view their own order items
CREATE POLICY "Customers can view own order items" ON order_items FOR SELECT USING (
  auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
);

-- 2. Vendors can view order items for their products
CREATE POLICY "Vendors can view order items for their products" ON order_items FOR SELECT USING (
  auth.uid() IN (
    SELECT vendor_id 
    FROM products 
    WHERE id = product_id
  )
);

-- 3. Insert policy for order creation
CREATE POLICY "Enable insert for authenticated users" ON order_items FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
);

-- 4. Update policy (if needed)
CREATE POLICY "Enable update for order owners" ON order_items FOR UPDATE USING (
  auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
);

-- 5. Delete policy (if needed)  
CREATE POLICY "Enable delete for order owners" ON order_items FOR DELETE USING (
  auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
);

-- =====================================================
-- FIX ORDERS TABLE POLICIES
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Create comprehensive policies for orders
-- 1. Customers can view their own orders
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (
  auth.uid() = customer_id
);

-- 2. Vendors can view orders containing their products (KEY FIX FOR RECENT ORDERS)
CREATE POLICY "Vendors can view orders with their products" ON orders FOR SELECT USING (
  EXISTS (
    SELECT 1 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id 
    AND p.vendor_id = auth.uid()
  )
);

-- 3. Users can create own orders
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (
  auth.uid() = customer_id
);

-- 4. Users can update own orders
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (
  auth.uid() = customer_id
);

-- 5. Admins can view all orders (if needed)
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM vendors WHERE is_approved = TRUE AND is_admin = TRUE)
);
```

### 3. Verify the Fix
After running the SQL, refresh the vendor dashboard page. The console error should be resolved and recent orders should display properly.

## What This Fixes

1. **Console Error**: Removes the "Error fetching recent orders: {}" error
2. **Order Access**: Allows vendors to see orders for their products through order_items
3. **Recent Orders Display**: Enables the recent orders table to show vendor's product orders
4. **Order Count**: Fixes the total orders count calculation

## Technical Details

The issue was that the original RLS policy only allowed customers to see their own orders:
```sql
-- Old restrictive policy
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
);
```

The new policies add vendor access:
```sql
-- New vendor-friendly policy
CREATE POLICY "Vendors can view order items for their products" ON order_items FOR SELECT USING (
  auth.uid() IN (
    SELECT vendor_id 
    FROM products 
    WHERE id = product_id
  )
);
```

This allows vendors to access order data for products they own, which is essential for the dashboard functionality.
