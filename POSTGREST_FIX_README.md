# Fixing PostgREST "Could not find the 'updated_at' column" Error

## Problem
You're getting a PostgREST error: `Could not find the 'updated_at' column of 'profiles' in the schema cache` when trying to update the profiles table.

## Root Cause
This error occurs when:
1. The PostgREST schema cache is outdated and doesn't reflect the current database schema
2. The application is trying to update columns that don't exist in the profiles table
3. Manual timestamp management conflicts with Supabase's automatic timestamp handling

## Solution Steps

### 1. Update Database Schema
Run the following SQL script in your Supabase SQL Editor:

```sql
-- Run this script: refresh-schema-cache.sql
```

This script will:
- Add missing `is_vendor`, `subscription_status`, and `store_name` columns to the profiles table
- Add missing `phone_number` and `is_subscribed` columns to the vendors table  
- Refresh the PostgREST schema cache

### 2. New Payment Flow Implementation
The vendor subscription form now includes a **simulated payment flow**:

1. **Form Validation**: User fills out store name and phone number
2. **Payment Modal**: Clicking "Pay Subscription" opens a payment modal with:
   - Order summary showing plan details and store information
   - Mock payment form with card number, expiry, CVV, and cardholder name
   - Payment processing animation
   - Success/error states
3. **Database Updates**: Only after successful payment:
   - Updates `profiles` table with `is_vendor: true`, `subscription_status: 'active'`, and `store_name`
   - Creates vendor record in `vendors` table
   - Redirects to `/vendor/dashboard`

### 3. Code Changes Made
- **New PaymentModal Component**: Full-featured payment modal with validation and simulated processing
- **Updated VendorSubscriptionForm**: Now shows payment modal instead of direct database updates
- **Removed Manual Timestamps**: No manual `updated_at` or `created_at` fields (Supabase handles automatically)
- **Better Error Handling**: Detects missing columns and provides clear error messages
- **Store Name Integration**: Added `store_name` to profiles table for better vendor tracking

### 4. Verify the Fix
After running the SQL script, verify the schema:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

You should see these columns in the profiles table:
- `id` (UUID, primary key)
- `full_name` (TEXT, nullable)
- `phone` (TEXT, nullable) 
- `address` (TEXT, nullable)
- `avatar_url` (TEXT, nullable)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)
- `is_vendor` (BOOLEAN, default FALSE)
- `subscription_status` (TEXT, default 'inactive')
- `store_name` (TEXT, nullable)

### 5. Test the Complete Flow
1. Go to the vendor subscription page
2. Fill out store name and phone number
3. Click "Pay Subscription" - should open payment modal
4. Fill in mock payment details and submit
5. Wait for payment processing animation
6. Confirm success message and redirect to `/vendor/dashboard`
7. Verify database updates (profiles and vendors tables)

## Important Notes

- **Never manually set `updated_at`**: Supabase automatically manages this column when you use `.update()`
- **Refresh cache after schema changes**: Always run `NOTIFY pgrst, 'reload schema';` after adding columns
- **Use untyped client for schema changes**: The form uses an untyped Supabase client to avoid TypeScript issues during schema transitions

## Troubleshooting

If you still get errors after running the fix:
1. Wait 30 seconds and try again (cache refresh can take time)
2. Check Supabase logs for detailed error messages
3. Verify all required columns exist using the SELECT query above
4. Ensure RLS policies allow updates on the profiles table

## Files Modified
- `src/components/forms/vendor-subscription-form.tsx` - Added payment modal integration and removed manual timestamp management
- `src/components/ui/payment-modal.tsx` - New payment modal component with simulated payment flow
- `src/components/index.ts` - Added PaymentModal export
- `refresh-schema-cache.sql` - Updated script to add store_name column and refresh cache
- `POSTGREST_FIX_README.md` - Updated documentation with new payment flow
