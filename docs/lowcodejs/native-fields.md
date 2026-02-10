# Campos Nativos

Campos nativos sao campos criados automaticamente pelo sistema quando uma nova tabela e criada. Eles definem o schema inicial da tabela (usado pelo Mongoose para criar a collection dinamica) e nao podem ser editados estruturalmente, removidos ou enviados para a lixeira pelo usuario.

## Campos nativos disponiveis

| Campo | Slug | Tipo | Visivel em Lista | Visivel em Detalhes | Descricao |
|-------|------|------|------------------|---------------------|-----------|
| ID | `_id` | `IDENTIFIER` | Sim | Sim | Identificador unico do registro (ObjectId MongoDB, gerado automaticamente) |
| Criador | `creator` | `CREATOR` | Sim | Sim | Usuario autenticado que criou o registro |
| Criado em | `createdAt` | `CREATED_AT` | Sim | Sim | Data/hora de criacao do registro (gerado por `timestamps: true` do Mongoose) |
| Lixeira | `trashed` | `TRASHED` | Nao | Nao | Flag booleano indicando se o registro esta na lixeira |
| Enviado para lixeira em | `trashedAt` | `TRASHED_AT` | Nao | Nao | Data/hora em que o registro foi enviado para a lixeira |

## Como sao criados

Quando uma tabela e criada (`TableCreateUseCase`), o fluxo e:

1. **`fieldRepository.createMany(FIELD_NATIVE_LIST)`** — cria os 5 campos nativos no banco de dados
2. **`buildSchema(nativeFields)`** — gera o `_schema` inicial da tabela usando apenas os campos nativos (pula IDENTIFIER e CREATED_AT pois sao gerenciados pelo MongoDB/Mongoose)
3. **`tableRepository.create({ _schema, fields: [] })`** — cria a tabela com o schema gerado e um array `fields` vazio
4. **`tableRepository.update({ fields: nativeFieldIds, fieldOrderList: nativeFieldIds, fieldOrderForm: nativeFieldIds })`** — vincula os IDs dos campos nativos ao documento da tabela, definindo tambem a ordem inicial em lista e formulario

Isso garante que a collection Mongoose ja exista com a estrutura minima (schema dos nativos) antes de qualquer campo do usuario ser adicionado.

## Papel no schema inicial

A funcao `buildSchema()` (`util.core.ts`) processa os campos recebidos, **pulando** `IDENTIFIER` e `CREATED_AT` (pois `_id` e `createdAt` sao gerenciados automaticamente pelo MongoDB e pelo Mongoose `timestamps: true`). Todos os demais campos nativos (incluindo `TRASHED` e `TRASHED_AT`) sao processados normalmente por `mapperSchema()`.

```
buildSchema(fields) → para cada field:
  - IDENTIFIER → skip (_id auto MongoDB)
  - CREATED_AT → skip (timestamps: true)
  - demais → mapperSchema(field) → FieldTypeMapper[field.type]
```

Adicionalmente, `buildTable()` sanitiza `_id` e `createdAt` do `schemaDefinition` antes de criar o `mongoose.Schema`, como backward compatibility para tabelas existentes que ainda possuem esses campos no `_schema`.

## Mapeamento de tipos para schema

| Tipo nativo | Tipo Mongoose (`FieldTypeMapper`) | Configuracao extra |
|-------------|----------------------------------|-------------------|
| `IDENTIFIER` | `ObjectId` | — (pulado no buildSchema) |
| `CREATOR` | `ObjectId` | `ref: 'User'` |
| `CREATED_AT` | `Date` | — (pulado no buildSchema) |
| `TRASHED` | `Boolean` | `default: false` |
| `TRASHED_AT` | `Date` | `default: null` |

Esses mapeamentos estao definidos em `FieldTypeMapper` e `mapperSchema()` dentro de `util.core.ts`.

## Como sao gerados nos registros

