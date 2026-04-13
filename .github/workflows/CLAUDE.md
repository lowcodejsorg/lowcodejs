# GitHub Actions — CI/CD Workflows

Pipelines de build, teste e deploy automatizados.

## Estrutura

Dois pipelines principais, cada um composto por workflows reutilizaveis:

### Pipeline `main` (branch main)

| Workflow | Descricao |
|----------|-----------|
| `main.yml` | Orchestrador: dispara build, test e docker push |
| `main-test-backend.yml` | Roda testes do backend |
| `main-build-backend.yml` | Build do backend |
| `main-build-frontend.yml` | Build do frontend |
| `main-docker-backend.yml` | Push da imagem Docker do backend (tag `latest`) |
| `main-docker-frontend.yml` | Push da imagem Docker do frontend (tag `latest`) |

### Pipeline `deployment` (branches de deploy)

| Workflow | Descricao |
|----------|-----------|
| `deployment.yml` | Orchestrador: build + docker push + deploy VPS |
| `deployment-test-backend.yml` | Testes do backend |
| `deployment-build-backend.yml` | Build do backend |
| `deployment-build-frontend.yml` | Build do frontend |
| `deployment-docker-backend.yml` | Push da imagem Docker do backend |
| `deployment-docker-frontend.yml` | Push da imagem Docker do frontend |
| `deployment-deploy-vps.yml` | Deploy via SSH na VPS (docker compose pull + up) |

## Branches de Deploy

Configuradas em `.github/deploy-config.json`: develop, demo, intranet, homolog, saneago, lab-gestor, net-labic, admin-labic.

## Fluxo

1. Push na branch dispara o workflow orchestrador
2. Testes rodam primeiro (backend)
3. Build paralelo (backend + frontend)
4. Docker build + push para registry (GHCR + Docker Hub)
5. Deploy via SSH (apenas branches de deployment)
