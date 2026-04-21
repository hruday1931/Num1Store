# Fix Address Loading Error

## Problem
The use-addresses hook is failing with: `Error loading addresses: {}`

## Root Cause
The `shipping_addresses` table likely doesn't exist in your Supabase database.

## Solution Steps

### 1. Execute the SQL Script
Go to your Supabase Dashboard:
1. Navigate to SQL Editor
2. Copy and paste the contents of `create-shipping-addresses-table.sql`
3. Click "Run" to execute the script

### 2. Verify Environment Variables
Make sure you have a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Test the Fix
After running the SQL script, the address loading should work properly.

## SQL Script Contents
The script creates:
- `shipping_addresses` table with proper schema
- RLS policies for user access
- Indexes for performance
- Constraint for unique default addresses

## If Issues Persist
Check that:
- User is authenticated before calling use-addresses
- RLS policies are correctly applied
- Supabase connection is working
