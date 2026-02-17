# Visao Geral da Arquitetura do Backend

## Introducao

O backend do LowCodeJS e uma API RESTful construida com **Fastify 5** e **TypeScript**, utilizando **MongoDB** como banco de dados via **Mongoose 8**. A aplicacao segue principios de arquitetura limpa com injecao de dependencias, pattern Either para tratamento de erros e controllers baseados em decorators.

---

## Stack Tecnologica

| Tecnologia | Versao | Funcao |
|---|---|---|
| Fastify | 5.6+ | Framework HTTP |
| TypeScript | 5.9+ | Linguagem |
| Mongoose | 8.18+ | ODM para MongoDB |
| Zod | 4.1+ | Validacao de schemas |
| @fastify/jwt | 10.x | Autenticacao JWT (RS256) |
| @fastify/cookie | 11.x | Gerenciamento de cookies |
| fastify-decorators | 3.16+ | Injecao de dependencias e controllers via decorators |
| Vitest | 4.x | Testes unitarios e e2e |
| tsup | 8.x | Bundler para producao |
| SWC | 1.x | Compilador TypeScript em desenvolvimento |

---

## Autenticacao

A autenticacao utiliza **JWT com algoritmo RS256** e chaves publica/privada codificadas em Base64. Os tokens sao entregues via **cookies httpOnly**:

- **accessToken**: validade de 24 horas, utilizado para autenticar requisicoes
- **refreshToken**: validade de 7 dias, utilizado para renovar o accessToken

```typescript
// Criacao dos tokens (application/utils/jwt.util.ts)
const accessToken = await response.jwtSign(jwt, {
  sub: user._id.toString(),
  expiresIn: '24h',
});

const refreshToken = await response.jwtSign(
  { sub: user._id.toString(), type: E_JWT_TYPE.REFRESH },
  { sub: user._id.toString(), expiresIn: '7d' },
);
```

Os cookies sao configurados com as seguintes opcoes:

```typescript
// application/utils/cookies.util.ts
const cookieOptions = {
  path: '/',
  secure: Env.NODE_ENV === 'production',
  sameSite: Env.NODE_ENV === 'production' ? 'none' : 'lax',
  httpOnly: true,
  ...(Env.COOKIE_DOMAIN && { domain: Env.COOKIE_DOMAIN }),
};
```

---

## Validacao

A validacao de dados e feita em duas camadas:

1. **Schema Fastify (AJV)**: validacao no nivel do framework, com `ajv-errors` para mensagens customizadas
2. **Zod**: validacao no nivel do use-case, com tipagem inferida automaticamente

```typescript
// Exemplo de validator com Zod (sign-in.validator.ts)
export const SignInBodyValidator = z.object({
  email: z
    .string({ message: 'O email e obrigatorio' })
    .email('Digite um email valido')
    .trim(),
  password: z
    .string({ message: 'A senha e obrigatoria' })
    .min(1, 'A senha e obrigatoria')
    .trim(),
});

export type SignInPayload = z.infer<typeof SignInBodyValidator>;
```

---

## Injecao de Dependencias

A DI e gerenciada pelo `fastify-decorators` atraves do `injectablesHolder`. O registro de dependencias e feito de forma explicita no arquivo `application/core/di-registry.ts`, mapeando contratos abstratos para implementacoes concretas:

```typescript
// application/core/di-registry.ts
import { injectablesHolder } from 'fastify-decorators';

export function registerDependencies(): void {
  injectablesHolder.injectService(
    UserContractRepository,
    UserMongooseRepository,
  );

  injectablesHolder.injectService(
    EmailContractService,
    NodemailerEmailService,
  );

  // ... demais registros
}
```

Essa abordagem permite trocar a implementacao do ORM ou de servicos externos alterando apenas este arquivo.

### Repositorios registrados

