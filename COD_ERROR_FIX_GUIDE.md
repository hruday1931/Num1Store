# COD (Cash on Delivery) Error Fix Guide

## 🚨 PRIMARY ISSUE IDENTIFIED

**Function Overload Conflict**: There are TWO versions of the `create_order_with_items` database function with different parameter types, causing PostgreSQL to not know which one to call.

### Error Details:
```
PGRST203: Could not choose the best candidate function between:
- public.create_order_with_items(..., p_shipping_address => jsonb, ...)
- public.create_order_with_items(..., p_shipping_address => text, ...)
```

## 🛠️ IMMEDIATE FIX REQUIRED

### Step 1: Run the Complete Fix Script
1. Open **Supabase SQL Editor**
2. Copy and paste the entire contents of `fix-cod-errors-complete.sql`
3. **Execute the script**

This script will:
- ✅ Drop ALL conflicting function versions
- ✅ Create the correct function with TEXT shipping_address
- ✅ Add comprehensive error handling and validation
- ✅ Grant proper permissions
- ✅ Verify the function works correctly

### Step 2: Test the Fix
Run the test script to verify the fix:
```bash
node test-cod-fix.js
```

Expected output:
```
✅ Function is working correctly!
```

## 🔧 OTHER COD ISSUES FOUND & FIXED

### 1. **Order Success Page Issues**
- **Problem**: Order success page shows ₹0.00 for total amount
- **Fix**: Update the success page to fetch actual order details

### 2. **Cart Page Data Handling**
- **Problem**: Inconsistent data type handling in cart page
- **Fix**: Ensure proper type conversion for price and quantity

### 3. **Error Handling Improvements**
- **Problem**: Generic error messages don't help users
- **Fix**: Enhanced error messages with specific guidance

## 📋 FILES THAT NEED UPDATES

### 1. Database Function (CRITICAL)
- **File**: `fix-cod-errors-complete.sql`
- **Action**: Must be run in Supabase SQL Editor
- **Priority**: 🔴 URGENT

### 2. Order Success Page (HIGH)
- **File**: `src/app/order-success/page.tsx`
- **Issue**: Shows ₹0.00 instead of actual order total
- **Fix**: Fetch order details using the order ID

### 3. Cart Page (MEDIUM)
- **File**: `src/app/cart/page.tsx`
- **Issue**: Data type inconsistencies
- **Fix**: Better type conversion and validation

## 🚀 QUICK TESTING STEPS

After applying the database fix:

1. **Test COD Checkout**:
   - Add items to cart
   - Select COD payment method
   - Enter shipping address
   - Click "Place COD Order"
   - Should redirect to success page

2. **Verify Order Creation**:
   - Check Supabase dashboard
   - Look in `orders` table
   - Verify `order_items` table has the items

3. **Test Error Scenarios**:
   - Try with invalid product IDs
   - Try with negative quantities
   - Try with missing shipping address

## 🐛 COMMON ERROR SCENARIOS & SOLUTIONS

### Error: "Function overload conflict"
**Solution**: Run the complete fix script

### Error: "Customer profile not found"
**Solution**: User needs to sign out and sign in again

### Error: "Product not found or inactive"
**Solution**: Check if products exist and have `is_active = true`

### Error: "Invalid quantity/price"
**Solution**: Ensure cart has valid positive numbers

## 🔍 DEBUGGING TIPS

### Check Console Logs
```javascript
// In browser console, look for:
// === COD ORDER DEBUG INFO ===
// === COD ORDER ERROR DETAILS ===
```

### Check Network Tab
- Look for `/api/create-cod-order` requests
- Check response status and error messages

### Check Database
```sql
-- Verify function exists and is unique
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'create_order_with_items';

-- Check recent orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- Check order items
SELECT * FROM order_items ORDER BY created_at DESC LIMIT 10;
```

## 📞 IF ISSUES PERSIST

1. **Clear Browser Cache**: Sometimes old JavaScript causes issues
2. **Restart Local Server**: `npm run dev` again
3. **Check Environment Variables**: Ensure Supabase keys are correct
4. **Verify RLS Policies**: Make sure policies allow order creation

## ✅ SUCCESS CRITERIA

COD is working correctly when:
- [ ] Function overload error is resolved
- [ ] COD orders create successfully
- [ ] Order appears in database with correct items
- [ ] Cart is cleared after successful order
- [ ] User redirected to proper success page
- [ ] Order total shows correctly on success page
- [ ] Error messages are helpful and specific

## 🎯 FINAL VERIFICATION

After applying all fixes, run this complete test:

1. Add 2-3 different products to cart
2. Proceed to checkout with COD
3. Fill shipping address form
4. Place COD order
5. Verify success page shows correct details
6. Check database for order and items
7. Verify cart is empty
8. Try accessing orders from dashboard

All tests should pass without errors!
