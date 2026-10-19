# PROMPT: Fix urgente — Dashboard en blanco por cambio de mes + Feature "Cerrar Mes"

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** db.js + server.js + index.html
> **Prioridad:** CRÍTICA (dashboard roto) + Alta (feature nueva)

---

## PROBLEMA URGENTE

El dashboard muestra todo en 0 porque hoy es 1 de julio UTC pero los engagements tienen `month: '2026-06'`. La función `getMgmtOverview()` y `getBusinessMetrics()` filtran con `.eq('month', currentMonth)` donde `currentMonth = '2026-07'` — no matchea nada.

**El ciclo de facturación de G*S va del 10 al 10**, no del 1 al 1. El mes no se cierra automáticamente — se cierra manualmente cuando el usuario lo decide.

---

## PARTE 1: Fix inmediato — Fallback al mes más reciente

### En db.js — todas las funciones que usan `currentMonth`

Buscar TODAS las ocurrencias de:
```javascript
const currentMonth = new Date().toISOString().substring(0, 7);
```

Y reemplazar la lógica de filtrado para que haga fallback:

```javascript
async function getActiveMonth() {
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  // Primero intentar el mes actual
  const { data: current } = await supabase
    .from('mgmt_engagements')
    .select('month')
    .eq('month', currentMonth)
    .eq('status', 'active')
    .limit(1);
  
  if (current && current.length > 0) return currentMonth;
  
  // Fallback: el mes más reciente que tenga engagements activos
  const { data: latest } = await supabase
    .from('mgmt_engagements')
    .select('month')
    .eq('status', 'active')
    .order('month', { ascending: false })
    .limit(1);
  
  return latest?.[0]?.month || currentMonth;
}
```

Usar `getActiveMonth()` en vez de `currentMonth` en:
- `getMgmtOverview()`
- `getBusinessMetrics()` (la función que calcula revenue, deliverables, etc.)
- Cualquier otra función que filtre por mes

**IMPORTANTE:** Cachear el resultado por request — no llamar a Supabase cada vez. Se puede guardar en una variable de módulo que se refresque cada 5 minutos, o simplemente calcularlo una vez al inicio de cada función que lo necesite.

### Alternativa más simple (si getActiveMonth es overkill):

```javascript
// En vez de .eq('month', currentMonth), usar:
// Obtener el mes más reciente con datos
const { data: latestEng } = await supabase
  .from('mgmt_engagements')
  .select('month')
  .eq('status', 'active')
  .order('month', { ascending: false })
  .limit(1);
const activeMonth = latestEng?.[0]?.month || new Date().toISOString().substring(0, 7);
```

---

## PARTE 2: Feature "CERRAR MES"

### Concepto

Botón explícito en el dashboard que:
1. Archiva lo completado del mes actual
2. Clona lo pendiente al mes nuevo
3. Crea engagement del nuevo mes

### Endpoint: POST /api/mgmt/close-month

```javascript
// En server.js:
if (pathname === '/api/mgmt/close-month' && req.method === 'POST') {
  const body = await parseBody(req);
  const newMonth = body.new_month; // '2026-07' — el usuario elige
  
  try {
    const result = await db.closeMonth(newMonth);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result, null, 2));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
  return;
}
```

### Función closeMonth() en db.js

