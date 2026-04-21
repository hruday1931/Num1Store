# Razorpay Live Mode Migration Guide

## Overview
This guide will help you switch Razorpay from Test Mode to Live Mode for production payments.

## 1. Environment Variables to Update

You need to update the following environment variables in your `.env.local` file:

### Current Test Mode Variables:
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=rzp_test_XXXXXXXXXXXXXXXXXXXX
```

### Replace with Live Mode Variables:
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=rzp_live_XXXXXXXXXXXXXXXXXXXX
```

### How to Get Live Keys:
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Switch from "Test Mode" to "Live Mode" using the toggle
4. Generate new API keys (Key ID and Key Secret)
5. Copy the live keys and replace them in your `.env.local` file

### Important Notes:
- **NEVER** commit your `.env.local` file to version control
- Live keys start with `rzp_live_` instead of `rzp_test_`
- Keep your keys secure and never expose them in client-side code

## 2. Current Implementation Analysis

### ✅ What's Already Working:
1. **Environment Variable Usage**: The code correctly uses `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
2. **Payment Flow**: Complete checkout → payment → verification → order creation flow
3. **Order Success Page**: Professional success page with proper navigation
4. **Cart Clearing**: Cart is automatically cleared after successful payment
5. **Error Handling**: Comprehensive error handling throughout the payment process

### 📁 Key Files Involved:
- `src/app/cart/page.tsx` - Main checkout logic
- `src/app/api/checkout/route.ts` - Order creation and Razorpay integration
- `src/app/api/verify-payment/route.ts` - Payment verification
- `src/app/order-success/page.tsx` - Success page

## 3. Checkout Logic Validation

### Current Flow:
1. **Cart Page** (`src/app/cart/page.tsx`):
   - ✅ Uses live environment variable: `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - ✅ Handles payment success callback
   - ✅ Redirects to `/order-success` on success
   - ✅ Clears cart after successful payment

2. **Checkout API** (`src/app/api/checkout/route.ts`):
   - ✅ Uses both key ID and secret: `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID` and `process.env.RAZORPAY_KEY_SECRET`
   - ✅ Creates Razorpay orders with proper validation
   - ✅ Includes comprehensive error handling

3. **Payment Verification** (`src/app/api/verify-payment/route.ts`):
   - ✅ Verifies payment signature using live secret
   - ✅ Creates orders and order items in database
   - ✅ Clears cart after verification
   - ✅ Returns success response

## 4. Order Success Page Validation

### Current Implementation (`src/app/order-success/page.tsx`):
- ✅ Professional design with success message
- ✅ Order details display
- ✅ Payment method indication (Online/COD)
- ✅ Next steps information
- ✅ Navigation buttons (Continue Shopping, View Orders)
- ✅ Proper authentication checks

## 5. Migration Steps

### Step 1: Update Environment Variables
```bash
# Edit .env.local file
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_live_key_id_here
RAZORPAY_KEY_SECRET=your_live_key_secret_here
```

### Step 2: Restart Development Server
```bash
npm run dev
```

### Step 3: Test Live Payments
⚠️ **IMPORTANT**: Live mode will charge actual money!
- Use small amounts for testing (₹1-₹5)
- Test with your own payment methods
- Verify order creation in Razorpay dashboard

### Step 4: Verify Integration
1. Complete a test transaction
2. Check order appears in your Razorpay dashboard
3. Verify order appears in your database
4. Confirm cart is cleared
5. Check order success page displays correctly

## 6. Production Deployment

### Environment Variables for Production:
Make sure to set these in your hosting environment:
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Live Key ID)
- `RAZORPAY_KEY_SECRET` (Live Key Secret)

### Security Checklist:
- ✅ Environment variables are set in production
- ✅ No test keys in production
- ✅ HTTPS is enabled (required for live payments)
- ✅ Domain is whitelisted in Razorpay dashboard
- ✅ Webhook endpoints are configured (if using webhooks)

## 7. Testing Checklist

### Pre-Launch Testing:
- [ ] Live keys are configured
- [ ] Test transaction completes successfully
- [ ] Order is created in database
- [ ] Cart is cleared after payment
- [ ] User is redirected to success page
- [ ] Success page shows correct order details
- [ ] Error handling works for failed payments

### Post-Launch Monitoring:
- [ ] Monitor successful transactions
- [ ] Check for any payment failures
- [ ] Verify order creation consistency
- [ ] Monitor webhook responses (if configured)

## 8. Troubleshooting

### Common Issues:
1. **Invalid Key Error**: Check if keys are correctly copied and start with `rzp_live_`
2. **Payment Failed**: Ensure domain is added to Razorpay whitelist
3. **Order Not Created**: Check server logs for API errors
4. **Cart Not Cleared**: Verify payment verification webhook is working

### Debug Mode:
The code includes comprehensive logging. Check browser console and server logs for detailed error information.

## 9. Webhook Configuration (Optional but Recommended)

For production, configure webhooks in Razorpay dashboard:
- **URL**: `https://yourdomain.com/api/webhooks/razorpay`
- **Events**: `payment.captured`, `payment.failed`
- **Secret**: Generate and add to environment variables

## 10. Final Verification

After switching to live mode:
1. ✅ Environment variables updated with live keys
2. ✅ Server restarted
3. ✅ Test transaction completed
4. ✅ Order created in database
5. ✅ Cart cleared successfully
6. ✅ User redirected to success page
7. ✅ Email confirmations working (if configured)

---

## 🚨 Important Security Notes

- **NEVER** expose your `RAZORPAY_KEY_SECRET` in client-side code
- **ALWAYS** use HTTPS in production
- **REGULARLY** rotate your API keys
- **MONITOR** your Razorpay dashboard for suspicious activity
- **IMPLEMENT** proper webhook verification if using webhooks

## 📞 Support

If you encounter issues:
1. Check Razorpay dashboard for API errors
2. Review browser console and server logs
3. Verify environment variables are correctly set
4. Contact Razorpay support for account-specific issues

---

**Ready to go live!** 🎉

Your Num1Store is properly configured for Razorpay live mode payments.
