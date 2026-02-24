# Docker

## Introducao

O backend possui dois Dockerfiles para diferentes ambientes: desenvolvimento local e producao. Ambos utilizam `node:22-alpine` como imagem base e expõem a porta **3000**.

---

## Dockerfile-local

Arquivo: `backend/Dockerfile-local`

Container de desenvolvimento com hot-reload. Instala todas as dependencias (incluindo devDependencies) e executa o servidor em modo watch.

```dockerfile
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl curl

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### Caracteristicas

- **Imagem base**: `node:22-alpine`
- **Dependencias de sistema**: `openssl` e `curl`
- **Instalacao**: `npm install` completo (com devDependencies para SWC e TypeScript)
- **Modo de execucao**: `npm run dev` (Fastify com `--watch` e compilacao SWC)
- **Codigo-fonte**: copiado integralmente para o container (`COPY . .`)

### Seed

O seed do banco de dados deve ser executado apos os containers estarem rodando:

```bash
docker exec low-code-js-backend npm run seed
```

---

## Dockerfile-production

Arquivo: `backend/Dockerfile-production`

Container de producao otimizado. Recebe o build pre-compilado e executa diretamente com Node.js, sem compilacao em runtime.

```dockerfile
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl

# Build pre-compilado
COPY build/ ./
COPY node_modules/ ./node_modules/
COPY package.json ./
COPY templates/ ./templates/

# Storage com logos padrao
RUN mkdir -p ./_storage
COPY _storage/logo-large.webp _storage/logo-small.webp ./_storage/

# Usuario nao-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000
CMD ["node", "bin/server.js"]
```

### Caracteristicas

- **Imagem base**: `node:22-alpine`
- **Dependencia de sistema**: `curl` (para healthcheck)
- **Arquivos copiados**:
  - `build/` — codigo compilado pelo tsup
  - `node_modules/` — dependencias de producao
  - `package.json`
  - `templates/` — templates de email EJS
  - `_storage/logo-large.webp` e `_storage/logo-small.webp` — logos padrao
- **Seguranca**: usuario `nodejs` nao-root (UID 1001, GID 1001)
- **Modo de execucao**: `node bin/server.js` (execucao direta do build)

---

## Diferencas entre Local e Producao

| Aspecto | Local | Producao |
|---|---|---|
| Dependencias de sistema | `openssl` + `curl` | `curl` |
| Instalacao npm | `npm install` (todas) | `node_modules/` copiado |
| Codigo-fonte | Fonte TypeScript completo | Build compilado (`build/`) |
| Comando de execucao | `npm run dev` (watch + SWC) | `node bin/server.js` |
| Usuario | root (padrao) | `nodejs` (nao-root) |
| Storage | Herdado do volume | Criado + logos padrao |
| Hot-reload | Sim | Nao |

---

## Comandos Docker Uteis

```bash
# Subir containers em modo desenvolvimento
docker compose up -d

# Ver logs do backend
docker logs -f low-code-js-backend

# Executar seed no container
docker exec low-code-js-backend npm run seed

# Acessar shell do container
docker exec -it low-code-js-backend sh

# Rebuild do container apos mudancas no Dockerfile
docker compose up -d --build backend
```
