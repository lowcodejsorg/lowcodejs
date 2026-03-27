# Test

Configuracao e helpers para testes.

## Configs

| Config | Arquivo | Pattern | Detalhes |
|--------|---------|---------|----------|
| Unit | `vitest.config.ts` | `*.use-case.spec.ts`, `*.service.spec.ts` | Setup: `test/setup.ts`. Globals: true |
| E2E | `vitest.e2e.config.ts` | `*.controller.spec.ts` | Setup: `test/setup.e2e.ts`. Pool: forks, maxWorkers: 1, timeout: 60s |

## Setup

### `setup.ts` (Unit)
Importa `reflect-metadata` para decorators.

### `setup.e2e.ts` (E2E)
- Carrega `.env.test`
- Cria database MongoDB unica por suite (`test_{uuid}`)
- `beforeAll`: conecta ao MongoDB
- `afterAll`: dropa database + fecha conexao

## Helpers

### `helpers/auth.helper.ts`

| Funcao | Descricao |
|--------|-----------|
| `createAuthenticatedUser(overrides?)` | Cria usuario + grupo Master + permissoes no DB, faz sign-in via supertest, retorna `{ user, cookies, permissions }` |
| `cleanDatabase()` | Deleta todos User e UserGroup |

## Patterns

### Unit Tests
- Repositorios in-memory (sem MongoDB)
- `vi.spyOn()` para mocks de erro
- SUT (System Under Test) pattern
- Either assertions: `result.isRight()`, `result.isLeft()`

### E2E Tests
- MongoDB real (database unica por suite)
- `supertest(kernel.server)` para requests HTTP
- `createAuthenticatedUser()` para auth
- Cleanup: `Model.deleteMany({})` no beforeEach

## Comandos

```bash
npm run test          # Todos
npm run test:unit     # Unit only
npm run test:e2e      # E2E only
npm run test:coverage # Com coverage
```
