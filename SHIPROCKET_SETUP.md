# Shiprocket Integration Setup

This document explains how to set up the Shiprocket delivery automation for the Num1Store marketplace.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Shiprocket Configuration
SHIPROCKET_EMAIL=your_shiprocket_email@example.com
SHIPROCKET_PASSWORD=your_shiprocket_password
```

## Database Setup

Run the following SQL script to add the necessary columns to your orders table:

```sql
-- Run this script in your Supabase SQL editor
-- File: add-shiprocket-columns.sql
```

## Features Implemented

### 1. API Client Service (`src/lib/shiprocket.ts`)
- Authentication with Shiprocket API
- Shipment creation functionality
- Pickup generation
- Label download
- Tracking integration

### 2. API Endpoints
- `POST /api/shiprocket/auth` - Test authentication
- `POST /api/shiprocket/shipments` - Create shipment and pickup
- `POST /api/shiprocket/labels` - Download shipping label

### 3. Vendor Dashboard Integration
- **Ship Order Button**: Creates shipment with Shiprocket
- **Automatic Pickup**: Pickup request is generated automatically
- **Download Label**: Download shipping labels for shipped orders
- **Tracking**: View AWB codes and track shipments

## Workflow

1. **Order Processing**: Vendor changes order status to "Processing"
2. **Ship Order**: Vendor clicks "Ship Order" button
3. **Shipment Creation**: System creates shipment with Shiprocket
4. **Pickup Generation**: Pickup request is automatically generated
5. **Label Download**: Vendor can download shipping label
6. **Tracking**: AWB code is displayed for tracking

## Data Flow

### When vendor clicks "Ship Order":
1. Order details are fetched from database
2. Order data is converted to Shiprocket format
3. Shipment is created via Shiprocket API
4. Pickup request is automatically generated
5. Order is updated with:
   - `shipment_id`
   - `awb_code`
   - `courier_name`
   - `pickup_status`
   - `estimated_delivery`

### When vendor clicks "Download Label":
1. Label URL is fetched from Shiprocket
2. Label opens in new tab for printing
3. Vendor can print and attach to package

## Error Handling

- Authentication errors are logged and displayed to user
- Shipment creation failures show specific error messages
- Network timeouts are handled gracefully
- All errors are logged for debugging

## Testing

To test the integration:

1. Set up your Shiprocket account credentials
2. Add environment variables
3. Run the database migration script
4. Create a test order
5. Process the order through the vendor dashboard
6. Verify shipment creation and label download

## Security Notes

- Shiprocket credentials are stored in environment variables
- All API calls are made server-side
- RLS policies ensure vendors can only access their orders
- Pickup requests are generated automatically to reduce manual errors

## Support

For issues with:
- **Shiprocket API**: Check credentials and account status
- **Database**: Verify SQL migration was applied
- **UI**: Check browser console for JavaScript errors
