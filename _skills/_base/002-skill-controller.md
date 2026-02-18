# Skill: Controller

O Controller e a camada responsavel por receber requests HTTP, delegar o processamento para o UseCase apropriado e retornar a response adequada. Ele atua como ponto de entrada da aplicacao, conectando rotas HTTP a logica de negocio sem conter regras de dominio. Utiliza decorators do `fastify-decorators` para declarar rotas de forma limpa e injecao de dependencia via `getInstanceByToken`.

---

## Estrutura do Arquivo

O arquivo de controller deve estar localizado em:

```
backend/application/resources/[entity]/[action]/[action].controller.ts
```

Onde `[entity]` representa o recurso (ex: `users`, `projects`) e `[action]` representa a operacao (ex: `show`, `create`, `update`, `delete`).

Dependencias tipicas de um controller:

- **FastifyRequest / FastifyReply** - tipos do Fastify para request e response
- **Controller, GET, POST, PUT, DELETE** - decorators do `fastify-decorators`
- **getInstanceByToken** - funcao de injecao de dependencia
- **Middleware** - funcoes de middleware (ex: `AuthenticationMiddleware`)
- **Schema** - schema da rota para documentacao OpenAPI
- **UseCase** - classe que contem a logica de negocio
- **Schema** - parser de validacao dos dados de entrada (Zod)
- **Doc** - schema de documentacao OpenAPI (`.doc.ts`)

## Template

```typescript
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, <HTTP_METHOD>, getInstanceByToken } from 'fastify-decorators';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { <Entity><Action>Schema } from './<action>.schema';
import <Entity><Action>UseCase from './<action>.use-case';
import { <Entity><Action><Param|Body>Schema } from './<action>.schema';
import { <Entity><Action>Doc } from './<action>.doc';

@Controller({ route: '/<entities>' })
export default class {
  constructor(
    private readonly useCase: <Entity><Action>UseCase = getInstanceByToken(<Entity><Action>UseCase),
  ) {}

  @<HTTP_METHOD>({
    url: '/<url-segment>',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: <Entity><Action>Schema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const data = <Entity><Action><Param|Body>Validator.parse(request.<params|body>);
    const result = await this.useCase.execute(data);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(<status_code>).send(result.value);
  }
}
```

## Exemplo Real

```typescript
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { UserShowSchema } from './show.schema';
import UserShowUseCase from './show.use-case';
import { UserShowParamSchema } from './show.schema';
import { UserShowDoc } from './show.doc';

@Controller({ route: '/users' })
export default class {
  constructor(
    private readonly useCase: UserShowUseCase = getInstanceByToken(UserShowUseCase),
  ) {}

  @GET({
    url: '/:id',
    options: {
      onRequest: [AuthenticationMiddleware({ optional: false })],
      schema: UserShowSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const params = UserShowParamSchema.parse(request.params);
    const result = await this.useCase.execute(params);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send({ ...result?.value, password: undefined });
  }
}
```

Neste exemplo, o controller de `UserShow`:

1. Define a rota base `/users` via `@Controller`.
2. Registra o endpoint `GET /:id` com middleware de autenticacao obrigatoria.
3. Faz parse dos parametros da URL usando `UserShowParamSchema`.
4. Delega a execucao para `UserShowUseCase`.
5. Trata o retorno Either: erro com status code dinamico ou sucesso com status 200 (omitindo o campo `password`).

## Regras e Convencoes

1. **`@Controller({ route })`** define a rota base do recurso. Todas as rotas declaradas dentro da classe serao prefixadas com esse valor.

2. **HTTP method decorators** (`@GET`, `@POST`, `@PUT`, `@DELETE`) devem ser usados para declarar o metodo HTTP e a URL complementar do endpoint.

3. **Injecao de dependencia** deve ser feita exclusivamente via `getInstanceByToken` no constructor. Nunca instancie use cases manualmente com `new`.

4. **NUNCA coloque logica de negocio no controller.** O controller deve apenas: validar entrada, chamar o use case e formatar a resposta. Qualquer regra de dominio pertence ao use case.

