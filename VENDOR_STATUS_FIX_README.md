# Fix Vendor Status Console Error

## Problem
The vendor page is showing a console error: `Error checking vendor status: {}`

## Root Cause
The `profiles` table in your Supabase database is missing the required columns:
- `is_vendor` (BOOLEAN)
- `subscription_status` (TEXT)

## Quick Fix Solutions

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the following SQL:

```sql
-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired'));

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;

CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable insert for authentication" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users" ON profiles FOR UPDATE USING (auth.uid() = id);
```

4. Click **Run** to execute the SQL

### Option 2: Use the SQL File

1. Open `fix-vendor-status-columns.sql` 
2. Copy the contents
3. Paste into Supabase SQL Editor
4. Run the query

### Option 3: Automatic Script (Requires Service Role Key)

1. Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file
2. Run: `node check-and-fix-vendor-schema.js`

## Verification

After running the fix, the console error should disappear. You can verify the fix by:

1. Checking the browser console - no more vendor status errors
2. In Supabase SQL Editor, run:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_vendor', 'subscription_status');
```

## What the Fix Does

- **Adds missing columns**: `is_vendor` and `subscription_status` to the profiles table
- **Sets defaults**: New users will have `is_vendor = false` and `subscription_status = 'inactive'`
- **Updates RLS policies**: Ensures proper access control for the new columns
- **Maintains backward compatibility**: Uses `IF NOT EXISTS` to avoid errors

## Code Changes Made

The vendor page has been updated with better error handling:
- Specific error codes are handled (PGRST116 for missing profiles)
- Column existence errors are detected and logged
- Graceful fallback to subscription form when errors occur
- More descriptive error messages for debugging

## Next Steps

After fixing the database schema:
1. Test the vendor registration flow
2. Verify existing users can become vendors
3. Check that the vendor dashboard redirects work correctly
