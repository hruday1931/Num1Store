# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Where to Find These Values

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "Project URL"

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - In the same API settings page
   - Copy the "anon" public key

3. **SUPABASE_SERVICE_ROLE_KEY**
   - In the same API settings page
   - Copy the "service_role" key (keep this secret!)

## Steps to Fix the Current Error

1. Create `.env.local` in your project root (`c:\Num1Store\.env.local`)
2. Add your Supabase credentials from above
3. Restart your development server (`npm run dev`)

## Important Notes

- Never commit `.env.local` to version control
- The `service_role` key should be kept secret and only used on the server
- If you don't have a Supabase project yet, create one at https://supabase.com
