# Group Endpoints — Documentação

## Visão Geral

Os endpoints dedicados `group-fields/` e `group-rows/` foram criados para isolar a lógica de operar em campos e rows **dentro** de um grupo existente. Anteriormente, essa lógica estava embutida nos módulos `table-fields/` e `table-rows/`, usando query parameters (`?group=slug`) para despachar para métodos privados internos.

Com os endpoints dedicados:

- Cada operação de grupo tem sua própria rota RESTful clara
- A lógica de grupo não polui os use-cases de tabela
- Auto-discovery de rotas funciona normalmente (mesma convenção de controllers)
- Middlewares de autenticação e permissão são reutilizados

> **Nota:** A criação/gerenciamento do campo do tipo `FIELD_GROUP` em si (quando `field.type === E_FIELD_TYPE.FIELD_GROUP`) continua em `table-fields/`. Os endpoints dedicados tratam apenas de operar **dentro** de um grupo existente.

---

## Group Fields

Endpoints para gerenciar campos dentro de um grupo.

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| `POST` | `/tables/:slug/groups/:groupSlug/fields` | Criar campo no grupo | `CREATE_FIELD` |
| `GET` | `/tables/:slug/groups/:groupSlug/fields` | Listar campos do grupo | `VIEW_FIELD` |
| `GET` | `/tables/:slug/groups/:groupSlug/fields/:fieldId` | Detalhes de um campo | `VIEW_FIELD` |
| `PUT` | `/tables/:slug/groups/:groupSlug/fields/:fieldId` | Atualizar campo no grupo | `UPDATE_FIELD` |
| `POST` | `/tables/:slug/groups/:groupSlug/fields/:fieldId/send-to-trash` | Enviar campo para lixeira | `UPDATE_FIELD` |

### Payload de criação/atualização

```json
{
  "name": "string",
  "type": "TEXT | NUMBER | DATE | ...",
  "required": false,
  "multiple": false,
  "format": null,
  "showInFilter": false,
  "showInForm": false,
  "showInDetail": false,
  "showInList": false,
  "widthInForm": 50,
  "widthInList": 10,
  "locked": false,
  "defaultValue": null,
  "relationship": null,
  "dropdown": [],
  "category": [],
  "group": null
}
```

### Response

Retorna o objeto `IField` criado/atualizado.

---

## Group Rows

Endpoints para gerenciar itens (rows) dentro de um grupo embedded em uma row da tabela pai.

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| `POST` | `/tables/:slug/rows/:rowId/groups/:groupSlug` | Criar item no grupo | `CREATE_ROW` |
| `GET` | `/tables/:slug/rows/:rowId/groups/:groupSlug` | Listar itens do grupo | `VIEW_ROW` |
| `GET` | `/tables/:slug/rows/:rowId/groups/:groupSlug/:itemId` | Detalhes de um item | `VIEW_ROW` |
| `PATCH` | `/tables/:slug/rows/:rowId/groups/:groupSlug/:itemId` | Atualizar item no grupo | `UPDATE_ROW` |
| `DELETE` | `/tables/:slug/rows/:rowId/groups/:groupSlug/:itemId` | Deletar item do grupo | `REMOVE_ROW` |

### Payload de criação/atualização

```json
{
  "campo-slug": "valor",
  "outro-campo": 123
}
```

Os campos aceitos são dinâmicos, baseados nos campos configurados no grupo (`table.groups[].fields`).

### Response

- **Create/Update/Show:** Retorna o item do grupo (objeto com `_id` e os campos)
- **List:** Retorna array de itens do grupo
- **Delete:** Retorna o item deletado

---

## Migração — O que foi removido dos módulos originais

### table-fields/

