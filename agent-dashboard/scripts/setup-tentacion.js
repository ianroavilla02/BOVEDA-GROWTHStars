// =====================================================================
// Setup TENTACIÓN — verifica IDs y crea proyecto si no existe
// =====================================================================

require('dotenv').config();
const db = require('../db');

async function main() {
  try {
    // 1. Buscar cliente Marlon
    const { data: client, error: clientError } = await db.supabase
      .from('clients')
      .select('id, slug, display_name')
      .eq('slug', 'marlon-villamil-legacy')
      .single();

    if (clientError) throw new Error(`Cliente no encontrado: ${clientError.message}`);
    console.log('Cliente Marlon:', client);

    // 2. Buscar artista Marlon (best effort)
    const { data: artist, error: artistError } = await db.supabase
      .from('artists')
      .select('id, slug, stage_name')
      .ilike('slug', '%marlon%')
      .maybeSingle();

    if (artistError) {
      console.warn('Error buscando artista:', artistError.message);
    }
    console.log('Artista Marlon:', artist || 'NO ENCONTRADO (se usará null)');

    // 3. Buscar proyecto TENTACIÓN
    const { data: existingProject, error: projectError } = await db.supabase
      .from('projects')
      .select('id, name, phase, release_date')
      .eq('client_id', client.id)
      .ilike('name', 'tent%')
      .maybeSingle();

    if (projectError) throw new Error(`Error buscando proyecto: ${projectError.message}`);

    let project = existingProject;

    if (!project) {
      console.log('Proyecto TENTACIÓN no existe. Creando...');
      const { data: newProject, error: insertError } = await db.supabase
        .from('projects')
        .insert({
          client_id: client.id,
          artist_id: artist?.id || null,
          name: 'TENTACIÓN',
          project_type: 'lanzamiento',
          phase: 'pre-release',
          release_date: '2026-09-04',
          notes: 'Single TENTACIÓN — Marlon Villamil. Fiesta 26 ago 2026, lanzamiento 4 sep 2026 (New Music Friday).',
          metadata: { campaign_slug: 'tentacion', ep: 'AMOR ADOLESCENTE' }
        })
        .select()
        .single();

      if (insertError) throw new Error(`Error creando proyecto: ${insertError.message}`);
      project = newProject;
    } else {
      console.log('Proyecto TENTACIÓN ya existe.');
    }

    console.log('Proyecto TENTACIÓN:', project);

    // 4. Verificar que tabla project_assets existe
    const { data: tableCheck, error: tableError } = await db.supabase
      .from('project_assets')
      .select('id', { count: 'exact', head: true });

    if (tableError) {
      console.error('ERROR: La tabla project_assets NO existe. Aplicar migración SQL primero.');
      console.error(tableError.message);
      process.exit(1);
    }

    console.log('Tabla project_assets OK. Filas existentes:', tableCheck);

    console.log('\n=== RESUMEN ===');
    console.log(`CLIENT_ID: ${client.id}`);
    console.log(`ARTIST_ID: ${artist?.id || 'null'}`);
    console.log(`PROJECT_ID: ${project.id}`);
    console.log('\nActualizar .env de tentacion-launch con:');
    console.log(`REACT_APP_PROJECT_ID=${project.id}`);

  } catch (err) {
    console.error('FATAL:', err.message);
    process.exit(1);
  }
}

main();
