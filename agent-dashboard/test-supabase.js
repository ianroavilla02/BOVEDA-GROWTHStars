const { testConnection, getAllAgentsFromDB, getMetricsOverview } = require('./db');

async function main() {
  console.log('Testing Supabase connection...\n');

  try {
    const test = await testConnection();
    console.log('Connected to Supabase');
    console.log(`   Agents count: ${test.agents_count}\n`);

    const agents = await getAllAgentsFromDB();
    console.log('Agents from DB:');
    agents.forEach(a => {
      const order = a.pipeline_order !== null ? `#${a.pipeline_order}` : '   ';
      console.log(`   ${order}  ${a.slug.padEnd(35)} ${a.panel.padEnd(12)} ${a.workspace}`);
    });

    console.log('\nMetrics Overview:');
    const metrics = await getMetricsOverview();
    console.log(`   Agents:   ${metrics.agents}`);
    console.log(`   Clients:  ${metrics.clients}`);
    console.log(`   Projects: ${metrics.projects}`);
    console.log(`   Runs:     ${metrics.runs}`);

    console.log('\nSupabase integration working correctly');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
