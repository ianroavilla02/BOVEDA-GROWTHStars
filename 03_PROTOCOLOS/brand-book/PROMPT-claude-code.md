# PROMPT MAESTRO · CLAUDE CODE · BRAND BOOK G*S
> Copiar todo lo de abajo de la línea, rellenar {{campos}}, pegar en Claude Code
> desde la raíz del repo del proyecto (que ya contiene template/, CONTENT.md
> y moodboard/).

---

Actuá como desarrollador frontend senior de Growth*Stars. Vas a construir el
brand book digital de **{{ARTISTA}}** como un único `index.html` autocontenido.

## Inputs en este repo
- `template/index.html` → esqueleto base con arquitectura, JS e interacciones ya resueltas. NO reinventes la arquitectura: extendela.
- `CONTENT.md` → TODO el contenido del brand book, sección por sección, más los design tokens (paleta, fuentes, signature element). Es la única fuente de verdad de contenido. No inventes contenido que no esté ahí; si falta algo crítico, preguntame antes de rellenar con placeholder.
- `moodboard/` → imágenes numeradas del artista. Referencialas con rutas relativas.

## Tarea
1. Leé `CONTENT.md` completo y `template/index.html`.
2. Generá `index.html` en la raíz:
   - Reemplazá los tokens CSS (`:root`) con la paleta exacta de CONTENT.md.
   - Cargá desde Google Fonts las 3 fuentes definidas (+ DM Mono + Inter).
   - Construí las 11 secciones con el contenido de CONTENT.md, replicando
     los componentes del template (.block, .stamp, .frame, .palette-cell,
     .toc-item, .ref-card, ticker, timeline, vibe-grid, look-card,
     contact-sheet, track-row, anti-list, firma).
   - Implementá el **signature element** descrito en CONTENT.md como el único
     riesgo estético del documento; mantené el resto disciplinado.
3. Conservá intactas las interacciones del template: cursor custom, fade-up
   con IntersectionObserver (+fallback 2.5s), contadores data-count, copy-HEX
   al click en swatches con toast, scroll-spy en nav lateral, ticker marquee.
4. Conservá y adaptá el `@media print` (A4, primera página sin margen,
   print-color-adjust exact) para que Ctrl+P produzca el PDF de entrega.
5. Metadata del `<head>`: title, description, OG completo (title, description,
   image = foto hero del moodboard con URL absoluta de {{URL_GITHUB_PAGES}},
   site_name, url, type), twitter card summary_large_image,
   theme-color = color charcoal/base de la paleta, y `noindex, nofollow`.
6. Accesibilidad y robustez: `prefers-reduced-motion`, fallback `html.no-js`,
   breakpoints 980/820/680/480, `(hover:none)` desactiva cursor custom.

## Verificación antes de terminar
- Abrí el archivo y revisá que no haya `{{...}}` sin reemplazar ni rutas rotas.
- Listá todas las imágenes referenciadas y confirmá que existen en moodboard/.
- Confirmá que cada HEX de la sección 05 coincide con las variables `:root`.
- Simulá print: ninguna sección debe quedar ilegible en fondo oscuro sin
  override de print.
- Resumí en 5 líneas qué decisiones de diseño tomaste para el signature element.

## Datos del proyecto
- Artista: {{ARTISTA}}
- Repo / URL Pages: {{URL_GITHUB_PAGES}}
- Edición / volumen: {{VOL_Y_EDICION}}
- Fecha de versión: {{FECHA}}
- Notas extra de esta versión: {{NOTAS}}
