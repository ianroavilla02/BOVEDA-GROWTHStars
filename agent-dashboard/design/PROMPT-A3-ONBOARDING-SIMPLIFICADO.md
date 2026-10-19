# PROMPT: Simplificar Onboarding — MGMT Automatico

> **Para:** CTO Jr (Claude Code operativo)
> **Scope:** Modal de onboarding de artista (`openOnboardClientModal`)
> **Archivo target:** `agent-dashboard/index.html`

---

## CONTEXTO DE NEGOCIO

En G*S, TODOS los artistas entran a MGMT por defecto. No existe artista sin MGMT. Hay dos tipos:
- **Pagos:** tienen retainer mensual (USD o COP)
- **Colaborativos/oportunidad:** retainer $0, trabajan por regalias, creditos u oportunidades. En estos casos, el pagador es G*S mismo.

Lema interno: "Hay trabajo que deja oportunidades y hay trabajo que deja dinero."

Por esto, el formulario de onboarding NO debe preguntar que servicio quiere — MGMT siempre se crea. Solo debe pedir el monto del retainer (default 0).

---

## PASO 1: REEMPLAZAR SECCION "3. SERVICIO INICIAL"

Buscar en el modal de onboarding (funcion `openOnboardClientModal`, linea ~5874):

```html
<!-- ELIMINAR todo esto -->
<div class="form-section">
  <div class="form-section-title">3. SERVICIO INICIAL</div>
  <div class="onboard-services-checks">
    <label class="onboard-check"><input type="checkbox" id="svc-mgmt"> MGMT</label>
    <label class="onboard-check"><input type="checkbox" id="svc-av"> Produccion AV</label>
    <label class="onboard-check"><input type="checkbox" id="svc-eventos"> Eventos</label>
  </div>
  <div id="svc-mgmt-fields" style="display:none; margin-top:12px;">
    <!-- campos de monto y moneda -->
  </div>
  <div id="svc-av-fields" style="display:none; margin-top:12px;">
    <!-- campos de AV -->
  </div>
  <div id="svc-eventos-fields" style="display:none; margin-top:12px;">
    <!-- placeholder eventos -->
  </div>
</div>
```

Reemplazar con:

```html
<div class="form-section">
  <div class="form-section-title">3. RETAINER MGMT</div>
  <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
    MGMT se activa automaticamente. Si no hay pago mensual, dejar en 0.
  </div>
  <div class="form-row">
    <div class="form-field-group">
      <label class="modal-label">Monto mensual</label>
      <input type="number" class="modal-input" id="mgmt-amount" placeholder="0" value="0">
    </div>
    <div class="form-field-group">
      <label class="modal-label">Moneda</label>
      <select class="modal-select" id="mgmt-currency">
        <option value="USD">USD</option>
        <option value="COP">COP</option>
      </select>
    </div>
  </div>
</div>
```

---

## PASO 2: LIMPIAR EVENT LISTENERS

Buscar y ELIMINAR los event listeners de los checkboxes de servicios que ya no existen. Estan despues del modal HTML, probablemente como:

```javascript
// ELIMINAR si existen:
$('#svc-mgmt').addEventListener('change', ...);
$('#svc-av').addEventListener('change', ...);
$('#svc-eventos').addEventListener('change', ...);
```

Si no existen listeners explicitos, verificar que no haya referencias a `svc-mgmt`, `svc-av`, `svc-eventos`, `svc-mgmt-fields`, `svc-av-fields`, `svc-eventos-fields` en ningun otro lugar del archivo.

---

## PASO 3: VERIFICAR PAYLOAD DEL SUBMIT

El boton "Crear Artista" ya envia `services.mgmt` con amount y currency (linea ~6023). Verificar que sigue funcionando:

```javascript
payload.services.mgmt = {
  amount: parseFloat($('#mgmt-amount').value) || 0,
  currency: $('#mgmt-currency').value
};
```

Este bloque debe ejecutarse SIEMPRE (no condicionado a un checkbox). Si estaba dentro de un `if ($('#svc-mgmt').checked)`, sacarlo de ahi.

---

## CHECKLIST

- [ ] Eliminar seccion "3. SERVICIO INICIAL" con checkboxes
- [ ] Agregar seccion "3. RETAINER MGMT" con monto (default 0) + moneda
- [ ] Eliminar event listeners de checkboxes de servicios
- [ ] Verificar que `services.mgmt` se envia siempre en el payload
- [ ] Verificar que no quedan referencias a `svc-mgmt`, `svc-av`, `svc-eventos`
- [ ] Probar crear un artista nuevo con retainer $0
- [ ] Probar crear un artista nuevo con retainer > 0
