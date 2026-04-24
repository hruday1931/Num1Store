# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## How to Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project (or create a new one)
4. Navigate to **Settings → API** in your project dashboard
5. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Database Setup

Run the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample categories
INSERT INTO categories (name, slug, description, icon_name, sort_order) VALUES
('Electronics', 'electronics', 'Gadgets and devices', 'Laptop', 1),
('Fashion', 'fashion', 'Clothing and accessories', 'Shirt', 2),
('Home', 'home', 'Home and living', 'Home', 3),
('Beauty', 'beauty', 'Beauty and health', 'Sparkles', 4),
('Sports', 'sports', 'Sports and fitness', 'Package', 5),
('Gaming', 'gaming', 'Games and consoles', 'Gamepad2', 6);
```

## After Setup

1. Restart your development server: `npm run dev`
2. The console error should disappear
3. Categories will load from your Supabase database
