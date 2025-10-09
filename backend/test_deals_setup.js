/**
 * Test Script: Check Deals Setup
 *
 * This script checks:
 * 1. If pipelines exist
 * 2. If pipeline_stages exist
 * 3. User's organization ID
 * 4. User's permissions
 */

import { supabase } from './config/supabase.js';

async function testDealsSetup() {
  console.log('🔍 Checking Deals Module Setup...\n');

  try {
    // 1. Check pipelines
    console.log('1️⃣ Checking pipelines...');
    const { data: pipelines, error: pipelineError } = await supabase
      .from('pipelines')
      .select('*');

    if (pipelineError) {
      console.error('❌ Error fetching pipelines:', pipelineError.message);
    } else {
      console.log(`✅ Found ${pipelines.length} pipelines`);
      pipelines.forEach(p => {
        console.log(`   - ${p.name} (${p.id}) [org: ${p.organization_id}]`);
      });
    }

    // 2. Check pipeline_stages
    console.log('\n2️⃣ Checking pipeline stages...');
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('*');

    if (stagesError) {
      console.error('❌ Error fetching stages:', stagesError.message);
    } else {
      console.log(`✅ Found ${stages.length} stages`);

      // Group by pipeline
      const stagesByPipeline = stages.reduce((acc, stage) => {
        if (!acc[stage.pipeline_id]) acc[stage.pipeline_id] = [];
        acc[stage.pipeline_id].push(stage);
        return acc;
      }, {});

      Object.entries(stagesByPipeline).forEach(([pipelineId, pipelineStages]) => {
        console.log(`   Pipeline ${pipelineId}: ${pipelineStages.length} stages`);
        pipelineStages
          .sort((a, b) => a.display_order - b.display_order)
          .forEach(s => console.log(`      ${s.display_order}. ${s.name} (${s.color})`));
      });
    }

    // 3. Check deals
    console.log('\n3️⃣ Checking deals...');
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('*');

    if (dealsError) {
      console.error('❌ Error fetching deals:', dealsError.message);
    } else {
      console.log(`✅ Found ${deals.length} deals`);
      deals.forEach(d => {
        console.log(`   - ${d.title} (${d.value} ${d.currency}) - Status: ${d.status}`);
      });
    }

    // 4. Check organizations
    console.log('\n4️⃣ Checking organizations...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name');

    if (orgsError) {
      console.error('❌ Error fetching organizations:', orgsError.message);
    } else {
      console.log(`✅ Found ${orgs.length} organizations`);
      orgs.forEach(o => {
        console.log(`   - ${o.name} (${o.id})`);
      });
    }

    // 5. Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    if (pipelines.length === 0) {
      console.log('⚠️  No pipelines found! You need to create a pipeline first.');
      console.log('   Run the SQL from DEALS_QUICK_START.md Step 3 to create test data.');
    }
    if (stages.length === 0) {
      console.log('⚠️  No pipeline stages found! You need to create stages.');
    }
    if (deals.length === 0) {
      console.log('ℹ️  No deals found. This is OK - you can create deals from the UI.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n✅ Check complete!');
  process.exit(0);
}

testDealsSetup();