| Contrato | Implementacao |
|---|---|
| `EvaluationContractRepository` | `EvaluationMongooseRepository` |
| `FieldContractRepository` | `FieldMongooseRepository` |
| `MenuContractRepository` | `MenuMongooseRepository` |
| `PermissionContractRepository` | `PermissionMongooseRepository` |
| `ReactionContractRepository` | `ReactionMongooseRepository` |
| `SettingContractRepository` | `SettingMongooseRepository` |
| `StorageContractRepository` | `StorageMongooseRepository` |
| `TableContractRepository` | `TableMongooseRepository` |
| `UserContractRepository` | `UserMongooseRepository` |
| `UserGroupContractRepository` | `UserGroupMongooseRepository` |
| `ValidationTokenContractRepository` | `ValidationTokenMongooseRepository` |
| `EmailContractService` | `NodemailerEmailService` |

---

## Tratamento de Erros

### Either Pattern

O pattern Either e utilizado nos use-cases para separar fluxos de sucesso e erro sem lancamento de excecoes:

```typescript
// application/core/either.core.ts
export class Left<L, R> {
  readonly value: L;
  constructor(value: L) { this.value = value; }
  isRight(): this is Right<L, R> { return false; }
  isLeft(): this is Left<L, R> { return true; }
}

export class Right<L, R> {
  readonly value: R;
  constructor(value: R) { this.value = value; }
  isRight(): this is Right<L, R> { return true; }
  isLeft(): this is Left<L, R> { return false; }
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export const left = <L, R>(value: L): Either<L, R> => new Left(value);
export const right = <L, R>(value: R): Either<L, R> => new Right(value);
```

Uso tipico em um use-case:

```typescript
type Response = Either<HTTPException, Entity>;

async execute(payload: Payload): Promise<Response> {
  const user = await this.userRepository.findBy({ email: payload.email, exact: true });

  if (!user)
    return left(HTTPException.Unauthorized('Credenciais invalidas', 'INVALID_CREDENTIALS'));

  return right(user);
}
```

### HTTPException

A classe `HTTPException` fornece metodos estaticos para cada codigo HTTP de erro:

```typescript
// application/core/exception.core.ts
HTTPException.BadRequest('Mensagem', 'CAUSE_CODE', errors);
HTTPException.Unauthorized('Mensagem', 'CAUSE_CODE');
HTTPException.NotFound('Mensagem', 'CAUSE_CODE');
HTTPException.Forbidden('Mensagem', 'CAUSE_CODE');
HTTPException.InternalServerError('Mensagem', 'CAUSE_CODE');
// ... todos os codigos 4xx e 5xx
```

### Error Handler Global

O kernel do Fastify possui um error handler que padroniza todas as respostas de erro:

- **HTTPException**: retorna `{ message, code, cause, errors? }`
- **ZodError**: retorna `{ message: 'Invalid request', code: 400, cause: 'INVALID_PAYLOAD_FORMAT', errors }`
- **FST_ERR_VALIDATION**: retorna `{ message: 'Invalid request', code, cause: 'INVALID_PAYLOAD_FORMAT', errors }`
- **Erros genericos**: retorna `{ message: 'Internal server error', cause: 'SERVER_ERROR', code: 500 }`

---

## Documentacao da API

- **Swagger/OpenAPI**: gerado automaticamente via `@fastify/swagger`
- **Scalar**: interface grafica disponivel em `/documentation`
- **OpenAPI JSON**: disponivel no endpoint `/openapi.json`

---

## Testes

O projeto utiliza **Vitest** com duas configuracoes:

### Testes unitarios (`vitest.config.ts`)

- Inclui: `**/*.use-case.spec.ts`, `**/*.service.spec.ts`
- Setup: `test/setup.ts`
- Utiliza repositorios in-memory

### Testes e2e (`vitest.e2e.config.ts`)

- Inclui: `**/*.controller.spec.ts`
- Setup: `test/setup.e2e.ts`
- Pool: `forks` (isolamento por processo)
- MaxWorkers: 1 (sequencial)
- Timeout: 60 segundos
- Utiliza supertest para chamadas HTTP reais

---

## Build e Desenvolvimento

