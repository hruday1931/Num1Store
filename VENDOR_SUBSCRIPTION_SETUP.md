# Vendor Subscription Flow Setup Guide

## Overview
The Num1Store now includes a complete vendor subscription flow that allows users to register as vendors, choose subscription plans, and make payments to become sellers on the marketplace.

## Features Implemented

### 1. Vendor Subscription Form (`/vendor`)
- Collects store details (name, description, phone number)
- Three subscription plans: Basic (¥29.99), Standard (¥49.99), Premium (¥99.99)
- Form validation and error handling
- Redirects to payment page after form submission

### 2. Payment Page (`/vendor/payment`)
- Secure payment form with card details
- Order summary display
- Payment processing simulation
- Automatic redirect to dashboard after successful payment

### 3. Smart Redirect Logic
- Checks if user is already a paid vendor
- Auto-redirects to `/dashboard/seller` for existing vendors
- Shows subscription form for new vendors

### 4. Database Integration
- Updates vendors table with phone number and subscription status
- Creates vendor_subscriptions records
- API endpoints for registration and status checking

## Database Setup

### 1. Run the schema update:
```sql
-- Run this in Supabase SQL Editor
-- File: add-vendor-phone-number.sql
```

### 2. Ensure vendor_subscriptions table exists:
```sql
-- Run this in Supabase SQL Editor  
-- File: vendor-subscriptions-schema.sql
```

## API Endpoints

### Check Vendor Status
- **GET** `/api/vendors/check-status?user_id={user_id}`
- Returns vendor status and subscription information

### Register New Vendor
- **POST** `/api/vendors/register`
- Creates vendor account and subscription
- Updates user role to 'seller'

## File Structure
```
src/
  app/
    vendor/
      page.tsx                    # Main vendor page with smart redirect
      payment/
        page.tsx                  # Payment processing page
    api/
      vendors/
        check-status/
          route.ts                # Vendor status API
        register/
          route.ts                # Vendor registration API
  components/
    forms/
      vendor-subscription-form.tsx  # Subscription form component
```

## User Flow

1. **New User**: 
   - Visits `/vendor` 
   - Sees subscription form
   - Fills store details, selects plan
   - Redirects to payment page
   - Completes payment
   - Redirected to `/dashboard/seller`

2. **Existing Paid Vendor**:
   - Visits `/vendor`
   - Automatically redirected to `/dashboard/seller`

3. **Unauthenticated User**:
   - Visits `/vendor`
   - Prompted to sign in first

## Payment Processing

Currently uses a simulated payment process. In production, integrate with:
- Stripe (recommended)
- PayPal
- Square

To integrate with Stripe, replace the payment processing logic in `/vendor/payment/page.tsx` with actual Stripe integration.

## Next Steps

1. **Test the flow**: Run the application and test the complete vendor registration process
2. **Database setup**: Ensure all SQL files have been run in Supabase
3. **Environment variables**: Verify Supabase configuration in `.env.local`
4. **Payment integration**: Add real payment processing (Stripe recommended)
5. **Email notifications**: Add welcome emails for new vendors
6. **Admin approval**: Implement admin approval workflow if needed

## Troubleshooting

### Common Issues

1. **Database errors**: Make sure all SQL schema files have been executed in Supabase
2. **Authentication issues**: Verify Supabase auth configuration
3. **Redirect loops**: Check that vendor status API is working correctly
4. **Form validation**: Ensure all required fields are properly validated

### Debug Mode

Add console logging to track the flow:
```javascript
console.log('Checking vendor status for user:', user.id);
console.log('Vendor status result:', data);
```

## Security Notes

- Payment form uses client-side validation only (add server-side validation in production)
- Card details are not stored (simulate payment processing)
- Row Level Security (RLS) policies protect vendor data
- Service role key used for admin operations

The vendor subscription flow is now ready for testing and further customization!
