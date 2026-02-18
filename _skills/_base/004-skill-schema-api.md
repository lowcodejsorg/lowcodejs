# Skill: Schema API (OpenAPI Documentation)

O Schema API (arquivo `.doc.ts`) e o contrato que define a documentacao OpenAPI/Swagger de cada endpoint da aplicacao. Note que `.schema.ts` contem a validacao Zod dos dados de entrada, enquanto `.doc.ts` contem a documentacao OpenAPI do endpoint. Sao responsabilidades distintas: `.schema.ts` valida dados em runtime, `.doc.ts` documenta a API. Ele descreve parametros de entrada, formatos de resposta e codigos de status possiveis, servindo tanto como documentacao automatica quanto como camada de validacao do Fastify. Todo endpoint exposto deve ter um schema correspondente que documente completamente seu comportamento.

---

## Estrutura do Arquivo

O arquivo de documentacao OpenAPI deve estar localizado em:

```
backend/application/resources/[entity]/[action]/[action].doc.ts
```

O arquivo de validacao Zod correspondente fica em:

```
backend/application/resources/[entity]/[action]/[action].schema.ts
```

Onde `[entity]` representa o recurso (ex: `users`, `projects`) e `[action]` representa a operacao (ex: `show`, `create`, `update`, `delete`).

O arquivo exporta uma unica constante tipada como `FastifySchema` contendo:

- **tags** - agrupamento no Swagger UI
- **summary** - descricao curta do endpoint
- **description** - descricao detalhada do comportamento
- **security** - mecanismo de autenticacao
- **params / body / querystring** - dados de entrada
- **response** - todos os codigos de status possiveis com suas estruturas

## Template

```typescript
import type { FastifySchema } from 'fastify';

export const <Entity><Action>Schema: FastifySchema = {
  tags: ['<EntityPlural>'],
  summary: '<Descricao curta do endpoint>',
  description: '<Descricao detalhada do que o endpoint faz, incluindo comportamentos especiais>',
  security: [{ cookieAuth: [] }],
  // Use params para parametros de URL
  params: {
    type: 'object',
    required: ['<param_name>'],
    properties: {
      <param_name>: { type: 'string', description: '<Descricao do parametro>' },
    },
  },
  // OU use body para dados enviados no corpo da requisicao
  body: {
    type: 'object',
    required: ['<field1>', '<field2>'],
    properties: {
      <field1>: { type: 'string', description: '<Descricao>' },
      <field2>: { type: 'number', description: '<Descricao>' },
    },
  },
  response: {
    <success_code>: {
      description: '<Descricao da resposta de sucesso>',
      type: 'object',
      properties: {
        // propriedades da resposta
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Unauthorized'] },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
    },
    404: {
      description: 'Not Found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string' },
      },
    },
    500: {
      description: 'Internal Server Error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal Server Error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['INTERNAL'] },
      },
    },
  },
};
```

## Exemplo Real

```typescript
import type { FastifySchema } from 'fastify';

export const UserShowSchema: FastifySchema = {
  tags: ['Users'],
  summary: 'Get user by ID',
  description: 'Retrieves a specific user by their ID (password excluded from response)',
  security: [{ cookieAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'User ID' },
    },
  },
  response: {
    200: {
      description: 'User details',
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        group: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Unauthorized'] },
        code: { type: 'number', enum: [401] },
        cause: { type: 'string', enum: ['AUTHENTICATION_REQUIRED'] },
      },
    },
    404: {
      description: 'User not found',
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', enum: [404] },
        cause: { type: 'string', enum: ['USER_NOT_FOUND'] },
      },
    },
    500: {
      description: 'Internal Server Error',
      type: 'object',
      properties: {
        message: { type: 'string', enum: ['Internal Server Error'] },
        code: { type: 'number', enum: [500] },
        cause: { type: 'string', enum: ['INTERNAL'] },
      },
    },
  },
};
```

Neste exemplo, o schema de `UserShow`:

1. Agrupa o endpoint sob a tag `Users` no Swagger UI.
2. Define `summary` conciso e `description` detalhada explicando que a password e excluida.
3. Declara autenticacao obrigatoria via `cookieAuth`.
4. Especifica o parametro `id` como obrigatorio na URL.
5. Documenta quatro codigos de resposta: 200 (sucesso com detalhes do usuario), 401 (nao autenticado), 404 (usuario nao encontrado) e 500 (erro interno).
6. Usa `enum` para valores fixos como mensagens de erro e codigos.

## Regras e Convencoes

1. **Sempre tipar com `FastifySchema`.** A constante exportada deve ser tipada como `FastifySchema` importada de `fastify`. Isso garante autocomplete e validacao em tempo de desenvolvimento.

2. **`tags` serve para agrupamento no Swagger.** Use o nome da entidade no plural e em ingles (ex: `['Users']`, `['Projects']`). Isso organiza os endpoints por recurso na interface do Swagger UI.