| Comando | Descricao |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento com `--watch` e SWC |
| `npm run build` | Compila com `tsc -b` e empacota com `tsup` |
| `npm start` | Executa o build de producao |
| `npm run seed` | Executa os seeders do banco de dados |
| `npm test` | Executa todos os testes |
| `npm run test:unit` | Executa apenas testes unitarios |
| `npm run test:e2e` | Executa apenas testes e2e |
| `npm run lint` | Lint com ESLint e auto-fix |

A configuracao do tsup:

```typescript
// tsup.config.ts
export default defineConfig({
  entry: [
    'application/**/*.ts',
    'bin/**/*.ts',
    'config/**/*.ts',
    'database/**/*.ts',
    'start/**/*.ts',
  ],
  outDir: 'build',
  target: 'es2024',
  format: ['esm'],
});
```

### ESLint (`eslint.config.js`)

O projeto utiliza **ESLint flat config** com as seguintes configuracoes:

- **Parser**: `typescript-eslint` para arquivos `.ts`, `.js`, `.mjs`, `.cjs`
- **Plugins**: `@typescript-eslint`, `eslint-plugin-import`, `eslint-plugin-prettier`
- **Regras principais**:
  - `prettier/prettier: 'error'` — formatacao via Prettier integrada ao ESLint
  - `@typescript-eslint/explicit-function-return-type: 'error'` — tipo de retorno explicito obrigatorio
  - `import/order: 'error'` — ordenacao alfabetica de imports com grupos separados (builtin/external, internal, parent, sibling)
  - `@typescript-eslint/consistent-type-imports: 'off'` — desabilitado porque `import type` remove a referencia no runtime e quebra o `reflect-metadata` usado pelo `fastify-decorators` para injecao de dependencias
- **Ignores**: `node_modules`, `build`

---

## Estrutura de Diretorios

```
backend/
├── bin/                    # Ponto de entrada da aplicacao
│   └── server.ts
├── config/                 # Configuracoes (banco, email, utilitarios)
│   ├── database.config.ts
│   ├── email.config.ts
│   └── util.config.ts
├── start/                  # Inicializacao (env, kernel Fastify)
│   ├── env.ts
│   └── kernel.ts
├── database/               # Seeders
│   └── seeders/
│       ├── main.ts
│       ├── 1720448435-permissions.seed.ts
│       ├── 1720448445-user-group.seed.ts
│       └── 1720465892-users.seed.ts
├── templates/              # Templates de email (EJS)
│   └── email/
│       ├── notification.ejs
│       └── sign-up.ejs
├── application/            # Codigo principal da aplicacao
│   ├── core/               # Nucleo: Either, HTTPException, entidades, DI, controllers loader
│   │   ├── either.core.ts
│   │   ├── exception.core.ts
│   │   ├── entity.core.ts
│   │   ├── di-registry.ts
│   │   ├── controllers.ts
│   │   ├── util.core.ts
│   │   └── row-payload-validator.core.ts
│   ├── middlewares/         # Middlewares (autenticacao, acesso a tabela)
│   │   ├── authentication.middleware.ts
│   │   └── table-access.middleware.ts
│   ├── model/              # Modelos Mongoose
│   │   ├── evaluation.model.ts
│   │   ├── field.model.ts
│   │   ├── menu.model.ts
│   │   ├── permission.model.ts
│   │   ├── reaction.model.ts
│   │   ├── setting.model.ts
│   │   ├── storage.model.ts
│   │   ├── table.model.ts
│   │   ├── user.model.ts
│   │   ├── user-group.model.ts
│   │   └── validation-token.model.ts
│   ├── repositories/       # Repositorios (contrato + implementacao Mongoose + in-memory)
│   ├── resources/           # Recursos da API (controllers, validators, use-cases, schemas)
│   ├── services/            # Servicos externos (email)
│   └── utils/               # Utilitarios (cookies, jwt)
├── _types/                  # Declaracoes TypeScript
│   ├── fastify.d.ts
│   ├── fastify-jwt.d.ts
│   └── fastify-multipart.d.ts
├── _storage/                # Armazenamento de arquivos (servido em /storage/)
├── _locales/                # Internacionalizacao
│   ├── pt-br.properties
│   └── en-us.properties
└── test/                    # Configuracao dos testes
```

