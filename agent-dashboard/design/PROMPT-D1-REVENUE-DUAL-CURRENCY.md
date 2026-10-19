# PROMPT: Revenue Cards USD + COP Side by Side — Editorial Noir

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** 3 cards de revenue en la vista Metricas + backend getMgmtMetricsOverview
> **Stack:** Vanilla JS con template literals, NO React/Vue/frameworks
> **Archivos target:** `agent-dashboard/index.html` (CSS + rendering), `agent-dashboard/db.js` (backend)
> **Referencia de diseno:** Mantener Editorial Noir existente (colores, tipografia, spacing)

---

## CONTEXTO

Las 3 cards de revenue (Revenue Total, Revenue Mes, Revenue Extra) actualmente muestran USD como valor principal y COP como subtitulo debajo. Ian quiere que ambos valores aparezcan LADO A LADO dentro de cada card, separados por un divisor vertical sutil. La logica de COP y USD se mantiene separada (no se convierten).

**Estado actual del backend** (`db.js` linea ~1365):
```javascript
return {
  revenue_usd: totalUSD,      // solo retainers en USD
  revenue_cop: totalCOP,      // solo retainers en COP
  extra_revenue_usd: extraUSD, // solo proyectos en USD
  extra_revenue_cop: extraCOP, // solo proyectos en COP
  total_usd,                   // TODO convertido a USD via TRM
  trm,
  // ... otros campos
};
```

**Estado actual del frontend** (`index.html` linea ~3082):
```javascript
const revenueUsd = '$' + Number(bm.revenue_usd).toLocaleString('en-US') + ' USD';
const revenueCop = '+ $' + (Number(bm.revenue_cop) / 1000000).toFixed(1) + 'M COP';
// ... se renderiza USD como metric-value, COP como metric-meta (debajo)
```

---

## PASO 1: BACKEND — Agregar campos al response (`db.js`)

En la funcion `getMgmtMetricsOverview()`, agregar 2 campos nuevos al return:

```javascript
// ANTES del calculo de total_usd, agregar:
const total_cop = totalCOP + extraCOP;
const total_usd_pure = totalUSD + extraUSD;

// El calculo de total_usd ya esta bien (es la conversion total)

// En el return, agregar estos 2 campos:
total_usd_pure,  // USD puro sin conversion (retainers USD + extras USD)
total_cop,       // COP total (retainers COP + extras COP)
```

---

## PASO 2: CSS — Agregar estilos para layout dual

Agregar DESPUES de `.metric-meta` (linea ~375):

```css
.metric-dual {
  display: flex;
  align-items: flex-start;
  gap: 0;
}
.metric-dual-col {
  flex: 1;
  min-width: 0;
}
.metric-dual-col .metric-value {
  font-size: 28px;  /* reducido de 36px para que quepan ambos */
}
.metric-dual-sep {
  width: 1px;
  align-self: stretch;
  background: var(--border);
  margin: 0 14px;
}
.metric-currency {
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-top: 2px;
}
```

**IMPORTANTE:** Estos valores estan calibrados para Editorial Noir. Ajustar font-size si el diseno actual usa otra escala tipografica.

---

## PASO 3: FRONTEND — Reformatear las 3 cards de revenue

Reemplazar el bloque de rendering de metricas de negocio (linea ~3082-3127).

### Helpers de formato (reemplazar los existentes):

```javascript
const fmtUsd = (v) => '$' + Number(v || 0).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
const fmtCop = (v) => {
  const n = Number(v || 0);
  return n >= 1000000 ? '$' + (n/1000000).toFixed(1) + 'M' : '$' + n.toLocaleString('en-US');
};
```

### Card Revenue Total:
```html
<div class="metric-card card-total" style="border-color: #d4a017;">
  <div class="metric-label">Revenue Total</div>
  <div class="metric-dual">
    <div class="metric-dual-col">
      <div class="metric-value">${fmtUsd(bm.total_usd_pure)}</div>
      <div class="metric-currency">USD</div>
    </div>
    <div class="metric-dual-sep"></div>
    <div class="metric-dual-col">
      <div class="metric-value">${fmtCop(bm.total_cop)}</div>
      <div class="metric-currency">COP</div>
    </div>
  </div>
  <div class="metric-meta">${trmFmt}</div>
</div>
```

### Card Revenue Mes:
```html
<div class="metric-card green card-revmes">
  <div class="metric-label">Revenue Mes</div>
  <div class="metric-dual">
    <div class="metric-dual-col">
      <div class="metric-value">${fmtUsd(bm.revenue_usd)}</div>
      <div class="metric-currency">USD</div>
    </div>
    <div class="metric-dual-sep"></div>
    <div class="metric-dual-col">
      <div class="metric-value">${fmtCop(bm.revenue_cop)}</div>
      <div class="metric-currency">COP</div>
    </div>
  </div>
</div>
```

### Card Revenue Extra:
```html
<div class="metric-card orange card-revextra">
  <div class="metric-label">Revenue Extra</div>
  <div class="metric-dual">
    <div class="metric-dual-col">
      <div class="metric-value">${fmtUsd(bm.extra_revenue_usd)}</div>
      <div class="metric-currency">USD</div>
    </div>
    <div class="metric-dual-sep"></div>
    <div class="metric-dual-col">
      <div class="metric-value">${fmtCop(bm.extra_revenue_cop)}</div>
      <div class="metric-currency">COP</div>
    </div>
  </div>
</div>
```

### Cards que NO cambian:
- Entregables (card-entregables) — mantener igual
- Proyectos (card-proyectos) — mantener igual

---

## PASO 4: VERIFICACION

1. `node -e "require('dotenv').config(); require('./db').getMgmtMetricsOverview().then(r => console.log(JSON.stringify(r, null, 2)))"` — debe incluir `total_usd_pure` y `total_cop`
2. Abrir `localhost:3737` → Metricas
3. Las 3 cards de revenue deben mostrar USD | COP lado a lado con separador vertical
4. Los valores NO deben superponerse ni cortarse en pantallas >= 1200px
5. El TRM sigue visible como meta debajo de Revenue Total

---

## CHECKLIST

- [ ] `db.js`: agregar `total_cop` y `total_usd_pure` al return de `getMgmtMetricsOverview()`
- [ ] `index.html`: agregar CSS `.metric-dual`, `.metric-dual-col`, `.metric-dual-sep`, `.metric-currency`
- [ ] `index.html`: reformatear Revenue Total con layout dual
- [ ] `index.html`: reformatear Revenue Mes con layout dual
- [ ] `index.html`: reformatear Revenue Extra con layout dual
- [ ] Verificar que Entregables y Proyectos siguen igual
- [ ] Verificar visual en navegador
