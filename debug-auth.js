// Debug script to check authentication setup
const { createClient } = require('@supabase/supabase-js');

// Check environment variables
console.log('Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    console.log('Supabase client created successfully');
    
    // Test a simple query
    supabase.from('products').select('count').then(result => {
      console.log('Database connection test:', result.error ? 'FAILED' : 'SUCCESS');
      if (result.error) {
        console.error('Database error:', result.error);
      }
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
  }
} else {
  console.error('Missing required environment variables');
}
