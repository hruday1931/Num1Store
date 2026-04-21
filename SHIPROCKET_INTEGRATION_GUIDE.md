# Shiprocket Integration Complete Setup Guide

## Overview
The Num1Store now has complete Shiprocket integration for automated delivery boy pickup and live tracking.

## ✅ Completed Features

### 1. Order Sync & Shipment Creation
- **Endpoint**: `POST /api/shiprocket/shipments`
- **Trigger**: Vendor clicks "Ship Order" in vendor dashboard
- **Process**:
  - Sends order details to Shiprocket's `/external/orders/create/adhoc` API
  - Includes customer address, product dimensions, weight, and payment details
  - Automatically validates required fields before sending

### 2. Automatic Pickup Request
- **Endpoint**: `POST /api/shiprocket/generate/pickup`
- **Trigger**: Immediately after successful shipment creation
- **Process**:
  - Calls Shiprocket's pickup generation API
  - Notifies delivery boy to visit vendor location
  - Updates order status to "Pickup Scheduled"

### 3. AWB Code & Label Management
- **AWB Code**: Automatically fetched and saved in Supabase orders table
- **Label Generation**: `POST /api/shiprocket/labels` endpoint
- **Print Label**: Button in vendor orders opens Shiprocket label in new tab

### 4. Live Tracking
- **Tracking Page**: `/orders/[id]/track` updated with Shiprocket data
- **Live Status**: Shows actual Shiprocket status (Pickup Scheduled, In Transit, Out for Delivery)
- **Tracking History**: Detailed activity log from Shiprocket API
- **Auto-refresh**: Manual refresh button to get latest tracking data

## 🔧 Environment Setup

### Required Environment Variables
Add these to your `.env.local` file:

```env
SHIPROCKET_EMAIL=your-shiprocket-email@example.com
SHIPROCKET_PASSWORD=your-shiprocket-password
```

### Database Schema Updates
The orders table now includes these Shiprocket fields:
- `shipment_id` (number) - Internal Shiprocket shipment ID
- `awb_code` (text) - Tracking number for customers
- `courier_name` (text) - Assigned courier company
- `shiprocket_order_id` (text) - Shiprocket's order reference
- `pickup_status` (text) - Current pickup status
- `estimated_delivery` (timestamp) - Delivery estimate
- `customer_name`, `customer_email`, `customer_phone` - Customer details
- `address`, `city`, `state`, `country`, `pincode` - Address fields

## 🚀 How It Works

### For Vendors
1. **Process Order**: Change order status to "Processing"
2. **Ship Order**: Click "Ship Order" button
3. **Automatic Magic**: 
   - Order sent to Shiprocket
   - Pickup request generated
   - AWB code assigned
   - Label available for printing
4. **Track**: Monitor pickup and delivery status

### For Customers
1. **Order Confirmation**: Receive order confirmation
2. **Live Tracking**: Visit `/orders/[id]/track` for real-time updates
3. **Status Updates**: See actual Shiprocket status and location
4. **Delivery**: Get notified when out for delivery and delivered

## 📋 API Endpoints

### Shipments
```
POST /api/shiprocket/shipments
Body: { orderId: "string" }
Response: { success: true, shipment: {...}, pickup: {...} }
```

### Labels
```
POST /api/shiprocket/labels
Body: { shipmentId: number }
Response: { success: true, label: { label_url: "string" } }
```

### Tracking
```
POST /api/shiprocket/tracking
Body: { orderId: "string" }
Response: { success: true, trackingData: {...}, orderStatus: "string" }

GET /api/shiprocket/tracking?orderId=string
Response: { success: true, trackingData: {...} }
```

## 🔄 Integration Flow

```
Vendor clicks "Ship Order"
    ↓
API: POST /api/shiprocket/shipments
    ↓
Shiprocket: Create adhoc shipment
    ↓
Shiprocket: Generate pickup request
    ↓
Database: Update order with shipment details
    ↓
Vendor: See AWB code and Print Label button
    ↓
Customer: Track order with live Shiprocket data
```

## 🎯 Key Features Implemented

### ✅ Order Sync
- Customer address validation
- Product weight and dimensions
- Payment method integration
- Real-time error handling

### ✅ Pickup Request
- Automatic pickup generation
- Vendor notification
- Status tracking

### ✅ AWB & Label
- Automatic AWB assignment
- One-click label printing
- Courier assignment

### ✅ Live Tracking
- Real-time Shiprocket status
- Tracking history
- Location updates
- Delivery estimates

## 🛠 Testing the Integration

### 1. Test Authentication
```bash
node test-shiprocket-integration.js
```

### 2. Test Complete Flow
1. Create a test order as customer
2. Go to vendor orders page
3. Change status to "Processing"
4. Click "Ship Order"
5. Verify AWB code appears
6. Test label printing
7. Check tracking page

### 3. Verify Database Updates
Check orders table for:
- `shipment_id` populated
- `awb_code` assigned
- `pickup_status` = "scheduled"
- `courier_name` assigned

## 🔍 Troubleshooting

### Common Issues
1. **Authentication Failed**: Check SHIPROCKET_EMAIL and PASSWORD
2. **Missing Address**: Ensure customer address is complete
3. **Pickup Failed**: Verify vendor pickup address is configured
4. **Tracking Not Updating**: Check AWB code is properly saved

### Error Messages
- "Missing required customer information": Complete customer profile
- "Shiprocket authentication failed": Check API credentials
- "Failed to create shipment": Verify order data completeness

## 📞 Support

For Shiprocket-specific issues:
1. Check Shiprocket dashboard for API status
2. Verify account is approved and active
3. Check pickup location configuration

For application issues:
1. Check browser console for errors
2. Verify environment variables are set
3. Check database schema updates

## 🎉 Integration Complete!

Your Num1Store now has fully automated shipping with:
- ✅ One-click shipment creation
- ✅ Automatic pickup requests
- ✅ Live tracking for customers
- ✅ Label printing for vendors
- ✅ Complete order-to-delivery workflow

The integration is ready for production use!
