# Core

Logica central compartilhada por toda a aplicacao.

## Arquivos

### `entity.core.ts`
Enums, tipos e interfaces do dominio. Fonte unica de verdade para:
- Enums: `E_ROLE`, `E_FIELD_TYPE`, `E_FIELD_FORMAT`, `E_TABLE_TYPE`, `E_TABLE_STYLE`, `E_TABLE_VISIBILITY`, `E_TABLE_COLLABORATION`, `E_TABLE_PERMISSION`, `E_JWT_TYPE`, `E_USER_STATUS`, `E_SCHEMA_TYPE`, `E_CHAT_EVENT`
- Interfaces: `IUser`, `ITable`, `IField`, `IRow`, `IGroup`, `IPermission`, `IStorage`, `IMenu`, `ISetting`, `IValidationToken`, `IReaction`, `IEvaluation`
- Tipos base: `Base` (campos comuns: _id, createdAt, updatedAt, trashed, trashedAt)
- Helpers: `Optional<T, K>`, `Merge<T, U>`, `ValueOf<T>`, `Paginated<Entity>`, `IMeta`, `ISearch`
- Constantes: `FIELD_NATIVE_LIST`, `FIELD_GROUP_NATIVE_LIST` (5 campos nativos cada)

### `exception.core.ts`
Classe `HTTPException` que extends `Error`. Factory methods estaticos para cada HTTP status:
- `BadRequest(message?, cause?, errors?)` - 400, aceita `errors` para erros de campo
- `Unauthorized(message?, cause?, errors?)` - 401, aceita `errors` (ex: INVALID_CREDENTIALS com erros por campo)
- `Forbidden(message?, cause?)` - 403
- `NotFound(message?, cause?)` - 404
- `Conflict(message?, cause?)` - 409
- `InternalServerError(message?, cause?)` - 500
- Estrutura: `{ message, code, cause, errors? }`
- Todas as mensagens devem ser em PT-BR

### `either.core.ts`
Pattern funcional para error handling:
- `Left<L, R>` = erro, `Right<L, R>` = sucesso
- Usado em todos os use-cases: `Either<HTTPException, T>`
- Metodos: `isLeft()`, `isRight()`, `.value`

### `util.core.ts` (954 linhas)
Funcoes utilitarias para schema/query/model building:
- `buildSchema(fields)` - converte IField[] em Mongoose schema definition
- `buildTable(table)` - cria modelo Mongoose dinamico a partir de ITable
- `buildPopulate(table)` - gera populate paths para relacionamentos
- `buildQuery(search, fields)` - converte filtros de busca em query MongoDB
- `buildOrder(sort)` - converte parametros de sort
- `normalize(text)` - regex com tratamento de acentos
- `findReverseRelationships(table)` - encontra tabelas que referenciam a atual
- `PASSWORD_REGEX` - validacao de senha

### `row-payload-validator.core.ts`
`validateRowPayload(payload, fields)` - valida dados de row contra definicao de campos:
- Validadores por tipo: TEXT_SHORT/LONG, DATE, DROPDOWN, FILE, RELATIONSHIP, CATEGORY, FIELD_GROUP
- Validadores de formato: EMAIL, URL, INTEGER, DECIMAL, PHONE, CNPJ, CPF

### `controllers.ts`
Carrega dinamicamente todos os `*.controller.ts` de `resources/` para registro no Fastify.

### `di-registry.ts`
Registro explicito de dependencias (Contract -> Implementation):
- 11 repositorios (Mongoose)
- 1 servico (Email -> Nodemailer)
- Usa `injectablesHolder.injectService()` do fastify-decorators

## Subdiretorio: `table/`

Sistema de sandbox para execucao de scripts de usuario (beforeSave, afterSave, onLoad).

| Arquivo | Responsabilidade |
|---------|-----------------|
| `executor.ts` | Executa codigo em Node VM com timeout (5s). Valida sintaxe. |
| `handler.ts` | Orquestra: monta sandbox + executa + coleta logs |
| `sandbox.ts` | Monta ambiente isolado com APIs: `field`, `context`, `email`, `utils`, `console` |
| `field-resolver.ts` | Resolve valores de campo com normalizacao |
| `types.ts` | Tipos TypeScript para execucao |
