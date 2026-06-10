# PROTOCOLO · BRAND BOOK DIGITAL G*S
> Versión 1.0 · Junio 2026 · Formato: HTML single-file + GitHub Pages + PDF print
> Ubicación sugerida en BOVEDA: `03_PROTOCOLOS/brand-book/`
> Ingeniería inversa base: jared-laj-brand-book (Sancor MGMT, Vol. IX, mayo 2026)

## Qué es este entregable

Un brand book digital de ~11 secciones en un único `index.html` autocontenido
(CSS + JS vanilla inline, sin frameworks), hosteado gratis en GitHub Pages,
con export PDF A4 vía `@media print`. Un solo source of truth, dos formatos
de entrega (link + PDF), costo de hosting $0.

## División de roles

| Fase | Herramienta | Rol |
|------|------------|-----|
| 1. Discovery | Fathom + parser híbrido | Captura quotes, decisiones, fechas |
| 2. Co-creación estratégica | **Claude.ai (chat)** | Definir tensión, norte, referentes, tokens. Llenar `CONTENT.md` |
| 3. Build | **Claude Code** | Generar `index.html` desde template + CONTENT.md |
| 4. Deploy | Git + GitHub Pages | Publicar, configurar OG metadata |
| 5. Firma | Cliente | Validación formal del documento (sección 11) |

**Claude.ai = estrategia y contenido. Claude Code = construcción.**
El puente entre ambos es el archivo `CONTENT.md` + el `PROMPT-claude-code.md`.

## Flujo paso a paso

### Fase 1 → Inputs (antes de la sesión con Claude.ai)
Reunir y tener a mano:
1. Transcripción/`.md` de la(s) sesión(es) de discovery (output del parser)
2. Moodboard del artista (fotos de WhatsApp → carpeta `moodboard/` numerada)
3. Top 5 tracks con su mood/BPM
4. Decisiones estéticas ya tomadas (con fecha → esto da autoridad al documento)

### Fase 2 → Co-creación en Claude.ai
Abrir chat con Claude.ai y pegar los inputs. Trabajar juntos el `CONTENT.md`
sección por sección usando la plantilla `CONTENT-template.md`. Claude.ai debe:
- Extraer 3 quotes literales del artista con fecha y contexto (Manifiesto)
- Formular **la Tensión** como ratio numérico (ej. 70/30) → el concepto central
- Definir el Norte como timeline de 3 hitos (año actual → +4 años)
- Curar 6–8 referentes divididos entre núcleo y acento, cada uno con nota
  "para [artista]" o "nota DC"
- Definir design tokens: 4 colores core + 4 accent (HEX/RGB/CMYK/Pantone),
  3 fuentes de Google Fonts (display / brutalist-secundaria / body)
- Redactar la sección anti-brand ("lo que NO es") → mínimo 8 descartes con razón
- Escribir el statement de espacio libre (posicionamiento en 1 frase)

**Output de la fase: `CONTENT.md` completo + tokens confirmados.**

### Fase 3 → Build en Claude Code
1. Copiar la carpeta `template/` del protocolo al repo del proyecto
2. Colocar `CONTENT.md` y la carpeta `moodboard/` en la raíz
3. Pegar en Claude Code el prompt de `PROMPT-claude-code.md` (rellenando
   los campos {{...}})
4. Claude Code genera el `index.html` final, verifica responsive y print

### Fase 4 → Deploy
```bash
git init && git add . && git commit -m "Brand Book v1 · [ARTISTA]"
gh repo create gs-brandbook-[artista] --public --source=. --push
# Settings → Pages → Deploy from branch master /(root)
```
Verificar: OG preview en WhatsApp, Ctrl+P → PDF A4 limpio, móvil 480px.

### Fase 5 → Firma
Enviar link al artista/manager. La sección 11 incluye bloque de firma con
fecha. Una vez confirmado verbalmente o por escrito, marcar versión como
oficial en el commit (`tag v1.0-firmado`).

## Estructura editorial canónica (11 secciones)

| # | Sección | Contenido | Fuente del input |
|---|---------|-----------|------------------|
| 00 | Cover | Vol., fecha, créditos, foto hero | Moodboard |
| — | Ticker | Marquee con claims de marca | CONTENT.md |
| — | Index | TOC navegable | Auto |
| 01 | Manifiesto | 3 quotes literales con fecha | Discovery/Fathom |
| 02 | La Tensión | Ratio X/Y, dos vectores (sonido vs imagen) | Co-creación |
| 03 | El Norte | Timeline 3 hitos a 4 años | Co-creación |
| 04 | Universo | 6–8 referentes con notas | Co-creación |
| 05 | El Sistema | Logo + zona respeto + don'ts + paleta + tipo | Co-creación |
| 06 | Vibe Wall | Moodboard crudo numerado | WhatsApp |
| 07 | Los Looks | 3 sistemas: Daily / Stage / Cover | Co-creación |
| 08 | Los Detalles | Contact sheet de accesorios/firmas | Moodboard |
| 09 | Track by Track | Top 5 con visual + cover por track | Catálogo |
| 10 | Lo que NO es | Anti-brand + mapa ecosistema + espacio libre | Co-creación |
| 11 | Aplica + Firma | Mockups merch/redes + bloque de firma | Co-creación |

## Principios de diseño del formato

1. **El documento ES la marca**: los tokens CSS son la paleta del artista,
   las fuentes del documento son las de la identidad. Coherencia total.
2. **Autoridad por trazabilidad**: cada decisión lleva fecha y autor
   ("Discovery 9-may", "vía Sancor 12-may"). Eso convierte opiniones en actas.
3. **El concepto central es un número**: la tensión expresada como ratio
   (70/30) es memorizable y operativa → cualquier diseñador puede aplicarla.
4. **Anti-brand tan importante como brand**: la sección "NO ES" previene
   el 80% de los errores de ejecución futuros.
5. **Micro-interacciones de sistema serio**: copy-HEX al click, contadores,
   scroll-spy. Señalizan "design system real", no PDF estático.
6. **Un signature element por proyecto**: cada brand book debe tener UN
   elemento visual único (en Jared: blackletter + ticker). No reciclar el
   mismo entre artistas → cambiar el riesgo estético por proyecto.

## Checklist de calidad pre-entrega

- [ ] Tokens CSS = paleta oficial (verificar HEX contra sección 05)
- [ ] Las 3 fuentes cargan desde Google Fonts (verificar en red lenta)
- [ ] Todas las imágenes del moodboard cargan (rutas relativas, sin 404)
- [ ] Copy-HEX funciona en cada swatch
- [ ] Ctrl+P produce PDF A4 legible (sin elementos cortados)
- [ ] Responsive verificado a 480px
- [ ] OG metadata: title, description, image (foto hero), theme-color
- [ ] `noindex, nofollow` activo (documento privado de cliente)
- [ ] `prefers-reduced-motion` respetado
- [ ] Sección firma con nombres y fecha correctos
- [ ] Quotes del manifiesto verificados contra transcripción original
