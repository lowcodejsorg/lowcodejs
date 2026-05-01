# Migração Dual MongoDB Connection

A partir desta branch o backend usa **2 databases**:

- `DB_DATABASE` (default `lowcodejs`) — sistema (users, tables, fields, settings, etc.)
- `DB_DATA_DATABASE` (default `lowcodejs_data`) — dados das tabelas dinâmicas

A migração é idempotente (marcador no `Setting`) e roda sozinha no boot do container.

---

## 1. Desenvolvimento

Roda em TypeScript direto via `@swc-node/register` (script `npm run dev`).

Atualizar `backend/.env`:

```env
DB_DATABASE=lowcodejs
DB_DATA_DATABASE=lowcodejs_data
```

Subir e migrar:

```bash
docker compose up -d
cd backend
npm run migrate:dual-connection
npm run seed
```

Conferir no Mongo:

```bash
docker exec -it low-code-js-mongo mongosh -u lowcodejs -p lowcodejs --authenticationDatabase admin

use lowcodejs        # só sistema
show collections

use lowcodejs_data   # só slugs das tabelas dinâmicas
show collections
```

Após validar que tudo funciona, limpar as collections antigas do DB sistema:

```bash
cd backend
npm run migrate:dual-connection -- --drop-source
```

---

## 2. Produção

> **Build é bundleado.** `tsup` empacota tudo em `backend/build/` (centenas de
> chunks). O `Dockerfile-production`/`Dockerfile-coolify` copiam `build/` direto
> para `/app/`. **Dentro do container só existe `.js`** — não tem TypeScript
> nem `swc-node`. Por isso o entrypoint chama `migrate:dual-connection:prod`
> (que é `node database/migrations/migrate-dual-connection.js`).

**1. Backup** (obrigatório):

```bash
docker exec -it low-code-js-mongo mongodump \
  --uri="mongodb://$DB_USERNAME:$DB_PASSWORD@127.0.0.1:27017/?authSource=admin" \
  --out=/data/dump-pre-dual
```

**2. Atualizar env vars** (Coolify/`.env`/secrets):

```env
DB_DATABASE=lowcodejs
DB_DATA_DATABASE=lowcodejs_data
```

**3. Deploy.** O `docker-entrypoint.sh` roda automaticamente:

```
node database/migrations/migrate-dual-connection.js   →   node database/seeders/main.js   →   node bin/server.js
```

Boots seguintes são no-op (skip via marcador no `Setting`).

**4. Aguardar 3-7 dias** com app em uso. Validar que não há reclamação.

**5. Drop manual** das collections antigas no DB sistema:

```bash
# Via npm script (preferencial)
docker exec -it low-code-js-api npm run migrate:dual-connection:prod -- --drop-source

# Ou direto via node (mesma coisa, sem o overhead do npm)
docker exec -it low-code-js-api node database/migrations/migrate-dual-connection.js --drop-source
```

---

## Comandos extras

```bash
# Re-rodar cópia ignorando o marcador (dev)
npm run migrate:dual-connection -- --force

# Mesmo em produção
docker exec -it low-code-js-api npm run migrate:dual-connection:prod -- --force
```

Inspecionar marcadores em produção:

```bash
docker exec -it low-code-js-mongo mongosh \
  -u "$DB_USERNAME" -p "$DB_PASSWORD" --authenticationDatabase admin \
  --eval "
    db.getSiblingDB('$DB_DATABASE').settings.findOne({}, {
      MIGRATION_DUAL_CONNECTION_AT: 1,
      MIGRATION_DUAL_CONNECTION_DROPPED_AT: 1,
      _id: 0
    });
  "
```