```javascript
async function closeMonth(newMonth) {
  // Validar formato
  if (!/^\d{4}-\d{2}$/.test(newMonth)) throw new Error('Formato de mes inválido. Usar YYYY-MM');
  
  // 1. Obtener el mes activo actual (el más reciente con engagements activos)
  const { data: latestEng } = await supabase
    .from('mgmt_engagements')
    .select('month')
    .eq('status', 'active')
    .order('month', { ascending: false })
    .limit(1);
  
  const currentMonth = latestEng?.[0]?.month;
  if (!currentMonth) throw new Error('No hay engagements activos para cerrar');
  if (newMonth <= currentMonth) throw new Error(`El nuevo mes (${newMonth}) debe ser posterior al actual (${currentMonth})`);
  
  // 2. Obtener TODOS los engagements activos del mes actual
  const { data: engagements } = await supabase
    .from('mgmt_engagements')
    .select(`
      *,
      mgmt_objectives (
        *,
        mgmt_deliverables (*)
      )
    `)
    .eq('month', currentMonth)
    .eq('status', 'active');
  
  if (!engagements || engagements.length === 0) {
    throw new Error(`No hay engagements activos en ${currentMonth}`);
  }
  
  const summary = {
    closed_month: currentMonth,
    new_month: newMonth,
    engagements_processed: 0,
    objectives_archived: 0,
    objectives_cloned: 0,
    deliverables_archived: 0,
    deliverables_cloned: 0,
    tasks_archived: 0,
    new_engagements: []
  };
  
  for (const eng of engagements) {
    // 3. Crear engagement del nuevo mes (copia del actual)
    const { data: newEng, error: engError } = await supabase
      .from('mgmt_engagements')
      .insert({
        client_id: eng.client_id,
        artist_id: eng.artist_id,
        month: newMonth,
        invoice_amount: eng.invoice_amount,
        invoice_currency: eng.invoice_currency,
        status: 'active'
      })
      .select()
      .single();
    
    if (engError) {
      console.error('Error creating new engagement for', eng.client_id, engError.message);
      continue;
    }
    
    summary.new_engagements.push({ id: newEng.id, client_id: eng.client_id });
    
    // 4. Procesar objetivos
    for (const obj of (eng.mgmt_objectives || [])) {
      const dels = obj.mgmt_deliverables || [];
      const allDone = dels.length > 0 && dels.every(d => d.status === 'done');
      const isCompleted = obj.status === 'completed' || allDone;
      
      if (isCompleted) {
        // Archivar objetivo completado
        await supabase.from('mgmt_objectives')
          .update({ status: 'archived' })
          .eq('id', obj.id);
        summary.objectives_archived++;
        summary.deliverables_archived += dels.length;
      } else {
        // Clonar objetivo pendiente al nuevo engagement
        const { data: newObj } = await supabase
          .from('mgmt_objectives')
          .insert({
            engagement_id: newEng.id,
            number: obj.number,
            title: obj.title,
            description: obj.description,
            status: obj.status === 'archived' ? 'archived' : 'active',
            notes: obj.notes
          })
          .select()
          .single();
        
        summary.objectives_cloned++;
        
        if (newObj) {
          // Clonar deliverables pendientes
          for (const del of dels) {
            if (del.status !== 'done') {
              await supabase.from('mgmt_deliverables').insert({
                objective_id: newObj.id,
                title: del.title,
                description: del.description,
                owner: del.owner,
                status: 'pending',
                due_date: del.due_date,
                notes: del.notes
              });
              summary.deliverables_cloned++;
            }
            // Los done se quedan en el mes viejo como registro
          }
        }
      }
    }
    
    // 5. Archivar misiones completadas del mes viejo
    const { data: doneTasks } = await supabase
      .from('secondary_tasks')
      .select('id')
      .eq('client_id', eng.client_id)
      .in('status', ['hecha', 'descartada'])
      .eq('archived', false);
    
    if (doneTasks?.length > 0) {
      await supabase
        .from('secondary_tasks')
        .update({ archived: true })
        .in('id', doneTasks.map(t => t.id));
      summary.tasks_archived += doneTasks.length;
    }
    
    // 6. Cerrar el engagement del mes viejo
    await supabase
      .from('mgmt_engagements')
      .update({ status: 'closed' })
      .eq('id', eng.id);
    
    summary.engagements_processed++;
  }
  
  return summary;
}
```

### Frontend: Botón "CERRAR MES" en index.html

Agregar un botón en la sección de métricas del dashboard (arriba, junto a NEGOCIO):

```javascript
// En la sección de ROSTER o NEGOCIO, agregar:
function renderCloseMonthButton(currentMonth) {
  // Solo mostrar si estamos en un mes posterior al engagement activo
  // O siempre visible, con confirm
  return `
    <button onclick="openCloseMonthModal()" 
      style="padding: 8px 16px; background: var(--neon-orange); color: #000; 
             border: none; border-radius: 6px; cursor: pointer; font-weight: bold;
             font-size: 0.8em;">
      CERRAR MES
    </button>
  `;
}

async function openCloseMonthModal() {
  // Calcular el próximo mes
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const newMonthStr = nextMonth.toISOString().substring(0, 7);
  
  // Obtener mes activo actual
  const res = await fetch('/api/mgmt/overview');
  const data = await res.json();
  const currentMonth = data.active_month || data.overview?.[0]?.month || 'desconocido';
  
  const confirmed = confirm(
    `¿Cerrar el mes ${currentMonth}?\n\n` +
    `• Objetivos completados → archivados\n` +
    `• Objetivos pendientes → clonados a ${newMonthStr}\n` +
    `• Deliverables hechos → registro histórico\n` +
    `• Deliverables pendientes → clonados\n` +
    `• Misiones hechas → archivadas\n\n` +
    `Se creará el engagement de ${newMonthStr} automáticamente.`
  );
  
  if (!confirmed) return;
  
  try {
    const closeRes = await fetch('/api/mgmt/close-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_month: newMonthStr })
    });
    const result = await closeRes.json();
    
    if (result.error) {
      showToast('Error: ' + result.error);
      return;
    }
    
    showToast(`Mes ${currentMonth} cerrado. ${result.objectives_archived} obj archivados, ${result.objectives_cloned} clonados a ${newMonthStr}`);
    
    // Refrescar dashboard
    location.reload();
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}
```

---

## VERIFICACIÓN

### Parte 1 — Fix inmediato:
- [ ] Dashboard carga datos de junio aunque estemos en julio UTC
- [ ] Revenue, entregables, reuniones, objetivos — todos con datos correctos
- [ ] Si se crea un engagement de julio, el dashboard muestra julio

### Parte 2 — Cerrar Mes:
- [ ] Botón "CERRAR MES" visible en el dashboard
- [ ] Click → confirm con resumen de lo que va a pasar
- [ ] Aceptar → engagement de junio se marca `status: 'closed'`
- [ ] Engagement de julio creado con mismo client_id, invoice_amount, etc.
- [ ] Objetivos completados → `status: 'archived'` en junio
- [ ] Objetivos pendientes → clonados en julio con `status: 'active'`
- [ ] Deliverables done → se quedan en junio (registro)
- [ ] Deliverables pending → clonados al objetivo de julio
- [ ] Misiones hecha/descartada → `archived: true`
- [ ] Misiones pendientes → siguen activas (no se archivan)
- [ ] Dashboard se refresca y muestra datos de julio

---

## ORDEN

1. **PARTE 1 primero** — fix urgente, el dashboard está roto
2. **PARTE 2 después** — feature de cierre de mes
