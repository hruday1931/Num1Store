# Shiprocket Integration for Num1Store

This document provides a comprehensive guide for the Shiprocket API integration that enables automated delivery management for your Num1Store marketplace.

## 🚀 Features Implemented

### 1. **Authentication**
- Server-side authentication with Shiprocket API
- Secure token management using environment variables
- Automatic token refresh capability

### 2. **Order Synchronization**
- Automatic order creation in Shiprocket when status changes to "Processing"
- Manual "Ship with Shiprocket" button for vendors
- Complete order data transfer including items, addresses, and pricing

### 3. **Pickup Management**
- Automatic pickup request generation after order creation
- Real-time pickup status tracking
- Multiple pickup status states: pending → requested → scheduled → picked

### 4. **Tracking Integration**
- AWB (Air Waybill) code retrieval and storage
- Real-time tracking updates from Shiprocket
- Automatic status sync when Shiprocket marks orders as delivered
- Direct tracking links to Shiprocket portal

### 5. **Enhanced Vendor Dashboard**
- New columns for AWB Code and Pickup Status
- Action buttons for Shiprocket operations
- Loading states and error handling
- Real-time status updates

## 📋 Database Schema Changes

Run the `add-shiprocket-columns.sql` file in your Supabase dashboard to add the following columns to the `orders` table:

```sql
-- New columns added:
awb_code TEXT                    -- AWB code from Shiprocket
shiprocket_order_id TEXT         -- Shiprocket internal order ID  
pickup_status TEXT               -- Pickup request status
shipping_method TEXT             -- Shipping method (standard/express)
estimated_delivery TIMESTAMP     -- Estimated delivery date
delivered_at TIMESTAMP           -- Actual delivery timestamp
payment_method TEXT              -- Payment method (online/cod)
payment_status TEXT              -- Payment status (paid/pending/failed)
```

## 🔧 Environment Configuration

The following environment variables have been automatically configured in your `.env.local` file:

```env
# Shiprocket API Credentials
SHIPROCKET_EMAIL=num1olinestore@gmail.com
SHIPROCKET_PASSWORD=sjVmy3RRetC4mmvKan7H1&97z&j9*AJB

# App URL for Shiprocket callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📁 API Endpoints Created

### 1. Authentication
```
POST /api/shiprocket/auth
GET  /api/shiprocket/auth  (Check configuration)
```

### 2. Order Management
```
POST /api/shiprocket/orders  (Create order in Shiprocket)
```

### 3. Pickup Requests
```
POST /api/shiprocket/pickup   (Create pickup request)
```

### 4. Tracking
```
POST /api/shiprocket/tracking (Update tracking info)
GET  /api/shiprocket/tracking?orderId=xxx (Get tracking info)
```

## 🎯 How It Works

### For Vendors:

1. **Order Processing**: When a vendor changes an order status to "Processing", the system automatically:
   - Creates the order in Shiprocket
   - Generates a pickup request
   - Fetches AWB code and tracking information

2. **Manual Shiprocket Sync**: Vendors can click the "Ship with Shiprocket" button (📦) to manually sync orders that weren't automatically processed.

3. **Tracking Updates**: Click the "Update Tracking" button (🔄) to fetch the latest tracking information from Shiprocket.

4. **Direct Tracking**: Click the external link icon (🔗) next to the AWB code to open the tracking page in Shiprocket.

### Order Status Flow:
```
Pending → Processing → [Auto Shiprocket Sync] → Shipped → Delivered
```

### Pickup Status Flow:
```
Pending → Requested → Scheduled → Picked
```

## 🔒 Security Features

- **Server-side Only**: All Shiprocket API calls are made server-side
- **No Token Exposure**: API tokens are never exposed to the frontend
- **Environment Variables**: Credentials stored securely in environment variables
- **RLS Policies**: Updated Row Level Security policies for vendor access

## 🚨 Important Notes

### Before Using:
1. **Run Database Migration**: Execute the SQL in `add-shiprocket-columns.sql` in your Supabase dashboard
2. **Verify Credentials**: Ensure Shiprocket account is active and has sufficient balance
3. **Test with Small Orders**: Start with test orders to verify the integration

### Vendor Requirements:
- Vendors must have an active subscription to access shipping features
- Orders must have valid shipping addresses
- Product dimensions and weights should be configured for accurate shipping calculations

### Error Handling:
- Automatic retry mechanisms for failed API calls
- Detailed error messages for debugging
- Graceful fallback when Shiprocket is unavailable

## 🛠️ Troubleshooting

### Common Issues:

1. **Authentication Failed**:
   - Check Shiprocket credentials in `.env.local`
   - Verify Shiprocket account status
   - Ensure API access is enabled

2. **Order Creation Failed**:
   - Verify shipping address format
   - Check product dimensions and weights
   - Ensure vendor pickup address is configured

3. **Pickup Request Failed**:
   - Order must be created in Shiprocket first
   - Check if pickup location is serviceable
   - Verify courier availability

4. **Tracking Not Updating**:
   - AWB code may take time to generate
   - Check if courier has assigned the shipment
   - Try manual tracking update

### Debug Mode:
Enable debug logging by checking the browser console and server logs for detailed API responses.

## 📞 Support

For Shiprocket-specific issues:
- Contact Shiprocket support: support@shiprocket.in
- Check Shiprocket dashboard for service status
- Review API documentation: https://shiprocket.in/api

For Num1Store integration issues:
- Check the implementation in `/src/app/api/shiprocket/`
- Review vendor orders page: `/src/app/vendor/orders/page.tsx`
- Verify database schema updates

## 🔄 Future Enhancements

1. **Bulk Order Processing**: Process multiple orders simultaneously
2. **Courier Selection**: Allow vendors to choose preferred couriers
3. **Shipping Rate Calculator**: Show estimated shipping costs before order creation
4. **Delivery Notifications**: SMS/email notifications for delivery updates
5. **Return Management**: Handle returns through Shiprocket

---

**Integration Status**: ✅ Complete and Ready for Testing

**Last Updated**: April 18, 2026

**Version**: 1.0.0
