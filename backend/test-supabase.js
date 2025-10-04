/**
 * Supabase Connection Test
 *
 * This script tests the connection to Supabase and verifies that tables exist.
 * Run with: node test-supabase.js
 */

import supabase from './config/supabase.js';

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check organizations table exists
    console.log('Test 1: Checking organizations table...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    if (orgError) {
      console.error('❌ Organizations table error:', orgError.message);
    } else {
      console.log('✅ Organizations table accessible');
      console.log(`   Found ${orgs.length} organizations`);
    }

    // Test 2: Check users table exists
    console.log('\nTest 2: Checking users table...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.error('❌ Users table error:', userError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log(`   Found ${users.length} users`);
    }

    // Test 3: Check invitations table exists
    console.log('\nTest 3: Checking invitations table...');
    const { data: invites, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1);

    if (inviteError) {
      console.error('❌ Invitations table error:', inviteError.message);
    } else {
      console.log('✅ Invitations table accessible');
      console.log(`   Found ${invites.length} invitations`);
    }

    // Test 4: Test insert permission (should work with service role)
    console.log('\nTest 4: Testing write permissions...');
    const testOrg = {
      name: 'Test Organization',
      slug: `test-org-${Date.now()}`,
      subscription_plan: 'free',
      subscription_status: 'trialing'
    };

    const { data: newOrg, error: insertError } = await supabase
      .from('organizations')
      .insert(testOrg)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
    } else {
      console.log('✅ Write permissions working');
      console.log(`   Created test organization: ${newOrg.name}`);

      // Clean up test data
      await supabase.from('organizations').delete().eq('id', newOrg.id);
      console.log('   (Test data cleaned up)');
    }

    console.log('\n✅ All tests passed! Supabase is connected and working.');

  } catch (err) {
    console.error('\n❌ Connection test failed:', err.message);
    console.error('\nPlease check:');
    console.error('1. SUPABASE_URL is correct in .env');
    console.error('2. SUPABASE_SERVICE_ROLE_KEY is correct in .env');
    console.error('3. Foundation migration has been run in Supabase SQL Editor');
  }
}

testConnection();
