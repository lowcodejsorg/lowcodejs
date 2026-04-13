---
name: maiyu:devops
description: |
  Activates ALL 3 DevOps skills for containerization and CI/CD.
  Use when: any DevOps task — Dockerfile, Docker Compose, GitHub Actions,
  CI/CD pipelines, containerization, deployment.
metadata:
  author: jhollyfer
  version: "1.0.0"
---

# maiyu:devops — All DevOps Skills

When this skill is activated, you have access to **all 3 DevOps modules**. Identify the task and read the matching module before generating code.

## Available Modules

| Task | Module to read |
|------|---------------|
| Create Dockerfile / containerize | `skills/dockerfile.md` |
| Create Docker Compose (dev/staging/prod) | `skills/docker-compose.md` |
| Create CI/CD pipeline / GitHub Actions | `skills/github-actions.md` |

## Compound Tasks

- **"Deploy the project"** — Read: `dockerfile`, `docker-compose`, `github-actions`
- **"Containerize"** — Read: `dockerfile`, `docker-compose`
- **"Set up CI/CD"** — Read: `github-actions`
