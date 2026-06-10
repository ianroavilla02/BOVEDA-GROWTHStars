# SISTEMA BRAND BOOK · G*S
Carpeta destino en BOVEDA: `03_PROTOCOLOS/brand-book/`

| Archivo | Qué es | Quién lo usa |
|---------|--------|--------------|
| PROTOCOLO-BRANDBOOK.md | Workflow completo de 5 fases | Ian + Claude (ai/code) |
| CONTENT-template.md | Plantilla de contenido por artista | Claude.ai (Fase 2) |
| PROMPT-claude-code.md | Prompt maestro de build | Claude Code (Fase 3) |
| template/index.html | Esqueleto HTML parametrizado | Claude Code (Fase 3) |

Inicio rápido por proyecto:
1. `cp -r 03_PROTOCOLOS/brand-book/ proyectos/brandbook-[artista]/`
2. Sesión Claude.ai → llenar CONTENT.md
3. Claude Code + PROMPT-claude-code.md → index.html
4. GitHub Pages → link + PDF (Ctrl+P)
