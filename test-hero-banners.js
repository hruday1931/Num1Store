const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testHeroBanners() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Try to query hero_banners table
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying hero_banners:', error);
      console.log('Please run the create-hero-banners-table.sql script in Supabase SQL Editor');
    } else {
      console.log('Hero banners table exists. Found', data.length, 'records');
    }
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

testHeroBanners();
