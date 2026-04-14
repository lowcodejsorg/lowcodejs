---
name: maiyu:fullstack-monorepo
description: |
  Generates fullstack monorepo setup for Node.js projects.
  Use when: user asks to create monorepo, project setup, workspace setup,
  or mentions "monorepo", "workspace", "project structure" for multi-package projects.
  Supports: npm workspaces, pnpm workspaces, Turborepo, npm-run-all2.
  Structure: backend + frontend in single repository.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating, detect:

1. Check root `package.json` for `workspaces` field
2. Check for `pnpm-workspace.yaml` or `turbo.json`
3. Detect existing directory structure: `backend/`, `frontend/`, `packages/`
4. Check for `npm-run-all2` or `concurrently`

## Conventions

### Rules
- Root package.json with parallel scripts (`npm-run-all2`)
- Husky pre-commit hooks with lint-staged per project
- Separate Dockerfiles per project (local and production)
- Shared `.env` at root with `.env.example` documented
- For any generated TypeScript code (e.g., shared packages, config files, scripts):
  - Zero `any` — use concrete types, `unknown`, generics, or `Record<string, unknown>`
  - Zero ternaries — use if/else, early return, or const mapper
  - Zero `as TYPE` (except `as const`) — use type guards, generics, or proper typing
  - All functions must have explicit return types
  - Multiple conditions must use const mapper (object lookup) instead of switch/if-else chains

## Templates

### Root package.json (Reference Implementation)

```json
{
  "name": "my-project",
  "private": true,
  "devDependencies": {
    "husky": "^9.1.7",
    "npm-run-all2": "^8.0.4"
  },
  "scripts": {
    "prepare": "husky",
    "dev": "run-p dev:*",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "lint": "run-p lint:*",
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint",
    "test:unit:backend": "cd backend && npm run test:unit",
    "test:e2e:backend": "cd backend && npm run test:e2e",
    "build": "run-p build:*",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "seed": "cd backend && npm run seed"
  }
}
```

### With npm Workspaces

```json
{
  "name": "my-project",
  "private": true,
  "workspaces": ["backend", "frontend", "packages/*"],
  "devDependencies": {
    "husky": "^9.1.7"
  },
  "scripts": {
    "prepare": "husky",
    "dev": "npm run dev --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  }
}
```

### With pnpm Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - backend
  - frontend
  - packages/*
```

```json
{
  "name": "my-project",
  "private": true,
  "scripts": {
    "dev": "pnpm -r run dev",
    "lint": "pnpm -r run lint",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test"
  }
}
```

### With Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", ".output/**", ".next/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### Husky Pre-commit Hook

```bash
#!/usr/bin/env sh
# .husky/pre-commit

cd backend && npx lint-staged
cd ../frontend && npx lint-staged
```

### lint-staged Config (per project)

```json
// backend/package.json (partial)
{
  "lint-staged": {
    "**/*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

```json
// frontend/package.json (partial)
{
  "lint-staged": {
    "**/*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

### Directory Structure

```
my-project/
├── .github/
│   └── workflows/          ← CI/CD
├── .husky/
│   └── pre-commit          ← Lint on commit
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile-local
│   ├── Dockerfile-production
│   └── src/
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile-local
│   ├── Dockerfile-production
│   └── src/
├── docker-compose.yml       ← Dev environment
├── docker-compose.production.yml
├── .env                     ← Shared env vars
├── .env.example
├── .gitignore
└── package.json             ← Root scripts
```

### .gitignore (Root)

```gitignore
# Dependencies
node_modules/

# Build outputs
build/
dist/
.output/
.next/

# Environment
.env
.env.test
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Storage
_storage/
!_storage/.gitkeep

# Coverage
coverage/

# Docker
.docker/
```

### .env.example

```bash
# Database
DB_USERNAME=root
DB_PASSWORD=secret
DATABASE_URL=mongodb://root:secret@localhost:27017
DB_NAME=myproject

# Server
NODE_ENV=development
PORT=3000
APP_SERVER_PORT=3000
APP_CLIENT_PORT=5173
APP_SERVER_URL=http://localhost:3000
APP_CLIENT_URL=http://localhost:5173

# Authentication
JWT_PUBLIC_KEY=
JWT_PRIVATE_KEY=
COOKIE_SECRET=
COOKIE_DOMAIN=

# Email
EMAIL_PROVIDER_HOST=smtp.example.com
EMAIL_PROVIDER_PORT=587
EMAIL_PROVIDER_USER=
EMAIL_PROVIDER_PASSWORD=

# Frontend
VITE_API_BASE_URL=http://localhost:3000

# CORS
ALLOWED_ORIGINS=http://localhost:5173;http://localhost:3000
```

## Checklist

- [ ] Root package.json with parallel scripts
- [ ] Husky pre-commit hooks
- [ ] lint-staged in each project
- [ ] Docker Compose for development
- [ ] `.env.example` with all variables documented
- [ ] `.gitignore` covering all projects
- [ ] Clear directory structure (backend/, frontend/)
