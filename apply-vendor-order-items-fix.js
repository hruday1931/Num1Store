// Apply RLS fix for vendor order_items and orders access
// This fixes the console errors: 
// - "Error fetching orders count: {}"
// - "Error fetching recent orders: {}"

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyVendorOrderItemsFix() {
  console.log('Applying vendor order_items and orders RLS fix...');

  try {
    // =====================================================
    // FIX ORDER_ITEMS TABLE
    // =====================================================
    console.log('\n=== FIXING ORDER_ITEMS TABLE ===');
    
    // 1. Drop the existing restrictive policy
    console.log('1. Dropping existing restrictive policy...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can view own order items" ON order_items;'
    });

    if (dropError) {
      console.warn('Warning dropping policy (may not exist):', dropError.message);
    } else {
      console.log('   Existing policy dropped successfully');
    }

    // 2. Create customer policy
    console.log('2. Creating customer access policy...');
    const { error: customerPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Customers can view own order items" ON order_items FOR SELECT USING (
          auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
        );
      `
    });

    if (customerPolicyError) {
      console.error('Error creating customer policy:', customerPolicyError);
      return;
    }
    console.log('   Customer policy created successfully');

    // 3. Create vendor policy
    console.log('3. Creating vendor access policy...');
    const { error: vendorPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Vendors can view order items for their products" ON order_items FOR SELECT USING (
          auth.uid() IN (
            SELECT vendor_id 
            FROM products 
            WHERE id = product_id
          )
        );
      `
    });

    if (vendorPolicyError) {
      console.error('Error creating vendor policy:', vendorPolicyError);
      return;
    }
    console.log('   Vendor policy created successfully');

    // 4. Create insert policy
    console.log('4. Creating insert policy...');
    const { error: insertPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Enable insert for authenticated users" ON order_items FOR INSERT WITH CHECK (
          auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
        );
      `
    });

    if (insertPolicyError) {
      console.error('Error creating insert policy:', insertPolicyError);
      return;
    }
    console.log('   Insert policy created successfully');

    // 5. Create update policy
    console.log('5. Creating update policy...');
    const { error: updatePolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Enable update for order owners" ON order_items FOR UPDATE USING (
          auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
        );
      `
    });

    if (updatePolicyError) {
      console.error('Error creating update policy:', updatePolicyError);
      return;
    }
    console.log('   Update policy created successfully');

    // 6. Create delete policy
    console.log('6. Creating delete policy...');
    const { error: deletePolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Enable delete for order owners" ON order_items FOR DELETE USING (
          auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
        );
      `
    });

    if (deletePolicyError) {
      console.error('Error creating delete policy:', deletePolicyError);
      return;
    }
    console.log('   Delete policy created successfully');

    // =====================================================
    // FIX ORDERS TABLE
    // =====================================================
    console.log('\n=== FIXING ORDERS TABLE ===');
    
    // 7. Drop existing restrictive orders policies
    console.log('7. Dropping existing restrictive orders policies...');
    const { error: dropOrdersError1 } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Users can view own orders" ON orders;'
    });
    const { error: dropOrdersError2 } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Admins can view all orders" ON orders;'
    });

    if (dropOrdersError1 || dropOrdersError2) {
      console.warn('Warning dropping orders policies (may not exist):', dropOrdersError1?.message || dropOrdersError2?.message);
    } else {
      console.log('   Existing orders policies dropped successfully');
    }

    // 8. Create customer orders policy
    console.log('8. Creating customer orders policy...');
    const { error: customerOrdersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (
          auth.uid() = customer_id
        );
      `
    });

    if (customerOrdersError) {
      console.error('Error creating customer orders policy:', customerOrdersError);
      return;
    }
    console.log('   Customer orders policy created successfully');

    // 9. Create vendor orders policy (KEY FIX FOR RECENT ORDERS)
    console.log('9. Creating vendor orders policy...');
    const { error: vendorOrdersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Vendors can view orders with their products" ON orders FOR SELECT USING (
          EXISTS (
            SELECT 1 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = orders.id 
            AND p.vendor_id = auth.uid()
          )
        );
      `
    });

    if (vendorOrdersError) {
      console.error('Error creating vendor orders policy:', vendorOrdersError);
      return;
    }
    console.log('   Vendor orders policy created successfully');

    // 10. Create other orders policies
    console.log('10. Creating additional orders policies...');
    const ordersPolicies = [
      `CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);`,
      `CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = customer_id);`,
      `CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM vendors WHERE is_approved = TRUE AND is_admin = TRUE)
      );`
    ];

    for (let i = 0; i < ordersPolicies.length; i++) {
      const { error } = await supabase.rpc('exec_sql', { sql: ordersPolicies[i] });
      if (error) {
        console.error(`Error in orders policy ${i + 1}:`, error);
        return;
      }
    }
    console.log('   Additional orders policies created successfully');

    console.log('\n=== SUCCESS ===');
    console.log('Vendor order_items and orders RLS fix applied successfully!');
    console.log('The vendor dashboard should now be able to fetch:');
    console.log('  - Orders count without errors');
    console.log('  - Recent orders without errors');
    console.log('  - Sales data without errors');

    // 11. Verify the policies
    console.log('\n11. Verifying policies...');
    const { data: orderItemsPolicies, error: orderItemsPoliciesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'order_items');

    const { data: ordersPoliciesData, error: ordersPoliciesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'orders');

    if (orderItemsPoliciesError || ordersPoliciesError) {
      console.warn('Could not verify policies:', orderItemsPoliciesError?.message || ordersPoliciesError?.message);
    } else {
      console.log('Current order_items policies:');
      orderItemsPolicies?.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
      
      console.log('Current orders policies:');
      ordersPoliciesData?.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Alternative approach using direct SQL execution
async function applyFixWithDirectSQL() {
  console.log('Applying fix with direct SQL...');
  
  const sqlStatements = [
    'DROP POLICY IF EXISTS "Users can view own order items" ON order_items;',
    `CREATE POLICY "Customers can view own order items" ON order_items FOR SELECT USING (
      auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
    );`,
    `CREATE POLICY "Vendors can view order items for their products" ON order_items FOR SELECT USING (
      auth.uid() IN (
        SELECT vendor_id 
        FROM products 
        WHERE id = product_id
      )
    );`,
    `CREATE POLICY "Enable insert for authenticated users" ON order_items FOR INSERT WITH CHECK (
      auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
    );`,
    `CREATE POLICY "Enable update for order owners" ON order_items FOR UPDATE USING (
      auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
    );`,
    `CREATE POLICY "Enable delete for order owners" ON order_items FOR DELETE USING (
      auth.uid() IN (SELECT customer_id FROM orders WHERE id = order_id)
    );`
  ];

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`Executing statement ${i + 1}/${sqlStatements.length}: ${sql.split('\n')[0].trim()}`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error(`Error in statement ${i + 1}:`, error);
        console.log('Trying alternative approach...');
        
        // Try using the SQL editor approach
        const { error: altError } = await supabase
          .from('order_items')
          .select('count')
          .limit(1);
          
        if (altError && altError.code === '42501') {
          console.log('RLS is active but policies need to be updated manually in Supabase SQL Editor.');
          console.log('Please run the SQL statements from fix-vendor-order-items-rls.sql in your Supabase SQL Editor.');
        }
      } else {
        console.log('   Success!');
      }
    } catch (error) {
      console.error(`Exception in statement ${i + 1}:`, error);
    }
  }
}

// Run the fix
applyVendorOrderItemsFix().catch(() => {
  console.log('Primary method failed, trying direct SQL...');
  applyFixWithDirectSQL();
});
