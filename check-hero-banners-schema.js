const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkHeroBannersSchema() {
  try {
    console.log('=== Checking Hero Banners Schema ===\n');
    
    // Get one hero banner to see the actual columns
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Hero banner columns found:');
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof data[0][key]} (${data[0][key]})`);
      });
    } else {
      console.log('No hero banners found in table');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

checkHeroBannersSchema().then(() => {
  console.log('\n=== Check Complete ===');
});
