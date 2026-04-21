// Run this script to create the categories table if it doesn't exist
// Usage: node setup-categories.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupCategories() {
  try {
    console.log('Setting up categories table...');
    
    // Read and execute the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'create-categories-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Note: This won't work with the anon key - you need to run this in Supabase SQL Editor
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('---');
    console.log(sql);
    console.log('---');
    console.log('\nOr open create-categories-table.sql and copy the SQL to run in Supabase.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setupCategories();
