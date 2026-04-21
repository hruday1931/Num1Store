# Database Phone Number Column Fix

## Issue
The vendors table is missing the `phone_number` column, causing errors in the vendor settings page.

## Solution
Run the following SQL in your Supabase SQL Editor:

```sql
-- Add phone_number column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' AND column_name = 'phone_number';
```

## Steps to Apply Fix:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL above
4. Click "Run" to execute the migration

## Alternative: Use the prepared migration file

You can also run the migration file directly:
- Run the contents of `apply-phone-fix.sql` in the Supabase SQL Editor

## Verification

After running the migration, the vendor settings page should work without errors. The phone number field will be properly saved to the database.
