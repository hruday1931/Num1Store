// Diagnostic tool to test Supabase connection
export async function testSupabaseConnection() {
  console.log('=== Supabase Connection Test ===');
  
  // Check environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Environment Check:');
  console.log('  URL:', url ? '✅ SET' : '❌ NOT SET');
  console.log('  Key:', key ? `✅ SET (${key.length} chars)` : '❌ NOT SET');
  
  if (!url || !key) {
    console.error('❌ MISSING ENVIRONMENT VARIABLES');
    console.error('Please check your .env.local file contains:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
    return { success: false, error: 'Missing environment variables' };
  }
  
  // Test if URL is valid
  try {
    const urlObj = new URL(url);
    console.log('🌐 URL Validation:');
    console.log(`  Hostname: ${urlObj.hostname}`);
    console.log(`  Protocol: ${urlObj.protocol}`);
    
    // Test basic connectivity with fetch
    console.log('🔌 Testing HTTP connectivity...');
    
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    console.log(`📡 HTTP Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('❌ CONNECTION FAILED');
      console.error(`HTTP ${response.status}: ${response.statusText}`);
      
      if (response.status === 401) {
        console.error('🔑 401 Error: Invalid API key or URL');
        console.error('Please verify your Supabase credentials in .env.local');
      }
      
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    console.log('✅ SUPABASE CONNECTION SUCCESSFUL!');
    
    // Test table existence (graceful)
    console.log('🗂️  Testing table existence...');
    const tables = ['profiles', 'vendors', 'products', 'cart', 'wishlist'];
    const tableResults: Record<string, { exists: boolean; status?: number; error?: string }> = {};
    
    for (const table of tables) {
      try {
        const tableResponse = await fetch(`${url}/rest/v1/${table}?select=count&limit=1`, {
          method: 'HEAD',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Prefer': 'count=exact'
          }
        });
        
        tableResults[table] = {
          exists: tableResponse.ok,
          status: tableResponse.status
        };
        
        if (tableResponse.ok) {
          console.log(`  ✅ ${table}: EXISTS`);
        } else {
          console.log(`  ❌ ${table}: MISSING (Status: ${tableResponse.status})`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        tableResults[table] = {
          exists: false,
          error: errorMessage
        };
        console.log(`  ⚠️  ${table}: ERROR - ${errorMessage}`);
      }
    }
    
    // Count existing tables
    const existingTables = Object.values(tableResults).filter(result => result.exists).length;
    console.log(`\n📊 SUMMARY: ${existingTables}/${tables.length} tables exist`);
    
    if (existingTables < tables.length) {
      console.log('🔧 ACTION NEEDED: Run the SQL schema in Supabase SQL Editor');
    }
    
    return { 
      success: true, 
      tables: tableResults,
      message: `Connection successful. ${existingTables}/${tables.length} tables exist.`
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ FATAL CONNECTION ERROR:', errorMessage);
    console.error('Please check your internet connection and Supabase URL');
    return { success: false, error: errorMessage };
  }
}
