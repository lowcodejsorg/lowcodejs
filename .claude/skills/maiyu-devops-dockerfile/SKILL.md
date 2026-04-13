---
name: maiyu:devops-dockerfile
description: |
  Generates Dockerfiles for Node.js backend and frontend projects.
  Use when: user asks to create a Dockerfile, containerize, Docker setup,
  or mentions "docker", "container", "Dockerfile" for deployment.
  Supports: Multi-stage builds, Node Alpine, non-root user, health checks.
  Targets: Backend (Fastify, Express, NestJS), Frontend (Next.js, TanStack Start, Vite).
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating, detect the project:

1. Find `package.json` to detect:
   - **Runtime**: `node` version (check `.nvmrc`, `engines.node`, or default to 22)
   - **Framework**: `fastify` | `express` | `@nestjs/core` | `next` | `@tanstack/react-start` | `vite`
   - **Build tool**: `tsup` | `tsc` | `swc` | `vite build` | `next build`
   - **Entry point**: `build/bin/server.js` | `dist/main.js` | `.output/server/index.mjs`
2. Check for existing Dockerfiles and `.dockerignore`
3. Detect if project uses ESM (`"type": "module"` in package.json)

## Conventions

### Rules
- Always use Alpine images for smaller size
- Non-root user for security
- Multi-stage builds for production
- `.dockerignore` to exclude `node_modules`, `.git`, `.env`
- Health check endpoint
- For any generated TypeScript code (e.g., health check scripts, build helpers):
  - Zero `any` — use concrete types, `unknown`, generics, or `Record<string, unknown>`
  - Zero ternaries — use if/else, early return, or const mapper
  - Zero `as TYPE` (except `as const`) — use type guards, generics, or proper typing
  - All functions must have explicit return types
  - Multiple conditions must use const mapper (object lookup) instead of switch/if-else chains

## Templates

### Backend — Production (Pre-built Artifacts)

```dockerfile
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl

# Copy pre-built artifacts
COPY build/ ./
COPY node_modules/ ./node_modules/
COPY package.json ./
COPY templates/ ./templates/

# Create storage directory
RUN mkdir -p ./_storage

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "bin/server.js"]
```

### Backend — Multi-stage Build (Coolify/PaaS)

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: Run
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/build ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/templates ./templates

RUN mkdir -p ./_storage

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs && \
    chown -R appuser:nodejs /app

USER appuser

EXPOSE 3000

CMD ["node", "--import", "@swc-node/register/esm-register", "bin/server.ts"]
```

### Backend — Development (Hot Reload)

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Frontend — TanStack Start / Vite SSR

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Run
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs && \
    chown -R appuser:nodejs /app

USER appuser

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

### Frontend — Next.js (Standalone)

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### .dockerignore

```
node_modules
.git
.env
.env.*
*.md
.vscode
.output
.next
build
dist
coverage
```

## Checklist

- [ ] Alpine base image
- [ ] Multi-stage build (builder → runner)
- [ ] Non-root user (addgroup + adduser)
- [ ] `.dockerignore` file
- [ ] Health check command
- [ ] Correct entry point for framework
- [ ] EXPOSE correct port
