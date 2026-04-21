# Database Setup Guide for Num1Store

## Issue
The products page is showing a Supabase error because the database schema hasn't been applied to your Supabase project.

## Solution

### Step 1: Get Your Database Schema
The schema is already defined in `database_schema.sql` in your project root.

### Step 2: Apply the Schema to Supabase

1. **Open your Supabase project dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New query" to open a new SQL window

3. **Run the schema**
   - Copy the entire contents of `database_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

4. **Verify the setup**
   - You should see "Success" messages for each table creation
   - The script will create sample data automatically

### Step 3: Check the Results

After running the schema, you should see:
- Tables: `profiles`, `vendors`, `products`, `orders`, `order_items`, `cart`, `wishlist`
- Sample products inserted automatically
- Row Level Security (RLS) policies configured

### Step 4: Test the Application

1. Refresh your browser at `http://localhost:3000/products`
2. You should now see the sample products displayed
3. The console error should be resolved

## Troubleshooting

### If you get permission errors:
- Make sure you're running the SQL as the project owner
- Check that your Supabase project is active

### If tables already exist:
- The script uses `IF NOT EXISTS` so it should handle existing tables gracefully
- You may need to manually drop and recreate tables if there are schema conflicts

### If sample data doesn't appear:
- Check that the sample data insertion at the bottom of the script ran successfully
- You can manually insert sample data using the SQL Editor

## What the Schema Creates

### Tables:
- **profiles**: User profile information
- **vendors**: Seller/store information
- **products**: Product catalog with categories
- **orders**: Customer orders
- **order_items**: Items in each order
- **cart**: Shopping cart functionality
- **wishlist**: Customer wishlists

### Sample Data:
The script automatically inserts 5 sample products:
1. Wireless Headphones - ¥299.99 (Electronics)
2. Organic Coffee Beans - ¥24.99 (Food)
3. Yoga Mat - ¥39.99 (Sports)
4. Smart Watch - ¥199.99 (Electronics)
5. Running Shoes - ¥89.99 (Sports)

### Security:
- Row Level Security (RLS) is enabled on all tables
- Policies allow public read access to active products
- Vendors can only manage their own products
- Users can only access their own data

After completing these steps, your Num1Store application should work properly with the products page displaying the sample data.
