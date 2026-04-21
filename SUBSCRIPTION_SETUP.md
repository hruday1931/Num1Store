# Vendor Subscription System Setup

## Overview
The Num1Store vendor system now uses a subscription-based model with three pricing plans:
- **Basic**: Rs. 99 - 10 Products, 90 Days validity
- **Standard**: Rs. 499 - 25 Products, 90 Days validity  
- **Premium**: Rs. 1999 - Unlimited Products, 90 Days validity

## Database Setup

### Step 1: Create the vendor_subscriptions table
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `create-subscription-table.sql`
4. Click "Run" to execute the SQL

### Step 2: Verify Table Creation
The following table should be created:
- `vendor_subscriptions` - stores subscription information

## Features Implemented

### 1. Subscription Page (`/vendor`)
- Professional pricing cards with Num1Store branding (Pink & Lavender)
- One-click subscription with automatic vendor account creation
- Black text for maximum readability
- Responsive design

### 2. Vendor Dashboard
- Days remaining countdown (90 to 0)
- Progress bar showing subscription progress
- Subscription status card with renewal option
- Real-time countdown based on subscription dates

### 3. Subscription Logic
- One user can only subscribe once per ID
- Automatic vendor account creation upon subscription
- 90-day validity from subscription date
- Hide subscribe buttons for already subscribed users

## File Structure

### Updated Files
- `src/app/vendor/page.tsx` - Complete subscription system
- `src/types/index.ts` - Added VendorSubscription type
- `src/components/VendorRegistrationForm.tsx` - **DELETED**
- `src/app/vendor/register/` - **DELETED**

### New Files
- `create-subscription-table.sql` - Database schema
- `SUBSCRIPTION_SETUP.md` - This setup guide

## Database Schema

### vendor_subscriptions table
```sql
CREATE TABLE vendor_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    vendor_id UUID REFERENCES vendors(id),
    plan_type TEXT CHECK (plan_type IN ('basic', 'standard', 'premium')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    price_paid DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Features
- Row Level Security (RLS) enabled
- Users can only access their own subscriptions
- Automatic timestamp updates
- Function to deactivate expired subscriptions

## UI/UX Features
- Num1Store brand colors (Pink & Lavender)
- Black text for clear visibility
- Attractive pricing cards
- Progress bars and countdown timers
- Responsive design for all devices

## Testing the System

1. **Without Database Table**: The app will show the subscription page but subscriptions won't work
2. **After Database Setup**: Full subscription functionality will work
3. **Test Subscription Flow**:
   - Visit `/vendor`
   - Choose a plan
   - Complete subscription
   - Verify dashboard access
   - Check days remaining countdown

## Troubleshooting

### TypeScript Errors
If you see TypeScript errors related to `vendor_subscriptions` table:
1. Make sure you've run the SQL schema first
2. The app uses `as any` type assertions to handle missing tables gracefully
3. Errors will resolve once the database table exists

### Subscription Not Working
1. Verify the `vendor_subscriptions` table exists
2. Check Supabase RLS policies
3. Ensure user is authenticated
4. Check browser console for errors

### Dashboard Not Showing
1. Verify user has an active subscription
2. Check `vendor_subscriptions` table for user's record
3. Ensure `is_active` is true and `end_date` is in the future

## Next Steps

1. Run the SQL schema in Supabase
2. Test the subscription flow
3. Set up payment integration (optional)
4. Configure subscription renewal notifications
5. Add subscription management features

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify database setup
3. Review the SQL schema execution
4. Test with different user accounts
