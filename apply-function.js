const fs = require('fs');
const path = require('path');

// Read the updated SQL function
const sql = fs.readFileSync(path.join(__dirname, 'create-order-function.sql'), 'utf8');
console.log('Updated SQL function loaded. You need to run this in Supabase SQL Editor:');
console.log('\n--- COPY THIS TO SUPABASE SQL EDITOR ---');
console.log(sql);
console.log('--- END SQL ---');
