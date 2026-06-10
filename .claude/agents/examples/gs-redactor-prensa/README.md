# Ejemplos curados — gs-redactor-prensa

Carpeta para alimentar al agente periodista con casos reales que funcionaron.

## Cómo agregar un ejemplo nuevo

1. Después de generar una nota con el agente, si el resultado fue bueno:

2. Creá una carpeta numerada:
```
   001-<slug-del-caso>/
   002-<slug-del-caso>/
```

3. Adentro creá 3 archivos:
   - `input.md` — el contexto que le pasaste al agente
   - `output-good.md` — el output que generó (o el editado final)
   - `notes.md` — qué funcionó editorialmente y por qué

## Cuándo actualizar el agente principal

Cuando tengas **5-10 ejemplos curados**:

1. Releé los `notes.md` de cada uno.
2. Identificá patrones (palabras que funcionan, estructuras que enganchan).
3. Editá `BOVEDA/.claude/agents/gs-redactor-prensa.md`.
4. Reemplazá los 2 ejemplos embebidos por tus 2-3 mejores casos reales.
5. Si surgieron anti-patrones nuevos, agregalos a la sección Anti-patrones.
6. Commit en BOVEDA con mensaje: `feat(agent): update gs-redactor-prensa with N new examples`

## Política de calidad

NO sumes un ejemplo solo porque "salió okay". Sumá ejemplos cuando:

- El output fue digno de mandar a un medio sin editarlo
- O lo editaste pero el 80%+ del output base era usable
- O descubriste un ángulo que querés que el agente replique

Pocos ejemplos buenos > muchos ejemplos mediocres.
