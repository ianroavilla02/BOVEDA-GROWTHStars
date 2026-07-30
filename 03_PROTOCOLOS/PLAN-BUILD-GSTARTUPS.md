# PLAN DE BUILD — G*STARTUPS (Cumbre + infraestructura)

> Creado 2026-07-30. Spec ordenado para el CTO Jr. **Ejecutar de arriba a abajo — las tandas dependen unas de otras.**
> Base arquitectónica: **D-105** (mismo dashboard, aislamiento lógico por `línea`, portales por colaborador). Reuso máximo (D-103).
> Guardrails globales: reusar-no-duplicar · `apiMutate` en toda mutación · **no-regresión en G\*S** (artistas/sellos siguen igual) · commit por tanda · DoD validado en pantalla.

---

## TANDA 1 — Directorio de colaboradores (DT-062) · LA BASE
De acá sale todo lo demás. Hacela primero.
- **Modelo:** un directorio de personas, cada una con **nombre · función/rol · contacto · ciudad**.
- **Scoped por gremio** (`línea`): en el workspace G\*Stars ves los de G\*S; en G\*Startups los de G\*Startups.
- **Cross-gremio SIN duplicar:** una persona puede pertenecer a **uno o ambos** gremios (many-to-many persona↔gremio). Ej. Juan Mora / Andrés Fierro (directores AV de G\*S) que trabajan en G\*Startups → aparecen en ambos directorios, un solo registro.
- CRUD del directorio (agregar/editar persona).
- **DoD:** registrás una persona con sus 4 datos; aparece en el directorio del gremio activo; una marcada en ambos gremios se ve en los dos.

## TANDA 2 — Equipo Operativo = selección del directorio
- El **Equipo Operativo** de cada proyecto deja de cargar personas ad-hoc: es una **selección del Directorio (Tanda 1)**. "+ Agregar miembro" = **elegir del directorio** (o crear uno nuevo ahí y asignarlo).
- Reusá el componente de "artistas del sello" ya relabeleado a EQUIPO OPERATIVO.
- **DoD:** agregás un miembro eligiéndolo del directorio; queda vinculado al proyecto; el mismo colaborador se puede asignar a varios proyectos.

## TANDA 3 — Tareas: Rol + Entregable + reglas de status
- **Rol = dropdown single-select** poblado desde el **Equipo Operativo** del proyecto (no checkboxes, no texto libre). **Eliminá el campo "Responsable"** (Ian es siempre el responsable). Roles seleccionables/agregables por contrato.
- **Entregable por tarea (DT-063):** cada tarea tiene un **entregable** = **link O documento** (reusá el mecanismo de adjuntos/Storage existente).
- **Reglas de status atadas al entregable:**
  - Sin entregable → la tarea solo puede ser **"Sin iniciar"** o **"En progreso"**.
  - Al **adjuntar el entregable → se marca automáticamente "Terminado"** (evidencia = entregado). *Este auto-mark es un estado DERIVADO de un hecho, no la "auto-acción silenciosa" que D-105 prohíbe.*
  - **"Aprobado"** = solo manual, por Ian (paso final tras Terminado).
- El filtro "Todos los roles" refleja la misma fuente (Equipo Operativo).
- **DoD:** el Rol lista los miembros del equipo; sin entregable no podés marcar Terminado; al subir link/doc pasa a Terminado solo; Ian puede pasar a Aprobado.

## TANDA 4 — UI de la sección de tareas
- Quitá el texto **"CALENDARIO / TAREAS"**. En ese espacio, **justificado a la izquierda**, poné el **switch Calendario/Tareas**. Filtros (fases, roles) siguen a la derecha.
- **DoD:** el switch está arriba-izquierda, sin el título viejo; cambiar de vista sigue instantáneo.

## TANDA 5 — Servicios Independientes (Opción A · read-only)
- La sección **SERVICIOS INDEPENDIENTES aparece solo si hay ≥1 contrato ACTIVO vinculado** al cliente. Si no hay, **ocultá la sección entera** (sin empty-state ni botón).
- Es **de solo lectura** en la vista del cliente. El **alta viene de Contratos**: se registra un contrato suelto **apuntando a la Cumbre** (mismo patrón que los videoclips que cuelgan de Chimbita/Marlon por `client_id`) → **indexa solo** en esta sección. Cero lógica nueva.
- **DoD:** con 0 contratos la sección no se ve; registrás un contrato para la Cumbre desde Contratos → aparece indexado acá.

## TANDA 6 — Portales por colaborador (Paso 2 · BLINDADO)
Infraestructura reusable para TODOS los colaboradores de G\*Startups (Cumbre, marca, spa, futuros).
- **Aislamiento BLINDADO (token server-side):** cada colaborador tiene un **token único**; el portal pega a **endpoints propios del server** que filtran por ese token y **NUNCA exponen tareas de otro**. NO usar el patrón anon+param (inseguro para externos con escritura).
- **Cada portal (simple):** las **tareas del colaborador** (filtradas a él) + **calendario** (filtrado) + su **propia dona** (status de sus tareas). Puede **actualizar el status de SUS tareas** (respetando la regla del entregable de la Tanda 3).
- Reusá los 3 componentes (lista, calendario, dona) filtrados al colaborador.
- **DoD:** con el token de un miembro ves SOLO lo suyo; cambiar el token/manipular la URL NO expone lo de otro; el miembro marca avance de sus tareas.

---

## FRENTE GRANDE (aparte) — Aislamiento por línea
Transversal, más grande, se ataca como tanda propia (no bloquea las de arriba).
- La dimensión `línea` (G\*Stars / G\*Startups) debe scopear **métricas, agentes, tipos de contrato, y toda la data** — no solo el sidebar. El switcher ya existe; falta que TODO filtre por la línea activa.
- **Excepción:** el Directorio de colaboradores es cross-gremio (Tanda 1) — las personas se comparten, la data de negocio no.

---

## Orden de dependencia (resumen)
```
1 Directorio → 2 Equipo Operativo → 3 Tareas (Rol/Entregable) → 6 Portales
                                     4 UI switch  (independiente)
                                     5 Servicios  (independiente, Opción A)
[transversal] Aislamiento por línea
```
