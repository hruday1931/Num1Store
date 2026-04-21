# Supabase Setup Guide

## Quick Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign in with GitHub or Google
   - Create a new organization (if needed)
   - Create a new project

2. **Get Your Credentials**
   - In your Supabase project dashboard
   - Go to **Settings** > **API**
   - Copy the **Project URL** and **anon public key**

3. **Configure Environment Variables**
   - Update your `.env.local` file with your actual credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up Database Tables**
   - In Supabase dashboard, go to **SQL Editor**
   - Run the complete SQL schema from `database_schema.sql` file
   - Or run the SQL manually from the setup file
   
   **Important**: The products table must include these columns to match the TypeScript interface:
   - `category` (TEXT)
   - `images` (TEXT[])
   - `inventory_count` (INTEGER)
   - `is_active` (BOOLEAN)

6. **Test the Configuration**
   - Restart your Next.js development server
   - Open browser console to see debug logs
   - Try signing up/Signing in

## Troubleshooting

### "Failed to fetch" Error
- Check that your `.env.local` file has correct Supabase URL and key
- Ensure your Supabase project is active (not paused)
- Verify the URL format: `https://your-project-id.supabase.co`

### Environment Variables Not Loading
- Make sure `.env.local` is in the project root
- Restart your development server after changing env variables
- Check that variables start with `NEXT_PUBLIC_` for client-side access

### Authentication Issues
- Enable authentication in Supabase dashboard
- Check that email/password auth is enabled
- Verify RLS policies allow access

## Debug Mode
The application now includes console logging to help debug:
- Supabase client initialization
- Form input values
- Authentication attempts
- Error details

Check the browser console for detailed error information.
