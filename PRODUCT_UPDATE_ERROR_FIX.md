# Product Update Error Fix

## Problem
The product edit page was showing an empty error object `{}` in the console when trying to update a product:
```
Error updating product: {}
src/app/vendor/products/edit/[id]/page.tsx (207:17) @ handleSubmit
```

## Root Cause
The issue was caused by incorrect Row Level Security (RLS) policies on the `products` table. The policies were checking:
```sql
vendor_id = auth.uid()
```

But `vendor_id` references the `vendors.id` column, not the user ID directly. The correct check should be:
```sql
vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
```

## Solution

### 1. Fix RLS Policies
Run the SQL script `fix-product-update-rls.sql` in your Supabase SQL Editor to:
- Drop existing incorrect policies
- Create corrected policies that properly check vendor ownership
- Refresh the schema cache

### 2. Improved Error Handling
Updated the product edit page (`src/app/vendor/products/edit/[id]/page.tsx`) to:
- Add form validation before submission
- Include vendor ownership check in the update query
- Provide detailed error messages with specific error codes
- Add better debugging information

### 3. Key Changes Made

#### RLS Policy Fix
```sql
-- OLD (incorrect)
CREATE POLICY "Vendors can update own products" ON products 
FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- NEW (correct)
CREATE POLICY "Vendors can update own products" ON products 
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
);
```

#### Code Improvements
- Added form validation for required fields
- Added vendor ownership check in update query: `.eq('vendor_id', vendorData.id)`
- Enhanced error logging with detailed error information
- Better error messages for permission denied errors (code 42501)

## Steps to Fix

1. **Run the SQL Fix:**
   - Open Supabase SQL Editor
   - Run the contents of `fix-product-update-rls.sql`

2. **Test the Fix:**
   - Navigate to `/vendor/products`
   - Click "Edit" on any product
   - Make changes and click "Save Changes"
   - The update should now work without errors

3. **Debug if Needed:**
   - Check browser console for detailed error information
   - Verify vendor status in the profiles table
   - Ensure the user has an active vendor record

## Common Issues

### Permission Denied (Error 42501)
If you get a permission denied error:
1. Check if the user has a vendor record
2. Verify the vendor's subscription status is 'active'
3. Ensure the vendor is approved

### Empty Error Object
If you still see empty error objects:
1. Check the browser network tab for the actual API response
2. Verify the RLS policies were applied correctly
3. Refresh the schema cache: `NOTIFY pgrst, 'reload schema';`

## Files Modified
- `src/app/vendor/products/edit/[id]/page.tsx` - Enhanced error handling and validation
- `fix-product-update-rls.sql` - New SQL script to fix RLS policies
- `PRODUCT_UPDATE_ERROR_FIX.md` - This documentation file
