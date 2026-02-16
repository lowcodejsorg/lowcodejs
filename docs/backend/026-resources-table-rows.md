# Recurso: Table Rows

O recurso **Table Rows** gerencia os registros (linhas) de cada tabela dinamica do sistema. Cada tabela possui seu proprio modelo Mongoose construido em tempo de execucao via `buildTable()`, com schema baseado nos campos configurados pelo usuario.

---

## Endpoints

| Metodo | Rota | Auth | Permissao | Descricao |
|--------|------|------|-----------|-----------|
| GET | `/tables/:slug/rows/paginated` | Sim/Opcional | VIEW_ROW | Lista paginada de rows |
| GET | `/tables/:slug/rows/:_id` | Sim/Opcional | VIEW_ROW | Detalhes de um row |
| POST | `/tables/:slug/rows` | Sim/Opcional | CREATE_ROW | Criar row |
| PUT | `/tables/:slug/rows/:_id` | Sim | UPDATE_ROW | Atualizar row |
| PATCH | `/tables/:slug/rows/:_id/trash` | Sim | UPDATE_ROW | Enviar para lixeira |
| PATCH | `/tables/:slug/rows/:_id/restore` | Sim | UPDATE_ROW | Restaurar da lixeira |
| DELETE | `/tables/:slug/rows/:_id` | Sim | REMOVE_ROW | Deletar permanentemente |
| POST | `/tables/:slug/rows/:_id/reaction` | Sim | UPDATE_ROW | Adicionar/atualizar reacao |
| POST | `/tables/:slug/rows/:_id/evaluation` | Sim | UPDATE_ROW | Adicionar/atualizar avaliacao |
| PATCH | `/tables/:slug/rows/bulk-trash` | Sim | UPDATE_ROW | Enviar multiplos para lixeira |
| PATCH | `/tables/:slug/rows/bulk-restore` | Sim | UPDATE_ROW | Restaurar multiplos |
| POST | `/tables/:slug/rows/:_id/forum/messages` | Sim | VIEW_ROW | Criar mensagem no forum |
| PUT | `/tables/:slug/rows/:_id/forum/messages/:messageId` | Sim | VIEW_ROW | Atualizar mensagem no forum |
| DELETE | `/tables/:slug/rows/:_id/forum/messages/:messageId` | Sim | VIEW_ROW | Deletar mensagem no forum |

> **Autenticacao opcional**: Os endpoints de listagem (GET) e criacao (POST) possuem autenticacao opcional. Tabelas com colaboracao aberta (PUBLIC/FORM) permitem acesso sem autenticacao.

---

## Arquitetura

Cada endpoint segue o padrao `controller -> validator -> use-case -> schema`:

```
resources/table-rows/
  paginated/        # GET /tables/:slug/rows/paginated
  show/             # GET /tables/:slug/rows/:_id
  create/           # POST /tables/:slug/rows
  update/           # PUT /tables/:slug/rows/:_id
  send-to-trash/    # PATCH /tables/:slug/rows/:_id/trash
  remove-from-trash/# PATCH /tables/:slug/rows/:_id/restore
  delete/           # DELETE /tables/:slug/rows/:_id
  reaction/         # POST /tables/:slug/rows/:_id/reaction
  evaluation/       # POST /tables/:slug/rows/:_id/evaluation
  bulk-trash/       # PATCH /tables/:slug/rows/bulk-trash
  bulk-restore/     # PATCH /tables/:slug/rows/bulk-restore
  forum-message/    # POST/PUT/DELETE /tables/:slug/rows/:_id/forum/messages
```

---

## Modelo Dinamico (`buildTable`)

Diferente dos demais recursos, os rows nao possuem um modelo Mongoose fixo. O modelo e construido em tempo de execucao pela funcao `buildTable()` com base no campo `_schema` da tabela:

```typescript
const table = await this.tableRepository.findBy({ slug: payload.slug, exact: true });
const model = await buildTable(table);
```

A funcao `buildTable()`:

1. Le o `_schema` da tabela (gerado a partir dos campos configurados)
2. Converte campos do tipo `Embedded` (FIELD_GROUP) em subdocument schemas do Mongoose
3. Registra virtual populates para relacionamentos reversos (tabelas que apontam para esta)
4. Registra middlewares `beforeSave`/`afterSave` se configurados na tabela
5. Cria a collection no MongoDB se nao existir

---

## Listagem Paginada

**`GET /tables/:slug/rows/paginated`**

### Query Parameters

