/**
 * Test Pipeline API Endpoints
 * Simulates authenticated request to check if endpoints work
 */

import { supabase } from './config/supabase.js';

async function testPipelineAPI() {
  console.log('🔍 Testing Pipeline API...\n');

  try {
    // Get all organizations
    console.log('1️⃣ Getting organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name');

    if (orgError) throw orgError;

    console.log(`Found ${orgs.length} organizations:`);
    orgs.forEach(o => console.log(`   - ${o.name} (${o.id})`));

    // Test for each organization
    for (const org of orgs) {
      console.log(`\n2️⃣ Testing pipelines for: ${org.name}`);

      const { data: pipelines, error: pipelineError } = await supabase
        .from('pipelines')
        .select(`
          *,
          created_by_user:users!pipelines_created_by_fkey(id, full_name),
          stages:pipeline_stages(id, name, display_order, color)
        `)
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false });

      if (pipelineError) {
        console.error(`   ❌ Error:`, pipelineError.message);
        continue;
      }

      console.log(`   ✅ Found ${pipelines.length} pipelines`);

      pipelines.forEach(p => {
        console.log(`\n   Pipeline: ${p.name}`);
        console.log(`   - ID: ${p.id}`);
        console.log(`   - Default: ${p.is_default}`);
        console.log(`   - Active: ${p.is_active}`);
        console.log(`   - Stages: ${p.stages?.length || 0}`);

        if (p.stages && p.stages.length > 0) {
          p.stages
            .sort((a, b) => a.display_order - b.display_order)
            .forEach(s => {
              console.log(`      ${s.display_order}. ${s.name} (${s.color}) [${s.id}]`);
            });
        } else {
          console.log(`      ⚠️  No stages found!`);
        }

        // Test getting deals for this pipeline
        console.log(`   - Testing deals endpoint...`);
      });

      // Test deals endpoint for first pipeline
      if (pipelines.length > 0) {
        const pipelineId = pipelines[0].id;
        console.log(`\n3️⃣ Testing GET /pipelines/${pipelineId}/deals`);

        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select(`
            *,
            contact:contacts(id, name, phone, avatar_url),
            company:companies(id, name, logo_url),
            assigned_user:users!deals_assigned_to_fkey(id, full_name, avatar_url)
          `)
          .eq('pipeline_id', pipelineId)
          .eq('organization_id', org.id);

        if (dealsError) {
          console.error(`   ❌ Error:`, dealsError.message);
        } else {
          console.log(`   ✅ Found ${deals.length} deals`);
          deals.forEach(d => {
            console.log(`      - ${d.title} (${d.value} ${d.currency}) - Stage: ${d.stage_id}`);
          });
        }
      }
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

testPipelineAPI();
