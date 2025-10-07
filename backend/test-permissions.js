/**
 * Test Permission System
 * Quick script to check current users and test permission API
 */

import supabase from './config/supabase.js';
import { getUserPermissionsSummary } from './utils/permissions.js';

async function testPermissionSystem() {
  console.log('\n=== Testing Permission System ===\n');

  try {
    // 1. Get all users
    console.log('1. Fetching all users...\n');
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, permissions')
      .order('created_at');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log(`Found ${users.length} users:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Custom Permissions: ${JSON.stringify(user.permissions || {}, null, 2)}`);

      // Calculate effective permissions
      const summary = getUserPermissionsSummary(user);
      console.log(`   Effective Permissions Count: ${summary.effectivePermissions.length}`);
      console.log(`   Has Custom Overrides: ${summary.hasCustomOverrides}`);
      console.log('---\n');
    });

    // 2. Test permission calculation for each role
    console.log('\n2. Testing Permission Calculation:\n');

    const testUser = {
      role: 'agent',
      permissions: {
        grant: ['tags.create', 'tags.edit'],
        revoke: ['contacts.create']
      }
    };

    const agentSummary = getUserPermissionsSummary(testUser);
    console.log('Test Agent with Custom Permissions:');
    console.log(`  Base Role Permissions: ${agentSummary.rolePermissions.length}`);
    console.log(`  Custom Grants: ${agentSummary.customPermissions.grant?.length || 0}`);
    console.log(`  Custom Revokes: ${agentSummary.customPermissions.revoke?.length || 0}`);
    console.log(`  Effective Total: ${agentSummary.effectivePermissions.length}`);
    console.log(`  Effective Permissions: ${agentSummary.effectivePermissions.slice(0, 10).join(', ')}...`);

    console.log('\n=== Test Complete ===\n');
    console.log('Next Steps:');
    console.log('1. Login to get auth token');
    console.log('2. Use token to test API endpoints (see PERMISSION_SYSTEM_TEST.md)');
    console.log('3. Try granting/revoking permissions via API');

  } catch (error) {
    console.error('Test failed:', error);
  }

  process.exit(0);
}

testPermissionSystem();
