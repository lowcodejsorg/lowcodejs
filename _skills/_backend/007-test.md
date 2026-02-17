# Testes

O backend utiliza o **Vitest** como framework de testes, com suporte a TypeScript decorators via plugin **SWC**.

## Configuracoes

Existem duas configuracoes separadas para testes unitarios e testes end-to-end (e2e).

### Testes Unitarios — `vitest.config.ts`

- **Inclui:** arquivos `*.use-case.spec.ts` e `*.service.spec.ts`
- **Setup:** `test/setup.ts` — realiza apenas o import de `reflect-metadata`, necessario para o funcionamento dos decorators
- Execucao padrao com pool de threads

### Testes E2E — `vitest.e2e.config.ts`

- **Inclui:** arquivos `*.controller.spec.ts`
- **Setup:** `test/setup.e2e.ts`
- **Pool:** `forks`
- **maxWorkers:** `1` (execucao sequencial para evitar conflitos no banco)
- **Timeout:** `60000ms` (60 segundos)

## Setup E2E — `test/setup.e2e.ts`

O setup de testes e2e realiza as seguintes operacoes:

1. **Conexao com MongoDB:** conecta a uma instancia do MongoDB utilizando um nome de banco aleatorio no formato `test_<UUID>`, garantindo isolamento entre execucoes.
2. **Limpeza:** no `afterAll`, o banco de dados criado e completamente removido (drop), evitando acumulo de dados de teste.

## Helpers — `test/helpers/auth.helper.ts`

### `createAuthenticatedUser()`

Funcao auxiliar que simplifica a criacao de um usuario autenticado para testes e2e:

1. Cria um usuario com o grupo **master** e **todas as permissoes** do sistema.
2. Realiza o sign-in via **supertest**.
3. Retorna os **cookies** de autenticacao para uso nas requisicoes subsequentes.

### `cleanDatabase()`

Funcao auxiliar que limpa o banco de dados entre os testes, garantindo que cada suite inicie com um estado limpo.

## Plugin SWC

O projeto utiliza o plugin SWC do Vitest para suporte a **decorators do TypeScript**, que sao amplamente utilizados no backend (ex: injecao de dependencias, validacoes, etc.).

## Scripts npm

| Script           | Descricao                                      |
|------------------|-------------------------------------------------|
| `test`           | Executa todos os testes                         |
| `test:unit`      | Executa apenas os testes unitarios              |
| `test:e2e`       | Executa apenas os testes end-to-end             |
| `test:run`       | Executa os testes em modo single-run (sem watch)|
| `test:coverage`  | Executa os testes com relatorio de cobertura    |
