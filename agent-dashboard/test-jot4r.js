const { supabase } = require('./db');

async function main() {
  console.log('Verificando datos de Jot4 R desde Node.js...\n');

  // Get client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', 'jot4r')
    .single();

  console.log('Cliente:');
  console.log(`  ID:          ${client.id}`);
  console.log(`  Slug:        ${client.slug}`);
  console.log(`  Display:     ${client.display_name}`);
  console.log(`  Tier:        ${client.artist_tier}`);
  console.log(`  Country:     ${client.country}`);
  console.log(`  Genre:       ${client.genre}`);
  console.log(`  Status:      ${client.status}`);

  // Get project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', client.id)
    .limit(1)
    .single();

  console.log('\nProyecto:');
  console.log(`  Name:        ${project.name}`);
  console.log(`  Type:        ${project.project_type}`);
  console.log(`  Phase:       ${project.phase}`);
  console.log(`  Status:      ${project.status}`);
  console.log(`  Price USD:   ${project.package_price_usd}`);
  console.log(`  Price COP:   ${project.package_price_cop}`);

  // Get runs for this project
  const { data: runs, error: runsErr } = await supabase
    .from('runs')
    .select('agent_id, status, started_at, completed_at, metadata')
    .eq('project_id', project.id)
    .order('started_at', { ascending: true });

  if (runsErr) throw runsErr;

  // Get agent names separately
  const agentIds = [...new Set(runs.map(r => r.agent_id))];
  const { data: agents } = await supabase
    .from('agents')
    .select('id, slug, name, pipeline_order')
    .in('id', agentIds);

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));

  console.log(`\nRuns ejecutados (${runs.length}):`);
  for (const run of runs) {
    const agent = agentMap[run.agent_id] || { slug: 'unknown', pipeline_order: null };
    const order = agent.pipeline_order !== null ? `#${agent.pipeline_order}` : '---';
    const duration = new Date(run.completed_at) - new Date(run.started_at);
    const minutes = Math.round(duration / 1000 / 60);
    console.log(`  ${order}  ${agent.slug.padEnd(35)} ${run.status.padEnd(12)} (${minutes}min)`);
  }

  console.log('\nVerificacion end-to-end completada');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