5. **Sempre use `schema.parse()`** para validar e tipar os dados de entrada (`request.params`, `request.body`, `request.query`). Nunca acesse dados do request diretamente sem validacao.

6. **Trate o retorno Either corretamente:**
   - `result.isLeft()` indica erro - extraia `message`, `code` e `cause` para a response.
   - `result.isRight()` indica sucesso (o caminho implicito quando `isLeft()` e falso) - retorne os dados com o status code adequado.

7. **`onRequest`** e o array de middlewares executados antes do handler. Use para autenticacao, autorizacao e validacoes previas.

8. **`schema`** referencia o objeto FastifySchema que documenta o endpoint no Swagger/OpenAPI. Todo endpoint deve ter um schema associado.

9. **A classe controller e exportada como `export default class`** (classe anonima). Nao nomeie a classe.

10. **O metodo handler deve sempre se chamar `handle`** e ter a assinatura `async handle(request: FastifyRequest, response: FastifyReply): Promise<void>`.

## Checklist

- [ ] Arquivo localizado em `backend/application/resources/[entity]/[action]/[action].controller.ts`
- [ ] `@Controller({ route })` com rota base correta
- [ ] HTTP method decorator adequado (`@GET`, `@POST`, `@PUT`, `@DELETE`)
- [ ] `getInstanceByToken` usado para injecao do use case
- [ ] Middleware de autenticacao configurado no `onRequest` (com `optional` correto)
- [ ] Schema importado e referenciado na opcao `schema`
- [ ] Schema Zod usado para parse de `request.params`, `request.body` ou `request.query`
- [ ] Retorno Either tratado: `isLeft()` para erro, caminho normal para sucesso
- [ ] Nenhuma logica de negocio presente no controller
- [ ] Response de erro com `message`, `code` e `cause`
- [ ] Response de sucesso com status code correto
- [ ] Campos sensiveis removidos da response (ex: `password: undefined`)
- [ ] Classe exportada como `export default class` (anonima)
- [ ] Metodo handler nomeado como `handle`

## Erros Comuns

1. **Colocar logica de negocio no controller.** Validacoes complexas, queries ao banco de dados ou transformacoes de dados devem estar no use case, nunca no controller.

2. **Acessar `request.params` ou `request.body` sem schema.** Sempre passe os dados pelo `Schema.parse()` para garantir tipagem e validacao. Dados nao validados podem causar erros silenciosos em runtime.

3. **Instanciar o use case com `new` ao inves de `getInstanceByToken`.** Isso quebra o ciclo de vida gerenciado pelo container de injecao de dependencia e pode causar problemas com singletons e dependencias compartilhadas.

4. **Esquecer de tratar o `isLeft()` do Either.** Se o retorno de erro nao for tratado, o controller pode tentar acessar propriedades de sucesso em um objeto de erro, resultando em respostas incorretas ou excecoes.

5. **Retornar status code fixo sem considerar o erro.** O `error.code` vindo do use case ja carrega o status HTTP correto (400, 401, 404, 500). Nunca force um status code generico como 500 para todos os erros.

6. **Omitir o `schema` na configuracao da rota.** Sem schema, o endpoint nao aparece corretamente na documentacao Swagger e perde a validacao automatica do Fastify.

7. **Esquecer de configurar o middleware `onRequest`.** Endpoints sem autenticacao ficam expostos. Quando a rota e publica, use `AuthenticationMiddleware({ optional: true })` ao inves de omitir o middleware.

8. **Nomear a classe controller.** A convencao do projeto e usar `export default class` sem nome. Classes nomeadas fogem do padrao estabelecido.

---

> **Ver tambem:** [001-skill-use-case.md](./001-skill-use-case.md) | [003-skill-validator.md](./003-skill-validator.md) | [004-skill-schema-api.md](./004-skill-schema-api.md) | [007-skill-middleware.md](./007-skill-middleware.md)

> **Nota:** Os arquivos `.doc.ts` definem a documentacao OpenAPI/Swagger de cada endpoint (ver [004-skill-schema-api.md](./004-skill-schema-api.md)).
