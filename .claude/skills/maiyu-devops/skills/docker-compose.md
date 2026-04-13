---
name: maiyu:devops-docker-compose
description: |
  Generates docker-compose files for different environments.
  Use when: user asks to create docker-compose, container orchestration,
  or mentions "docker-compose", "compose", "containers" for multi-service setup.
  Supports: Development, production, pre-built image environments.
  Databases: MongoDB, PostgreSQL, Redis, MySQL.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating, detect:

1. Scan project root for existing `docker-compose*.yml`
2. Check `package.json` for database drivers: `mongoose` | `pg` | `mysql2` | `redis`
3. Check for `.env` file with database credentials
4. Detect backend/frontend directory structure

## Conventions

### Rules
- Always use named services with project prefix
- Health checks for all services
- `depends_on` with `condition: service_healthy`
- Named volumes for data persistence
- Isolated network per project
- For any generated TypeScript code (e.g., helper scripts, health check utilities):
  - Zero `any` — use concrete types, `unknown`, generics, or `Record<string, unknown>`
  - Zero ternaries — use if/else, early return, or const mapper
  - Zero `as TYPE` (except `as const`) — use type guards, generics, or proper typing
  - All functions must have explicit return types
  - Multiple conditions must use const mapper (object lookup) instead of switch/if-else chains

## Templates

### Development (Reference Implementation)

```yaml
name: my-project

services:
  mongo:
    image: mongo:latest
    container_name: my-project-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mongo-volume:/data/db
    ports:
      - "27017:27017"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile-local
    container_name: my-project-api
    restart: unless-stopped
    ports:
      - "${APP_SERVER_PORT}:3000"
    env_file: .env
    networks:
      - app-network
    depends_on:
      mongo:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health-check"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  app:
    build:
      context: ./frontend
      dockerfile: Dockerfile-local
    container_name: my-project-app
    restart: unless-stopped
    ports:
      - "${APP_CLIENT_PORT}:5173"
    env_file: .env
    environment:
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
      - PORT=5173
    networks:
      - app-network
    depends_on:
      api:
        condition: service_healthy
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  mongo-volume:
    driver: local

networks:
  app-network:
    driver: bridge
```

### Production (with Traefik)

```yaml
name: my-project-production

services:
  mongo:
    image: mongo:latest
    container_name: my-project-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${DB_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mongo-volume:/data/db
    networks:
      - app-network
    deploy:
      resources:
        limits:
          memory: 1G
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.runCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: ${DOCKER_REGISTRY}/my-project-api:latest
    container_name: my-project-api
    restart: unless-stopped
    env_file: .env
    networks:
      - app-network
      - traefik-network
    depends_on:
      mongo:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 512M
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.${DOMAIN}`)"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health-check"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: ${DOCKER_REGISTRY}/my-project-app:latest
    container_name: my-project-app
    restart: unless-stopped
    env_file: .env
    networks:
      - app-network
      - traefik-network
    depends_on:
      api:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 512M
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=3000"

volumes:
  mongo-volume:
    driver: local

networks:
  app-network:
    driver: bridge
  traefik-network:
    external: true
```

### PostgreSQL Variant

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: my-project-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres-volume:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-volume:
    driver: local
```

### With Redis

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: my-project-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

## Checklist

- [ ] Named services with project prefix
- [ ] Health checks for all services
- [ ] `depends_on` with `condition: service_healthy`
- [ ] Named volumes for data persistence
- [ ] Isolated network
- [ ] `env_file: .env` for configuration
- [ ] Resource limits for production
- [ ] Traefik labels for production reverse proxy
