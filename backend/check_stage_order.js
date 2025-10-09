/**
 * Check Stage Order in Database
 */

import { supabase } from './config/supabase.js';

async function checkStageOrder() {
  console.log('🔍 Checking stage order in database...\n');

  try {
    // Get all pipelines with stages
    const { data: pipelines, error } = await supabase
      .from('pipelines')
      .select(`
        id,
        name,
        stages:pipeline_stages(id, name, display_order, color)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    pipelines.forEach(pipeline => {
      console.log(`📋 Pipeline: ${pipeline.name}`);

      if (pipeline.stages && pipeline.stages.length > 0) {
        // Sort by display_order
        const sortedStages = [...pipeline.stages].sort((a, b) => a.display_order - b.display_order);

        console.log('   Stages (sorted by display_order):');
        sortedStages.forEach(stage => {
          console.log(`      ${stage.display_order}. ${stage.name} (${stage.color}) [${stage.id}]`);
        });
      } else {
        console.log('   No stages');
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkStageOrder();
