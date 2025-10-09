import supabase from './config/supabase.js';

async function testMeEndpoint() {
  try {
    // First find the user by email
    const { data: userLookup } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'agent@test.com')
      .single();

    if (!userLookup) {
      console.log('User agent@test.com not found');
      return;
    }

    const userId = userLookup.id;

    // Simulate what /me endpoint does
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*),
        role:roles(id, name, slug, permissions)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('='.repeat(60));
    console.log('WHAT /me ENDPOINT RETURNS FOR agent@test.com:');
    console.log('='.repeat(60));
    console.log('\nUser Data:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Full Name:', user.full_name);
    console.log('  Role (slug):', user.role?.slug || 'member');
    console.log('  Role ID:', user.role?.id);
    console.log('  Role Name:', user.role?.name);
    console.log('\nRole Permissions from DB:');
    console.log('  ', JSON.stringify(user.role?.permissions || [], null, 2));
    console.log('\nCustom Permissions:');
    console.log('  ', JSON.stringify(user.permissions || { grant: [], revoke: [] }, null, 2));
    console.log('\nHas companies.view in rolePermissions?',
      (user.role?.permissions || []).includes('companies.view'));
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  }
}

testMeEndpoint().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