- **`_id`**: Gerado automaticamente pelo MongoDB (`ObjectId`, `auto: true`)
- **`creator`**: Preenchido com o ID do usuario autenticado no momento da criacao do registro
- **`createdAt`**: Gerado automaticamente pelo Mongoose (`timestamps: true`)
- **`trashed`**: Inicializado como `false` (default no schema); alterado para `true` quando o registro e enviado para a lixeira
- **`trashedAt`**: Inicializado como `null` (default no schema); preenchido com a data/hora quando o registro e enviado para a lixeira

## `native` na API

O campo `native` e um flag **interno** — **nao e aceito pela API**. Foi removido do schema Zod (`TableFieldBaseSchema`), impedindo que o frontend ou qualquer cliente sobrescreva o valor. O Mongoose preserva `native: true` nos campos nativos pois o Zod nao mais parseia esse campo do body.

O campo `locked` continua aceito pela API e faz parte do `TableFieldBaseSchema`.

## Validacao de registros

A funcao `validateRowPayload()` (`row-payload-validator.core.ts`) **pula campos nativos** durante a validacao de dados do registro:

```typescript
if (field.native) continue;
```

Isso significa que os campos `_id`, `creator`, `createdAt`, `trashed` e `trashedAt` nao precisam ser fornecidos pelo usuario no payload de criacao/atualizacao de registros — sao gerenciados pelo sistema.

## Restricoes

- **Nao editaveis**: O nome, tipo e configuracoes estruturais dos campos nativos nao podem ser alterados
- **Nao removiveis**: Campos nativos nao podem ser enviados para a lixeira (`NATIVE_FIELD_CANNOT_BE_TRASHED`)
- **Visibilidade/largura/ordem**: O usuario pode alterar `showInList`, `showInDetail`, `widthInList` e a posicao na ordenacao
- **Nunca em filtros ou formularios**: `showInFilter` e `showInForm` sao sempre `false`; os campos nativos nao aparecem nas tabs de Filtros e Formularios do gerenciamento

## Onde aparecem

- **Lista**: Campos nativos com `showInList: true` aparecem como colunas na tabela
- **Detalhes**: Campos nativos com `showInDetail: true` aparecem na visualizacao de detalhes do registro
- **Filtros**: Nunca aparecem
- **Formularios**: Nunca aparecem
- **Gerenciamento de campos (tabs Lista/Detalhes)**: Aparecem junto com os demais campos, podem ser reordenados e ter largura alterada

## Validacao da API (Fastify Schema)

Os Fastify schemas definem quais valores sao aceitos pelo OpenAPI/Swagger nos endpoints de fields. Os tipos nativos (`CREATOR`, `IDENTIFIER`, `CREATED_AT`, `TRASHED`, `TRASHED_AT`) precisam estar presentes nos enums desses schemas para que a API nao rejeite requests envolvendo campos nativos.

| Schema | Arquivo | Body inclui nativos? | Response inclui nativos? | Motivo |
|--------|---------|---------------------|-------------------------|--------|
| `TableFieldUpdateSchema` | `update.schema.ts` | Sim | Sim (200) | PUT de visibilidade (`showInList`, `showInDetail`, etc.) envia e recebe o campo nativo completo |
| `TableFieldCreateSchema` | `create.schema.ts` | Nao | Sim (201) | Usuario nao cria campos nativos, mas a resposta pode retornar campos nativos ja existentes na tabela |

**Importante**: O Zod validator (`update.validator.ts`) ja aceitava tipos nativos via `z.enum(E_FIELD_TYPE)`, que inclui todos os tipos do enum. O problema era exclusivamente no Fastify schema, que listava os tipos manualmente e omitia os nativos — causando rejeicao de requests validos antes mesmo de chegarem ao handler.

## Onde sao filtrados

Pontos do codigo onde campos nativos sao explicitamente excluidos:

