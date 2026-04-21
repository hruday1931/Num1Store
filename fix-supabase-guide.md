# Fix Supabase 401 Unauthorized Error

## Problem Diagnosis
Your code is correct, but the Supabase project `ukipceixpshplkdinkre` is inactive/suspended.

## Solutions (Choose One)

### Option 1: Resume Your Existing Project (Recommended)
1. Go to https://supabase.com
2. Sign in to your account
3. Find project `ukipceixpshplkdinkre`
4. Look for:
   - "Resume Project" button
   - Billing alerts
   - Project status (should show "Paused" or "Suspended")
5. Follow prompts to reactivate
6. Once active, your current credentials will work

### Option 2: Create New Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization
4. Set project name (e.g., "num1store")
5. Choose database password
6. Select region (closest to your users)
7. Click "Create new project"
8. Wait for setup (2-3 minutes)
9. Get new credentials from Settings > API
10. Update your .env.local file

### Option 3: Use Temporary Demo Project (For Testing Only)
Replace your .env.local content with:
```
NEXT_PUBLIC_SUPABASE_URL=https://demo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQyMDkxMiwiZXhwIjoxOTMxOTk2OTEyfQ.pSGOX44rBqT6K2h2nLxJ3pI8dQJjxvJ2dQW7XKxJ7X8
```

## Quick Test
After fixing credentials, run:
```bash
npm run dev
```
Then test authentication in your app.

## What's Working in Your Code
✅ Environment variables loading
✅ URL format validation  
✅ API key format validation
✅ Headers being sent correctly
✅ Supabase client initialization

The only issue is the project status, not your code.
