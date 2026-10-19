# PROMPT: Cambiar card "Objetivos Activos" → "Contratos Activos" en ROSTER

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** index.html (frontend) + db.js (si aplica)
> **Prioridad:** Baja — cosmético

---

## Cambio

En la sección **ROSTER ACTUAL** del dashboard principal, el card que dice **OBJETIVOS ACTIVOS** con el conteo de `mgmt_objectives` debe cambiar a:

- **Label:** `CONTRATOS ACTIVOS`
- **Dato:** Cantidad de `mgmt_engagements` con `status = 'active'` del mes actuaAl
- **Sublabel:** `Este mes` (mantener igual)

### En index.html

Buscar donde se renderiza el card de ROSTER que muestra `objectives_total` o `objectivesTotal` y cambiar:

```javascript
// ANTES:
// Algo como: OBJETIVOS ACTIVOS + objectives_total

// DESPUÉS:
// Label: CONTRATOS ACTIVOS
// Valor: contar engagements activos del overview
```

El dato ya existe — en el response de `/api/mgmt/overview`, contar cuántos engagements tienen `status: 'active'`:

```javascript
const contratosActivos = overview.filter(e => e.status === 'active').length;
```

### En db.js (si el card usa un campo específico de getBusinessMetrics/getMgmtOverview)

Buscar `objectives_total` en la función que calcula las métricas del dashboard y agregar:

```javascript
contracts_active: engagements.filter(e => e.status === 'active').length,
```

---

## Verificación

- [ ] El card de ROSTER dice "CONTRATOS ACTIVOS" en vez de "OBJETIVOS ACTIVOS"
- [ ] El número refleja la cantidad de engagements activos (actualmente debería ser 3: ERY, Jot4 R, Reckless)
- [ ] No se rompe ningún otro card