| Local | Arquivo | Logica |
|-------|---------|--------|
| Validacao de payload do registro | `row-payload-validator.core.ts` | `if (field.native) continue` — pula nativos na validacao |
| Busca global (full-text search) | `util.core.ts` (`buildQuery`) | `!f.native` — exclui nativos dos campos de busca textual |
| buildSchema (IDENTIFIER/CREATED_AT) | `util.core.ts` (`buildSchema`) | `field.type === IDENTIFIER/CREATED_AT → continue` — pula pois MongoDB/Mongoose gerencia |
| buildTable (sanitizacao) | `util.core.ts` (`buildTable`) | `delete schemaDefinition['_id'/'createdAt']` — backward compatibility |
| Default values (criacao de registro) | `frontend/src/lib/table.ts` | `if (field.native) continue` — nao gera valores padrao |
| Default values (edicao de registro) | `frontend/src/lib/table.ts` | `if (field.native) continue` — nao carrega valores para edicao |
| Payload de envio (criar/atualizar) | `frontend/src/lib/table.ts` | `if (field.native) continue` — exclui do payload enviado a API |
| Formulario de criacao | `frontend/.../row/create/-create-form.tsx` | `if (field.native) return null` — nao renderiza inputs |
| Gerenciamento (contagem de lixeira) | `frontend/.../field/management.tsx` | `fields.filter(f => !f.native)` — conta apenas nao-nativos |
| Gerenciamento (campos de grupo) | `frontend/.../field/management.tsx` | `fields.filter(f => !f.native)` — exclui nativos em grupos |
| Tabs de Filtros/Formularios | `frontend/.../field/-field-order-form.tsx` | `excludeNative && f.native` — oculta nativos condicionalmente |
| Botao de edicao do campo | `frontend/.../field/-field-order-form.tsx` | `field.native` — esconde botao de editar para nativos |
| Fastify schema (update body) | `update.schema.ts` | Tipos nativos incluidos no enum `type` — permite PUT de campos nativos |
| Fastify schema (responses) | `update.schema.ts`, `create.schema.ts` | Tipos nativos incluidos no enum `type` do response |

## Mapeamento de tipos para renderizacao (frontend)

| Tipo nativo | Componente de renderizacao |
|-------------|---------------------------|
| `IDENTIFIER` | `TableRowTextShortCell` |
| `CREATOR` | `TableRowUserCell` |
| `CREATED_AT` | `TableRowDateCell` |
| `TRASHED` | `TableRowTextShortCell` |
| `TRASHED_AT` | `TableRowDateCell` |

## Observacoes

- Apenas tabelas novas terao os 5 campos nativos com tipos proprios. Tabelas existentes mantem os tipos antigos (`TEXT_SHORT`, `USER`, `DATE`) sem migracao automatica.
- O `buildSchema()` pula `IDENTIFIER` e `CREATED_AT` pois `_id` e gerenciado pelo MongoDB e `createdAt` pelo Mongoose `timestamps: true`. Os demais campos nativos (`CREATOR`, `TRASHED`, `TRASHED_AT`) sao incluidos normalmente no `_schema`.
- O `buildTable()` faz `delete schemaDefinition['_id']` e `delete schemaDefinition['createdAt']` como seguranca para tabelas existentes que ainda possuem essas chaves no `_schema` armazenado.
- `native` nao e aceito pela API (removido do Zod); `locked` continua aceito.
- Os Fastify schemas (`update.schema.ts` e `create.schema.ts`) foram corrigidos para incluir tipos nativos nos enums de `type`. Anteriormente, os enums eram listados manualmente e omitiam `CREATOR`, `IDENTIFIER`, `CREATED_AT`, `TRASHED` e `TRASHED_AT`, fazendo com que o Fastify rejeitasse requests validos (ex: PUT de visibilidade em campo nativo) antes de chegarem ao handler. O Zod validator nunca teve esse problema pois usa `z.enum(E_FIELD_TYPE)` diretamente.
