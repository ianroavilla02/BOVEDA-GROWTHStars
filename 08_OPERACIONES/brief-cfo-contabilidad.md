# Brief para CFO — Contexto del negocio G*S / SANCORT

> Documento de contexto para que el agente CFO entienda la estructura del negocio
> y pueda diseñar el modelo contable/financiero.
> Generado: 2026-06-27 · Fuente: decisiones D-027, D-067–D-073

---

## 1. QUÉ ES G*S

**G*S (Growth*Stars)** es un holding de servicios para artistas musicales, operado bajo la razón social **SANCORT Mgmt**. Foco geográfico: LATAM, América y Europa. Operado por Ian Villaveces (founder, Growth Hacker), sin equipo técnico — solo él + agentes de IA.

## 2. LÍNEAS DE SERVICIO (3 activas)

### MGMT — Gestión mensual continua
- **Modelo:** retainer mensual (engagement por mes)
- **Facturación:** monto fijo mensual, facturado en USD o COP según cliente
- **Unidad de trabajo:** objetivos mensuales → entregables (deliverables)
- **Ejemplo:** Brandbook, Discovery Session, Auditoría de Redes, Estrategia de Contenido, Actualización de Feed
- **Estado actual:** 1 artista activo (Reckless), 4 objetivos, 7 entregables

### Productora AV — Por proyecto
- **Modelo:** proyecto cerrado con presupuesto fijo
- **Subservicios (4):**
  - Videoclip
  - Cubrimiento (evento, detrás de cámaras)
  - Sesión de contenido (fotos + reels para redes)
  - Sesión de fotos (editorial, press kit)
- **Facturación:** por proyecto, puede tener pagos parciales (anticipo + saldo)
- **Estado actual:** aún no construida en el sistema, pero ya se ejecuta informalmente

### Productora de Eventos — Booking + producción
- **Modelo:** evento individual o tour
- **Tipos:** evento propio (G*S produce) vs booking (G*S gestiona, artista toca, fee %)
- **Relación N:M:** un evento puede involucrar varios artistas, un artista participa en varios eventos
- **Facturación:** fee por evento (propio) o % del booking (10-20% típico)
- **Estado actual:** aún no construida en el sistema

## 3. ESTRUCTURA CLIENTE ↔ ARTISTA

| Concepto | Definición | Ejemplo |
|----------|-----------|---------|
| **Cliente** | Quien contrata y PAGA (sello, inversor, manager, productor ejecutivo) | Chimbita Records (sello) |
| **Artista** | El PROYECTO sobre el que se trabaja | Javier Ferreira (artista de Chimbita) |
| **Artista autogestionado** | Artista que se paga a sí mismo — existe como client Y como artist | Reckless |

**Regla clave:** el pagador NO vive en la línea de servicio, sino en el ÍTEM facturable. Esto permite que un mismo artista tenga pagadores distintos por servicio (ej: sello paga el MGMT, el artista paga el videoclip de su bolsillo).

## 4. MODELO ECONÓMICO ACTUAL

### Ingresos confirmados
| Artista | Servicio | Monto | Moneda | Frecuencia |
|---------|----------|-------|--------|------------|
| Reckless | MGMT | (pendiente de completar) | (USD/COP) | Mensual |

### Ingresos esperados (pipeline)
- Jot4 R: artista creado, sin línea activa aún
- Ery La Buena Vida: artista creado, sin línea activa aún
- Servicios AV puntuales: ejecución informal, sin facturación sistematizada

### Estructura de costos (estimada)
- API Anthropic (Claude): variable, ~$XX/mes
- Supabase: free tier (sin costo actual)
- Herramientas: Notion (free), Obsidian (free), Canva (por definir)
- Talento externo: (pendiente — videógrafo, fotógrafo, etc.)

## 5. PREGUNTAS PARA EL CFO

### Facturación y cobro
1. ¿Cómo estructuramos las cuentas de cobro? ¿Por línea de servicio, por artista, o por proyecto?
2. ¿Qué campos necesita una cuenta de cobro para ser válida legalmente en Colombia? (NIT, razón social, concepto, retenciones)
3. ¿Manejamos facturación electrónica o cuentas de cobro simples? ¿A partir de qué volumen necesitamos factura electrónica?
4. Para servicios AV (proyecto cerrado): ¿anticipo + saldo? ¿Qué porcentaje de anticipo es estándar?
5. Para eventos (booking): ¿cómo facturamos el fee? ¿Al artista o al venue?

### Monedas y conversión
6. ¿Mantenemos cuentas en USD y COP por separado o consolidamos a una moneda base?
7. ¿Qué TRM usamos para reportes? ¿Fecha de factura, fecha de pago, o promedio del mes?

### Seguimiento financiero
8. ¿Qué necesitamos rastrear por cada transacción? (emitida → pagada → vencida → en mora)
9. ¿Necesitamos tracking de gastos por proyecto/artista para calcular margen real?
10. ¿Cómo manejamos retenciones? (en Colombia el cliente a veces retiene % antes de pagar)

### Reportes
11. ¿Qué reporte mensual mínimo necesita Ian? (facturado vs cobrado vs pendiente, por línea)
12. ¿Necesitamos proyección de cashflow? ¿Con qué horizonte?
13. ¿Hay obligaciones tributarias periódicas que debamos rastrear? (IVA, retención en la fuente, declaración de renta)

### Escalabilidad
14. ¿A partir de cuántos clientes/transacciones por mes recomendarías sistematizar esto en el dashboard vs manejarlo en Excel/Notion?
15. ¿Existe un software contable colombiano que valga la pena integrar (Siigo, Alegra, World Office)?

## 6. DATOS TÉCNICOS DISPONIBLES

Lo que ya existe en el sistema y el CFO puede aprovechar:

| Tabla | Campos útiles |
|-------|---------------|
| `artists` | id, slug, stage_name, status |
| `clients` | id, slug, display_name, type (sello/artista), country |
| `service_lines` | artist_id, service_type_id, status, started_at |
| `service_types` | name (MGMT, AV, Eventos) |
| `subservices` | name (videoclip, cubrimiento, sesión contenido, sesión fotos) |
| `mgmt_engagements` | client_id, month, invoice_amount, invoice_currency, status |
| `mgmt_deliverables` | title, status (pending/in_progress/done), owner (team/artist/both) |

Lo que NO existe aún:
- Tabla de facturas/cuentas de cobro
- Tracking de pagos recibidos vs pendientes
- Gastos por proyecto
- Margen por servicio
