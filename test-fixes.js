const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFixes() {
  try {
    console.log('=== Testing Fixes ===\n');
    
    // Test 1: Hero Banners
    console.log('1. Testing Hero Banners...');
    const { data: heroData, error: heroError } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('active', true);
    
    if (heroError) {
      console.log('❌ Hero banners error:', heroError.message);
    } else {
      console.log('✅ Hero banners work, found:', heroData?.length || 0);
      if (heroData && heroData.length > 0) {
        console.log('   Sample:', heroData[0].title);
      }
    }
    
    // Test 2: Featured Products
    console.log('\n2. Testing Featured Products...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);
    
    if (productsError) {
      console.log('❌ Featured products error:', productsError.message);
    } else {
      console.log('✅ Featured products work, found:', productsData?.length || 0);
      if (productsData && productsData.length > 0) {
        console.log('   Sample:', productsData[0].name, '- $', productsData[0].price);
      }
    }
    
    console.log('\n=== All Tests Complete ===');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testFixes();
