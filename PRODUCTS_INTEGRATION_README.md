# Products Integration Fix - Num1Store

## Overview
This guide will help you complete the products integration by fixing RLS policies, adding sample data, and ensuring the products page works correctly.

## Files Created/Modified

### 1. `fix_products_integration.sql`
Complete SQL script to:
- Enable RLS on products table
- Create public read access policy
- Insert 5 sample products
- Verify data insertion

### 2. `src/app/products/page.tsx`
Enhanced with:
- Better error handling for RLS issues
- Specific error messages for different database problems
- Clear guidance for users on how to fix issues

## Step-by-Step Instructions

### Step 1: Run the SQL Script
1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy the contents of `fix_products_integration.sql`
4. Paste and run the script

**What this does:**
- Enables Row Level Security (RLS) on the products table
- Creates a policy allowing public read access to active products
- Inserts 5 sample products with proper vendor references
- Verifies the data was inserted correctly

### Step 2: Verify Environment Variables
Ensure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Test the Products Page
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/products`
3. You should see the 5 sample products displayed in a grid

## Expected Results

### After Running SQL Script:
- ✅ Products table has RLS enabled
- ✅ Public read policy for active products
- ✅ 5 sample products inserted:
  1. Wireless Headphones - ¥299.99 (Electronics)
  2. Organic Coffee Beans - ¥24.99 (Food)
  3. Yoga Mat - ¥39.99 (Sports)
  4. Smart Watch - ¥199.99 (Electronics)
  5. Running Shoes - ¥89.99 (Sports)

### Products Page Features:
- ✅ Clean grid layout with product cards
- ✅ Search functionality
- ✅ Category filtering
- ✅ Price range filtering
- ✅ Responsive design
- ✅ Add to cart buttons (ready for cart implementation)

## Troubleshooting

### If you still see "Database Connection Error":

1. **Check Supabase Connection:**
   - Verify your Supabase project is active
   - Check environment variables are correct
   - Look at browser console for specific error messages

2. **RLS Issues:**
   - Ensure the SQL script ran successfully
   - Check that RLS policy was created: `SELECT * FROM pg_policies WHERE tablename = 'products'`

3. **Data Issues:**
   - Verify products exist: `SELECT COUNT(*) FROM products WHERE is_active = true`
   - Check vendor reference is valid

4. **Network Issues:**
   - Check your internet connection
   - Verify Supabase URL is accessible
   - Try refreshing the page

### Common Error Codes:
- `42501`: RLS permission denied → Run the SQL script
- `PGRST116`: Table not found → Run database schema first
- `Invalid URL`: Check environment variables

## Next Steps

After products are working:
1. Implement product detail pages (`/products/[id]`)
2. Add shopping cart functionality
3. Implement checkout process
4. Add product management for vendors
5. Implement product reviews and ratings

## Technical Details

### RLS Policy Created:
```sql
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT USING (is_active = true);
```

This allows:
- ✅ Public read access to active products
- ✅ No authentication required for viewing products
- ✅ Secure - only active products are visible

### Sample Data Structure:
Each product includes:
- Proper UUID references to vendor
- Realistic pricing and descriptions
- Category classification
- Inventory counts
- Image placeholders (ready for actual images)

## Support

If you encounter issues:
1. Check browser console logs
2. Verify SQL script execution in Supabase
3. Ensure all environment variables are set
4. Test Supabase connection directly

The products integration should now be fully functional with proper RLS policies and sample data!
