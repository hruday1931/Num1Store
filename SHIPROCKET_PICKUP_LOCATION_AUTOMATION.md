# Shiprocket Pickup Location Automation

This feature automates the registration and management of pickup locations with Shiprocket when vendors update their address information in the vendor settings page.

## Overview

When a vendor saves their address in the vendor settings page, the system automatically:
1. Authenticates with Shiprocket API
2. Registers/updates the pickup location with the vendor's address details
3. Saves the pickup location ID returned by Shiprocket in the database
4. Handles future updates by using the Shiprocket Update Pickup Location API

## Implementation Details

### 1. Database Schema

The vendors table has been enhanced with the following columns:

```sql
-- From add-vendor-pickup-location-fields.sql
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS pickup_address JSONB;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS shiprocket_pickup_location_id TEXT;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS pickup_location_registered BOOLEAN DEFAULT FALSE;

ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS pickup_location_registered_at TIMESTAMP WITH TIME ZONE;
```

### 2. API Route

**Endpoint**: `/api/shiprocket/pickup-location`

**Methods**:
- `POST`: Register or update pickup location
- `GET`: Retrieve vendor's pickup location information

#### POST Request Body
```json
{
  "vendorId": "string",
  "storeName": "string", 
  "address": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "address": "string",
    "address_2": "string",
    "city": "string",
    "state": "string", 
    "country": "string",
    "pin_code": "string"
  },
  "isUpdate": "boolean"
}
```

#### POST Response
```json
{
  "success": true,
  "pickupLocationId": "string",
  "pickupLocationName": "string", 
  "message": "Pickup location registered successfully",
  "shiprocketData": {}
}
```

### 3. Vendor Settings Integration

The vendor settings page (`/vendor/settings`) now includes:

- **Address Fields**: Complete pickup address form with validation
- **Auto-registration**: Automatic Shiprocket pickup location registration on save
- **Status Indicator**: Visual indicator showing pickup location registration status
- **Error Handling**: Graceful fallback if Shiprocket registration fails

### 4. Shiprocket API Integration

The system uses the following Shiprocket APIs:

- **Authentication**: `/v1/external/auth/login`
- **Add Pickup Location**: `/v1/external/settings/company/pickuplocations` (POST)
- **Update Pickup Location**: `/v1/external/settings/company/pickuplocations/{id}` (PUT)
- **Get Pickup Locations**: `/v1/external/settings/company/pickuplocations` (GET)

## Setup Instructions

### 1. Database Migration

Run the SQL migration to add the required columns:

```bash
# Run the comprehensive migration
psql -d your_database -f add-vendor-pickup-location-fields.sql
```

### 2. Environment Variables

Ensure the following environment variables are configured:

```env
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password
NEXT_PUBLIC_APP_URL=your_app_url
```

### 3. File Structure

The implementation consists of:

```
src/
├── app/
│   ├── api/shiprocket/pickup-location/
│   │   └── route.ts                    # Pickup location API endpoint
│   └── vendor/settings/
│       └── page.tsx                    # Updated vendor settings page
├── lib/
│   └── shiprocket.ts                   # Existing Shiprocket service
```

## Flow Diagram

```
Vendor saves settings
         ↓
Update vendor record in database
         ↓
Prepare pickup address data
         ↓
Authenticate with Shiprocket
         ↓
Check if pickup location exists
         ↓
[NEW] Add pickup location
[UPDATE] Update existing location
         ↓
Save pickup location ID to database
         ↓
Show success/error message to vendor
```

## Features

### ✅ Automated Registration
- Automatic pickup location registration when vendor saves address
- No manual intervention required

### ✅ Smart Updates
- Detects existing pickup locations
- Updates existing locations instead of creating duplicates
- Uses Shiprocket location ID for efficient updates

### ✅ Error Handling
- Graceful fallback if Shiprocket API fails
- Vendor settings still saved even if pickup registration fails
- Clear error messages and status indicators

### ✅ Validation
- Required field validation for address information
- Shiprocket API response validation
- Database constraint checking

### ✅ Status Tracking
- Visual indicators for pickup location registration status
- Registration timestamp tracking
- Vendor dashboard integration ready

## Testing

### Manual Testing Steps

1. **Setup**: Ensure Shiprocket credentials are configured
2. **Database**: Run the migration script
3. **Test Registration**:
   - Go to `/vendor/settings`
   - Fill in all address fields
   - Save settings
   - Verify pickup location is registered with Shiprocket
4. **Test Update**:
   - Modify address fields
   - Save settings
   - Verify pickup location is updated (not duplicated)
5. **Test Error Handling**:
   - Temporarily disable Shiprocket credentials
   - Save settings
   - Verify graceful fallback behavior

### API Testing

```bash
# Test pickup location registration
curl -X POST http://localhost:3000/api/shiprocket/pickup-location \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "test_vendor_id",
    "storeName": "Test Store",
    "address": {
      "name": "Test Store",
      "email": "test@example.com",
      "phone": "1234567890",
      "address": "123 Test Street",
      "city": "Test City", 
      "state": "Test State",
      "country": "India",
      "pin_code": "400001"
    }
  }'

# Test getting pickup location info
curl "http://localhost:3000/api/shiprocket/pickup-location?vendorId=test_vendor_id"
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check Shiprocket credentials in environment variables
   - Verify Shiprocket account is active

2. **Database Errors**
   - Ensure migration script was run
   - Check RLS policies if using Supabase

3. **API Failures**
   - Verify Shiprocket API endpoints are accessible
   - Check network connectivity
   - Review Shiprocket API rate limits

4. **Form Validation**
   - Ensure all required address fields are filled
   - Check PIN code format validation

### Debug Logging

The system includes comprehensive debug logging:
- `[DEBUG]` tags for normal flow tracking
- `[ERROR]` tags for error conditions
- `[SUCCESS]` tags for successful operations

Check browser console and server logs for detailed troubleshooting information.

## Future Enhancements

### Planned Features

1. **Address Validation**: Integration with postal code validation APIs
2. **Multiple Locations**: Support for multiple pickup locations per vendor
3. **Location Sync**: Periodic sync with Shiprocket to ensure consistency
4. **Analytics**: Pickup location usage analytics and reporting
5. **Bulk Operations**: Bulk pickup location management for admin users

### Integration Opportunities

1. **Order Flow**: Automatic pickup location selection during order creation
2. **Shipping Rates**: Location-based shipping rate calculation
3. **Courier Selection**: Smart courier selection based on pickup location
4. **Inventory Management**: Location-based inventory tracking

## Security Considerations

1. **API Keys**: Shiprocket credentials stored securely in environment variables
2. **Data Validation**: All input data validated before processing
3. **Error Disclosure**: Minimal error information exposed to clients
4. **Access Control**: Vendor-specific data isolation enforced

## Support

For issues or questions regarding this feature:

1. Check the troubleshooting section above
2. Review debug logs in browser console and server
3. Verify environment configuration
4. Test with manual API calls if needed

---

**Last Updated**: May 2, 2026
**Version**: 1.0.0
**Dependencies**: Next.js, Supabase, Shiprocket API