| Parametro | Tipo | Padrao | Descricao |
|-----------|------|--------|-----------|
| `page` | number | 1 | Numero da pagina |
| `perPage` | number | 50 | Itens por pagina (max 100) |
| `search` | string | - | Termo de busca global |
| `trashed` | string | "false" | Incluir itens na lixeira |
| `public` | string | "false" | Filtrar apenas itens publicos |
| `{field-slug}` | string | - | Filtro dinamico por campo |
| `{field-slug}-initial` | string | - | Filtro de data: inicio |
| `{field-slug}-final` | string | - | Filtro de data: fim |
| `order-{field-slug}` | string | - | Ordenacao (asc/desc) |

### Resposta de Sucesso (200)

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nome": "Joao Silva",
      "email": "joao@email.com",
      "trashed": false,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "perPage": 50,
    "page": 1,
    "lastPage": 1,
    "firstPage": 1
  }
}
```

### Construcao de Queries (`buildQuery`)

A funcao `buildQuery()` constroi a query MongoDB de forma dinamica com base nos campos da tabela:

- **TEXT_SHORT / TEXT_LONG**: busca com regex accent-insensitive via `normalize()`
- **RELATIONSHIP / DROPDOWN / CATEGORY / USER / CREATOR**: filtro `$in` com valores separados por virgula
- **DATE**: filtro de range com `$gte` (initial) e `$lte` (final)
- **FIELD_GROUP**: busca em campos embedded usando dot notation (ex: `mensagens.texto`)
- **Relacionamentos reversos**: filtro via lookup na collection de origem

### Busca Accent-Insensitive (`normalize`)

A funcao `normalize()` substitui caracteres por classes de caracteres regex, permitindo buscas que ignoram acentos:

```typescript
normalize("joao")
// Resultado: "[jJ][oóòôõö][aáàâãä][oóòôõö]"
```

### Populate Recursivo (`buildPopulate`)

A funcao `buildPopulate()` gera a configuracao de populate do Mongoose para todos os campos relacionais:

| Tipo de Campo | Comportamento |
|---------------|---------------|
| FILE | Populate com modelo `Storage` |
| USER / CREATOR | Populate com modelo `User` (select: name, email, _id) |
| RELATIONSHIP | Populate recursivo com modelo da tabela referenciada |
| REACTION | Populate com nested populate do `user` |
| EVALUATION | Populate com nested populate do `user` |
| FIELD_GROUP (embedded) | Populate de campos USER e FILE internos via dot notation |
| Virtual (reverso) | Populate de relacionamentos reversos com transform para remover campo circular |

---

## Detalhes de um Row

**`GET /tables/:slug/rows/:_id`**

### Parametros

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `slug` | string | Slug da tabela |
| `_id` | string | ID do row |

### Resposta de Sucesso (200)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nome": "Joao Silva",
  "email": "joao@email.com",
  "foto": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "url": "/storage/12345678.webp",
      "filename": "12345678.webp",
      "mimetype": "image/webp"
    }
  ],
  "creator": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Admin",
    "email": "admin@email.com"
  },
  "trashed": false,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 404 | TABLE_NOT_FOUND | Tabela nao encontrada |
| 404 | ROW_NOT_FOUND | Registro nao encontrado |
| 500 | GET_ROW_TABLE_BY_ID_ERROR | Erro interno |

---

## Criar Row

**`POST /tables/:slug/rows`**

### Body

O body e dinamico, com chaves correspondendo aos slugs dos campos da tabela. Os tipos aceitos dependem do tipo de cada campo:

| Tipo de Campo | Tipo do Valor | Exemplo |
|---------------|---------------|---------|
| TEXT_SHORT | string | `"Joao"` |
| TEXT_LONG | string | `"<p>Descricao longa</p>"` |
| DROPDOWN | string[] | `["opcao1", "opcao2"]` |
| FILE | string[] (IDs) | `["507f1f77bcf86cd799439011"]` |
| DATE | string (ISO 8601) | `"2025-01-15T10:30:00.000Z"` |
| RELATIONSHIP | string[] (IDs) | `["507f1f77bcf86cd799439011"]` |
| CATEGORY | string[] | `["tag1", "tag2"]` |
| USER | string[] (IDs) | `["507f1f77bcf86cd799439011"]` |
| FIELD_GROUP | object[] | `[{ "texto": "msg", "autor": ["id"] }]` |

### Validacao de Payload (`validateRowPayload`)

A funcao `validateRowPayload()` valida cada campo do payload com base na configuracao da tabela:

- Verifica campos obrigatorios (`required`)
- Valida tipos (string, array, object)
- Valida formatos (email, URL, inteiro, decimal) para TEXT_SHORT
- Valida ObjectIDs para FILE, RELATIONSHIP e USER
- Valida datas ISO 8601 para DATE
- Valida recursivamente campos dentro de FIELD_GROUP
- Pula campos nativos (system-managed) e campos REACTION/EVALUATION

### Processamento de FIELD_GROUP

Campos do tipo FIELD_GROUP sao tratados como embedded documents. Na criacao, o `_id` interno de cada item e removido (sanitizado):

```typescript
payload[groupSlug] = groupData.map(({ _id, ...rest }) => rest);
```

### Resposta de Sucesso (201)

Retorna o row criado com todos os relacionamentos populados.

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 400 | INVALID_PAYLOAD_FORMAT | Erro de validacao por campo (retorna `errors` detalhado) |
| 404 | TABLE_NOT_FOUND | Tabela nao encontrada |
| 500 | CREATE_ROW_ERROR | Erro interno |

---

## Atualizar Row

**`PUT /tables/:slug/rows/:_id`**

Funciona de forma semelhante a criacao, com a diferenca de que a validacao usa `skipMissing: true`, ou seja, campos ausentes no payload nao sao validados como obrigatorios. O row e atualizado com merge dos dados existentes + novos.

### Codigos de Erro

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 400 | INVALID_PAYLOAD_FORMAT | Erro de validacao |
| 404 | TABLE_NOT_FOUND | Tabela nao encontrada |
| 404 | ROW_NOT_FOUND | Registro nao encontrado |
| 500 | UPDATE_ROW_TABLE_ERROR | Erro interno |

---

## Lixeira (Soft Delete)

### Enviar para Lixeira

**`PATCH /tables/:slug/rows/:_id/trash`**

Define `trashed: true` e `trashedAt: new Date()` no registro. Retorna erro 409 se o row ja estiver na lixeira.

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 404 | TABLE_NOT_FOUND | Tabela nao encontrada |
| 404 | ROW_NOT_FOUND | Registro nao encontrado |
| 409 | ALREADY_TRASHED | Row ja esta na lixeira |
| 500 | SEND_ROW_TABLE_TO_TRASH_ERROR | Erro interno |

### Restaurar da Lixeira

**`PATCH /tables/:slug/rows/:_id/restore`**

Define `trashed: false` e `trashedAt: null` no registro.

### Deletar Permanentemente

**`DELETE /tables/:slug/rows/:_id`**

Remove o registro permanentemente do banco de dados via `findOneAndDelete`.

---

## Operacoes em Lote (Bulk)

### Enviar Multiplos para Lixeira

**`PATCH /tables/:slug/rows/bulk-trash`**

```json
{
  "ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

Usa `updateMany` com filtro `{ _id: { $in: ids }, trashed: false }` para enviar multiplos rows para a lixeira de uma vez. Retorna o numero de registros modificados:

```json
{
  "modified": 2
}
```

### Restaurar Multiplos

**`PATCH /tables/:slug/rows/bulk-restore`**

```json
{
  "ids": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

Usa `updateMany` com filtro `{ _id: { $in: ids }, trashed: true }` para restaurar multiplos rows. Retorna o numero de registros modificados.

---

## Reacoes

**`POST /tables/:slug/rows/:_id/reaction`**

Permite que um usuario adicione ou atualize uma reacao em um campo do tipo REACTION de um row.

### Body

```json
{
  "type": "LIKE",
  "field": "curtidas"
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `type` | string | Tipo da reacao: `LIKE` ou `UNLIKE` |
| `field` | string | Slug do campo de reacao no row |

### Comportamento

1. Busca a tabela e o row
2. Busca ou cria um registro na collection `Reaction` para o usuario
3. Se a reacao ja existir, atualiza o tipo
4. Se o ID da reacao ainda nao estiver no array do campo, adiciona
5. Retorna o row atualizado com relacionamentos populados

---

## Avaliacoes

**`POST /tables/:slug/rows/:_id/evaluation`**

Permite que um usuario adicione ou atualize uma avaliacao numerica em um campo do tipo EVALUATION de um row.

### Body

```json
{
  "value": 5,
  "field": "nota"
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `value` | number | Valor numerico da avaliacao |
| `field` | string | Slug do campo de avaliacao no row |

### Comportamento

Funciona de maneira analoga as reacoes: busca ou cria um registro na collection `Evaluation` para o usuario, atualiza o valor se ja existir, e adiciona o ID ao array do campo se necessario.

---

## Mensagens de Forum

O sistema de forum permite que tabelas com estilo `FORUM` gerenciem mensagens dentro de rows. Cada row representa um canal, e as mensagens sao armazenadas como embedded documents em um campo do tipo FIELD_GROUP.

### Criar Mensagem

**`POST /tables/:slug/rows/:_id/forum/messages`**

```json
{
  "text": "<p>Minha mensagem</p>",
  "attachments": ["507f1f77bcf86cd799439011"],
  "mentions": ["507f1f77bcf86cd799439012"],
  "replyTo": "uuid-da-mensagem-original"
}
```

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `text` | string | Nao* | Texto da mensagem (HTML permitido) |
| `attachments` | string[] | Nao* | IDs de arquivos anexados |
| `mentions` | string[] | Nao | IDs de usuarios mencionados |
| `replyTo` | string/null | Nao | UUID da mensagem sendo respondida |

> *Pelo menos `text` ou `attachments` deve conter conteudo.

### Atualizar Mensagem

**`PUT /tables/:slug/rows/:_id/forum/messages/:messageId`**

Aceita os mesmos campos do body de criacao. Apenas o autor da mensagem pode editar.

### Deletar Mensagem

**`DELETE /tables/:slug/rows/:_id/forum/messages/:messageId`**

Apenas o autor da mensagem pode deletar.

### Comportamento do Forum

- Valida que a tabela possui estilo `FORUM`
- Resolve a configuracao do forum (`resolveForumConfig`) mapeando slugs de campos do grupo de mensagens
- Verifica acesso ao canal: criador tem acesso total; canais privados verificam campo `membros`
- Valida que a mensagem possui conteudo (texto sem tags HTML ou anexos)
- Gera um UUID unico para cada mensagem via `randomUUID()`
- Resolve emails dos usuarios mencionados e envia notificacao por email
- Rastreia mencoes ja notificadas para evitar notificacoes duplicadas em edicoes

### Codigos de Erro (Forum)

| Codigo | Cause | Descricao |
|--------|-------|-----------|
| 400 | FORUM_TABLE_REQUIRED | Tabela nao e do tipo FORUM |
| 400 | FORUM_MESSAGES_FIELD_NOT_FOUND | Campo de mensagens nao encontrado |
| 400 | FORUM_MESSAGE_EMPTY | Mensagem sem conteudo |
| 403 | FORUM_CHANNEL_ACCESS_DENIED | Usuario sem acesso ao canal |
| 403 | FORUM_MESSAGE_AUTHOR_REQUIRED | Apenas o autor pode editar/deletar |
| 404 | TABLE_NOT_FOUND | Tabela nao encontrada |
| 404 | ROW_NOT_FOUND | Registro nao encontrado |
| 404 | FORUM_MESSAGE_NOT_FOUND | Mensagem nao encontrada |
| 500 | FORUM_MESSAGE_CREATE_ERROR | Erro ao criar mensagem |
| 500 | FORUM_MESSAGE_UPDATE_ERROR | Erro ao atualizar mensagem |
| 500 | FORUM_MESSAGE_DELETE_ERROR | Erro ao deletar mensagem |

---

## Middlewares

### AuthenticationMiddleware

Configurado com `optional: true` nos endpoints de listagem e criacao, permitindo acesso anonimo a tabelas publicas. Configurado com `optional: false` nos demais endpoints.

### TableAccessMiddleware

Verifica se o usuario possui a permissao necessaria para a operacao na tabela. As permissoes verificadas sao:

| Permissao | Endpoints |
|-----------|-----------|
| `VIEW_ROW` | Listagem paginada, detalhes, forum messages |
| `CREATE_ROW` | Criacao |
| `UPDATE_ROW` | Atualizacao, lixeira, restaurar, bulk, reacao, avaliacao |
| `REMOVE_ROW` | Deletar permanentemente |

---

## Fluxo Completo de uma Requisicao

```
Request
  -> AuthenticationMiddleware (verifica JWT / opcional)
  -> TableAccessMiddleware (verifica permissao na tabela)
  -> Controller (parseia params/query/body com Zod)
  -> Use Case (logica de negocio com Either pattern)
    -> TableRepository.findBy (busca tabela por slug)
    -> buildTable (constroi modelo Mongoose dinamico)
    -> buildQuery / buildPopulate / buildOrder (filtros e populate)
    -> Operacao MongoDB (find, create, update, delete)
  -> Controller (retorna resultado ou erro HTTP)
```
