/**
 * Check Users and Organizations Mapping
 */

import { supabase } from './config/supabase.js';

async function checkUsersOrgs() {
  console.log('🔍 Checking Users and Organizations...\n');

  try {
    // Get all users with their organizations
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        organization_id,
        organizations!inner(id, name)
      `)
      .order('email');

    if (error) throw error;

    console.log(`Found ${users.length} users:\n`);

    // Group by organization
    const usersByOrg = {};
    users.forEach(u => {
      const orgName = u.organizations.name;
      if (!usersByOrg[orgName]) usersByOrg[orgName] = [];
      usersByOrg[orgName].push(u);
    });

    Object.entries(usersByOrg).forEach(([orgName, orgUsers]) => {
      console.log(`📁 ${orgName}:`);
      orgUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.full_name || 'No name'})`);
      });
      console.log('');
    });

    // Check pipelines per org
    console.log('\n📊 Pipelines per Organization:\n');

    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name');

    for (const org of orgs) {
      const { count } = await supabase
        .from('pipelines')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      const { count: stageCount } = await supabase
        .from('pipeline_stages')
        .select('id', { count: 'exact', head: true })
        .in('pipeline_id',
          (await supabase.from('pipelines').select('id').eq('organization_id', org.id)).data?.map(p => p.id) || []
        );

      const { count: dealCount } = await supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      console.log(`${org.name}:`);
      console.log(`   - Pipelines: ${count || 0}`);
      console.log(`   - Stages: ${stageCount || 0}`);
      console.log(`   - Deals: ${dealCount || 0}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkUsersOrgs();
