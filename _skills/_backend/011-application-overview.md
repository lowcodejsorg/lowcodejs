# Visao Geral - Camada Application

A camada `application/` contem toda a logica de negocio do backend LowCodeJS. Trata-se de uma aplicacao construida com **Fastify + TypeScript + Mongoose**, organizada em modulos com responsabilidades bem definidas.

## Estrutura de Diretorios

```
backend/application/
├── core/                  # Nucleo da aplicacao
│   ├── entity.core.ts     # Tipos, enums e entidades TypeScript
│   ├── either.core.ts     # Padrao Either (Left/Right) para tratamento de erros
│   ├── exception.core.ts  # HTTPException com factory methods para todos os codigos HTTP
│   ├── di-registry.ts     # Registro de dependencias (DI container)
│   ├── controllers.ts     # Auto-descoberta e carregamento de controllers
│   ├── util.core.ts       # Funcoes utilitarias (buildSchema, buildTable, buildQuery, etc.)
│   ├── row-payload-validator.core.ts  # Validacao de payload de linhas
│   └── table/             # Subdiretorio para execucao de scripts em hooks
│       ├── handler.ts     # Ponto de entrada para execucao de scripts
│       ├── executor.ts    # Executor de codigo em sandbox VM
│       ├── sandbox.ts     # Construcao do ambiente sandbox
│       ├── field-resolver.ts  # Resolucao de valores de campos
│       └── types.ts       # Tipos para o executor de scripts
│
├── middlewares/            # Middlewares Fastify
│   ├── authentication.middleware.ts   # Autenticacao via JWT/cookies
│   └── table-access.middleware.ts     # Controle de acesso a tabelas
│
├── model/                 # Modelos Mongoose (11 modelos)
│   ├── user.model.ts
│   ├── user-group.model.ts
│   ├── permission.model.ts
│   ├── table.model.ts
│   ├── field.model.ts
│   ├── storage.model.ts
│   ├── menu.model.ts
│   ├── reaction.model.ts
│   ├── evaluation.model.ts
│   ├── validation-token.model.ts
│   └── setting.model.ts
│
├── repositories/          # Camada de repositorios (11 repositorios)
│   ├── user/              # Contrato + Mongoose + In-memory
│   ├── user-group/
│   ├── permission/
│   ├── table/
│   ├── field/
│   ├── storage/
│   ├── menu/
│   ├── reaction/
│   ├── evaluation/
│   ├── setting/
│   └── validation-token/
│
├── resources/             # Endpoints da API organizados por feature
│   └── (*.controller.ts)  # Controllers auto-descobertos pelo loadControllers()
│
├── services/              # Servicos de infraestrutura
│   ├── storage.service.ts            # Upload e gerenciamento de arquivos
│   └── email/
│       ├── email-contract.service.ts        # Contrato abstrato
│       ├── nodemailer-email.service.ts      # Implementacao com Nodemailer
│       └── in-memory-email.service.ts       # Implementacao para testes
│
└── utils/                 # Utilitarios
    ├── jwt.util.ts        # Criacao de tokens JWT (access + refresh)
    └── cookies.util.ts    # Gerenciamento de cookies HTTP
```

## Padrao Arquitetural

A aplicacao segue um padrao em camadas com inversao de dependencias:

1. **Contratos abstratos** (`abstract class`) definem as interfaces dos repositorios
2. **Implementacoes Mongoose** satisfazem os contratos para producao
3. **Implementacoes In-Memory** satisfazem os contratos para testes
4. **Registro DI** (`di-registry.ts`) conecta contratos a implementacoes via `fastify-decorators`

```typescript
// Exemplo do fluxo de dependencia
import { injectablesHolder } from 'fastify-decorators';

// Contrato abstrato
export abstract class UserContractRepository {
  abstract create(payload: UserCreatePayload): Promise<IUser>;
  abstract findBy(payload: UserFindByPayload): Promise<IUser | null>;
  // ...
}

// Registro no container DI
injectablesHolder.injectService(UserContractRepository, UserMongooseRepository);
```

## Fluxo de uma Requisicao

1. Requisicao HTTP chega ao Fastify
2. Middlewares sao executados (`AuthenticationMiddleware`, `TableAccessMiddleware`)
3. Controller processa a requisicao via use case
4. Use case utiliza repositorios (injetados via DI) para acessar dados
5. Resposta e retornada usando o padrao `Either<HTTPException, T>`

## Tecnologias Principais

| Tecnologia | Uso |
|---|---|
| Fastify | Framework HTTP |
| fastify-decorators | Decorators para DI e controllers |
| Mongoose | ODM para MongoDB |
| TypeScript | Linguagem e tipagem estatica |
| sharp | Processamento de imagens |
| nodemailer | Envio de emails |
| jsonwebtoken (RS256) | Autenticacao JWT |
| zod | Validacao de schemas |
| node:vm | Execucao segura de scripts de usuario |