3. **`summary` deve ser curto e objetivo.** Maximo de uma linha, descrevendo a acao do endpoint (ex: `'Get user by ID'`, `'Create new project'`). Funciona como titulo do endpoint na documentacao.

4. **`description` deve ser detalhada.** Inclua comportamentos especiais, campos omitidos, efeitos colaterais e qualquer informacao relevante para quem consome a API (ex: `'password excluded from response'`).

5. **`security` com `cookieAuth`.** Endpoints autenticados devem declarar `security: [{ cookieAuth: [] }]`. Para endpoints publicos, omita a propriedade `security`.

6. **Documentar TODOS os status codes possiveis.** Todo schema deve incluir no minimo:
   - Status de sucesso (200, 201, 204)
   - 401 para endpoints autenticados
   - 404 quando aplicavel (busca por ID, por exemplo)
   - 500 para erro interno

7. **Use `enum` para valores fixos.** Mensagens de erro, codigos de status e causes que sao constantes devem ser declarados com `enum` (ex: `enum: ['Unauthorized']`). Isso documenta exatamente o que a API retorna.

8. **`params` para parametros de URL, `body` para corpo da requisicao, `querystring` para query parameters.** Escolha a propriedade correta conforme o tipo de dado de entrada.

9. **Campos `required`** devem listar todas as propriedades obrigatorias em um array de strings dentro do objeto de `params`, `body` ou `querystring`.

10. **Use `format` para tipos especificos.** Campos de data devem usar `format: 'date-time'`, emails podem usar `format: 'email'`, etc. Isso melhora a documentacao e pode ativar validacoes adicionais.

11. **Objetos aninhados** devem ser declarados com `type: 'object'` e suas proprias `properties`, como demonstrado no campo `group` do exemplo.

12. **A constante segue o padrao de nomenclatura `<Entity><Action>Schema`.** Exemplos: `UserShowSchema`, `ProjectCreateSchema`, `TaskUpdateSchema`.

## Checklist

- [ ] Arquivo localizado em `backend/application/resources/[entity]/[action]/[action].schema.ts`
- [ ] Constante exportada com tipo `FastifySchema`
- [ ] Nomenclatura segue padrao `<Entity><Action>Schema`
- [ ] `tags` com nome da entidade no plural
- [ ] `summary` curto e descritivo (uma linha)
- [ ] `description` detalhada com comportamentos especiais
- [ ] `security: [{ cookieAuth: [] }]` presente para endpoints autenticados
- [ ] `params`, `body` ou `querystring` definidos conforme o tipo de entrada
- [ ] `required` listando todos os campos obrigatorios
- [ ] Response 200/201/204 documentada com todas as propriedades de retorno
- [ ] Response 401 documentada para endpoints autenticados
- [ ] Response 404 documentada quando aplicavel
- [ ] Response 500 documentada para erro interno
- [ ] `enum` usado para valores fixos (mensagens de erro, codigos, causes)
- [ ] `format` usado para tipos especificos (`date-time`, `email`, etc.)
- [ ] Objetos aninhados com `type: 'object'` e `properties` proprias

## Erros Comuns

1. **Nao documentar todos os status codes.** Omitir respostas de erro (401, 404, 500) deixa a documentacao incompleta e dificulta o trabalho de quem consome a API. Sempre mapeie todos os cenarios possiveis do use case.

2. **Usar `summary` muito longo.** O summary deve ser uma frase curta que funciona como titulo. Detalhes adicionais pertencem ao campo `description`.

3. **Esquecer o campo `security`.** Sem declarar `security: [{ cookieAuth: [] }]`, o Swagger UI nao mostra o cadeado no endpoint e consumidores da API podem nao saber que autenticacao e necessaria.

4. **Nao usar `enum` para valores constantes.** Retornar `type: 'string'` quando o valor e sempre `'Unauthorized'` e impreciso. Use `enum: ['Unauthorized']` para documentar o valor exato.

5. **Deixar `required` vazio ou omiti-lo.** Campos obrigatorios nos parametros de entrada devem ser listados explicitamente no array `required`. Omitir isso faz o Swagger tratar todos os campos como opcionais.

6. **Divergencia entre schema e response real.** O schema deve refletir exatamente o que o controller retorna. Se o controller omite `password` da response, o schema nao deve incluir `password` nas propriedades de sucesso.

7. **Tipos incorretos em propriedades.** Usar `type: 'string'` para um campo que e numero ou `type: 'number'` para um ID que e string gera inconsistencias na documentacao e pode causar erros de validacao no Fastify.

8. **Esquecer de documentar objetos aninhados.** Campos como `group` que sao objetos precisam ter `type: 'object'` e suas proprias `properties` declaradas. Declarar apenas `group: { type: 'object' }` sem properties e insuficiente.

---

> **Ver tambem:** [002-skill-controller.md](./002-skill-controller.md) | [014-skill-kernel.md](./014-skill-kernel.md)