---

## Padrao de Recursos (Resource Pattern)

Cada recurso da API segue um padrao consistente com os seguintes arquivos:

```
resources/<recurso>/<acao>/
├── <acao>.controller.ts     # Controller com decorators (@Controller, @POST, @GET, etc.)
├── <acao>.validator.ts      # Validacao Zod com tipagem inferida
├── <acao>.use-case.ts       # Logica de negocio com Either pattern
├── <acao>.schema.ts         # Schema Fastify/Swagger para documentacao
├── <acao>.use-case.spec.ts  # Teste unitario do use-case
└── <acao>.controller.spec.ts # Teste e2e do controller
```

### Exemplo: Sign In

**Controller** (`sign-in.controller.ts`):
```typescript
@Controller({ route: 'authentication' })
export default class {
  constructor(
    private readonly useCase: SignInUseCase = getInstanceByToken(SignInUseCase),
  ) {}

  @POST({ url: '/sign-in', options: { schema: SignInSchema } })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const payload = SignInBodyValidator.parse(request.body);
    const result = await this.useCase.execute(payload);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    const tokens = await createTokens(result.value, response);
    clearCookieTokens(response);
    setCookieTokens(response, { ...tokens });

    return response.status(200).send();
  }
}
```

**Use-case** (`sign-in.use-case.ts`):
```typescript
@Service()
export default class SignInUseCase {
  constructor(private readonly userRepository: UserContractRepository) {}

  async execute(payload: Payload): Promise<Either<HTTPException, Entity>> {
    const user = await this.userRepository.findBy({
      email: payload.email,
      exact: true,
    });

    if (!user)
      return left(HTTPException.Unauthorized('Credenciais invalidas', 'INVALID_CREDENTIALS'));

    if (user.status === E_USER_STATUS.INACTIVE)
      return left(HTTPException.Unauthorized('Usuario inativo', 'USER_INACTIVE'));

    const passwordDoesMatch = await bcrypt.compare(payload.password, user.password);

    if (!passwordDoesMatch)
      return left(HTTPException.Unauthorized('Credenciais invalidas', 'INVALID_CREDENTIALS'));

    return right(user);
  }
}
```

---

## Sistema de Roles (Papeis)

O sistema de permissoes e baseado em 4 roles hierarquicos:

| Role | Slug | Descricao |
|---|---|---|
| **Master** | `MASTER` | Acesso total ao sistema, incluindo configuracoes |
| **Administrator** | `ADMINISTRATOR` | Gerenciamento total de tabelas, campos e registros |
| **Manager** | `MANAGER` | Cria tabelas proprias e gerencia onde e proprietario/admin |
| **Registered** | `REGISTERED` | Visualiza tabelas e cria registros (respeitando visibilidade) |

As permissoes sao granulares e operam sobre tres entidades: **TABLE**, **FIELD** e **ROW**, com operacoes de **CREATE**, **UPDATE**, **REMOVE** e **VIEW** (12 permissoes no total).

---

## Recursos da API

Os principais recursos disponibilizados pela API:

- **Authentication**: sign-in, sign-up, sign-out, refresh-token, request-code, validate-code, reset-password, magic-link
- **Users**: CRUD com paginacao
- **User Groups**: CRUD com paginacao
- **Permissions**: listagem
- **Profile**: visualizar e atualizar perfil
- **Table Base**: CRUD com paginacao, lixeira (send-to-trash, remove-from-trash)
- **Table Fields**: CRUD com lixeira, add-category
- **Table Rows**: CRUD com paginacao, lixeira, bulk-trash, bulk-restore, evaluation, reaction, forum-message
- **Menu**: CRUD com paginacao
- **Pages**: visualizacao
- **Storage**: upload e delete de arquivos
- **Setting**: visualizar e atualizar configuracoes
- **Locales**: listagem e detalhes de locales
- **Tools**: clone-table
- **Health Check**: verificacao de saude da API
