# Checkout 500 Error Fix

## Problem
The checkout API is returning a 500 error because Razorpay credentials are missing from the environment variables.

## Error Details
- **HTTP Error**: `status: 500` in `src/utils/fetch-wrapper.ts`
- **Root Cause**: Missing `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables
- **Location**: Checkout API at `/api/checkout`

## Solution

### Step 1: Get Razorpay Credentials
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up or log in to your account
3. Navigate to **Settings** > **API Keys**
4. Generate a new key pair or use existing ones
5. Copy the **Key ID** and **Key Secret**

### Step 2: Update Environment Variables
Add the following to your `.env.local` file:

```bash
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**Example:**
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890abcdef
RAZORPAY_KEY_SECRET=1234567890abcdef1234567890abcdef
```

### Step 3: Restart Development Server
After updating the environment variables, restart your Next.js development server:

```bash
npm run dev
```

### Step 4: Test Checkout
1. Add items to your cart
2. Proceed to checkout
3. Add a shipping address
4. Click "Proceed to Checkout"
5. The Razorpay payment modal should now appear

## What Was Fixed
1. **Added credential validation** in the checkout API before attempting to initialize Razorpay
2. **Improved error handling** to return a proper error message instead of crashing
3. **Moved Razorpay initialization** inside the POST function after credential validation

## Testing
Use the debug script to verify your setup:

```bash
node debug-checkout-simple.js
```

This should show:
- All environment variables as "SET"
- Supabase connection: OK
- All database tables: OK  
- Razorpay: OK - Test order created

## Notes
- Use test credentials for development (`rzp_test_...`)
- For production, use live credentials (`rzp_live_...`)
- Never commit `.env.local` to version control
- Keep your Razorpay keys secure and don't share them

## Still Having Issues?
1. Verify the environment variables are exactly as shown (no typos)
2. Ensure the `.env.local` file is in the project root
3. Check that your Razorpay account is active
4. Make sure you have sufficient permissions in Razorpay dashboard
