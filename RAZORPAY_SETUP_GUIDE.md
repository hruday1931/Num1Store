# Razorpay Setup Guide for Num1Store

## Issue Found
The checkout API is failing because Razorpay credentials are missing from the environment variables.

## Solution Steps:

### 1. Get Razorpay Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up or log in to your account
3. Go to Settings > API Keys
4. Generate a new key pair for testing
5. Copy the **Key ID** and **Key Secret**

### 2. Update Environment Variables

Add the following to your `.env.local` file:

```bash
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_actual_key_id_here
RAZORPAY_KEY_SECRET=your_actual_key_secret_here

# Example:
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890abcdef
# RAZORPAY_KEY_SECRET=1234567890abcdef1234567890abcdef
```

**Important:**
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is public and can be used in the browser
- `RAZORPAY_KEY_SECRET` is server-only and must never be exposed to the client
- Replace the placeholder values with your actual Razorpay credentials

### 3. Restart Development Server

After updating the environment variables, restart your Next.js development server:

```bash
npm run dev
```

### 4. Test the Checkout

1. Add products to cart
2. Go to checkout page
3. Add shipping address
4. Click "Proceed to Payment"
5. Check the server console for detailed logs

## Current Status

The checkout API has been enhanced with:

### Development Mode (Without Razorpay Credentials)
- Creates mock orders for testing
- Logs detailed debugging information
- Returns development-friendly responses

### Production Mode (With Razorpay Credentials)
- Full Razorpay integration
- Comprehensive error handling
- Detailed logging for debugging
- Automatic rollback on failures

### Error Handling Improvements
- Detailed console logging
- Specific error messages
- Request data validation
- Address validation
- Database transaction safety

## Testing Without Razorpay (Current State)

The API now works in development mode even without Razorpay credentials:
- Orders are created in the database
- Mock payment orders are generated
- You can test the entire checkout flow

## Server Logs

The API now provides detailed logging including:
- Environment variable status
- Request validation
- Authentication status
- Database operations
- Razorpay operations
- Error details with stack traces

Check your server console when testing checkout to see these logs.

## Next Steps

1. Set up Razorpay credentials following the steps above
2. Test the checkout flow
3. Verify orders are created in the database
4. Test payment completion (requires payment gateway setup)

## Troubleshooting

If you still encounter issues:

1. Check server console logs for specific error messages
2. Verify environment variables are correctly set
3. Ensure Supabase connection is working
4. Check if user is authenticated and has a profile
5. Verify shipping address is complete

Run the debug script to check your setup:
```bash
node debug-checkout-simple.js
```