| Arquivo | O que foi removido |
|---------|-------------------|
| `create/create.use-case.ts` | Bloco `if (groupSlug)` que despachava para `addFieldToGroup()` + método privado `addFieldToGroup()` inteiro |
| `update/update.use-case.ts` | Bloco `if (groupSlug)` que despachava para `updateFieldInGroup()` + método privado `updateFieldInGroup()` inteiro |
| `send-to-trash/send-to-trash.use-case.ts` | Bloco `if (groupSlug)` que despachava para `sendFieldToTrashInGroup()` + método privado `sendFieldToTrashInGroup()` inteiro |
| `send-to-trash/send-to-trash.validator.ts` | `TableFieldSendToTrashQueryValidator` (z.object com `group`) |
| `send-to-trash/send-to-trash.controller.ts` | Parsing de `request.query` com `QueryValidator` |
| `show/show.use-case.ts` | Bloco de validação de grupo `if (groupSlug)` |
| `show/show.validator.ts` | `TableFieldShowQueryValidator` (z.object com `group`) |
| `show/show.controller.ts` | Parsing de `request.query` com `QueryValidator` |
| `remove-from-trash/remove-from-trash.use-case.ts` | Bloco `if (groupSlug)` que despachava para `removeFieldFromTrashInGroup()` + método privado `removeFieldFromTrashInGroup()` inteiro |
| `remove-from-trash/remove-from-trash.validator.ts` | `TableFieldRemoveFromTrashQueryValidator` (z.object com `group`) |
| `remove-from-trash/remove-from-trash.controller.ts` | Parsing de `request.query` com `QueryValidator` |

### table-rows/

| Arquivo | O que foi removido |
|---------|-------------------|
| `create/create.use-case.ts` | Bloco de processamento embedded `FIELD_GROUP` (filtro de `groupFields` + loop de sanitização) |
| `update/update.use-case.ts` | Bloco de processamento embedded `FIELD_GROUP` (filtro de `groupFields` + loop de preservação de `_id`) |

### O que NÃO foi modificado

- **`table-base/update/update.use-case.ts`** — Lógica de propagação de visibilidade para FIELD_GROUP tables (gerenciamento do grupo em si)
- **`table-rows/show/`, `paginated/`** — Apenas leitura/populate, sem processamento de grupo
- **Schemas/enums** que referenciam `FIELD_GROUP` — O tipo continua existindo

---

## Arquitetura

### Estrutura de diretórios

```
backend/application/resources/
├── group-fields/
│   ├── group-field-base.schema.ts    # Schema base compartilhado
│   ├── create/                        # POST /:slug/groups/:groupSlug/fields
│   ├── list/                          # GET /:slug/groups/:groupSlug/fields
│   ├── show/                          # GET /:slug/groups/:groupSlug/fields/:fieldId
│   ├── update/                        # PUT /:slug/groups/:groupSlug/fields/:fieldId
│   └── send-to-trash/                 # POST /:slug/groups/:groupSlug/fields/:fieldId/send-to-trash
├── group-rows/
│   ├── create/                        # POST /:slug/rows/:rowId/groups/:groupSlug
│   ├── list/                          # GET /:slug/rows/:rowId/groups/:groupSlug
│   ├── show/                          # GET /:slug/rows/:rowId/groups/:groupSlug/:itemId
│   ├── update/                        # PATCH /:slug/rows/:rowId/groups/:groupSlug/:itemId
│   └── delete/                        # DELETE /:slug/rows/:rowId/groups/:groupSlug/:itemId
```

### Integração

- **Auto-discovery:** Os controllers usam `@Controller` + decorators de rota (`@POST`, `@GET`, `@PUT`, `@PATCH`, `@DELETE`), seguindo o mesmo padrão do resto da aplicação. O framework `fastify-decorators` faz o registro automático.
- **Middlewares:** `AuthenticationMiddleware` e `TableAccessMiddleware` são reutilizados com as permissões adequadas.
- **Repositórios:** `TableContractRepository` e `FieldContractRepository` são injetados via constructor (DI do fastify-decorators).
- **Utilitários:** `buildSchema`, `buildTable`, `buildPopulate` do `util.core` são reutilizados para manter consistência na construção de schemas e tabelas dinâmicas.
