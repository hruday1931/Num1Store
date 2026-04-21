# Image Upload Fix for RLS Policy Issues

This document outlines the fixes applied to resolve the image upload RLS (Row Level Security) policy errors in the Num1Store application.

## Issues Fixed

1. **Authentication Check**: Added proper user authentication validation before attempting uploads
2. **Bucket Targeting**: Ensured uploads target the correct `product-images` bucket
3. **Sequential Upload**: Changed from parallel to sequential upload for better error handling
4. **RLS Policy Updates**: Created proper storage policies for vendor image uploads
5. **Error Handling**: Improved error messages and debugging information

## Changes Made

### 1. Updated Storage Utility (`src/utils/storage.ts`)

- Added `User` parameter to upload functions
- Added authentication check before upload attempts
- Enhanced RLS error detection and messaging
- Changed `uploadMultipleImages` to process files sequentially (one by one)
- Added file limit validation (max 5 images)
- Added proper content type handling

### 2. Updated Vendor Products Page (`src/app/vendor/products/new/page.tsx`)

- Added user authentication check before starting uploads
- Pass user object to upload functions
- Improved error reporting with detailed error messages
- Better progress tracking for sequential uploads

### 3. Created Storage RLS Policies (`fix-storage-rls-policies.sql`)

- Enables RLS on storage objects table
- Creates policies for:
  - Viewing product images (authenticated users)
  - Uploading to vendor folders (vendors only)
  - Updating own images (vendors only)
  - Deleting own images (vendors only)
- Ensures `product-images` bucket exists with proper settings

### 4. Added Test Script (`test-image-upload.js`)

- Tests authentication and vendor status
- Verifies storage bucket existence
- Tests actual upload functionality
- Provides detailed error reporting
- Cleans up test files

## How to Apply the Fixes

### Step 1: Update Storage Policies

Run the SQL script in your Supabase dashboard:

```sql
-- Copy and paste the contents of fix-storage-rls-policies.sql
-- into the Supabase SQL Editor and run it
```

### Step 2: Test the Upload Functionality

Run the test script to verify everything works:

```bash
# Set your environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Run the test
node test-image-upload.js
```

### Step 3: Test in the Application

1. Start your development server
2. Sign in as a vendor with active subscription
3. Navigate to `/vendor/products/new`
4. Try uploading product images
5. Check browser console for detailed logs

## Key Features of the Fix

### Authentication Validation
```typescript
// Before upload, we check if user is authenticated
if (!user) {
  return {
    url: '',
    path: '',
    error: 'User must be authenticated to upload images'
  };
}
```

### Sequential Upload Processing
```typescript
// Upload images one by one for better error handling
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  console.log(`Uploading image ${i + 1}/${files.length}: ${file.name}`);
  
  const result = await uploadImage(file, bucketName, folder, productId, user);
  results.push(result);
}
```

### Enhanced Error Messages
```typescript
// Better RLS error detection
if (error.message.includes('row-level security policy') || error.message.includes('PGRST')) {
  errorMessage = `Storage permission denied. RLS Policy Error: ${error.message}. Please ensure you have an active vendor subscription and proper storage permissions.`;
}
```

## Folder Structure

The upload system organizes images in this structure:
```
product-images/
  vendors/
    {user-id}/
      {date}/
        {product-id}/
          {product-id}_{timestamp}.jpg
```

## Security Considerations

1. **Vendor Isolation**: Each vendor can only access their own folder
2. **Authentication Required**: All uploads require authenticated users
3. **Active Subscription**: Only vendors with active subscriptions can upload
4. **File Type Validation**: Only JPEG, PNG, and WebP images allowed
5. **Size Limits**: 2MB maximum file size per image

## Troubleshooting

### Common Issues and Solutions

1. **"User must be authenticated to upload images"**
   - Ensure you're signed in as a vendor
   - Check your authentication session is valid

2. **"Storage permission denied. RLS Policy Error"**
   - Run the `fix-storage-rls-policies.sql` script
   - Ensure user has active vendor subscription

3. **"product-images bucket not found"**
   - Run the SQL script to create the bucket
   - Check bucket permissions in Supabase dashboard

4. **Upload fails with network error**
   - Check your internet connection
   - Verify Supabase URL and keys are correct
   - Check Supabase service status

## Testing Checklist

- [ ] User can sign in as vendor
- [ ] Vendor has active subscription
- [ ] Storage policies are applied
- [ ] Bucket exists and is public
- [ ] Upload works for JPEG, PNG, WebP
- [ ] File size limits are enforced
- [ ] Sequential upload processes all 5 images
- [ ] Error messages are clear and helpful
- [ ] Public URLs are generated correctly
- [ ] Images are accessible via public URLs

## Support

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Run the test script for automated diagnostics
3. Verify all SQL policies were applied successfully
4. Ensure your environment variables are set correctly

The upload system now provides robust error handling, proper authentication checks, and detailed logging to help diagnose any remaining issues.
