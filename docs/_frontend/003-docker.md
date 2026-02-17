# Docker

## Dockerfile-local (Desenvolvimento)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
ENV HOST=0.0.0.0
CMD ["npm", "run", "dev", "--", "--host"]
```

- Baseado em **Node.js 22 Alpine**
- Instala todas as dependencias (incluindo devDependencies)
- Executa `npm run dev` com flag `--host` para acesso externo
- Porta 3000 exposta

---

## Dockerfile-production (Producao)

```dockerfile
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY .output/ ./.output/
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nitro && \
    chown nitro:nodejs /docker-entrypoint.sh && \
    chown -R nitro:nodejs /app/.output
USER nitro
EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
```

### Caracteristicas de Seguranca

- **Usuario nao-root**: Cria grupo `nodejs` (GID 1001) e usuario `nitro` (UID 1001)
- **Imagem minima**: Apenas `.output/` e copiado (sem node_modules, src, etc.)
- **Health check**: `curl` instalado para verificacoes de saude
- **ENTRYPOINT**: Executa `docker-entrypoint.sh` antes do servidor

---

## docker-entrypoint.sh

O script de entrada permite substituir a URL da API em runtime, sem necessidade de rebuild:

```bash
#!/bin/sh
set -e
# Substitui http://localhost:3000 por VITE_API_BASE_URL
# em todos os arquivos .js/.mjs do build
exec "$@"
```

Isso e necessario porque variaveis `VITE_*` sao inlined durante o build. O entrypoint faz find-and-replace nos arquivos compilados para atualizar a URL da API conforme o ambiente de deploy.

---

## Diferencas Local vs Producao

| Aspecto | Local | Producao |
|---|---|---|
| Base image | node:22-alpine | node:22-alpine |
| Usuario | root | nitro:nodejs |
| Conteudo | Codigo fonte completo | Apenas `.output/` |
| Comando | `npm run dev --host` | `node .output/server/index.mjs` |
| Hot reload | Sim (Vite HMR) | Nao |
| Dependencias | Todas (incluindo dev) | Nenhuma (pre-compilado) |
| Porta | 3000 | 3000 |
| Entrypoint | Direto | docker-entrypoint.sh |
