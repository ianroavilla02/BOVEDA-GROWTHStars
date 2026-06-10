# D-009: Brand Book Digital adoptado como formato de entregable premium G*S

**Fecha:** 2026-06-09
**Estado:** Aprobada
**Autor:** Ian Villaveces + G*S-CTO
**Tipo:** Decisión Operativa

---

## Contexto

G*S necesita un formato de entregable premium para brand books de artistas que sea:
- Profesional y memorable (no un PDF estático genérico)
- De costo cero en hosting
- Reproducible con flujo estandarizado
- Compatible con entrega digital (link) y física (PDF print)

Ingeniería inversa del brand book de Jared la J (Sancor MGMT, Vol. IX, mayo 2026) demostró que un HTML single-file con CSS/JS vanilla + GitHub Pages cumple todos los requisitos.

## Opciones consideradas

1. **PDF estático (Canva/Figma export)** — fácil pero genérico, sin interactividad, pesado.
2. **Notion page pública** — rápido pero sin control de diseño ni print limpio.
3. **HTML single-file + GitHub Pages** — control total, interactivo, print A4, hosting $0.
4. **Next.js/framework** — over-engineering para un documento estático de entrega.

## Decisión

**Opción 3: HTML single-file + GitHub Pages + PDF print.**

Formato: 11 secciones canónicas, CSS tokens = paleta del artista, JS vanilla (cursor, fade-up, contadores, copy-HEX, scroll-spy), @media print A4.

Flujo: co-creación de contenido en Claude.ai (Fase 2) → build en Claude Code (Fase 3) → deploy en GitHub Pages → firma del cliente.

Los proyectos viven en repos públicos FUERA de la bóveda. Solo el CONTENT.md final regresa a la ficha del cliente en la bóveda.

## Razón

- ROI operativo máximo: costo de hosting $0, tiempo de build ~30min con Claude Code.
- El documento ES la marca (tokens CSS = paleta real del artista).
- Dos formatos de entrega desde un solo source of truth (link + Ctrl+P PDF).
- Micro-interacciones señalizan "design system real", no slide deck.
- Reproducible: CONTENT-template.md + PROMPT-claude-code.md + template/index.html estandarizan el flujo.

## Criterio para revisar

- Si el volumen de brand books supera 10/mes y el build manual se vuelve bottleneck.
- Si los clientes demandan interactividad que exceda lo que JS vanilla puede hacer.
- Si GitHub Pages deja de ser gratis o impone limitaciones incompatibles.

## Ubicación de archivos

- Protocolo: `03_PROTOCOLOS/brand-book/`
- Proyectos: `C:\Users\Ian Villaveces\Documents\BRANDBOOKS\gs-brandbook-[slug]/`
