# start — Kernel e Configuração de Ambiente

Bootstrap da aplicação Fastify: registra todos os plugins e valida variáveis de
ambiente.

## Arquivos

| Arquivo      | Descrição                                                            |
| ------------ | -------------------------------------------------------------------- |
| `kernel.ts`  | Factory da aplicação Fastify com todos os plugins configurados       |
| `env.ts`     | Validação e tipagem de variáveis de ambiente via Zod                 |

## kernel.ts — Plugins Registrados

| Plugin                   | Configuração / Observação                                               |
| ------------------------ | ----------------------------------------------------------------------- |
| `@fastify/cors`          | Origins fixos + padrão via `ALLOWED_ORIGINS` (env)                     |
| `@fastify/cookie`        | Cookies httpOnly para armazenar JWT                                     |
| `@fastify/jwt`           | RS256, 24h de expiração, lê `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY`       |
| `@fastify/multipart`     | Upload de arquivos com limite configurável via Settings                 |
| `@fastify/static`        | Serve arquivos locais do `_storage/` (quando STORAGE_DRIVER=local)     |
| `@scalar/fastify-api-reference` | Documentação OpenAPI em `/documentation`                        |
| `fastify-socket.io`      | WebSocket para chat em tempo real                                       |
| `fastify-decorators`     | DI de controllers via diRegistry                                        |

## Tratamento de Erros Global

O error handler global captura e normaliza:
- `HTTPException` — retorna `statusCode` e `message` estruturados
- `ZodError` — retorna 400 com lista de erros de validação
- Erros AJV — retorna 400 para falhas no schema JSON

## env.ts — Variáveis de Ambiente

Validadas com Zod. Principais grupos:

| Grupo      | Variáveis                                           |
| ---------- | --------------------------------------------------- |
| App        | `PORT`, `NODE_ENV`, `ALLOWED_ORIGINS`               |
| Database   | `MONGO_URI`                                         |
| Auth       | `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `COOKIE_SECRET`|
| Storage    | `STORAGE_DRIVER`, `S3_*`, `LOCAL_STORAGE_PATH`      |
| Email      | `SMTP_*`, `MAIL_FROM`                               |
| Redis      | `REDIS_URI`                                         |
