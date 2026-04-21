# Restart Development Server to Clear Schema Cache

## Why Restart is Needed
The PGRST204 error can persist even after adding database columns because:
1. Next.js caches the Supabase client instances
2. PostgREST schema cache needs to be refreshed
3. Development server may hold stale type information

## Steps to Restart Properly

### 1. Stop the Development Server
```bash
# Press Ctrl+C in the terminal where Next.js is running
# Or run:
npm run dev -- --reset-cache
```

### 2. Clear Next.js Cache
```bash
# Remove Next.js cache
rm -rf .next

# Clear node modules cache (optional but recommended)
npm run build -- --no-cache
```

### 3. Restart Development Server
```bash
npm run dev
```

### 4. Verify the Fix
1. Navigate to `/vendor/settings`
2. Try updating your store name and phone number
3. Check that:
   - Success message appears
   - Loading spinner disappears
   - Data is properly saved and displayed

## Alternative: Cache Refresh in Code
The vendor settings page now includes automatic schema cache refresh:

```typescript
// Clear any cached schema to ensure fresh data
await supabaseUntyped.rpc('reload_schema', {}).catch(() => {
  console.log('Schema reload not available, continuing...');
});
```

## What Was Fixed
1. **Update Logic**: Now correctly targets the `vendors` table with proper field mapping
2. **Schema Cache**: Added automatic cache refresh attempt
3. **Loading State**: Ensures loading states are properly reset after save operations
4. **Data Refresh**: Fetches fresh data from database after successful update
5. **Error Handling**: Better error messages and state management

The vendor settings page should now work correctly without getting stuck on loading spinners.
