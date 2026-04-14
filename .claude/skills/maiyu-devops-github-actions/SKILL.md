---
name: maiyu:devops-github-actions
description: |
  Generates GitHub Actions CI/CD workflows for Node.js projects.
  Use when: user asks to create CI/CD, GitHub Actions, workflow, pipeline,
  or mentions "actions", "CI", "CD", "deploy" for automated builds/deployments.
  Supports: Test, build, Docker push, VPS deploy, multi-branch strategies.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating, detect:

1. Check for existing `.github/workflows/` directory
2. Scan `package.json` for scripts: `test`, `build`, `lint`
3. Detect project structure (monorepo vs single app)
4. Check for Dockerfiles (determines if Docker workflow needed)

## Conventions

### File Structure
```
.github/
├── workflows/
│   ├── main.yml                    ← CI orchestrator (push to main)
│   ├── main-test-backend.yml       ← Backend tests (reusable)
│   ├── main-build-backend.yml      ← Backend build (reusable)
│   ├── main-build-frontend.yml     ← Frontend build (reusable)
│   ├── main-docker-backend.yml     ← Backend Docker (reusable)
│   ├── main-docker-frontend.yml    ← Frontend Docker (reusable)
│   ├── deployment.yml              ← CD orchestrator (push to deploy branches)
│   └── deployment-deploy-vps.yml   ← VPS deploy (reusable)
└── deploy-config.json              ← Branch → domain mapping
```

### Rules
- Use reusable workflows (`workflow_call`) for DRY
- Artifacts for inter-job communication
- Cache node_modules with `actions/cache`
- Multi-platform Docker builds (amd64 + arm64)
- Secrets via `secrets: inherit`
- For any generated TypeScript code (e.g., custom actions, workflow scripts):
  - Zero `any` — use concrete types, `unknown`, generics, or `Record<string, unknown>`
  - Zero ternaries — use if/else, early return, or const mapper
  - Zero `as TYPE` (except `as const`) — use type guards, generics, or proper typing
  - All functions must have explicit return types
  - Multiple conditions must use const mapper (object lookup) instead of switch/if-else chains

## Templates

### CI Orchestrator — `main.yml`

```yaml
name: Main CI

on:
  push:
    branches: [main]

jobs:
  test-backend:
    uses: ./.github/workflows/main-test-backend.yml
    secrets: inherit

  build-backend:
    needs: test-backend
    uses: ./.github/workflows/main-build-backend.yml
    secrets: inherit

  build-frontend:
    needs: test-backend
    uses: ./.github/workflows/main-build-frontend.yml
    secrets: inherit

  docker-backend:
    needs: build-backend
    uses: ./.github/workflows/main-docker-backend.yml
    secrets: inherit

  docker-frontend:
    needs: build-frontend
    uses: ./.github/workflows/main-docker-frontend.yml
    secrets: inherit
```

### Test Workflow — `main-test-backend.yml`

```yaml
name: Test Backend

on:
  workflow_call:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: backend

      - name: Run unit tests
        run: npm run test:unit
        working-directory: backend
```

### Build Workflow — `main-build-backend.yml`

```yaml
name: Build Backend

on:
  workflow_call:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: backend

      - name: Build
        run: npm run build
        working-directory: backend

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: backend-build
          path: |
            backend/build/
            backend/node_modules/
            backend/package.json
            backend/templates/
          retention-days: 1
```

### Docker Workflow — `main-docker-backend.yml`

```yaml
name: Docker Backend

on:
  workflow_call:

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: backend-build
          path: backend/

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: backend
          file: backend/Dockerfile-production
          push: true
          platforms: linux/amd64,linux/arm64
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/my-project-api:latest
            ${{ secrets.DOCKER_USERNAME }}/my-project-api:${{ github.sha }}
```

### Deploy to VPS — `deployment-deploy-vps.yml`

```yaml
name: Deploy to VPS

on:
  workflow_call:
    inputs:
      domain:
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/${{ inputs.domain }}
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f
```

### CD Orchestrator — `deployment.yml`

```yaml
name: Deployment CD

on:
  push:
    branches: [develop, demo, staging, production]

jobs:
  read-config:
    runs-on: ubuntu-latest
    outputs:
      domain: ${{ steps.config.outputs.domain }}
    steps:
      - uses: actions/checkout@v4
      - id: config
        run: |
          BRANCH="${GITHUB_REF_NAME}"
          DOMAIN=$(jq -r ".\"$BRANCH\".domain // empty" .github/deploy-config.json)
          echo "domain=$DOMAIN" >> "$GITHUB_OUTPUT"

  test-backend:
    uses: ./.github/workflows/main-test-backend.yml
    secrets: inherit

  build-and-deploy:
    needs: [read-config, test-backend]
    uses: ./.github/workflows/deployment-deploy-vps.yml
    with:
      domain: ${{ needs.read-config.outputs.domain }}
    secrets: inherit
```

### Deploy Config — `deploy-config.json`

```json
{
  "develop": { "domain": "dev.example.com" },
  "demo": { "domain": "demo.example.com" },
  "staging": { "domain": "staging.example.com" },
  "production": { "domain": "example.com" }
}
```

## Checklist

- [ ] Reusable workflows with `workflow_call`
- [ ] Artifact passing between jobs
- [ ] Node.js cache with `actions/cache` or `setup-node` cache
- [ ] Multi-platform Docker builds
- [ ] Secrets via `secrets: inherit`
- [ ] Deploy config for multi-branch strategy
- [ ] SSH-based VPS deployment
