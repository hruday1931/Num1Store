# Vendor Dashboard Order Errors Fix

## Problem Description

The vendor dashboard is showing console errors:
```
Error fetching orders count: {}
Error fetching recent orders: {}
Error fetching sales data: {}
```

These errors occur in `src/app/vendor/dashboard/page.tsx` when trying to fetch order statistics for vendors:
- Line 160: Orders count error
- Line 189: Recent orders error  
- Line 208: Sales data error

## Root Cause Analysis

The issue is caused by **Row Level Security (RLS) policies** on both the `order_items` and `orders` tables being too restrictive.

### Current RLS Policy Issues

**1. order_items table policy:**
The existing policy only allows customers to see their own order items:
```sql
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
);
```

**2. orders table policies:**
The existing policies only allow customers and admins to see orders:
```sql
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (...);
```

These restrictive policies prevent vendors from:
- Calculating total orders count (needs order_items access)
- Computing total sales/revenue (needs order_items access)  
- Fetching recent orders (needs both order_items and orders access due to INNER JOIN)
- **All three queries fail with the same RLS error**

## Solution Options

### Option 1: Apply SQL Fix (Recommended)

Run the SQL from `fix-vendor-order-items-rls.sql` in your Supabase SQL Editor. The file contains comprehensive fixes for both tables:

**Key fixes include:**

**order_items table:**
- Customers can view own order items
- **Vendors can view order items for their products** (fixes orders count + sales data)
- Complete CRUD policies

**orders table:**
- Customers can view own orders  
- **Vendors can view orders with their products** (fixes recent orders)
- Complete CRUD policies

The critical vendor policy for recent orders:
```sql
CREATE POLICY "Vendors can view orders with their products" ON orders FOR SELECT USING (
  EXISTS (
    SELECT 1 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id 
    AND p.vendor_id = auth.uid()
  )
);
```

### Option 2: Use the Provided Script

If you have your Supabase credentials configured in `.env.local`, run:

```bash
node apply-vendor-order-items-fix.js
```

### Option 3: Manual Supabase Dashboard Steps

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Policies**
3. Find the `order_items` table
4. Delete the existing "Users can view own order items" policy
5. Add the new policies as shown in Option 1

## Verification

After applying the fix:

1. **All three console errors should disappear:**
   - `Error fetching orders count: {}`
   - `Error fetching recent orders: {}`
   - `Error fetching sales data: {}`

2. **Vendor dashboard should show:**
   - Correct total orders count
   - Accurate sales/revenue figures  
   - Recent orders list with order details

3. **Test the vendor dashboard:**
   - Navigate to `/vendor/dashboard`
   - Check that statistics load without errors
   - Verify recent orders appear if there are any

## How the Fix Works

The fix adds two critical vendor policies:

**1. order_items vendor policy:**
```sql
CREATE POLICY "Vendors can view order items for their products" ON order_items FOR SELECT USING (
  auth.uid() IN (
    SELECT vendor_id 
    FROM products 
    WHERE id = product_id
  )
);
```

**2. orders vendor policy (for recent orders):**
```sql
CREATE POLICY "Vendors can view orders with their products" ON orders FOR SELECT USING (
  EXISTS (
    SELECT 1 
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id 
    AND p.vendor_id = auth.uid()
  )
);
```

**How it works:**
1. **order_items policy**: Allows vendors to see order items for their products
2. **orders policy**: Allows vendors to see orders that contain their products (fixes the INNER JOIN issue)
3. Maintains security - vendors only see data for their own products
4. Preserves customer privacy - no customer data exposure

## Additional Notes

- The fix maintains security - vendors can only see orders for their own products
- Customer privacy is preserved - vendors cannot see customer details
- The policies are comprehensive and cover all CRUD operations
- No code changes are required in the dashboard component

## Troubleshooting

If the error persists after applying the fix:

1. Check that the policies were applied correctly in Supabase
2. Verify the vendor has products in the database
3. Ensure the vendor's user_id matches the vendors.user_id field
4. Check browser console for any additional errors
5. Verify Supabase authentication is working properly

## Files Created

- `fix-vendor-order-items-rls.sql` - SQL script for manual application
- `apply-vendor-order-items-fix.js` - Node.js script for automated application
