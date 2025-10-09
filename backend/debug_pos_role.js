import supabase from './config/supabase.js';

async function debugPOSRole() {
  try {
    // Get POS role
    const { data: posRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('slug', 'pos')
      .single();

    if (roleError || !posRole) {
      console.log('No POS role found');
      return;
    }

    console.log('='.repeat(60));
    console.log('POS ROLE DETAILS:');
    console.log('='.repeat(60));
    console.log('ID:', posRole.id);
    console.log('Name:', posRole.name);
    console.log('Slug:', posRole.slug);
    console.log('Is System:', posRole.is_system);
    console.log('Permissions:', JSON.stringify(posRole.permissions, null, 2));
    console.log('Has companies.view?', posRole.permissions.includes('companies.view'));
    console.log('');

    // Find users with this role
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, role_id, permissions')
      .eq('role_id', posRole.id);

    console.log('='.repeat(60));
    console.log('USERS WITH POS ROLE:', users?.length || 0);
    console.log('='.repeat(60));

    if (users && users.length > 0) {
      users.forEach(user => {
        console.log('\nUser:', user.email);
        console.log('  Full Name:', user.full_name);
        console.log('  Role (slug):', user.role);
        console.log('  Role ID:', user.role_id);
        console.log('  Custom Permissions:', JSON.stringify(user.permissions, null, 2));

        // Check if they have companies.view through custom grants
        if (user.permissions?.grant?.includes('companies.view')) {
          console.log('  ⚠️  WARNING: Has companies.view through custom GRANT');
        }
      });
    } else {
      console.log('No users found with POS role');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  }
}

debugPOSRole().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
