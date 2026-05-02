# Vendor Pickup Location Registration for Shiprocket

## Overview

This implementation provides functionality to automatically register pickup locations in Shiprocket whenever a vendor profile is updated or created. Since Shiprocket doesn't currently offer a direct API for adding pickup locations, this solution prepares the data and provides clear instructions for manual addition.

## Features Implemented

### ✅ Core Functionality
- **Pickup Location Registration Function**: `registerPickupLocation()` in `shiprocket.ts`
- **Vendor Profile Update Integration**: `/api/vendors/update` endpoint
- **Vendor Registration Integration**: Enhanced `/api/vendors/register` endpoint
- **Utility Functions**: Helper functions in `vendor-utils.ts`
- **Database Schema**: Migration script for required fields

### ✅ API Endpoints

#### 1. Update Vendor Profile
```
PUT /api/vendors/update
```

**Request Body:**
```json
{
  "vendor_id": "string",
  "store_name": "string (optional)",
  "store_description": "string (optional)",
  "phone_number": "string (optional)",
  "pickup_address": {
    "address": "string",
    "address_2": "string (optional)",
    "city": "string",
    "state": "string",
    "country": "string (optional, defaults to 'India')",
    "pin_code": "string"
  },
  "register_pickup_location": true
}
```

**Response:**
```json
{
  "success": true,
  "vendor": { ... },
  "shiprocket_result": {
    "success": true,
    "message": "Pickup location information prepared. Please add this location manually in Shiprocket dashboard under Settings > Pickup Addresses.",
    "pickupLocationId": "PICKUP-vendorId-1234567890"
  }
}
```

#### 2. Register New Vendor (Enhanced)
```
POST /api/vendors/register
```

**Additional Fields:**
- `pickup_address`: Object with address details
- `register_pickup_location`: Boolean to trigger Shiprocket registration

## Database Schema

### New Fields Added to `vendors` Table:

```sql
pickup_address JSONB
shiprocket_pickup_location_id TEXT
pickup_location_registered BOOLEAN DEFAULT FALSE
pickup_location_registered_at TIMESTAMP WITH TIME ZONE
```

### Pickup Address Structure:
```json
{
  "address": "123 Commercial Street",
  "address_2": "Shop No. 45, First Floor",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pin_code": "400001"
}
```

## Implementation Details

### 1. Shiprocket Service Enhancement

**File**: `src/lib/shiprocket.ts`

Added `registerPickupLocation()` method that:
- Validates required pickup address fields
- Prepares data in Shiprocket format
- Returns structured response with instructions for manual addition
- Generates unique pickup location ID for tracking

### 2. Vendor Utility Functions

**File**: `src/lib/vendor-utils.ts`

**Key Functions:**
- `registerVendorPickupLocation()`: Main function to handle registration
- `validatePickupAddress()`: Validates address data
- `hasVendorPickupLocation()`: Checks if vendor has registered location

### 3. API Integration

**Files**: 
- `src/app/api/vendors/update/route.ts`
- `src/app/api/vendors/register/route.ts`

Enhanced both endpoints to:
- Accept pickup address data
- Optionally trigger Shiprocket registration
- Update vendor record with registration status

## Usage Examples

### Example 1: Register New Vendor with Pickup Location

```javascript
const response = await fetch('/api/vendors/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user-123',
    store_name: 'Electronics Store',
    store_description: 'Best electronics in town',
    phone_number: '+919876543210',
    plan_id: 'premium',
    plan_price: 999,
    pickup_address: {
      address: '123 Commercial Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin_code: '400001'
    },
    register_pickup_location: true
  })
});
```

### Example 2: Update Vendor Profile

```javascript
const response = await fetch('/api/vendors/update', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vendor_id: 'vendor-123',
    pickup_address: {
      address: '456 New Address',
      city: 'Delhi',
      state: 'Delhi',
      pin_code: '110001'
    },
    register_pickup_location: true
  })
});
```

### Example 3: Direct Function Call

```javascript
import { registerVendorPickupLocation } from '@/lib/vendor-utils';

const result = await registerVendorPickupLocation({
  vendor_id: 'vendor-123',
  store_name: 'My Store',
  phone_number: '+919876543210',
  pickup_address: {
    address: '123 Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin_code: '400001'
  },
  user_id: 'user-123'
});
```

## Manual Shiprocket Setup Steps

Since Shiprocket requires manual addition of pickup locations:

1. **Log in to Shiprocket dashboard**
2. **Navigate to Settings > Pickup Addresses**
3. **Click "+Add Pickup Address"**
4. **Enter the pickup location details** from the API response
5. **Verify and Save Address** (OTP verification required)
6. **Activate the pickup location** using the toggle button
7. **Mark as primary pickup location** if needed

## Testing

### Run Test Script
```bash
node test-vendor-pickup-registration.js
```

### Test API Endpoints
```bash
# Test vendor update with pickup location
curl -X PUT http://localhost:3000/api/vendors/update \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "test-123",
    "pickup_address": {
      "address": "123 Test Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pin_code": "400001"
    },
    "register_pickup_location": true
  }'
```

## Database Migration

Run the migration script to add required fields:

```bash
psql -d your_database -f add-vendor-pickup-location-fields.sql
```

## Error Handling

The implementation includes comprehensive error handling for:
- Missing required fields
- Invalid pickup address data
- Shiprocket service errors
- Database connection issues
- User profile lookup failures

## Future Enhancements

When Shiprocket provides a direct API for pickup locations:
1. Update `registerPickupLocation()` to make actual API calls
2. Remove manual instruction messages
3. Add webhook support for real-time updates
4. Implement bulk pickup location registration

## Security Considerations

- All pickup location data is stored securely in the database
- RLS policies ensure vendors can only access their own data
- API endpoints validate input data before processing
- Shiprocket credentials are managed through environment variables

## Support

For issues related to:
- **Shiprocket API**: Check Shiprocket dashboard and API documentation
- **Database**: Verify migration script execution
- **API Endpoints**: Check server logs for detailed error messages
- **Integration**: Review environment variables and configuration
