# PROMPT: Sidebar Rebrand — GROWTH*Stars OPS CONSOLE

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** Sidebar del dashboard — brand name y footer
> **Archivo target:** `agent-dashboard/index.html`

---

## CAMBIO 1: Brand name del sidebar

Buscar el brand del sidebar (dentro de `<aside class="sidebar">`):

```html
<!-- ANTES -->
<div class="brand-name">IAN VILLAVECES</div>
<div class="brand-subtitle">Dashboard</div>

<!-- DESPUES -->
<div class="brand-name">GROWTH*Stars</div>
<div class="brand-subtitle">OPS CONSOLE</div>
```

## CAMBIO 2: Eliminar sidebar footer

Buscar y ELIMINAR completamente el div `sidebar-footer`:

```html
<!-- ELIMINAR este bloque entero -->
<div class="sidebar-footer">
  <div class="label">G*S System</div>
  <div>D-006 v2 · v2.0</div>
</div>
```

---

## CHECKLIST

- [ ] Cambiar brand-name a "GROWTH*Stars"
- [ ] Cambiar brand-subtitle a "OPS CONSOLE"
- [ ] Eliminar div.sidebar-footer
- [ ] Verificar visual en navegador
