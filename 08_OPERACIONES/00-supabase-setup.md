# 00 — Setup de Supabase para G*S

## Decisión: self-hosted vs cloud

**Recomendación CTO:** empezar con **Supabase Cloud (free tier)** durante las primeras 2-4 semanas, y migrar a self-hosted cuando G\*S tenga al menos 1 cliente pagando.

**Por qué cloud primero, contradiciendo el principio de soberanía:**
1. La fricción de instalar Supabase self-hosted (8+ contenedores Docker) come tiempo que debe ir a construir agentes.
2. El free tier soporta 500MB de DB y 2GB de transferencia/mes — más que suficiente para validar.
3. La migración cloud → self-hosted es trivial (pg_dump + restore). No hay lock-in.
4. Mantener Postgres + Auth + Realtime en local con 16GB de RAM compite con Docker, n8n, Obsidian, navegadores. Mal trade-off ahora.

**Cuándo migrar a self-hosted:**
- Datos sensibles de cliente que no pueden vivir en cloud externa.
- Volumen que excede free tier (500MB DB, 2GB egress, 50K usuarios auth).
- Costos de cloud > 25 USD/mes.

## Pasos: Supabase Cloud (recomendado para empezar)

1. Ir a `supabase.com` → Sign up (con GitHub recomendado).
2. **Crear nuevo proyecto:**
   - Name: `gs-growthstars-prod`
   - Database password: generar y guardar en password manager (NUNCA en git, NUNCA en el vault sin cifrar).
   - Region: la más cercana a Colombia → `us-east-1` (N. Virginia) o `sa-east-1` (São Paulo) si está disponible.
   - Pricing plan: Free.
3. Esperar provisioning (~2 min).
4. Guardar credenciales que aparecen en `Settings → API`:
   - `Project URL`
   - `anon public key` (uso desde frontend)
   - `service_role key` (uso desde backend, NUNCA expuesta a frontend)
5. Crear archivo `.env` en el proyecto local de G\*S:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres
```

6. Añadir `.env` a `.gitignore` inmediatamente.

## Pasos: Supabase Self-Hosted (Fase 2+)

Cuando llegue el momento, la receta es:

```bash
# Clonar repo oficial
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Configurar variables
cp .env.example .env
# Editar .env con secrets propios (POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY)

# Levantar
docker compose up -d

# Acceso en localhost:3000 (Studio) y localhost:8000 (API gateway)
```

**Costo de mantenimiento estimado:** 1-2 horas/mes de updates + monitoreo de espacio en disco. Backup obligatorio.

## Conexión desde n8n

n8n tiene nodo nativo de Postgres. Configuración:

- Host: el de `DATABASE_URL`
- Port: 5432
- Database: postgres
- User: postgres
- Password: el del `.env`
- SSL: enabled (cloud) / disabled (self-hosted en localhost)

## Conexión desde Claude Code

Para que los agentes lean/escriban de Postgres:

**Opción A (recomendada): MCP de Postgres oficial**

```bash
# En el proyecto de Claude Code
claude mcp add postgres \
  --command "npx @modelcontextprotocol/server-postgres" \
  --env DATABASE_URL=$DATABASE_URL
```

Esto le da a Claude Code la capacidad de hacer queries SQL directamente vía MCP.

**Opción B: Skill custom**

Skill `gs-db-write` y `gs-db-read` con scripts Python que conecten vía `psycopg2` o `supabase-py`. Más control pero más mantenimiento.

Recomendación: **Opción A** para empezar, Opción B cuando necesitemos lógica custom.

## Backups

Supabase Cloud free tier:
- Backup diario automático con retención de 7 días.
- **Esto NO es suficiente.** Configurar backup adicional propio:

```bash
# Cron diario en la laptop (o en n8n) que ejecute:
pg_dump $DATABASE_URL > /backups/gs-$(date +%Y%m%d).sql
# + sync a Backblaze B2 / Cloudflare R2
```

## Checklist de finalización

- [ ] Proyecto Supabase creado con nombre `gs-growthstars-prod`
- [ ] Credenciales guardadas en password manager
- [ ] `.env` creado en proyecto local con `.gitignore` configurado
- [ ] Conexión probada desde n8n
- [ ] MCP Postgres configurado en Claude Code
- [ ] Schema inicial cargado (ver `01-postgres-schema.sql`)
- [ ] Backup propio programado
