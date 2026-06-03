# DT-018 — Script de onboarding de clientes

**Prioridad:** Crítica
**Categoría:** DevOps / Workflow operacional
**Estado:** Pendiente — agendado para Día 5
**Fecha de registro:** 2026-06-03
**Bloqueador:** Cliente nuevo arranca esta misma semana

## Problema identificado

Con arquitectura híbrida actual (filesystem + Supabase sin sync), la
creación de un nuevo cliente requiere acciones manuales en 2 lugares:

1. Crear carpetas filesystem en `06_CLIENTES/<slug>/`
2. INSERT manual en Supabase: clients + projects + futuros runs

Este workflow es:
- Propenso a errores (slug inconsistente, datos faltantes)
- Inseguro arquitectónicamente (filesystem y Supabase divergen)
- No escalable cuando G*S tenga 5-10+ clientes activos

## Solución propuesta

Script CLI Node.js: `scripts/onboard-client.js`

### Funcionalidad

**Modo interactivo (default):**
```bash
node scripts/onboard-client.js
```

El script pregunta:
- Slug del cliente (validación de unicidad)
- Display name
- Tier (1/2/3)
- País (CO, MX, AR, US, EU, otro)
- Género musical
- Tipo de paquete (CREATOR!/ARTIST!/STAR!)
- Nombre del proyecto/lanzamiento
- Notas adicionales (opcional)

**Modo flags (para automatización):**
```bash
node scripts/onboard-client.js \
  --slug "artista-nuevo" \
  --display-name "Artista Nuevo" \
  --tier 1 \
  --country "CO" \
  --genre "trap" \
  --package "ARTIST!" \
  --project "Lanzamiento ABC"
```

### Acciones del script

1. Validación: slug único en Supabase
2. Crear estructura filesystem D-006 v2:
```
   06_CLIENTES/<slug>/
   ├── 00-baseline/
   ├── 01-auditorias/
   ├── 02-sintesis/
   ├── 03-estrategia/
   ├── 04-cotizacion/
   ├── 05-calendario/
   ├── 06-release/
   └── 07-post-release/
```
3. INSERT cliente en Supabase con metadata
4. INSERT proyecto en Supabase
5. Output: confirmación + paths creados + URL del dashboard

### Estructura de carpetas — D-006 v2 estándar

Definir contenido inicial de cada subcarpeta:
- 00-baseline: README.md con instrucciones para gs-baseline-snapshot
- 01-auditorias: README.md con outputs esperados (musical + redes)
- 02-sintesis: vacío hasta ejecución de gs-sintesis-growth
- 03-estrategia: vacío hasta ejecución de gs-estrategia-activaciones
- 04-cotizacion: vacío hasta ejecución de gs-cotizador
- 05-calendario: vacío hasta ejecución de gs-calendarizador
- 06-release: vacío hasta lanzamiento
- 07-post-release: vacío hasta post-release

### Validaciones

- Slug debe ser unique en Supabase
- Slug debe ser lowercase, sin espacios, sin acentos
- Tier debe ser 1, 2, o 3
- Package debe ser uno de CREATOR!/ARTIST!/STAR!
- Carpeta no debe existir previamente en filesystem

## Script auxiliar relacionado

**register-run.js:** registra ejecución de agente en Supabase cuando
producís un nuevo .md deliverable.

```bash
node scripts/register-run.js \
  --client "artista-nuevo" \
  --project "Lanzamiento ABC" \
  --agent "gs-auditor-redes" \
  --deliverable "01-auditorias/auditoria-redes-sociales.md"
```

Esto evita tener que INSERTAR runs manualmente en Supabase Studio.

## Impacto

- Tiempo de onboarding cliente: ~5 min (vs ~30 min manual)
- Errores: 0 (vs riesgo de inconsistencias filesystem <-> Supabase)
- Dashboard: cliente nuevo aparece automáticamente
- Reproducibilidad: mismo flujo siempre

## Resolución

Agendado para Día 5 / Sesión E.
Bloquea: Soundcharts integration (DT-015) que se mueve a Día 6.

## Relacionado

- DT-015: Soundcharts API (postponed, sin API key todavía)
- DT-016: Reorganización columnas agentes (Día 5)
- DT-017: Agente baseline snapshot (Día 5)
